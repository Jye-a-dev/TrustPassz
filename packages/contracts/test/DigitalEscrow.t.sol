// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EscrowTestBase} from "./helpers/EscrowTestBase.sol";
import {DigitalEscrowHappyPathTest} from "./components/DigitalEscrowHappyPath.t.sol";
import {DigitalEscrowInputValidationTest} from "./components/DigitalEscrowInputValidation.t.sol";
import {DigitalEscrowSecurityTest} from "./components/DigitalEscrowSecurity.t.sol";
import {DigitalEscrowStateMatrixTest} from "./components/DigitalEscrowStateMatrix.t.sol";
import {DigitalEscrowTimeoutTest} from "./components/DigitalEscrowTimeout.t.sol";

/// @title DigitalEscrowTest
/// @notice Aggregated test runner inheriting modular component test suites
contract DigitalEscrowTest is
    DigitalEscrowHappyPathTest,
    DigitalEscrowInputValidationTest,
    DigitalEscrowSecurityTest,
    DigitalEscrowStateMatrixTest,
    DigitalEscrowTimeoutTest
{
    function setUp() public virtual override(EscrowTestBase) {
        super.setUp();
    }
}
