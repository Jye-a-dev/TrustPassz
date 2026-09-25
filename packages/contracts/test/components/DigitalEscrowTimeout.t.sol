// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EscrowTestBase} from "../helpers/EscrowTestBase.sol";
import {EscrowTypes} from "../../src/types/EscrowTypes.sol";

/// @title DigitalEscrowTimeoutTest
/// @notice Tests for cancelDepositedDeal 48h timeout mechanics and abandoned seller defense
contract DigitalEscrowTimeoutTest is EscrowTestBase {
    function test_CancelDepositedDeal_RevertIf_TimeoutNotReached() external {
        bytes32 dealId = keccak256("TIMEOUT_NOT_REACHED");
        escrow.createDeal(dealId, _buildConfig(address(0), ETH_AMOUNT));

        uint256 depositTimestamp = 100_000;
        vm.warp(depositTimestamp);
        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealId);

        uint256 releaseTime = depositTimestamp + escrow.DELIVERY_TIMEOUT();

        // 1 second prior to timeout threshold
        vm.warp(releaseTime - 1);
        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.DeliveryTimeoutNotReached.selector,
                releaseTime,
                releaseTime - 1
            )
        );
        escrow.cancelDepositedDeal(dealId);
    }

    function test_CancelDepositedDeal_Success_BuyerRefund_NativeETH() external {
        bytes32 dealId = keccak256("CANCEL_SUCCESS_NATIVE");
        escrow.createDeal(dealId, _buildConfig(address(0), ETH_AMOUNT));

        uint256 depositTimestamp = 200_000;
        vm.warp(depositTimestamp);
        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealId);

        uint256 releaseTime = depositTimestamp + escrow.DELIVERY_TIMEOUT();
        vm.warp(releaseTime + 1);

        uint256 buyerBalBefore = buyer.balance;
        vm.prank(buyer);
        escrow.cancelDepositedDeal(dealId);

        assertEq(buyer.balance, buyerBalBefore + ETH_AMOUNT);
        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealId);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Refunded));
    }

    function test_CancelDepositedDeal_Success_OracleRelayerRefund_NativeETH() external {
        bytes32 dealId = keccak256("CANCEL_ORACLE_NATIVE");
        escrow.createDeal(dealId, _buildConfig(address(0), ETH_AMOUNT));

        uint256 depositTimestamp = 300_000;
        vm.warp(depositTimestamp);
        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealId);

        vm.warp(depositTimestamp + escrow.DELIVERY_TIMEOUT());

        uint256 buyerBalBefore = buyer.balance;
        vm.prank(oracle);
        escrow.cancelDepositedDeal(dealId);

        assertEq(buyer.balance, buyerBalBefore + ETH_AMOUNT);
        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealId);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Refunded));
    }

    function test_CancelDepositedDeal_Success_MockUSDC() external {
        bytes32 dealId = keccak256("CANCEL_SUCCESS_USDC");
        escrow.createDeal(dealId, _buildConfig(address(usdc), USDC_AMOUNT));

        uint256 depositTimestamp = 400_000;
        vm.warp(depositTimestamp);
        vm.prank(buyer);
        escrow.deposit(dealId);

        vm.warp(depositTimestamp + escrow.DELIVERY_TIMEOUT() + 1);

        uint256 buyerBalBefore = usdc.balanceOf(buyer);
        vm.prank(buyer);
        escrow.cancelDepositedDeal(dealId);

        assertEq(usdc.balanceOf(buyer), buyerBalBefore + USDC_AMOUNT);
        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealId);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Refunded));
    }

    function test_CancelDepositedDeal_RevertIf_UnauthorizedCaller() external {
        bytes32 dealId = keccak256("CANCEL_UNAUTHORIZED");
        escrow.createDeal(dealId, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealId);

        vm.warp(block.timestamp + escrow.DELIVERY_TIMEOUT() + 10);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.Unauthorized.selector, stranger));
        escrow.cancelDepositedDeal(dealId);
    }
}
