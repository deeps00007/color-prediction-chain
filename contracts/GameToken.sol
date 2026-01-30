// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameToken is ERC20, ERC20Permit, Ownable {
    constructor()
        ERC20("ColorGameToken", "CGT")
        ERC20Permit("ColorGameToken")
        Ownable(msg.sender)
    {}

    // Public mint function for testing environment so users can get tokens
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }

    // Compatibility helper: some wallets probe `getOwner()` (BEP-20 style)
    function getOwner() external view returns (address) {
        return owner();
    }
}