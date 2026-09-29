// SPDX-License-Identifier: MIT
/// @title SwapAPP
/// @author JPeraltaDev
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
pragma solidity 0.8.28;

import { ERC20 } from "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor (
        string memory name_,
        string memory symbol_
    )ERC20(name_,symbol_){}

    function mint(uint256 amount_) external {
        _mint(msg.sender, amount_);
    }

}