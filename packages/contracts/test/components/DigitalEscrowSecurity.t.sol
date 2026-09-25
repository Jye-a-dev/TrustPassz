// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EscrowTestBase, ReentrancyAttacker} from "../helpers/EscrowTestBase.sol";
import {EscrowTypes} from "../../src/types/EscrowTypes.sol";

/// @title DigitalEscrowSecurityTest
/// @notice Tests for EOA fake token detection, boundary conditions, and reentrancy defense
contract DigitalEscrowSecurityTest is EscrowTestBase {
    // =========================================================================
    // 1. SECURITY: EOA FAKE TOKEN DETECTION
    // =========================================================================

    function test_Security_FakeTokenEOA_RevertsERC20TransferFailed() external {
        address fakeTokenEOA = makeAddr("fakeTokenEOA");
        bytes32 fakeDealId = keccak256("FAKE_TOKEN_DEAL");

        EscrowTypes.DealConfig memory config = EscrowTypes.DealConfig({
            buyer: buyer,
            seller: seller,
            token: fakeTokenEOA,
            amount: 500e6,
            inspectionDuration: DURATION
        });

        escrow.createDeal(fakeDealId, config);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.ERC20TransferFailed.selector,
                fakeTokenEOA,
                address(escrow),
                500e6
            )
        );
        escrow.deposit(fakeDealId);
    }

    // =========================================================================
    // 2. BOUNDARY TIME-LOCK TESTS
    // =========================================================================

    function test_Boundary_Settle_OneSecondBeforeDeadline_RevertsNonBuyer() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdEth);

        vm.warp(stateData.inspectionDeadline - 1);
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InspectionPeriodStillActive.selector,
                stateData.inspectionDeadline,
                stateData.inspectionDeadline - 1
            )
        );
        escrow.settle(dealIdEth);
    }

    function test_Boundary_Settle_ExactDeadline_Succeeds() external {
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

    function test_Boundary_Dispute_OneSecondBeforeDeadline_Succeeds() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdEth);

        vm.warp(stateData.inspectionDeadline - 1);
        vm.prank(buyer);
        escrow.raiseDispute(dealIdEth);

        (, stateData) = escrow.getDeal(dealIdEth);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Disputed));
    }

    function test_Boundary_Dispute_ExactDeadline_Reverts() external {
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

    // =========================================================================
    // 3. SECURITY: REENTRANCY ATTACKS (settle & cancelDepositedDeal)
    // =========================================================================

    function test_Security_Reentrancy_Settle_RevertsReentrantCall() external {
        ReentrancyAttacker attacker = new ReentrancyAttacker(payable(address(escrow)));
        bytes32 attackDealId = keccak256("REENTRANCY_SETTLE_ATTACK");
        attacker.setTarget(attackDealId, ReentrancyAttacker.AttackTarget.Settle);

        EscrowTypes.DealConfig memory config = EscrowTypes.DealConfig({
            buyer: buyer,
            seller: address(attacker),
            token: address(0),
            amount: ETH_AMOUNT,
            inspectionDuration: DURATION
        });

        escrow.createDeal(attackDealId, config);

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(attackDealId);

        vm.prank(address(attacker));
        escrow.startInspection(attackDealId);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(attackDealId);
        vm.warp(stateData.inspectionDeadline);

        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        escrow.settle(attackDealId);
    }

    function test_Security_Reentrancy_CancelDeposited_RevertsReentrantCall() external {
        ReentrancyAttacker attacker = new ReentrancyAttacker(payable(address(escrow)));
        vm.deal(address(attacker), 10 ether);

        bytes32 attackDealId = keccak256("REENTRANCY_CANCEL_ATTACK");
        attacker.setTarget(attackDealId, ReentrancyAttacker.AttackTarget.CancelDeposited);

        EscrowTypes.DealConfig memory config = EscrowTypes.DealConfig({
            buyer: address(attacker),
            seller: seller,
            token: address(0),
            amount: ETH_AMOUNT,
            inspectionDuration: DURATION
        });

        escrow.createDeal(attackDealId, config);

        vm.prank(address(attacker));
        escrow.deposit{value: ETH_AMOUNT}(attackDealId);

        vm.warp(block.timestamp + escrow.DELIVERY_TIMEOUT() + 1);

        vm.prank(address(attacker));
        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        escrow.cancelDepositedDeal(attackDealId);
    }
}
