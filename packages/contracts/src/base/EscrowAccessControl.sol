// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EscrowTypes} from "../types/EscrowTypes.sol";

/// @title EscrowAccessControl
/// @notice Abstract contract governing multi-role access (Owner, OracleRelayer, DisputeResolver)
abstract contract EscrowAccessControl {
    address public owner;
    address public oracleRelayer;
    address public disputeResolver;

    event OwnerUpdated(address indexed previousOwner, address indexed newOwner);
    event OracleRelayerUpdated(address indexed previousOracle, address indexed newOracle);
    event DisputeResolverUpdated(address indexed previousResolver, address indexed newResolver);

    modifier onlyOwner() {
        if (msg.sender != owner) revert EscrowTypes.Unauthorized(msg.sender);
        _;
    }

    modifier onlyOracleRelayer() {
        if (msg.sender != oracleRelayer) revert EscrowTypes.Unauthorized(msg.sender);
        _;
    }

    modifier onlyDisputeResolver() {
        if (msg.sender != disputeResolver) revert EscrowTypes.Unauthorized(msg.sender);
        _;
    }

    modifier onlyArbitratorOrOracle() {
        if (msg.sender != disputeResolver && msg.sender != oracleRelayer) {
            revert EscrowTypes.Unauthorized(msg.sender);
        }
        _;
    }

    constructor(address _owner, address _oracleRelayer, address _disputeResolver) {
        if (_owner == address(0) || _oracleRelayer == address(0) || _disputeResolver == address(0)) {
            revert EscrowTypes.ZeroAddress();
        }
        owner = _owner;
        oracleRelayer = _oracleRelayer;
        disputeResolver = _disputeResolver;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert EscrowTypes.ZeroAddress();
        emit OwnerUpdated(owner, _newOwner);
        owner = _newOwner;
    }

    function setOracleRelayer(address _newOracle) external onlyOwner {
        if (_newOracle == address(0)) revert EscrowTypes.ZeroAddress();
        emit OracleRelayerUpdated(oracleRelayer, _newOracle);
        oracleRelayer = _newOracle;
    }

    function setDisputeResolver(address _newResolver) external onlyOwner {
        if (_newResolver == address(0)) revert EscrowTypes.ZeroAddress();
        emit DisputeResolverUpdated(disputeResolver, _newResolver);
        disputeResolver = _newResolver;
    }
}
