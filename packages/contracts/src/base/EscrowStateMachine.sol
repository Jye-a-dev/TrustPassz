// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EscrowTypes} from "../types/EscrowTypes.sol";

/// @title EscrowStateMachine
/// @notice Validation logic for state transitions and inspection time-locks
abstract contract EscrowStateMachine {
    function _validateState(bytes32 dealId, EscrowTypes.DealState current, EscrowTypes.DealState expected) internal pure {
        if (current != expected) {
            revert EscrowTypes.InvalidDealState(dealId, current, expected);
        }
    }

    function _checkInspectionActive(uint256 deadline) internal view {
        if (block.timestamp >= deadline) {
            revert EscrowTypes.InspectionPeriodExpired(block.timestamp, deadline);
        }
    }

    function _checkInspectionExpired(uint256 deadline) internal view {
        if (block.timestamp < deadline) {
            revert EscrowTypes.InspectionPeriodStillActive(block.timestamp, deadline);
        }
    }
}
