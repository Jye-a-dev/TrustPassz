// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EscrowTypes} from "../types/EscrowTypes.sol";

/// @title EscrowStateMachine
/// @notice Validation logic for state transitions and inspection time-locks
abstract contract EscrowStateMachine {
    function _validateState(EscrowTypes.DealState current, EscrowTypes.DealState required) internal pure {
        if (current != required) {
            revert EscrowTypes.InvalidDealState(current, required);
        }
    }

    function _checkInspectionActive(uint256 deadline) internal view {
        if (block.timestamp >= deadline) {
            revert EscrowTypes.InspectionPeriodExpired(deadline, block.timestamp);
        }
    }

    function _checkInspectionExpired(uint256 deadline) internal view {
        if (block.timestamp < deadline) {
            revert EscrowTypes.InspectionPeriodStillActive(deadline, block.timestamp);
        }
    }
}
