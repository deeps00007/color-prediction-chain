// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Plinko is Ownable {
    IERC20 public gameToken;

    // Events to track game action and bankroll
    event GameResult(address indexed player, uint256 betAmount, uint256 multiplier, uint256 payout, uint256 bucketIndex);
    event HouseFunded(address indexed funder, uint256 amount);
    event HouseWithdraw(address indexed owner, uint256 amount);

    constructor(address _tokenAddress) Ownable(msg.sender) {
        gameToken = IERC20(_tokenAddress);
    }

    /**
     * @dev Main game function.
     * @param betAmount The amount of tokens the user is betting.
     * @param rowCount The risk level (8, 12, or 16 rows).
     */
    function play(uint256 betAmount, uint256 rowCount) external {
        require(betAmount > 0, "Bet must be > 0");
        require(rowCount == 8 || rowCount == 12 || rowCount == 16, "Invalid Row Count");

        // 1. Solvency Check: Can the house afford the MAX possible win?
        // This prevents the "Transaction Failed" error if the house is broke.
        uint256 maxMult = getMaxPossibleMultiplier(rowCount);
        uint256 maxPotentialPayout = (betAmount * maxMult) / 10;
        
        require(
            gameToken.balanceOf(address(this)) >= maxPotentialPayout, 
            "House Insolvency: Contract cannot afford max payout. Try lower bet."
        );

        // 2. Take Bet
        require(gameToken.transferFrom(msg.sender, address(this), betAmount), "Bet Transfer Failed. Check Allowance.");

        // 3. Generate Randomness (Pseudo-random: Good for Portfolio, unsafe for Mainnet high-stakes)
        // We use prevrandao + timestamp + user address to generate a "path"
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp, 
            block.prevrandao, 
            msg.sender, 
            block.number
        )));
        
        // 4. Calculate Bucket (The "Drop")
        // We simulate a 50/50 bounce for every row.
        uint256 rightBounces = 0;
        for(uint256 i = 0; i < rowCount; i++) {
            // Check the i-th bit of the random number
            if ((random >> i) & 1 == 1) {
                rightBounces++;
            }
        }
        
        uint256 bucketIndex = rightBounces; 
        
        // 5. Determine Multiplier & Payout
        uint256 multiplier = getMultiplier(bucketIndex, rowCount);
        uint256 payout = (betAmount * multiplier) / 10;
        
        // 6. Pay Winner
        if (payout > 0) {
            require(gameToken.transfer(msg.sender, payout), "Payout Failed");
        }
        
        emit GameResult(msg.sender, betAmount, multiplier, payout, bucketIndex);
    }

    // --- Helper Functions ---

    // Allows the owner (you) to easily fund the contract
    function deposit(uint256 amount) external {
        require(gameToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit HouseFunded(msg.sender, amount);
    }

    // Withdraws all funds (Emergency or Profit taking)
    function withdrawHouse(uint256 amount) external onlyOwner {
        require(gameToken.balanceOf(address(this)) >= amount, "Insufficient funds");
        gameToken.transfer(owner(), amount);
        emit HouseWithdraw(owner(), amount);
    }

    // Helper to check max liability
    function getMaxPossibleMultiplier(uint256 rows) public pure returns (uint256) {
        if (rows == 8) return 290; // 29x
        if (rows == 12) return 1100; // 110x
        return 10000; // 1000x
    }

    function getMultiplier(uint256 index, uint256 rows) public pure returns (uint256) {
        // Multipliers are multiplied by 10 to handle decimals (e.g., 0.5x = 5)
        
        if (rows == 8) {
            // [29, 15, 8, 2, 0.5, 2, 8, 15, 29]
            if (index == 0 || index == 8) return 290; 
            if (index == 1 || index == 7) return 150; 
            if (index == 2 || index == 6) return 80;  
            if (index == 3 || index == 5) return 20;  
            return 5; 
        }
        
        if (rows == 12) {
             // [110, 25, 10, 5, 2, 1, 0.5, 1, 2, 5, 10, 25, 110]
            if (index == 0 || index == 12) return 1100;
            if (index == 1 || index == 11) return 250;
            if (index == 2 || index == 10) return 100;
            if (index == 3 || index == 9) return 50;
            if (index == 4 || index == 8) return 20;
            if (index == 5 || index == 7) return 10;
             return 5; 
        }
        
        // 16 Rows 
        // [1000, 100, 20, 10, 5, 2, 0.5, 0.2, 0.2, 0.2, 0.5, 2, 5, 10, 20, 100, 1000]
        if (index == 0 || index == 16) return 10000; 
        if (index == 1 || index == 15) return 1000;  
        if (index == 2 || index == 14) return 200;   
        if (index == 3 || index == 13) return 100;   
        if (index == 4 || index == 12) return 50;    
        if (index == 5 || index == 11) return 20;    
        if (index == 6 || index == 10) return 5;     
        if (index == 7 || index == 9) return 2;      
        return 2; 
    }
}