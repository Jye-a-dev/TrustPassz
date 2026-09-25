// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EscrowTestBase} from "../helpers/EscrowTestBase.sol";
import {EscrowTypes} from "../../src/types/EscrowTypes.sol";

/// @title DigitalEscrowHappyPathTest
/// @notice Happy path test suite for Native ETH and ERC20 tokens
contract DigitalEscrowHappyPathTest is EscrowTestBase {
    function test_HappyPath_NativeETH_AutoSettle() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdEth);
        vm.warp(stateData.inspectionDeadline);

        uint256 sellerBalBefore = seller.balance;
        vm.prank(stranger);
        escrow.settle(dealIdEth);

        assertEq(seller.balance, sellerBalBefore + ETH_AMOUNT);
        (, stateData) = escrow.getDeal(dealIdEth);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Settled));
    }

    function test_HappyPath_MockUSDC_AutoSettle() external {
        escrow.createDeal(dealIdUsdc, _buildConfig(address(usdc), USDC_AMOUNT));

        vm.prank(buyer);
        escrow.deposit(dealIdUsdc);

        vm.prank(oracle);
        escrow.startInspection(dealIdUsdc);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdUsdc);
        vm.warp(stateData.inspectionDeadline);

        uint256 sellerBalBefore = usdc.balanceOf(seller);
        vm.prank(oracle);
        escrow.settle(dealIdUsdc);

        assertEq(usdc.balanceOf(seller), sellerBalBefore + USDC_AMOUNT);
        (, stateData) = escrow.getDeal(dealIdUsdc);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Settled));
    }

    function test_HappyPath_NativeETH_BuyerEarlyRelease() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        uint256 sellerBalBefore = seller.balance;
        vm.prank(buyer);
        escrow.settle(dealIdEth);

        assertEq(seller.balance, sellerBalBefore + ETH_AMOUNT);
        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdEth);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Settled));
    }

    function test_HappyPath_MockUSDC_BuyerEarlyRelease() external {
        escrow.createDeal(dealIdUsdc, _buildConfig(address(usdc), USDC_AMOUNT));

        vm.prank(buyer);
        escrow.deposit(dealIdUsdc);

        vm.prank(seller);
        escrow.startInspection(dealIdUsdc);

        uint256 sellerBalBefore = usdc.balanceOf(seller);
        vm.prank(buyer);
        escrow.settle(dealIdUsdc);

        assertEq(usdc.balanceOf(seller), sellerBalBefore + USDC_AMOUNT);
        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdUsdc);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Settled));
    }

    function test_HappyPath_Dispute_RefundBuyer() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        vm.prank(buyer);
        escrow.raiseDispute(dealIdEth);

        uint256 buyerBalBefore = buyer.balance;
        vm.prank(arbitrator);
        escrow.resolveDispute(dealIdEth, true);

        assertEq(buyer.balance, buyerBalBefore + ETH_AMOUNT);
        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdEth);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Refunded));
    }

    function test_HappyPath_Dispute_SettleSeller() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        vm.prank(buyer);
        escrow.raiseDispute(dealIdEth);

        uint256 sellerBalBefore = seller.balance;
        vm.prank(oracle);
        escrow.resolveDispute(dealIdEth, false);

        assertEq(seller.balance, sellerBalBefore + ETH_AMOUNT);
        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdEth);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Settled));
    }
}
