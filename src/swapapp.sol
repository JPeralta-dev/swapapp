// SPDX-License-Identifier: MIT
/// @title SwapAPP
/// @author JPeraltaDev
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
pragma solidity 0.8.28;

import {IV2Router02} from "../src/interface/I2Router02.sol";

contract swapapp {
    address public V2Router02;

    constructor(address V2Router02_) {
        V2Router02 = V2Router02_;
    }

    function swapToken(
        uint256 amountln,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external {
        IV2Router02(V2Router02).swapExactTokensForTokens(amountln, amountOutMin, path, to, deadline);
    }
}
