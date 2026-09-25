// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EscrowTestBase} from "../helpers/EscrowTestBase.sol";
import {EscrowTypes} from "../../src/types/EscrowTypes.sol";

/// @title DigitalEscrowStateMatrixTest
/// @notice Comprehensive 7-state matrix transition tests (Uninitialized, Pending, Deposited, InInspection, Settled, Refunded, Disputed)
contract DigitalEscrowStateMatrixTest is EscrowTestBase {
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
        bytes32 uninitId = keccak256("UNINIT_DISPUTE");
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
        bytes32 uninitId = keccak256("UNINIT_RESOLVE");
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
    // 2. TERMINAL STATES TRANSITION PREVENTION (Settled & Refunded)
    // =========================================================================

    function test_StateMatrix_Settled_AllTransitions_RevertInvalidDealState() external {
        bytes32 dealId = keccak256("SETTLED_TRANSITIONS");
        _setupDealAtState(dealId, EscrowTypes.DealState.Settled);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Settled,
                EscrowTypes.DealState.Pending
            )
        );
        escrow.deposit{value: ETH_AMOUNT}(dealId);

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Settled,
                EscrowTypes.DealState.Deposited
            )
        );
        escrow.startInspection(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Settled,
                EscrowTypes.DealState.Deposited
            )
        );
        escrow.cancelDepositedDeal(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Settled,
                EscrowTypes.DealState.InInspection
            )
        );
        escrow.settle(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Settled,
                EscrowTypes.DealState.InInspection
            )
        );
        escrow.raiseDispute(dealId);

        vm.prank(arbitrator);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Settled,
                EscrowTypes.DealState.Disputed
            )
        );
        escrow.resolveDispute(dealId, true);
    }

    function test_StateMatrix_Refunded_AllTransitions_RevertInvalidDealState() external {
        bytes32 dealId = keccak256("REFUNDED_TRANSITIONS");
        _setupDealAtState(dealId, EscrowTypes.DealState.Refunded);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Refunded,
                EscrowTypes.DealState.Pending
            )
        );
        escrow.deposit{value: ETH_AMOUNT}(dealId);

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Refunded,
                EscrowTypes.DealState.Deposited
            )
        );
        escrow.startInspection(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Refunded,
                EscrowTypes.DealState.Deposited
            )
        );
        escrow.cancelDepositedDeal(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Refunded,
                EscrowTypes.DealState.InInspection
            )
        );
        escrow.settle(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Refunded,
                EscrowTypes.DealState.InInspection
            )
        );
        escrow.raiseDispute(dealId);

        vm.prank(arbitrator);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Refunded,
                EscrowTypes.DealState.Disputed
            )
        );
        escrow.resolveDispute(dealId, true);
    }

    // =========================================================================
    // 3. INTERMEDIATE STATES INVALID TRANSITION PREVENTION
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
        bytes32 dealId = keccak256("INSPECTION_INVALID");
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

    function test_StateMatrix_Disputed_InvalidTransitions() external {
        bytes32 dealId = keccak256("DISPUTED_INVALID");
        _setupDealAtState(dealId, EscrowTypes.DealState.Disputed);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Disputed,
                EscrowTypes.DealState.Pending
            )
        );
        escrow.deposit{value: ETH_AMOUNT}(dealId);

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Disputed,
                EscrowTypes.DealState.Deposited
            )
        );
        escrow.startInspection(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Disputed,
                EscrowTypes.DealState.Deposited
            )
        );
        escrow.cancelDepositedDeal(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Disputed,
                EscrowTypes.DealState.InInspection
            )
        );
        escrow.settle(dealId);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Disputed,
                EscrowTypes.DealState.InInspection
            )
        );
        escrow.raiseDispute(dealId);
    }
}
