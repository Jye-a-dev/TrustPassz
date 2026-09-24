// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {DigitalEscrowHappyPathTest} from "./components/DigitalEscrowHappyPath.t.sol";
import {DigitalEscrowRevertsTest} from "./components/DigitalEscrowReverts.t.sol";
import {DigitalEscrowSecurityEdgeTest} from "./components/DigitalEscrowSecurityEdge.t.sol";

/// @title DigitalEscrowTest
/// @notice Aggregated test runner inheriting modular Happy Path, Reverts, and Edge/Security components
contract DigitalEscrowTest is
    DigitalEscrowHappyPathTest,
    DigitalEscrowRevertsTest,
    DigitalEscrowSecurityEdgeTest
{
    function setUp() public override(DigitalEscrowHappyPathTest, DigitalEscrowRevertsTest, DigitalEscrowSecurityEdgeTest) {
        super.setUp();
    }
}
