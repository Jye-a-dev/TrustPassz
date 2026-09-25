// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EscrowTypes} from "../types/EscrowTypes.sol";

/// @title IDigitalEscrow
/// @notice External interface for the TrustPassz Digital Escrow engine
interface IDigitalEscrow {
    event DealCreated(
        bytes32 indexed dealId,
        address indexed buyer,
        address indexed seller,
        address token,
        uint256 amount
    );
    event DealDeposited(bytes32 indexed dealId, address indexed buyer, uint256 amount);
    event InspectionStarted(bytes32 indexed dealId, uint256 inspectionDeadline);
    event DealSettled(bytes32 indexed dealId, address indexed recipient, uint256 amount);
    event DealRefunded(bytes32 indexed dealId, address indexed buyer, uint256 amount);
    event DisputeRaised(bytes32 indexed dealId, address indexed initiator);
    event DisputeResolved(bytes32 indexed dealId, EscrowTypes.DealState finalState, address indexed recipient);

    function createDeal(bytes32 dealId, EscrowTypes.DealConfig calldata config) external;
    function deposit(bytes32 dealId) external payable;
    function startInspection(bytes32 dealId) external;
    function cancelDepositedDeal(bytes32 dealId) external;
    function settle(bytes32 dealId) external;
    function raiseDispute(bytes32 dealId) external;
    function resolveDispute(bytes32 dealId, bool refundBuyer) external;
    function getDeal(bytes32 dealId)
        external
        view
        returns (EscrowTypes.DealConfig memory config, EscrowTypes.DealStateData memory stateData);
}
