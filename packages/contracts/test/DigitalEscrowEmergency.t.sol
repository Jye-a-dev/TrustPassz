// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {EscrowTestBase} from "./helpers/EscrowTestBase.sol";
import {DigitalEscrow} from "../src/DigitalEscrow.sol";
import {EscrowTypes} from "../src/types/EscrowTypes.sol";

/// @title DigitalEscrowEmergencyTest
/// @notice Comprehensive test suite for Multi-sig Access Control and Circuit Breaker (Pause/Unpause)
contract DigitalEscrowEmergencyTest is EscrowTestBase {
    event Paused(address account);
    event Unpaused(address account);
    event EmergencyCircuitBreakerTriggered(address indexed admin, string reason);
    event DealEmergencyFrozen(bytes32 indexed dealId, address indexed trigger);

    bytes32 private dealPending = keccak256("EMERGENCY_DEAL_PENDING");
    bytes32 private dealDeposited = keccak256("EMERGENCY_DEAL_DEPOSITED");
    bytes32 private dealInInspection = keccak256("EMERGENCY_DEAL_INSPECTION");
    bytes32 private dealInInspectionDispute = keccak256("EMERGENCY_DEAL_INSPECTION_DISPUTE");
    bytes32 private dealDisputed = keccak256("EMERGENCY_DEAL_DISPUTED");

    // =========================================================================
    // 1. HAPPY PATH TESTS
    // =========================================================================

    function test_HappyPath_EmergencyRole_Arbitrator_CanPause() external {
        vm.prank(arbitrator);
        vm.expectEmit(true, false, false, false, address(escrow));
        emit Paused(arbitrator);
        vm.expectEmit(true, false, false, true, address(escrow));
        emit EmergencyCircuitBreakerTriggered(arbitrator, "Emergency circuit breaker triggered");

        escrow.pause();
        assertTrue(escrow.paused());
    }

    function test_HappyPath_Admin_CanPauseWithReason() external {
        string memory reason = "Suspicious oracle activity detected";
        vm.prank(owner);
        vm.expectEmit(true, false, false, false, address(escrow));
        emit Paused(owner);
        vm.expectEmit(true, false, false, true, address(escrow));
        emit EmergencyCircuitBreakerTriggered(owner, reason);

        escrow.pause(reason);
        assertTrue(escrow.paused());
    }

    function test_HappyPath_MultiSigAdmin_CanUnpause() external {
        vm.prank(arbitrator);
        escrow.pause();
        assertTrue(escrow.paused());

        vm.prank(owner);
        vm.expectEmit(true, false, false, false, address(escrow));
        emit Unpaused(owner);

        escrow.unpause();
        assertFalse(escrow.paused());
    }

    function test_HappyPath_EmergencyFreezeDeal() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(arbitrator);
        vm.expectEmit(true, true, false, false, address(escrow));
        emit DealEmergencyFrozen(dealIdEth, arbitrator);

        escrow.emergencyFreezeDeal(dealIdEth);
    }

    // =========================================================================
    // 2. ACCESS CONTROL REVERT TESTS
    // =========================================================================

    function test_Revert_UnauthorizedCaller_CannotPause() external {
        bytes32 emergencyRole = escrow.EMERGENCY_ROLE();

        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, emergencyRole)
        );
        escrow.pause();

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, buyer, emergencyRole)
        );
        escrow.pause();

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, seller, emergencyRole)
        );
        escrow.pause();
    }

    function test_Revert_UnauthorizedCaller_CannotUnpause() external {
        vm.prank(owner);
        escrow.pause();

        bytes32 adminRole = escrow.DEFAULT_ADMIN_ROLE();

        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, stranger, adminRole)
        );
        escrow.unpause();

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, buyer, adminRole)
        );
        escrow.unpause();

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, seller, adminRole)
        );
        escrow.unpause();
    }

    function test_Revert_EmergencyRole_CannotUnpause() external {
        vm.prank(arbitrator);
        escrow.pause();

        bytes32 adminRole = escrow.DEFAULT_ADMIN_ROLE();

        // Arbitrator with EMERGENCY_ROLE must NOT be able to unpause
        vm.prank(arbitrator);
        vm.expectRevert(
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, arbitrator, adminRole)
        );
        escrow.unpause();
    }

    function test_Revert_PauseWhenAlreadyPaused() external {
        vm.prank(owner);
        escrow.pause();

        vm.prank(owner);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        escrow.pause();
    }

    function test_Revert_UnpauseWhenNotPaused() external {
        vm.prank(owner);
        vm.expectRevert(Pausable.ExpectedPause.selector);
        escrow.unpause();
    }

    function test_Revert_EmergencyFreezeDeal_Unauthorized() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                stranger,
                escrow.EMERGENCY_ROLE()
            )
        );
        escrow.emergencyFreezeDeal(dealIdEth);
    }

    function test_Revert_EmergencyFreezeDeal_NotFound() external {
        bytes32 nonExistentDeal = keccak256("NON_EXISTENT");

        vm.prank(owner);
        vm.expectRevert(EscrowTypes.DealNotFound.selector);
        escrow.emergencyFreezeDeal(nonExistentDeal);
    }

    // =========================================================================
    // 3. CIRCUIT BREAKER ENFORCEMENT (BLOCKED ON PAUSE)
    // =========================================================================

    function test_CircuitBreaker_AllMutationsRevertWhenPaused() external {
        // Pre-create deals across states before pausing
        escrow.createDeal(dealPending, _buildConfig(address(0), ETH_AMOUNT));
        _setupDealAtState(dealDeposited, EscrowTypes.DealState.Deposited);
        _setupDealAtState(dealInInspection, EscrowTypes.DealState.InInspection);
        _setupDealAtState(dealInInspectionDispute, EscrowTypes.DealState.InInspection);
        _setupDealAtState(dealDisputed, EscrowTypes.DealState.Disputed);

        // Engage Circuit Breaker
        vm.prank(arbitrator);
        escrow.pause();
        assertTrue(escrow.paused());

        // 1. createDeal must revert
        bytes32 newDeal = keccak256("NEW_PAUSED_DEAL");
        vm.expectRevert(Pausable.EnforcedPause.selector);
        escrow.createDeal(newDeal, _buildConfig(address(0), ETH_AMOUNT));

        // 2. deposit must revert
        vm.prank(buyer);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        escrow.deposit{value: ETH_AMOUNT}(dealPending);

        // 3. startInspection must revert
        vm.prank(seller);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        escrow.startInspection(dealDeposited);

        // 4. cancelDepositedDeal must revert even after timeout
        vm.warp(block.timestamp + escrow.DELIVERY_TIMEOUT() + 1);
        vm.prank(buyer);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        escrow.cancelDepositedDeal(dealDeposited);

        // 5. settle must revert even after inspection deadline
        (, EscrowTypes.DealStateData memory inspState) = escrow.getDeal(dealInInspection);
        vm.warp(inspState.inspectionDeadline + 1);
        vm.prank(buyer);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        escrow.settle(dealInInspection);

        // 6. raiseDispute must revert
        vm.prank(buyer);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        escrow.raiseDispute(dealInInspectionDispute);

        // 7. resolveDispute must revert
        vm.prank(arbitrator);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        escrow.resolveDispute(dealDisputed, true);

        // 8. View/pure methods must continue to work normally
        (EscrowTypes.DealConfig memory cfg, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealDeposited);
        assertEq(cfg.buyer, buyer);
        assertEq(cfg.amount, ETH_AMOUNT);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Deposited));
        assertFalse(escrow.isInspectionExpired(dealDeposited));
    }

    // =========================================================================
    // 4. POST-UNPAUSE FULL RECOVERY TESTS
    // =========================================================================

    function test_CircuitBreaker_FullRecoveryAfterUnpause() external {
        // Pause contract
        vm.prank(arbitrator);
        escrow.pause();
        assertTrue(escrow.paused());

        // Multi-sig unpauses
        vm.prank(owner);
        escrow.unpause();
        assertFalse(escrow.paused());

        // A. createDeal succeeds
        bytes32 testDeal = keccak256("RECOVERY_DEAL");
        escrow.createDeal(testDeal, _buildConfig(address(0), ETH_AMOUNT));

        // B. deposit succeeds
        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(testDeal);

        // C. startInspection succeeds
        vm.prank(seller);
        escrow.startInspection(testDeal);

        // D. settle succeeds
        uint256 sellerBalBefore = seller.balance;
        vm.prank(buyer);
        escrow.settle(testDeal);
        assertEq(seller.balance, sellerBalBefore + ETH_AMOUNT);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(testDeal);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Settled));
    }

    function test_CircuitBreaker_CancelDepositedRecoversAfterUnpause() external {
        bytes32 cancelDeal = keccak256("RECOVERY_CANCEL_DEAL");
        escrow.createDeal(cancelDeal, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(cancelDeal);

        // Pause and unpause
        vm.prank(arbitrator);
        escrow.pause();
        vm.prank(owner);
        escrow.unpause();

        // Warp past timeout and cancel
        vm.warp(block.timestamp + escrow.DELIVERY_TIMEOUT() + 1);
        uint256 buyerBalBefore = buyer.balance;
        vm.prank(buyer);
        escrow.cancelDepositedDeal(cancelDeal);
        assertEq(buyer.balance, buyerBalBefore + ETH_AMOUNT);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(cancelDeal);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Refunded));
    }

    function test_CircuitBreaker_DisputeResolutionRecoversAfterUnpause() external {
        bytes32 dispDeal = keccak256("RECOVERY_DISPUTE_DEAL");
        escrow.createDeal(dispDeal, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dispDeal);

        vm.prank(seller);
        escrow.startInspection(dispDeal);

        vm.prank(buyer);
        escrow.raiseDispute(dispDeal);

        // Pause and unpause
        vm.prank(owner);
        escrow.pause();
        vm.prank(owner);
        escrow.unpause();

        // Resolve dispute
        uint256 buyerBalBefore = buyer.balance;
        vm.prank(arbitrator);
        escrow.resolveDispute(dispDeal, true);
        assertEq(buyer.balance, buyerBalBefore + ETH_AMOUNT);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dispDeal);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Refunded));
    }
}

