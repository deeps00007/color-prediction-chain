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

    // Rows are fixed to 16 for this contract to simplify the "bucket" logic on-chain
    // We can support dynamic rows later, but let's stick to one consistent probability map for now.
    // 16 Rows = 17 Buckets (0 to 16).
    // Multipliers (approximate to what we had in frontend):
    // Center (8) is lowest. Edges (0, 16) are highest.
    
    // We need a probability distribution.
    // In a real Galton board, it's a binomial distribution.
    // Center buckets are much more likely.
    // We will simulate this by generating a random number 0-100 and mapping it to buckets based on probabilities.

    struct Bucket {
        uint256 multiplier; // scaled by 10 (e.g. 5 means 0.5x, 20 means 2x)
        uint256 probability; // weight out of 10000
    }

    // We'll implementation a simplified version:
    // Generate a random number.
    // If it hits a "win" range, give high multiplier.
    // Else low.
    
    // Better: Simulate the "Left/Right" path 16 times.
    // 0 = Left, 1 = Right.
    // Sum of "Rights" = Bucket Index.
    // e.g. 16 Rows. 16 coin flips.
    // If 8 heads, 8 tails -> Bucket 8 (Center). Probability is highest.
    // If 16 heads -> Bucket 16 (Right Edge). Probability is (0.5)^16 (Tiny).
    
    function play(uint256 betAmount) external {
        require(betAmount > 0, "Bet > 0");
        require(gameToken.transferFrom(msg.sender, address(this), betAmount), "Transfer failed");

        // 1. Simulate 16 "bounces" (coin flips)
        // Pseudo-randomness: Keccak256(block.timestamp, msg.sender, nonce)
        // Note: Not secure for big money, fine for demo.
        
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao)));
        
        uint256 rightBounces = 0;
        for(uint256 i=0; i<16; i++) {
            // Check i-th bit of the random hash (simplest way to get 16 random bools)
            if ((random >> i) & 1 == 1) {
                rightBounces++;
            }
        }
        
        uint256 bucketIndex = rightBounces; // 0 to 16
        
        // 2. Determine Multiplier based on Bucket
        uint256 multiplier = getMultiplier(bucketIndex); // distinct values scaled by 10
        
        // 3. Calculate Payout
        uint256 payout = (betAmount * multiplier) / 10;
        
        // 4. Transfer Payout
        if (payout > 0) {
            require(gameToken.balanceOf(address(this)) >= payout, "Insufficient House Funds");
            require(gameToken.transfer(msg.sender, payout), "Payout failed");
        }
        
        emit GameResult(msg.sender, betAmount, multiplier, payout, bucketIndex);
    }

    function getMultiplier(uint256 bucketIndex) public pure returns (uint256) {
        // 16 Rows -> 17 Buckets (0..16)
        // Center is 8.
        // Payouts:
        // 0,16: 100x (Risk adjustment)
        // 1,15: 20x
        // 2,14: 8x
        // 3,13: 4x
        // 4,12: 2x
        // 5,11: 1x
        // 6-10: 0.2x (Loss)
        
        if (bucketIndex == 0 || bucketIndex == 16) return 1100; // 110x
        if (bucketIndex == 1 || bucketIndex == 15) return 250;  // 25x
        if (bucketIndex == 2 || bucketIndex == 14) return 100;  // 10x
        if (bucketIndex == 3 || bucketIndex == 13) return 50;   // 5x
        if (bucketIndex == 4 || bucketIndex == 12) return 30;   // 3x
        if (bucketIndex == 5 || bucketIndex == 11) return 15;   // 1.5x
        
        return 2; // 0.2x (loss)
    }

    // Admin to funding contract
    function withdraw(uint256 amount) external onlyOwner {
        gameToken.transfer(owner(), amount);
    }
}
