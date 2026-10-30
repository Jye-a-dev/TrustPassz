// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EscrowTestBase} from "./helpers/EscrowTestBase.sol";
import {DigitalEscrow} from "../src/DigitalEscrow.sol";
import {EscrowTypes} from "../src/types/EscrowTypes.sol";

/// @notice Malicious buyer contract attempting reentrancy attacks into DigitalEscrow
contract MaliciousReentrantBuyer {
    DigitalEscrow public immutable escrow;
    bytes32 public targetDealId;

    enum Action { None, Settle, Deposit, CancelDeposited }
    Action public reentrancyAction;

    constructor(address payable _escrow) {
        escrow = DigitalEscrow(_escrow);
    }

    function setAttack(bytes32 _dealId, Action _action) external {
        targetDealId = _dealId;
        reentrancyAction = _action;
    }

    receive() external payable {
        _dispatch();
    }

    fallback() external payable {
        _dispatch();
    }

    function _dispatch() internal {
        Action act = reentrancyAction;
        if (act == Action.Settle) {
            escrow.settle(targetDealId);
        } else if (act == Action.Deposit) {
            escrow.deposit{value: msg.value}(targetDealId);
        } else if (act == Action.CancelDeposited) {
            escrow.cancelDepositedDeal(targetDealId);
        }
    }
}

/// @notice Malicious seller contract attempting reentrancy attacks into DigitalEscrow
contract MaliciousReentrantSeller {
    DigitalEscrow public immutable escrow;
    bytes32 public targetDealId;

    enum Action { None, Settle, Deposit, CancelDeposited }
    Action public reentrancyAction;

    constructor(address payable _escrow) {
        escrow = DigitalEscrow(_escrow);
    }

    function setAttack(bytes32 _dealId, Action _action) external {
        targetDealId = _dealId;
        reentrancyAction = _action;
    }

    receive() external payable {
        _dispatch();
    }

    fallback() external payable {
        _dispatch();
    }

    function _dispatch() internal {
        Action act = reentrancyAction;
        if (act == Action.Settle) {
            escrow.settle(targetDealId);
        } else if (act == Action.Deposit) {
            escrow.deposit{value: msg.value}(targetDealId);
        } else if (act == Action.CancelDeposited) {
            escrow.cancelDepositedDeal(targetDealId);
        }
    }
}

/// @notice Contract that intentionally reverts upon receiving native ETH
contract EthRejector {
    receive() external payable {
        revert("ETH_REJECTED");
    }
}

/// @notice Test harness exposing internal state machine deadline helpers for test coverage
contract EscrowStateMachineHarness is DigitalEscrow {
    constructor(
        address _owner,
        address _oracleRelayer,
        address _disputeResolver
    ) DigitalEscrow(_owner, _oracleRelayer, _disputeResolver) {}

    function checkDeadlineNotPassed(uint256 deadline) external view {
        _checkDeadlineNotPassed(deadline);
    }

    function checkDeadlinePassed(uint256 deadline) external view {
        _checkDeadlinePassed(deadline);
    }

    function safeTransferZeroToken(address to, uint256 amount) external {
        _safeTransfer(address(0), to, amount);
    }
}

