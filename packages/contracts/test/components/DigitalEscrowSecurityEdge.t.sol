// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EscrowTestBase, MaliciousReentrantReceiver} from "../helpers/EscrowTestBase.sol";
import {EscrowTypes} from "../../src/types/EscrowTypes.sol";

/// @title DigitalEscrowSecurityEdgeTest
/// @notice Edge cases, sub-second time-warp boundary, and reentrancy attack tests
contract DigitalEscrowSecurityEdgeTest is EscrowTestBase {
    function test_EdgeCase_DeadlineBoundary_OneSecondBefore_RevertsNonBuyer() external {
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
                stateData.inspectionDeadline - 1,
                stateData.inspectionDeadline
            )
        );
        escrow.settle(dealIdEth);
    }

    function test_EdgeCase_DeadlineBoundary_ExactDeadline_Succeeds() external {
        escrow.createDeal(dealIdEth, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealIdEth);

        vm.prank(seller);
        escrow.startInspection(dealIdEth);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealIdEth);

        vm.warp(stateData.inspectionDeadline);

        vm.prank(stranger);
        escrow.settle(dealIdEth);

        (, stateData) = escrow.getDeal(dealIdEth);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Settled));
    }

    function test_EdgeCase_DisputeBoundary_OneSecondBefore_Succeeds() external {
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

    function test_Security_ReentrancyAttack_DisbursementBlocked() external {
        MaliciousReentrantReceiver malicious = new MaliciousReentrantReceiver(payable(address(escrow)));
        bytes32 reentrantDealId = keccak256("REENTRANT_DEAL_TEST");
        malicious.setTargetDealId(reentrantDealId);

        EscrowTypes.DealConfig memory config = EscrowTypes.DealConfig({
            buyer: buyer,
            seller: address(malicious),
            token: address(0),
            amount: ETH_AMOUNT,
            inspectionDuration: DURATION
        });

        escrow.createDeal(reentrantDealId, config);

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(reentrantDealId);

        vm.prank(address(malicious));
        escrow.startInspection(reentrantDealId);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(reentrantDealId);
        vm.warp(stateData.inspectionDeadline);

        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.NativeTransferFailed.selector,
                address(malicious),
                ETH_AMOUNT
            )
        );
        escrow.settle(reentrantDealId);
    }
}
