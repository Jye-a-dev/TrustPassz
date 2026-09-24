// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EscrowTestBase} from "../helpers/EscrowTestBase.sol";
import {EscrowTypes} from "../../src/types/EscrowTypes.sol";

/// @title DigitalEscrowRevertsTest
/// @notice Unhappy path test suite verifying custom error reverts
contract DigitalEscrowRevertsTest is EscrowTestBase {
    function test_RevertIf_CreateDeal_DuplicateId() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.DealAlreadyExists.selector, dealIdEth));
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));
    }

    function test_RevertIf_CreateDeal_ZeroValues() external {
        vm.expectRevert(EscrowTypes.ZeroAddress.selector);
        escrow.createDeal(dealIdEth, EscrowTypes.DealConfig(address(0), seller, address(0), 1 ether, 1 days));

        vm.expectRevert(EscrowTypes.ZeroAddress.selector);
        escrow.createDeal(dealIdEth, EscrowTypes.DealConfig(buyer, address(0), address(0), 1 ether, 1 days));

        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.InvalidParticipant.selector, buyer));
        escrow.createDeal(dealIdEth, EscrowTypes.DealConfig(buyer, buyer, address(0), 1 ether, 1 days));

        vm.expectRevert(EscrowTypes.ZeroAmount.selector);
        escrow.createDeal(dealIdEth, EscrowTypes.DealConfig(buyer, seller, address(0), 0, 1 days));

        vm.expectRevert(EscrowTypes.ZeroDuration.selector);
        escrow.createDeal(dealIdEth, EscrowTypes.DealConfig(buyer, seller, address(0), 1 ether, 0));
    }

    function test_RevertIf_Deposit_MismatchedETH() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.InvalidAmount.selector, ETH_AMOUNT, 0.5 ether));
        escrow.deposit{value: 0.5 ether}(dealIdEth);
    }

    function test_RevertIf_Deposit_SendingETHForERC20() external {
        escrow.createDeal(dealIdUsdc, _buildConfig(address(usdc), USDC_AMOUNT));

        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.InvalidAmount.selector, 0, 1 ether));
        escrow.deposit{value: 1 ether}(dealIdUsdc);
    }

    function test_RevertIf_Deposit_CallerNotBuyer() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.Unauthorized.selector, stranger));
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);
    }

    function test_RevertIf_Deposit_InvalidState() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                dealIdEth,
                EscrowTypes.DealState.Deposited,
                EscrowTypes.DealState.Pending
            )
        );
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);
    }

    function test_RevertIf_StartInspection_UnauthorizedCaller() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.Unauthorized.selector, stranger));
        escrow.startInspection(dealIdEth);
    }

    function test_RevertIf_StartInspection_InvalidState() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                dealIdEth,
                EscrowTypes.DealState.Pending,
                EscrowTypes.DealState.Deposited
            )
        );
        escrow.startInspection(dealIdEth);
    }

    function test_RevertIf_Settle_InspectionPeriodStillActive_NonBuyer() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdEth);

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InspectionPeriodStillActive.selector,
                block.timestamp,
                stateData.inspectionDeadline
            )
        );
        escrow.settle(dealIdEth);
    }

    function test_RevertIf_RaiseDispute_NonBuyerCaller() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        vm.prank(seller);
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.InvalidParticipant.selector, seller));
        escrow.raiseDispute(dealIdEth);
    }

    function test_RevertIf_RaiseDispute_InspectionPeriodExpired() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdEth);
        vm.warp(stateData.inspectionDeadline);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InspectionPeriodExpired.selector,
                stateData.inspectionDeadline,
                stateData.inspectionDeadline
            )
        );
        escrow.raiseDispute(dealIdEth);
    }

    function test_RevertIf_ResolveDispute_UnauthorizedCaller() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        vm.prank(buyer);
        escrow.raiseDispute(dealIdEth);

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.Unauthorized.selector, stranger));
        escrow.resolveDispute(dealIdEth, true);
    }
}
