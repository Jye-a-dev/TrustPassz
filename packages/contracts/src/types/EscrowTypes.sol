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
    /// @dev Storage layout packed into 3 slots (32 bytes each):
    /// Slot 0: buyer (20 bytes)
    /// Slot 1: seller (20 bytes) + inspectionDuration (5 bytes) = 25 bytes
    /// Slot 2: token (20 bytes) + amount (12 bytes) = 32 bytes
    struct DealConfig {
        address buyer;
        address seller;
        uint40 inspectionDuration;
        address token; // address(0) designates native ETH; non-zero indicates standard ERC20
        uint96 amount;
    }

    /// @notice Mutable runtime state data for a deal
    /// @dev Storage layout packed into 2 slots:
    /// Slot 0: state (1 byte) + inspectionDuration (5 bytes) + depositedAt (5 bytes) + inspectionDeadline (5 bytes) + createdAt (5 bytes) = 21 bytes <= 32 bytes
    /// Slot 1: disputeInitiator (20 bytes)
    struct DealStateData {
        DealState state;
        uint40 inspectionDuration;
        uint40 depositedAt;
        uint40 inspectionDeadline;
        uint40 createdAt;
        address disputeInitiator;
    }

    // --- Custom Errors (EIP-6093 Compliant) ---
    error DealAlreadyExists();
    error DealNotFound();
    error InvalidDealState(DealState current, DealState required);
    error InvalidParticipant(address caller);
    error InspectionPeriodStillActive(uint256 deadline, uint256 currentTimestamp);
    error InspectionPeriodExpired(uint256 deadline, uint256 currentTimestamp);
    error DeadlineNotPassed(uint256 deadline, uint256 currentTimestamp);
    error DeadlinePassed(uint256 deadline, uint256 currentTimestamp);
    error DeliveryTimeoutNotReached(uint256 releaseTime, uint256 currentTimestamp);
    error InvalidAmount(uint256 expected, uint256 actual);
    error NativeTransferFailed(address recipient, uint256 amount);
    error ERC20TransferFailed(address token, address to, uint256 amount);
    error InvalidTokenAddress(address token);
    error ZeroAddress();
    error ZeroAmount();
    error ZeroDuration();
    error Unauthorized(address caller);
}
