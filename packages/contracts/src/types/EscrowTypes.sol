// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

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
        uint256 depositedAt;
        uint256 inspectionDeadline;
        address disputeInitiator;
        uint256 createdAt;
    }

    // --- Custom Errors (EIP-6093 Compliant) ---
    error DealAlreadyExists();
    error DealNotFound();
    error InvalidDealState(DealState current, DealState required);
    error InvalidParticipant(address caller);
    error InspectionPeriodStillActive(uint256 deadline, uint256 currentTimestamp);
    error InspectionPeriodExpired(uint256 deadline, uint256 currentTimestamp);
    error DeliveryTimeoutNotReached(uint256 releaseTime, uint256 currentTimestamp);
    error InvalidAmount(uint256 expected, uint256 actual);
    error NativeTransferFailed(address recipient, uint256 amount);
    error ERC20TransferFailed(address token, address to, uint256 amount);
    error ZeroAddress();
    error ZeroAmount();
    error ZeroDuration();
    error Unauthorized(address caller);
}
