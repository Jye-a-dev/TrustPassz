// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EscrowTypes} from "../types/EscrowTypes.sol";
import {IERC20Minimal} from "../interfaces/IERC20Minimal.sol";

/// @title PaymentProcessor
/// @notice Manages inbound and outbound transfers of Native ETH and ERC20 tokens with CEI and ReentrancyGuard
abstract contract PaymentProcessor is ReentrancyGuard {
    function _processDeposit(address token, address payer, uint256 expectedAmount) internal {
        if (token == address(0)) {
            if (msg.value != expectedAmount) {
                revert EscrowTypes.InvalidAmount(expectedAmount, msg.value);
            }
        } else {
            if (msg.value != 0) {
                revert EscrowTypes.InvalidAmount(0, msg.value);
            }
            _safeTransferFrom(token, payer, address(this), expectedAmount);
        }
    }

    function _processDisbursement(address token, address recipient, uint256 amount) internal nonReentrant {
        if (token == address(0)) {
            (bool success, ) = recipient.call{value: amount}("");
            if (!success) {
                revert EscrowTypes.NativeTransferFailed(recipient, amount);
            }
        } else {
            _safeTransfer(token, recipient, amount);
        }
    }

    function _safeTransfer(address token, address to, uint256 amount) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20Minimal.transfer.selector, to, amount)
        );
        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
            revert EscrowTypes.ERC20TransferFailed(token, to, amount);
        }
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20Minimal.transferFrom.selector, from, to, amount)
        );
        if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
            revert EscrowTypes.ERC20TransferFailed(token, to, amount);
        }
    }
}
