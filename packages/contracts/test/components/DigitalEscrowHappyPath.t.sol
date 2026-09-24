// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EscrowTestBase} from "../helpers/EscrowTestBase.sol";
import {EscrowTypes} from "../../src/types/EscrowTypes.sol";

/// @title DigitalEscrowHappyPathTest
/// @notice Happy path test suite for Native ETH and ERC20 tokens
contract DigitalEscrowHappyPathTest is EscrowTestBase {
    function test_FlowA_AutoSettle_NativeETH() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdEth);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.InInspection));

        vm.warp(stateData.inspectionDeadline);

        uint256 sellerBalBefore = seller.balance;
        vm.prank(stranger);
        escrow.settle(dealIdEth);

        assertEq(seller.balance, sellerBalBefore + ETH_AMOUNT);
        (, stateData) = escrow.getDeal(dealIdEth);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Settled));
    }

    function test_FlowA_AutoSettle_MockUSDC() external {
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

    function test_FlowB_BuyerEarlyRelease_NativeETH() external {
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

    function test_FlowB_BuyerEarlyRelease_MockUSDC() external {
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

    function test_FlowC_DisputeAndRefund_NativeETH() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        vm.prank(buyer);
        escrow.raiseDispute(dealIdEth);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdEth);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Disputed));
        assertEq(stateData.disputeInitiator, buyer);

        uint256 buyerBalBefore = buyer.balance;
        vm.prank(oracle);
        escrow.resolveDispute(dealIdEth, true);

        assertEq(buyer.balance, buyerBalBefore + ETH_AMOUNT);
        (, stateData) = escrow.getDeal(dealIdEth);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Refunded));
    }

    function test_FlowC_DisputeAndRefund_MockUSDC() external {
        escrow.createDeal(dealIdUsdc, _buildConfig(address(usdc), USDC_AMOUNT));

        vm.prank(buyer);
        escrow.deposit(dealIdUsdc);

        vm.prank(seller);
        escrow.startInspection(dealIdUsdc);

        vm.prank(buyer);
        escrow.raiseDispute(dealIdUsdc);

        uint256 buyerBalBefore = usdc.balanceOf(buyer);
        vm.prank(arbitrator);
        escrow.resolveDispute(dealIdUsdc, true);

        assertEq(usdc.balanceOf(buyer), buyerBalBefore + USDC_AMOUNT);
        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdUsdc);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Refunded));
    }

    function test_FlowD_DisputeAndReject_NativeETH() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        vm.prank(buyer);
        escrow.raiseDispute(dealIdEth);

        uint256 sellerBalBefore = seller.balance;
        vm.prank(arbitrator);
        escrow.resolveDispute(dealIdEth, false);

        assertEq(seller.balance, sellerBalBefore + ETH_AMOUNT);
        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdEth);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Settled));
    }

    function test_FlowD_DisputeAndReject_MockUSDC() external {
        escrow.createDeal(dealIdUsdc, _buildConfig(address(usdc), USDC_AMOUNT));

        vm.prank(buyer);
        escrow.deposit(dealIdUsdc);

        vm.prank(seller);
        escrow.startInspection(dealIdUsdc);

        vm.prank(buyer);
        escrow.raiseDispute(dealIdUsdc);

        uint256 sellerBalBefore = usdc.balanceOf(seller);
        vm.prank(oracle);
        escrow.resolveDispute(dealIdUsdc, false);

        assertEq(usdc.balanceOf(seller), sellerBalBefore + USDC_AMOUNT);
        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdUsdc);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Settled));
    }
}
