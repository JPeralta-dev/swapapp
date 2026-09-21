// SPDX-License-Identifier: MIT
/// @title SwapAPP
/// @author JPeraltaDev
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
pragma solidity 0.8.28;

interface IV2Router02 {
    function swapExactTokensForTokens(
        uint256 amountln,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}
