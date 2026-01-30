// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GameToken is ERC20 {
    constructor() ERC20("ColorGameToken", "CGT") {}

    // Public mint function for testing environment so users can get tokens
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}