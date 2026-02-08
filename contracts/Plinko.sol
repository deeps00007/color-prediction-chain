// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Plinko is Ownable {
    IERC20 public gameToken;

    event GameResult(address indexed player, uint256 betAmount, uint256 multiplier, uint256 payout, uint256 bucketIndex);

    constructor(address _tokenAddress) Ownable(msg.sender) {
        gameToken = IERC20(_tokenAddress);
    }
    
    function play(uint256 betAmount, uint256 rowCount) external {
        require(betAmount > 0, "Bet > 0");
        require(rowCount == 8 || rowCount == 12 || rowCount == 16, "Invalid Rows");
        require(gameToken.transferFrom(msg.sender, address(this), betAmount), "Transfer failed");

        // 1. Simulate "bounces"
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao)));
        
        uint256 rightBounces = 0;
        for(uint256 i=0; i<rowCount; i++) {
            if ((random >> i) & 1 == 1) {
                rightBounces++;
            }
        }
        
        uint256 bucketIndex = rightBounces; 
        
        // 2. Determine Multiplier
        uint256 multiplier = getMultiplier(bucketIndex, rowCount);
        
        // 3. Payout
        uint256 payout = (betAmount * multiplier) / 10;
        
        if (payout > 0) {
            require(gameToken.balanceOf(address(this)) >= payout, "Insufficient House Funds");
            require(gameToken.transfer(msg.sender, payout), "Payout failed");
        }
        
        emit GameResult(msg.sender, betAmount, multiplier, payout, bucketIndex);
    }

    function getMultiplier(uint256 index, uint256 rows) public pure returns (uint256) {
        if (rows == 8) {
            // 8 Rows: 9 Buckets (0..8). Center 4.
            if (index == 0 || index == 8) return 290; // 29x
            if (index == 1 || index == 7) return 150; // 15x
            if (index == 2 || index == 6) return 80;  // 8x
            if (index == 3 || index == 5) return 20;  // 2x
            return 5; // Center: 0.5x
        }
        if (rows == 12) {
             // 12 Rows: 13 Buckets. Center 6.
            if (index == 0 || index == 12) return 1100; // 110x
            if (index == 1 || index == 11) return 250;
            if (index == 2 || index == 10) return 100;
            if (index == 3 || index == 9) return 50;
            if (index == 4 || index == 8) return 20;
            if (index == 5 || index == 7) return 10;
             return 5; // 0.5x
        }
        // 16 Rows (High Risk)
        if (index == 0 || index == 16) return 10000; // 1000x
        if (index == 1 || index == 15) return 1000;  // 100x
        if (index == 2 || index == 14) return 200;   // 20x
        if (index == 3 || index == 13) return 100;   // 10x
        if (index == 4 || index == 12) return 50;    // 5x
        if (index == 5 || index == 11) return 20;    // 2x
        if (index == 6 || index == 10) return 5;     // 0.5x
        if (index == 7 || index == 9) return 2;      // 0.2x
        return 2; // Center: 0.2x
    }

    function withdraw(uint256 amount) external onlyOwner {
        gameToken.transfer(owner(), amount);
    }
}
