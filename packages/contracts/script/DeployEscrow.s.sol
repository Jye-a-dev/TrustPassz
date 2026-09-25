// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {DigitalEscrow} from "../src/DigitalEscrow.sol";

/// @title DeployEscrow
/// @notice Production deployment script for DigitalEscrow on Base Sepolia (Chain ID: 84532)
contract DeployEscrow is Script {
    function run() external returns (address escrowAddress) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Required Oracle Relayer address from environment
        address oracleRelayer = vm.envAddress("ORACLE_RELAYER_ADDRESS");

        // Dispute Resolver address defaults to deployer if unspecified
        address disputeResolver = vm.envOr("DISPUTE_RESOLVER_ADDRESS", deployer);

        require(deployer != address(0), "Deployer address cannot be zero");
        require(oracleRelayer != address(0), "Oracle relayer address cannot be zero");
        require(disputeResolver != address(0), "Dispute resolver address cannot be zero");

        console2.log("=== Base Sepolia Deployment Configuration ===");
        console2.log("Chain ID:          ", block.chainid);
        console2.log("Deployer / Owner:  ", deployer);
        console2.log("Oracle Relayer:    ", oracleRelayer);
        console2.log("Dispute Resolver:  ", disputeResolver);

        vm.startBroadcast(deployerPrivateKey);

        DigitalEscrow escrow = new DigitalEscrow(deployer, oracleRelayer, disputeResolver);
        escrowAddress = address(escrow);

        vm.stopBroadcast();

        console2.log("---------------------------------------------");
        console2.log("CONTRACT_DEPLOYED_AT:", escrowAddress);
        console2.log("=============================================");
    }
}

