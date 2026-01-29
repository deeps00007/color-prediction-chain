// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ColorPrediction {
    /* ========== TYPES ========== */

    enum Color {
        RED,
        GREEN,
        VIOLET
    }

    enum RoundStatus {
        OPEN,
        RESOLVED
    }

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

    /* ========== STATE ========== */

    address public owner;

    // roundId => Round
    mapping(uint256 => Round) public rounds;

    // roundId => user => Bet
    mapping(uint256 => mapping(address => Bet)) public bets;

    // roundId => players
    mapping(uint256 => address[]) public roundPlayers;

    /* ========== EVENTS ========== */

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

    /* ========== MODIFIERS ========== */

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    /* ========== CONSTRUCTOR ========== */

    constructor() {
        owner = msg.sender;
    }

    /* ========== CORE FUNCTIONS ========== */

    /**
     * @notice Place a bet on a color for a round
     */
    function placeBet(uint256 roundId, Color color) external payable {
        require(msg.value > 0, "Bet amount must be > 0");

        Round storage round = rounds[roundId];

        // default round is OPEN unless resolved
        require(round.status == RoundStatus.OPEN, "Round not open");

        Bet storage existingBet = bets[roundId][msg.sender];
        require(!existingBet.exists, "Already bet this round");

        // store bet
        bets[roundId][msg.sender] = Bet({
            color: color,
            amount: msg.value,
            exists: true
        });
