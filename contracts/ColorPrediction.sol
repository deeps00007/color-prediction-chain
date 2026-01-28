// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ColorPrediction {

    enum Color {
        RED,
        GREEN,
        VIOLET
    }

    uint256 public constant BET_AMOUNT = 0.01 ether;

    struct Game {
        address player;
        Color chosenColor;
        Color resultColor;
        bool won;
        uint256 timestamp;
    }

    Game[] public games;

    event GamePlayed(
        address indexed player,
        Color chosenColor,
        Color resultColor,
        bool won
    );

    // ✅ allow contract to receive ETH (HOUSE BALANCE)
    receive() external payable {}

    function _randomColor(address player) internal view returns (Color) {
        uint256 random = uint256(
            keccak256(
                abi.encodePacked(block.timestamp, block.prevrandao, player)
            )
        ) % 100;

        if (random < 45) {
            return Color.RED;
        } else if (random < 90) {
            return Color.GREEN;
        } else {
            return Color.VIOLET;
        }
    }

    function play(Color chosenColor) external payable {
        require(msg.value == BET_AMOUNT, "Incorrect bet amount");
        require(
            address(this).balance >= BET_AMOUNT * 2,
            "House balance too low"
        );

        Color result = _randomColor(msg.sender);
        bool won = (chosenColor == result);

        games.push(
            Game({
                player: msg.sender,
                chosenColor: chosenColor,
                resultColor: result,
                won: won,
                timestamp: block.timestamp
            })
        );

        if (won) {
            payable(msg.sender).transfer(BET_AMOUNT * 2);
        }

        emit GamePlayed(msg.sender, chosenColor, result, won);
    }
}
