// SPDX-License-Identifier: MIT
/// @title SwapAPP
/// @author JPeraltaDev
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
pragma solidity 0.8.28;

import { Swapapp } from "../src/swapapp.sol";
import "forge-std/Test.sol";


contract swappTest is Test {

    Swapapp app;
    address uniswapV2SwapRouter = 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24;
    function setUp() public{
        app = new Swapapp(uniswapV2SwapRouter);
    }

    function testHasBeenDeploymentCorrectly () public view {
        assert(app.V2Router02() == uniswapV2SwapRouter);
    }
}