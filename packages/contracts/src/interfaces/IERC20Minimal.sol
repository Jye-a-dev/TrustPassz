// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IERC20Minimal
/// @notice Minimal interface defining essential ERC20 operations used by PaymentProcessor
interface IERC20Minimal {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
