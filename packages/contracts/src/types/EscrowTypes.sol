// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title EscrowTypes
/// @notice Defines state machine enums, configuration structs, and EIP-6093 custom errors for TrustPassz
library EscrowTypes {
    /// @notice Deal life cycle state tracking
    enum DealState {
        Uninitialized,
        Pending,
        Deposited,
        InInspection,
        Settled,
        Refunded,
        Disputed
    }

    /// @notice Static immutable parameters governing a deal
    struct DealConfig {
        address buyer;
        address seller;
        address token; // address(0) designates native ETH; non-zero indicates standard ERC20
        uint256 amount;
        uint256 inspectionDuration;
    }

    /// @notice Mutable runtime state data for a deal
    struct DealStateData {
        DealState state;
        uint256 inspectionDeadline;
        address disputeInitiator;
        uint256 createdAt;
    }

    // --- Custom Errors (EIP-6093 Compliant) ---
    error DealAlreadyExists(bytes32 dealId);
    error InvalidDealState(bytes32 dealId, DealState current, DealState expected);
    error InvalidAmount(uint256 expected, uint256 actual);
    error Unauthorized(address caller);
    error InvalidParticipant(address caller);
    error InspectionPeriodStillActive(uint256 currentTimestamp, uint256 deadline);
    error InspectionPeriodExpired(uint256 currentTimestamp, uint256 deadline);
    error NativeTransferFailed(address recipient, uint256 amount);
    error ERC20TransferFailed(address token, address to, uint256 amount);
    error ZeroAddress();
    error ZeroAmount();
    error ZeroDuration();
}
