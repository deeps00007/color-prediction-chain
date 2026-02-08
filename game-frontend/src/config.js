// Contract addresses - UPDATE THESE with your deployed contract addresses
export const CONTRACT_ADDRESS = "0x982Ad674Cb4ACE114753ebF2949658e580ca1dD6";
export const TOKEN_ADDRESS = "0xfDf4343D02330530cC4E3239C5f3F754a767fe7A";

// Supabase configuration
export const SUPABASE_URL = "https://zskfvqfszulwuhshzuxa.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2Z2cWZzenVsd3Voc2h6dXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE4NDYsImV4cCI6MjA4NTE3Nzg0Nn0.wAWewC_OZmLUK9DZmJy-YB63l_OA5sTn_Lu0yxY5r2U";

// Smart Contract ABIs
export const GAME_ABI = [
    "function placeBet(uint256 roundId, uint8 color, uint256 amount)",
    "event BetPlaced(uint256 indexed roundId, address indexed user, uint8 color, uint256 amount)",
    "event RoundResolved(uint256 indexed roundId, uint8 result)",
    "event Payout(address indexed user, uint256 amount)",
];

export const TOKEN_ABI = [
    "function mint(address to, uint256 amount)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)"
];

// Color mapping for smart contract
export const COLOR_MAP = { RED: 0, GREEN: 1, VIOLET: 2 };

// RPC URLs for Sepolia testnet
export const RPC_URLS = [
    "https://ethereum-sepolia.publicnode.com",
    "https://1rpc.io/sepolia",
    "https://rpc.sepolia.org"
];
export const PLINKO_ADDRESS = "0x0f73b729d6600A3977aeAB500aF1e7E25bcCCAe93";

export const PLINKO_ABI = [
    "function play(uint256 betAmount, uint256 rowCount) external",
    "event GameResult(address indexed player, uint256 betAmount, uint256 multiplier, uint256 payout, uint256 bucketIndex)"
];
