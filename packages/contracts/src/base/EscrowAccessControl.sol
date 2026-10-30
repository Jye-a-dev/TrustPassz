// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {EscrowTypes} from "../types/EscrowTypes.sol";

/// @title EscrowAccessControl
/// @notice Role-Based Access Control implementing Multi-sig Admin, Emergency, Relayer, and Dispute Resolver roles
abstract contract EscrowAccessControl is AccessControl {
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant DISPUTE_RESOLVER_ROLE = keccak256("DISPUTE_RESOLVER_ROLE");

    address public owner;
    address public oracleRelayer;
    address public disputeResolver;

    event OwnerUpdated(address indexed previousOwner, address indexed newOwner);
    event OracleRelayerUpdated(address indexed previousOracle, address indexed newOracle);
    event DisputeResolverUpdated(address indexed previousResolver, address indexed newResolver);

    modifier onlyOwner() {
        if (msg.sender != owner && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert EscrowTypes.Unauthorized(msg.sender);
        }
        _;
    }

    modifier onlyOracleRelayer() {
        if (msg.sender != oracleRelayer && !hasRole(RELAYER_ROLE, msg.sender)) {
            revert EscrowTypes.Unauthorized(msg.sender);
        }
        _;
    }

    modifier onlyDisputeResolver() {
        if (msg.sender != disputeResolver && !hasRole(DISPUTE_RESOLVER_ROLE, msg.sender)) {
            revert EscrowTypes.Unauthorized(msg.sender);
        }
        _;
    }

    modifier onlyArbitratorOrOracle() {
        if (
            msg.sender != disputeResolver &&
            msg.sender != oracleRelayer &&
            !hasRole(DISPUTE_RESOLVER_ROLE, msg.sender) &&
            !hasRole(RELAYER_ROLE, msg.sender)
        ) {
            revert EscrowTypes.Unauthorized(msg.sender);
        }
        _;
    }

    modifier onlyEmergencyOrAdmin() {
        if (!hasRole(EMERGENCY_ROLE, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert IAccessControl.AccessControlUnauthorizedAccount(msg.sender, EMERGENCY_ROLE);
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

        // Multi-sig governance configuration
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        _grantRole(EMERGENCY_ROLE, _owner);
        _grantRole(RELAYER_ROLE, _oracleRelayer);
        _grantRole(DISPUTE_RESOLVER_ROLE, _disputeResolver);
        _grantRole(EMERGENCY_ROLE, _disputeResolver);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert EscrowTypes.ZeroAddress();
        emit OwnerUpdated(owner, _newOwner);
        if (owner != disputeResolver) {
            _revokeRole(EMERGENCY_ROLE, owner);
        }
        _revokeRole(DEFAULT_ADMIN_ROLE, owner);
        _grantRole(DEFAULT_ADMIN_ROLE, _newOwner);
        _grantRole(EMERGENCY_ROLE, _newOwner);
        owner = _newOwner;
    }

    function setOracleRelayer(address _newOracle) external onlyOwner {
        if (_newOracle == address(0)) revert EscrowTypes.ZeroAddress();
        emit OracleRelayerUpdated(oracleRelayer, _newOracle);
        _revokeRole(RELAYER_ROLE, oracleRelayer);
        _grantRole(RELAYER_ROLE, _newOracle);
        oracleRelayer = _newOracle;
    }

    function setDisputeResolver(address _newResolver) external onlyOwner {
        if (_newResolver == address(0)) revert EscrowTypes.ZeroAddress();
        emit DisputeResolverUpdated(disputeResolver, _newResolver);
        if (disputeResolver != owner) {
            _revokeRole(EMERGENCY_ROLE, disputeResolver);
        }
        _revokeRole(DISPUTE_RESOLVER_ROLE, disputeResolver);
        _grantRole(DISPUTE_RESOLVER_ROLE, _newResolver);
        _grantRole(EMERGENCY_ROLE, _newResolver);
        disputeResolver = _newResolver;
    }
}
