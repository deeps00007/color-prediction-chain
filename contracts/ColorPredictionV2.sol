// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ColorPredictionV2 {

    enum Color { RED, GREEN, VIOLET }

    uint256 public constant ROUND_DURATION = 30;
    uint256 public constant MIN_BET = 0.001 ether;
    uint256 public constant MAX_BET = 0.05 ether;

    uint256 public currentRound;
    uint256 public roundStartTime;

    struct Bet {
        address player;
        uint256 amount;
        Color color;
    }

    mapping(uint256 => Bet[]) public roundBets;
    mapping(uint256 => Color) public roundResult;

    mapping(address => uint256) public totalWon;
    mapping(address => uint256) public totalLost;

    Color[10] public lastResults;
    uint8 public resultIndex;

    event BetPlaced(address indexed player, uint256 round, Color color, uint256 amount);
    event RoundResolved(uint256 round, Color result);

    constructor() {
        currentRound = 1;
        roundStartTime = block.timestamp;
    }

    receive() external payable {}

    function _roundOver() internal view returns (bool) {
        return block.timestamp >= roundStartTime + ROUND_DURATION;
    }

    function _nextRound() internal {
        currentRound++;
        roundStartTime = block.timestamp;
    }

    function _randomColor(uint256 seed) internal view returns (Color) {
        uint256 r = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, seed)
            )
        ) % 3;

        return Color(r);
    }

    function _resolveRound(uint256 roundId) internal {
        Color result = _randomColor(roundId);
        roundResult[roundId] = result;

        lastResults[resultIndex] = result;
        resultIndex = (resultIndex + 1) % 10;

        Bet[] storage bets = roundBets[roundId];

        for (uint256 i = 0; i < bets.length; i++) {
            Bet memory b = bets[i];

            if (b.color == result) {
                uint256 winAmount = b.amount * 2;
                totalWon[b.player] += winAmount;
                payable(b.player).transfer(winAmount);
            } else {
                totalLost[b.player] += b.amount;
            }
        }

        emit RoundResolved(roundId, result);
    }

    function placeBet(Color color) external payable {
        require(msg.value >= MIN_BET, "Bet too small");
        require(msg.value <= MAX_BET, "Bet too big");
        require(address(this).balance >= msg.value * 2, "House balance low");

        if (_roundOver()) {
            _resolveRound(currentRound);
            _nextRound();
        }

        roundBets[currentRound].push(
            Bet(msg.sender, msg.value, color)
        );

        emit BetPlaced(msg.sender, currentRound, color, msg.value);
    }
}
