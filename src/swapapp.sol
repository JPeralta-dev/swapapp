// SPDX-License-Identifier: MIT
/// @title SwapAPP
/// @author JPeraltaDev
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
pragma solidity 0.8.28;

import {IV2Router02} from "../src/interface/I2Router02.sol";
import { IERC20 } from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract swapapp {
    address public V2Router02;

    event SwapToken(address tokenIn, address tokenOutm, uint256 amountIn, uint256 amountOut);
    constructor(address V2Router02_) {
        V2Router02 = V2Router02_;
    }

    function swapToken(
        uint256 amountIn_,
        uint256 amountOutMin_,
        address[] calldata path_, 
        uint256 deadline_
    ) external {
        
        IERC20(path_[0]).transferFrom(msg.sender, address(this), amountIn_);

        uint256[] memory amountsOut = IV2Router02(V2Router02).swapExactTokensForTokens(amountIn_, amountOutMin_, path_, msg.sender, deadline_);

        emit SwapToken(path_[0], path_[path_.length - 1], amountIn_, amountsOut[amountsOut.length - 1]);
    }
}
