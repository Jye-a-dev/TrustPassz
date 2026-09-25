// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {DigitalEscrow} from "../../src/DigitalEscrow.sol";
import {EscrowTypes} from "../../src/types/EscrowTypes.sol";
import {MockUSDC} from "../../src/mocks/MockUSDC.sol";

/// @title ReentrancyAttacker
/// @notice Malicious contract attempting reentrancy attacks into settle() or cancelDepositedDeal()
contract ReentrancyAttacker {
    DigitalEscrow public immutable escrow;
    bytes32 public targetDealId;

    enum AttackTarget {
        Settle,
        CancelDeposited
    }

    AttackTarget public attackTarget;

    constructor(address payable _escrow) {
        escrow = DigitalEscrow(_escrow);
    }

    function setTarget(bytes32 _dealId, AttackTarget _target) external {
        targetDealId = _dealId;
        attackTarget = _target;
    }

    receive() external payable {
        if (attackTarget == AttackTarget.Settle) {
            escrow.settle(targetDealId);
        } else {
            escrow.cancelDepositedDeal(targetDealId);
        }
    }
}

/// @title EscrowTestBase
/// @notice Shared fixture, actors, and setup harness for DigitalEscrow tests
abstract contract EscrowTestBase is Test {
    DigitalEscrow internal escrow;
    MockUSDC internal usdc;

    address internal owner = makeAddr("owner");
    address internal oracle = makeAddr("oracle");
    address internal arbitrator = makeAddr("arbitrator");
    address internal buyer = makeAddr("buyer");
    address internal seller = makeAddr("seller");
    address internal stranger = makeAddr("stranger");

    bytes32 internal dealIdEth = keccak256("DEAL_ETH_TEST_1");
    bytes32 internal dealIdUsdc = keccak256("DEAL_USDC_TEST_1");

    uint256 internal constant ETH_AMOUNT = 1 ether;
    uint256 internal constant USDC_AMOUNT = 1000e6;
    uint256 internal constant DURATION = 3 days;

    function setUp() public virtual {
        vm.deal(buyer, 100 ether);
        vm.deal(seller, 100 ether);
        vm.deal(stranger, 100 ether);

        escrow = new DigitalEscrow(owner, oracle, arbitrator);
        usdc = new MockUSDC();

        usdc.mint(buyer, 100_000e6);
        vm.prank(buyer);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function _buildConfig(address token, uint256 amount) internal view returns (EscrowTypes.DealConfig memory) {
        return EscrowTypes.DealConfig({
            buyer: buyer,
            seller: seller,
            token: token,
            amount: amount,
            inspectionDuration: DURATION
        });
    }

    function _setupDealAtState(bytes32 dealId, EscrowTypes.DealState targetState) internal {
        escrow.createDeal(dealId, _buildConfig(address(0), ETH_AMOUNT));
        if (targetState == EscrowTypes.DealState.Pending) return;

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealId);
        if (targetState == EscrowTypes.DealState.Deposited) return;

        if (targetState == EscrowTypes.DealState.Refunded) {
            vm.warp(block.timestamp + escrow.DELIVERY_TIMEOUT() + 1);
            vm.prank(buyer);
            escrow.cancelDepositedDeal(dealId);
            return;
        }

        vm.prank(seller);
        escrow.startInspection(dealId);
        if (targetState == EscrowTypes.DealState.InInspection) return;

        if (targetState == EscrowTypes.DealState.Settled) {
            vm.prank(buyer);
            escrow.settle(dealId);
            return;
        }

        if (targetState == EscrowTypes.DealState.Disputed) {
            vm.prank(buyer);
            escrow.raiseDispute(dealId);
            return;
        }
    }
}
