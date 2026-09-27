// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {DigitalEscrowStateMatrixActiveTest} from "./DigitalEscrowStateMatrixActive.t.sol";
import {DigitalEscrowStateMatrixTerminalTest} from "./DigitalEscrowStateMatrixTerminal.t.sol";

/// @title DigitalEscrowStateMatrixTest
/// @notice Comprehensive 7-state matrix transition tests aggregated from active & terminal component suites
abstract contract DigitalEscrowStateMatrixTest is
    DigitalEscrowStateMatrixActiveTest,
    DigitalEscrowStateMatrixTerminalTest
{}
