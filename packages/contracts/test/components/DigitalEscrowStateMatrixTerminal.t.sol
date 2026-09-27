// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EscrowTestBase} from "../helpers/EscrowTestBase.sol";
import {EscrowTypes} from "../../src/types/EscrowTypes.sol";

/// @title DigitalEscrowStateMatrixTerminalTest
/// @notice State matrix transition tests for terminal and dispute states (Settled, Refunded, Disputed)
abstract contract DigitalEscrowStateMatrixTerminalTest is EscrowTestBase {
    // =========================================================================
    // 1. TERMINAL STATES TRANSITION PREVENTION (Settled & Refunded)
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
    // 2. DISPUTED STATE TRANSITION MATRIX
    // =========================================================================

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
