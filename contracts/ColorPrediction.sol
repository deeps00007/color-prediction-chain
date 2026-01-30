// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ColorPrediction {

    /* ========= ENUMS ========= */

    enum Color {
        RED,
        GREEN,
        VIOLET
    }

    enum RoundStatus {
        OPEN,
        RESOLVED
    }

    /* ========= STRUCTS ========= */

    struct Bet {
        Color color;
        uint256 amount;
        bool exists;
    }

    struct Round {
        RoundStatus status;
        Color result;
        bool resolved;
    }

    /* ========= STATE ========= */

    address public owner;
    IERC20 public gameToken;

    // roundId => Round
    mapping(uint256 => Round) public rounds;

    // roundId => user => Bet
    mapping(uint256 => mapping(address => Bet)) public bets;

    // roundId => players
    mapping(uint256 => address[]) public roundPlayers;

    /* ========= EVENTS ========= */

    event BetPlaced(
        uint256 indexed roundId,
        address indexed user,
        Color color,
        uint256 amount
    );

    event RoundResolved(
        uint256 indexed roundId,
        Color result
    );

    event Payout(
        address indexed user,
        uint256 amount
    );

    /* ========= MODIFIERS ========= */

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    /* ========= CONSTRUCTOR ========= */

    constructor(address _tokenAddress) {
        owner = msg.sender;
        gameToken = IERC20(_tokenAddress);
    }

    /* ========= CORE FUNCTIONS ========= */

    // Removed 'payable', added 'amount'
    function placeBet(uint256 roundId, Color color, uint256 amount) external {
        require(amount > 0, "Bet must be > 0");

        Round storage round = rounds[roundId];

        // default is OPEN (status = 0)
        require(round.status == RoundStatus.OPEN, "Round not open");

        require(!bets[roundId][msg.sender].exists, "Already bet");

        // Transfer tokens from User -> Contract
        // Frontend must call Approve first!
        require(gameToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        bets[roundId][msg.sender] = Bet({
            color: color,
            amount: amount,
            exists: true
        });

        roundPlayers[roundId].push(msg.sender);

        emit BetPlaced(roundId, msg.sender, color, amount);
    }

    function resolveRound(uint256 roundId, Color result)
        external
        onlyOwner
    {
        Round storage round = rounds[roundId];

        require(!round.resolved, "Already resolved");

        round.result = result;
        round.status = RoundStatus.RESOLVED;
        round.resolved = true;

        address[] storage players = roundPlayers[roundId];

        for (uint256 i = 0; i < players.length; i++) {
            address player = players[i];
            Bet storage bet = bets[roundId][player];

            if (bet.color == result) {
                uint256 payout = calculatePayout(bet.amount, result);
                // Transfer tokens from Contract -> Winner
                require(gameToken.transfer(player, payout), "Payout failed");
                emit Payout(player, payout);
            }
        }

        emit RoundResolved(roundId, result);
    }

    /* ========= VIEW FUNCTIONS ========= */

    function getBet(uint256 roundId, address user)
        external
        view
        returns (Color, uint256, bool)
    {
        Bet memory bet = bets[roundId][user];
        return (bet.color, bet.amount, bet.exists);
    }

    function calculatePayout(uint256 amount, Color color)
        public
        pure
        returns (uint256)
    {
        if (color == Color.VIOLET) {
            return amount * 5;
        }
        return amount * 2;
    }

    /* ========= ADMIN ========= */

    function withdraw(uint256 amount) external onlyOwner {
        require(gameToken.balanceOf(address(this)) >= amount, "Low balance");
        require(gameToken.transfer(owner, amount), "Withdraw failed");
    }

    receive() external payable {}
}
