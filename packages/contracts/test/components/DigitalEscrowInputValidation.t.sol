// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EscrowTestBase} from "../helpers/EscrowTestBase.sol";
import {EscrowTypes} from "../../src/types/EscrowTypes.sol";

/// @title DigitalEscrowInputValidationTest
/// @notice Input validation, zero-checks, and access control revert tests
contract DigitalEscrowInputValidationTest is EscrowTestBase {
    function test_RevertIf_CreateDeal_DuplicateId() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));
        vm.expectRevert(EscrowTypes.DealAlreadyExists.selector);
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

    function test_RevertIf_StartInspection_UnauthorizedCaller() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.Unauthorized.selector, stranger));
        escrow.startInspection(dealIdEth);
    }

    function test_RevertIf_RaiseDispute_CallerNotBuyer() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.InvalidParticipant.selector, stranger));
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