/// @title DigitalEscrowGasAndSecurityTest
/// @notice Comprehensive gas optimization, reentrancy exploit, and branch coverage suite
contract DigitalEscrowGasAndSecurityTest is EscrowTestBase {
    // =========================================================================
    // 1. REENTRANCY EXPLOIT TESTS
    // =========================================================================

    function test_Reentrancy_Buyer_CancelDeposited_AttemptsReentrantCancel() external {
        MaliciousReentrantBuyer malBuyer = new MaliciousReentrantBuyer(payable(address(escrow)));
        vm.deal(address(malBuyer), 10 ether);

        bytes32 attackId = keccak256("REENTRANCY_BUYER_CANCEL");
        malBuyer.setAttack(attackId, MaliciousReentrantBuyer.Action.CancelDeposited);

        EscrowTypes.DealConfig memory config = EscrowTypes.DealConfig({
            buyer: address(malBuyer),
            seller: seller,
            inspectionDuration: DURATION,
            token: address(0),
            amount: ETH_AMOUNT
        });

        escrow.createDeal(attackId, config);

        vm.prank(address(malBuyer));
        escrow.deposit{value: ETH_AMOUNT}(attackId);

        vm.warp(block.timestamp + escrow.DELIVERY_TIMEOUT() + 1);

        vm.prank(address(malBuyer));
        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        escrow.cancelDepositedDeal(attackId);
    }

    function test_Reentrancy_Buyer_CancelDeposited_AttemptsReentrantDeposit() external {
        MaliciousReentrantBuyer malBuyer = new MaliciousReentrantBuyer(payable(address(escrow)));
        vm.deal(address(malBuyer), 10 ether);

        bytes32 attackId = keccak256("REENTRANCY_BUYER_DEPOSIT");
        malBuyer.setAttack(attackId, MaliciousReentrantBuyer.Action.Deposit);

        EscrowTypes.DealConfig memory config = EscrowTypes.DealConfig({
            buyer: address(malBuyer),
            seller: seller,
            inspectionDuration: DURATION,
            token: address(0),
            amount: ETH_AMOUNT
        });

        escrow.createDeal(attackId, config);

        vm.prank(address(malBuyer));
        escrow.deposit{value: ETH_AMOUNT}(attackId);

        vm.warp(block.timestamp + escrow.DELIVERY_TIMEOUT() + 1);

        vm.prank(address(malBuyer));
        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        escrow.cancelDepositedDeal(attackId);
    }

    function test_Reentrancy_Seller_Settle_AttemptsReentrantSettle() external {
        MaliciousReentrantSeller malSeller = new MaliciousReentrantSeller(payable(address(escrow)));
        bytes32 attackId = keccak256("REENTRANCY_SELLER_SETTLE");
        malSeller.setAttack(attackId, MaliciousReentrantSeller.Action.Settle);

        EscrowTypes.DealConfig memory config = EscrowTypes.DealConfig({
            buyer: buyer,
            seller: address(malSeller),
            inspectionDuration: DURATION,
            token: address(0),
            amount: ETH_AMOUNT
        });

        escrow.createDeal(attackId, config);

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(attackId);

        vm.prank(address(malSeller));
        escrow.startInspection(attackId);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(attackId);
        vm.warp(stateData.inspectionDeadline);

        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        escrow.settle(attackId);
    }

    function test_Reentrancy_Seller_Settle_AttemptsReentrantDeposit() external {
        MaliciousReentrantSeller malSeller = new MaliciousReentrantSeller(payable(address(escrow)));
        bytes32 attackId = keccak256("REENTRANCY_SELLER_DEPOSIT");
        malSeller.setAttack(attackId, MaliciousReentrantSeller.Action.Deposit);

        EscrowTypes.DealConfig memory config = EscrowTypes.DealConfig({
            buyer: buyer,
            seller: address(malSeller),
            inspectionDuration: DURATION,
            token: address(0),
            amount: ETH_AMOUNT
        });

        escrow.createDeal(attackId, config);

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(attackId);

        vm.prank(address(malSeller));
        escrow.startInspection(attackId);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(attackId);
        vm.warp(stateData.inspectionDeadline);

        vm.expectRevert(ReentrancyGuard.ReentrancyGuardReentrantCall.selector);
        escrow.settle(attackId);
    }

    // =========================================================================
    // 2. DOUBLE SETTLEMENT PROTECTION
    // =========================================================================

    function test_Security_DoubleSettlementProtection_Reverts() external {
        bytes32 dealId = keccak256("DOUBLE_SETTLE_DEAL");
        escrow.createDeal(dealId, _buildConfig(address(0), ETH_AMOUNT));

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealId);

        vm.prank(seller);
        escrow.startInspection(dealId);

        vm.prank(buyer);
        escrow.settle(dealId);

        // Verification: deal state is now Settled
        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealId);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Settled));

        // Re-executing settle must immediately revert at state check layer
        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.InvalidDealState.selector,
                EscrowTypes.DealState.Settled,
                EscrowTypes.DealState.InInspection
            )
        );
        escrow.settle(dealId);
    }

    // =========================================================================
    // 3. TIME-WARP EDGE CASES & BRANCH CONDITIONS
    // =========================================================================

    function test_TimeWarp_DeliveryTimeout_ExactDeadline_Succeeds() external {
        bytes32 dealId = keccak256("TIMEWARP_DELIVERY_EXACT");
        escrow.createDeal(dealId, _buildConfig(address(0), ETH_AMOUNT));

        uint256 depositTimestamp = 1_000_000;
        vm.warp(depositTimestamp);
        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealId);

        uint256 exactReleaseTime = depositTimestamp + escrow.DELIVERY_TIMEOUT();
        vm.warp(exactReleaseTime);

        uint256 buyerBalBefore = buyer.balance;
        vm.prank(buyer);
        escrow.cancelDepositedDeal(dealId);

        assertEq(buyer.balance, buyerBalBefore + ETH_AMOUNT);
        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealId);
        assertEq(uint8(stateData.state), uint8(EscrowTypes.DealState.Refunded));
    }

    function test_PaymentProcessor_NativeTransferFailed() external {
        EthRejector rejector = new EthRejector();
        bytes32 dealId = keccak256("ETH_REJECTOR_DEAL");

        EscrowTypes.DealConfig memory config = EscrowTypes.DealConfig({
            buyer: buyer,
            seller: address(rejector),
            inspectionDuration: DURATION,
            token: address(0),
            amount: ETH_AMOUNT
        });

        escrow.createDeal(dealId, config);

        vm.prank(buyer);
        escrow.deposit{value: ETH_AMOUNT}(dealId);

        vm.prank(oracle);
        escrow.startInspection(dealId);

        (, EscrowTypes.DealStateData memory stateData) = escrow.getDeal(dealId);
        vm.warp(stateData.inspectionDeadline);

        vm.expectRevert(
            abi.encodeWithSelector(
                EscrowTypes.NativeTransferFailed.selector,
                address(rejector),
                ETH_AMOUNT
            )
        );
        escrow.settle(dealId);
    }

    // =========================================================================
    // 4. ACCESS CONTROL BRANCH & STATEMENT COVERAGE
    // =========================================================================

    function test_AccessControl_Constructor_ZeroAddressReverts() external {
        vm.expectRevert(EscrowTypes.ZeroAddress.selector);
        new DigitalEscrow(address(0), oracle, arbitrator);

        vm.expectRevert(EscrowTypes.ZeroAddress.selector);
        new DigitalEscrow(owner, address(0), arbitrator);

        vm.expectRevert(EscrowTypes.ZeroAddress.selector);
        new DigitalEscrow(owner, oracle, address(0));
    }

    function test_AccessControl_TransferOwnership_Branches() external {
        address newOwner = makeAddr("newOwner");

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.Unauthorized.selector, stranger));
        escrow.transferOwnership(newOwner);

        vm.prank(owner);
        vm.expectRevert(EscrowTypes.ZeroAddress.selector);
        escrow.transferOwnership(address(0));

        vm.prank(owner);
        escrow.transferOwnership(newOwner);
        assertEq(escrow.owner(), newOwner);
    }

    function test_AccessControl_SetOracleRelayer_Branches() external {
        address newOracle = makeAddr("newOracle");

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.Unauthorized.selector, stranger));
        escrow.setOracleRelayer(newOracle);

        vm.prank(owner);
        vm.expectRevert(EscrowTypes.ZeroAddress.selector);
        escrow.setOracleRelayer(address(0));

        vm.prank(owner);
        escrow.setOracleRelayer(newOracle);
        assertEq(escrow.oracleRelayer(), newOracle);
    }

    function test_AccessControl_SetDisputeResolver_Branches() external {
        address newResolver = makeAddr("newResolver");

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.Unauthorized.selector, stranger));
        escrow.setDisputeResolver(newResolver);

        vm.prank(owner);
        vm.expectRevert(EscrowTypes.ZeroAddress.selector);
        escrow.setDisputeResolver(address(0));

        vm.prank(owner);
        escrow.setDisputeResolver(newResolver);
        assertEq(escrow.disputeResolver(), newResolver);
    }

    // =========================================================================
    // 5. CUSTOM ERRORS & STATE MACHINE COVERAGE
    // =========================================================================

    function test_CustomErrors_StateMachineHarness() external {
        EscrowStateMachineHarness harness = new EscrowStateMachineHarness(owner, oracle, arbitrator);

        // Test _checkDeadlineNotPassed
        harness.checkDeadlineNotPassed(block.timestamp + 100);
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.DeadlinePassed.selector, block.timestamp, block.timestamp));
        harness.checkDeadlineNotPassed(block.timestamp);

        // Test _checkDeadlinePassed
        harness.checkDeadlinePassed(block.timestamp);
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.DeadlineNotPassed.selector, block.timestamp + 100, block.timestamp));
        harness.checkDeadlinePassed(block.timestamp + 100);

        // Test InvalidTokenAddress check in PaymentProcessor
        vm.expectRevert(abi.encodeWithSelector(EscrowTypes.InvalidTokenAddress.selector, address(0)));
        harness.safeTransferZeroToken(buyer, 100);
    }
}

