// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EscrowTypes} from "./types/EscrowTypes.sol";
import {IDigitalEscrow} from "./interfaces/IDigitalEscrow.sol";
import {EscrowAccessControl} from "./base/EscrowAccessControl.sol";
import {PaymentProcessor} from "./base/PaymentProcessor.sol";
import {EscrowStateMachine} from "./base/EscrowStateMachine.sol";

/// @title DigitalEscrow
/// @notice Core trustless digital asset escrow engine with CEI pattern, storage packing, and gas optimizations
contract DigitalEscrow is
    IDigitalEscrow,
    EscrowAccessControl,
    PaymentProcessor,
    EscrowStateMachine
{
    uint256 public constant DELIVERY_TIMEOUT = 48 hours;

    mapping(bytes32 => EscrowTypes.DealConfig) private _deals;
    mapping(bytes32 => EscrowTypes.DealStateData) private _dealStates;

    constructor(
        address _owner,
        address _oracleRelayer,
        address _disputeResolver
    ) EscrowAccessControl(_owner, _oracleRelayer, _disputeResolver) {}

    /// @inheritdoc IDigitalEscrow
    function createDeal(bytes32 dealId, EscrowTypes.DealConfig calldata config) external override {
        if (_dealStates[dealId].state != EscrowTypes.DealState.Uninitialized) {
            revert EscrowTypes.DealAlreadyExists();
        }
        if (config.buyer == address(0) || config.seller == address(0)) {
            revert EscrowTypes.ZeroAddress();
        }
        if (config.buyer == config.seller) {
            revert EscrowTypes.InvalidParticipant(config.seller);
        }
        if (config.amount == 0) revert EscrowTypes.ZeroAmount();
        if (config.inspectionDuration == 0) revert EscrowTypes.ZeroDuration();

        // Direct calldata-to-storage writes exploiting 3-slot DealConfig packing
        _deals[dealId] = config;

        // Slot 0 packing: state, inspectionDuration, depositedAt, inspectionDeadline, createdAt in 1 SSTORE
        _dealStates[dealId] = EscrowTypes.DealStateData({
            state: EscrowTypes.DealState.Pending,
            inspectionDuration: config.inspectionDuration,
            depositedAt: 0,
            inspectionDeadline: 0,
            createdAt: uint40(block.timestamp),
            disputeInitiator: address(0)
        });

        emit DealCreated(dealId, config.buyer, config.seller, config.token, config.amount);
    }

    /// @inheritdoc IDigitalEscrow
    function deposit(bytes32 dealId) external payable override nonReentrant {
        EscrowTypes.DealConfig storage config = _deals[dealId];
        address buyer = config.buyer;
        if (msg.sender != buyer) revert EscrowTypes.Unauthorized(msg.sender);

        EscrowTypes.DealStateData storage stateData = _dealStates[dealId];
        EscrowTypes.DealState currentState = stateData.state;
        _validateState(currentState, EscrowTypes.DealState.Pending);

        uint96 amount = config.amount;
        address token = config.token;

        // CEI: Mutate packed slot 0 (state + depositedAt) before external asset intake
        stateData.state = EscrowTypes.DealState.Deposited;
        stateData.depositedAt = uint40(block.timestamp);

        emit DealDeposited(dealId, msg.sender, amount);

        _processDeposit(token, msg.sender, amount);
    }

    /// @inheritdoc IDigitalEscrow
    function startInspection(bytes32 dealId) external override {
        EscrowTypes.DealStateData storage stateData = _dealStates[dealId];
        EscrowTypes.DealState currentState = stateData.state;
        _validateState(currentState, EscrowTypes.DealState.Deposited);

        EscrowTypes.DealConfig storage config = _deals[dealId];
        address seller = config.seller;
        if (msg.sender != seller && msg.sender != oracleRelayer) {
            revert EscrowTypes.Unauthorized(msg.sender);
        }

        uint40 deadline;
        unchecked {
            deadline = uint40(block.timestamp) + stateData.inspectionDuration;
        }

        // CEI: Mutate packed slot 0 (state + inspectionDeadline) in single storage write
        stateData.state = EscrowTypes.DealState.InInspection;
        stateData.inspectionDeadline = deadline;

        emit InspectionStarted(dealId, deadline);
    }

    /// @inheritdoc IDigitalEscrow
    function cancelDepositedDeal(bytes32 dealId) external override nonReentrant {
        EscrowTypes.DealStateData storage stateData = _dealStates[dealId];
        EscrowTypes.DealState currentState = stateData.state;
        _validateState(currentState, EscrowTypes.DealState.Deposited);

        EscrowTypes.DealConfig storage config = _deals[dealId];
        address buyer = config.buyer;
        if (msg.sender != buyer && msg.sender != oracleRelayer) {
            revert EscrowTypes.Unauthorized(msg.sender);
        }

        uint40 depositedAt = stateData.depositedAt;
        uint256 releaseTime;
        unchecked {
            releaseTime = uint256(depositedAt) + DELIVERY_TIMEOUT;
        }
        if (block.timestamp < releaseTime) {
            revert EscrowTypes.DeliveryTimeoutNotReached(releaseTime, block.timestamp);
        }

        uint96 amount = config.amount;
        address token = config.token;

        // CEI: Mutate internal state and emit event before initiating external transfer
        stateData.state = EscrowTypes.DealState.Refunded;
        emit DealRefunded(dealId, buyer, amount);

        _processDisbursement(token, buyer, amount);
    }

    /// @inheritdoc IDigitalEscrow
    function settle(bytes32 dealId) external override nonReentrant {
        EscrowTypes.DealStateData storage stateData = _dealStates[dealId];
        EscrowTypes.DealState currentState = stateData.state;
        _validateState(currentState, EscrowTypes.DealState.InInspection);

        EscrowTypes.DealConfig storage config = _deals[dealId];
        address buyer = config.buyer;
        uint40 deadline = stateData.inspectionDeadline;

        // Buyer can settle anytime; non-buyer calls require the deadline to have passed
        if (msg.sender != buyer) {
            _checkInspectionExpired(deadline);
        }

        address seller = config.seller;
        uint96 amount = config.amount;
        address token = config.token;

        // CEI: Transition state before transferring value
        stateData.state = EscrowTypes.DealState.Settled;
        emit DealSettled(dealId, seller, amount);

        _processDisbursement(token, seller, amount);
    }

    /// @inheritdoc IDigitalEscrow
    function raiseDispute(bytes32 dealId) external override {
        EscrowTypes.DealStateData storage stateData = _dealStates[dealId];
        EscrowTypes.DealState currentState = stateData.state;
        _validateState(currentState, EscrowTypes.DealState.InInspection);

        EscrowTypes.DealConfig storage config = _deals[dealId];
        if (msg.sender != config.buyer) revert EscrowTypes.InvalidParticipant(msg.sender);
        _checkInspectionActive(stateData.inspectionDeadline);

        stateData.state = EscrowTypes.DealState.Disputed;
        stateData.disputeInitiator = msg.sender;

        emit DisputeRaised(dealId, msg.sender);
    }

    /// @inheritdoc IDigitalEscrow
    function resolveDispute(bytes32 dealId, bool refundBuyer) external override onlyArbitratorOrOracle nonReentrant {
        EscrowTypes.DealStateData storage stateData = _dealStates[dealId];
        EscrowTypes.DealState currentState = stateData.state;
        _validateState(currentState, EscrowTypes.DealState.Disputed);

        EscrowTypes.DealConfig storage config = _deals[dealId];
        address buyer = config.buyer;
        address seller = config.seller;
        uint96 amount = config.amount;
        address token = config.token;

        address recipient = refundBuyer ? buyer : seller;
        EscrowTypes.DealState finalState = refundBuyer ? EscrowTypes.DealState.Refunded : EscrowTypes.DealState.Settled;

        // CEI: Mutate state and emit events before disbursement
        stateData.state = finalState;

        if (refundBuyer) {
            emit DealRefunded(dealId, buyer, amount);
        } else {
            emit DealSettled(dealId, seller, amount);
        }
        emit DisputeResolved(dealId, finalState, recipient);

        _processDisbursement(token, recipient, amount);
    }

    /// @inheritdoc IDigitalEscrow
    function getDeal(bytes32 dealId)
        external
        view
        override
        returns (EscrowTypes.DealConfig memory config, EscrowTypes.DealStateData memory stateData)
    {
        return (_deals[dealId], _dealStates[dealId]);
    }
}
