// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EscrowTestBase} from "../helpers/EscrowTestBase.sol";
import {EscrowTypes} from "../../src/types/EscrowTypes.sol";

/// @title DigitalEscrowStateMatrixActiveTest
/// @notice State matrix transition tests for non-terminal states (Uninitialized, Pending, Deposited, InInspection)
abstract contract DigitalEscrowStateMatrixActiveTest is EscrowTestBase {
    // =========================================================================
    // 1. UNINITIALIZED STATE TRANSITION PREVENTION
    // =========================================================================

    function test_StateMatrix_Uninitialized_Deposit_RevertsInvalidDealState() external {
        bytes32 uninitId = keccak256("UNINIT_DEPOSIT");
        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Uninitialized,
                EscrowTypes.DealState.Pending
            )
        );
        escrow.deposit{value: ETH_AMOUNT}(uninitId);
    }

    function test_StateMatrix_Uninitialized_StartInspection_RevertsInvalidDealState() external {
        bytes32 uninitId = keccak256("UNINIT_START_INSPECTION");
        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Uninitialized,
                EscrowTypes.DealState.Deposited
            )
        );
        escrow.startInspection(uninitId);
    }

    function test_StateMatrix_Uninitialized_CancelDeposited_RevertsInvalidDealState() external {
        bytes32 uninitId = keccak256("UNINIT_CANCEL_DEPOSITED");
        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Uninitialized,
                EscrowTypes.DealState.Deposited
            )
        );
        escrow.cancelDepositedDeal(uninitId);
    }

    function test_StateMatrix_Uninitialized_Settle_RevertsInvalidDealState() external {
        bytes32 uninitId = keccak256("UNINIT_SETTLE");
        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Uninitialized,
                EscrowTypes.DealState.InInspection
            )
        );
        escrow.settle(uninitId);
    }

    function test_StateMatrix_Uninitialized_RaiseDispute_RevertsInvalidDealState() external {
        bytes32 uninitId = keccak256("UNINIT_RAISE_DISPUTE");
        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Uninitialized,
                EscrowTypes.DealState.InInspection
            )
        );
        escrow.raiseDispute(uninitId);
    }

    function test_StateMatrix_Uninitialized_ResolveDispute_RevertsInvalidDealState() external {
        bytes32 uninitId = keccak256("UNINIT_RESOLVE_DISPUTE");
        vm.prank(arbitrator);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Uninitialized,
                EscrowTypes.DealState.Disputed
            )
        );
        escrow.resolveDispute(uninitId, true);
    }

    // =========================================================================
    // 2. ACTIVE STATES TRANSITION MATRIX (Pending, Deposited, InInspection)
    // =========================================================================

    function test_StateMatrix_Pending_InvalidTransitions() external {
        bytes32 dealId = keccak256("PENDING_INVALID");
        _setupDealAtState(dealId, EscrowTypes.DealState.Pending);

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Pending,
                EscrowTypes.DealState.Deposited
            )
        );
        escrow.startInspection(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Pending,
                EscrowTypes.DealState.Deposited
            )
        );
        escrow.cancelDepositedDeal(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Pending,
                EscrowTypes.DealState.InInspection
            )
        );
        escrow.settle(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Pending,
                EscrowTypes.DealState.InInspection
            )
        );
        escrow.raiseDispute(dealId);

        vm.prank(arbitrator);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Pending,
                EscrowTypes.DealState.Disputed
            )
        );
        escrow.resolveDispute(dealId, true);
    }

    function test_StateMatrix_Deposited_InvalidTransitions() external {
        bytes32 dealId = keccak256("DEPOSITED_INVALID");
        _setupDealAtState(dealId, EscrowTypes.DealState.Deposited);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Deposited,
                EscrowTypes.DealState.Pending
            )
        );
        escrow.deposit{value: ETH_AMOUNT}(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Deposited,
                EscrowTypes.DealState.InInspection
            )
        );
        escrow.settle(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Deposited,
                EscrowTypes.DealState.InInspection
            )
        );
        escrow.raiseDispute(dealId);

        vm.prank(arbitrator);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Deposited,
                EscrowTypes.DealState.Disputed
            )
        );
        escrow.resolveDispute(dealId, true);
    }

    function test_StateMatrix_InInspection_InvalidTransitions() external {
        bytes32 dealId = keccak256("IN_INSPECTION_INVALID");
        _setupDealAtState(dealId, EscrowTypes.DealState.InInspection);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.InInspection,
                EscrowTypes.DealState.Pending
            )
        );
        escrow.deposit{value: ETH_AMOUNT}(dealId);

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.InInspection,
                EscrowTypes.DealState.Deposited
            )
        );
        escrow.startInspection(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.InInspection,
                EscrowTypes.DealState.Deposited
            )
        );
        escrow.cancelDepositedDeal(dealId);

        vm.prank(arbitrator);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.InInspection,
                EscrowTypes.DealState.Disputed
            )
        );
        escrow.resolveDispute(dealId, true);
    }
}
