// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EscrowTypes} from "./types/EscrowTypes.sol";
import {IDigitalEscrow} from "./interfaces/IDigitalEscrow.sol";
import {EscrowAccessControl} from "./base/EscrowAccessControl.sol";
import {PaymentProcessor} from "./base/PaymentProcessor.sol";
import {EscrowStateMachine} from "./base/EscrowStateMachine.sol";

/// @title DigitalEscrow
/// @notice Core trustless digital asset escrow engine with CEI pattern and OpenZeppelin ReentrancyGuard
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

        _deals[dealId] = config;
        _dealStates[dealId] = EscrowTypes.DealStateData({
            state: EscrowTypes.DealState.Pending,
            depositedAt: 0,
            inspectionDeadline: 0,
            disputeInitiator: address(0),
            createdAt: block.timestamp
        });

        emit DealCreated(dealId, config.buyer, config.seller, config.token, config.amount);
    }

    /// @inheritdoc IDigitalEscrow
    function deposit(bytes32 dealId) external payable override nonReentrant {
        EscrowTypes.DealConfig storage config = _deals[dealId];
        EscrowTypes.DealStateData storage stateData = _dealStates[dealId];

        _validateState(stateData.state, EscrowTypes.DealState.Pending);
        if (msg.sender != config.buyer) revert EscrowTypes.Unauthorized(msg.sender);

        // CEI: Mutate internal state and emit event before executing external asset transfer
        stateData.state = EscrowTypes.DealState.Deposited;
        stateData.depositedAt = block.timestamp;
        emit DealDeposited(dealId, msg.sender, config.amount);

        _processDeposit(config.token, msg.sender, config.amount);
    }

    /// @inheritdoc IDigitalEscrow
    function startInspection(bytes32 dealId) external override {
        EscrowTypes.DealConfig storage config = _deals[dealId];
        EscrowTypes.DealStateData storage stateData = _dealStates[dealId];

        _validateState(stateData.state, EscrowTypes.DealState.Deposited);
        if (msg.sender != config.seller && msg.sender != oracleRelayer) {
            revert EscrowTypes.Unauthorized(msg.sender);
        }

        uint256 deadline = block.timestamp + config.inspectionDuration;
        stateData.state = EscrowTypes.DealState.InInspection;
        stateData.inspectionDeadline = deadline;

        emit InspectionStarted(dealId, deadline);
    }

    /// @inheritdoc IDigitalEscrow
    function cancelDepositedDeal(bytes32 dealId) external override nonReentrant {
        EscrowTypes.DealConfig storage config = _deals[dealId];
        EscrowTypes.DealStateData storage stateData = _dealStates[dealId];

        _validateState(stateData.state, EscrowTypes.DealState.Deposited);
        if (msg.sender != config.buyer && msg.sender != oracleRelayer) {
            revert EscrowTypes.Unauthorized(msg.sender);
        }

        uint256 releaseTime = stateData.depositedAt + DELIVERY_TIMEOUT;
        if (block.timestamp < releaseTime) {
            revert EscrowTypes.DeliveryTimeoutNotReached(releaseTime, block.timestamp);
        }

        // CEI: Mutate state and emit event before executing disbursement
        stateData.state = EscrowTypes.DealState.Refunded;
        emit DealRefunded(dealId, config.buyer, config.amount);

        _processDisbursement(config.token, config.buyer, config.amount);
    }

    /// @inheritdoc IDigitalEscrow
    function settle(bytes32 dealId) external override nonReentrant {
        EscrowTypes.DealConfig storage config = _deals[dealId];
        EscrowTypes.DealStateData storage stateData = _dealStates[dealId];

        _validateState(stateData.state, EscrowTypes.DealState.InInspection);

        // Buyer can settle anytime; any other caller requires the inspection deadline to have passed
        if (msg.sender != config.buyer) {
            _checkInspectionExpired(stateData.inspectionDeadline);
        }

        // CEI: Transition state and emit event before transferring value
        stateData.state = EscrowTypes.DealState.Settled;
        emit DealSettled(dealId, config.seller, config.amount);

        _processDisbursement(config.token, config.seller, config.amount);
    }

    /// @inheritdoc IDigitalEscrow
    function raiseDispute(bytes32 dealId) external override {
        EscrowTypes.DealConfig storage config = _deals[dealId];
        EscrowTypes.DealStateData storage stateData = _dealStates[dealId];

        _validateState(stateData.state, EscrowTypes.DealState.InInspection);
        if (msg.sender != config.buyer) revert EscrowTypes.InvalidParticipant(msg.sender);
        _checkInspectionActive(stateData.inspectionDeadline);

        stateData.state = EscrowTypes.DealState.Disputed;
        stateData.disputeInitiator = msg.sender;

        emit DisputeRaised(dealId, msg.sender);
    }

    /// @inheritdoc IDigitalEscrow
    function resolveDispute(bytes32 dealId, bool refundBuyer) external override onlyArbitratorOrOracle nonReentrant {
        EscrowTypes.DealConfig storage config = _deals[dealId];
        EscrowTypes.DealStateData storage stateData = _dealStates[dealId];

        _validateState(stateData.state, EscrowTypes.DealState.Disputed);

        address recipient = refundBuyer ? config.buyer : config.seller;
        EscrowTypes.DealState finalState = refundBuyer ? EscrowTypes.DealState.Refunded : EscrowTypes.DealState.Settled;

        // CEI: Mutate state and emit events before disbursement
        stateData.state = finalState;

        if (refundBuyer) {
            emit DealRefunded(dealId, config.buyer, config.amount);
        } else {
            emit DealSettled(dealId, config.seller, config.amount);
        }
        emit DisputeResolved(dealId, finalState, recipient);

        _processDisbursement(config.token, recipient, config.amount);
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
