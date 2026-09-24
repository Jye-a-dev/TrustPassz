// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {DigitalEscrow} from "../src/DigitalEscrow.sol";

/// @title DeployEscrow
/// @notice Deployment script for DigitalEscrow on EVM target chains
contract DeployEscrow is Script {
    function run() external returns (address escrowAddress) {
        uint256 deployerPrivateKey = vm.envOr("DEPLOYER_PRIVATE_KEY", uint256(1));
        address owner = vm.addr(deployerPrivateKey);
        address oracleRelayer = vm.envOr("ORACLE_RELAYER_ADDRESS", owner);
        address disputeResolver = vm.envOr("DISPUTE_RESOLVER_ADDRESS", owner);

        vm.startBroadcast(deployerPrivateKey);

        DigitalEscrow escrow = new DigitalEscrow(owner, oracleRelayer, disputeResolver);
        escrowAddress = address(escrow);

        vm.stopBroadcast();

        console2.log("DigitalEscrow deployed at:", escrowAddress);
        console2.log("Owner:", owner);
        console2.log("OracleRelayer:", oracleRelayer);
        console2.log("DisputeResolver:", disputeResolver);
    }
}
