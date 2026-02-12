<div align="center">

<img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License">
<img src="https://img.shields.io/badge/Solidity-0.8.20-363636?style=flat-square&logo=solidity" alt="Solidity">
<img src="https://img.shields.io/badge/Network-Sepolia_Testnet-FFA500?style=flat-square" alt="Network">
<img src="https://img.shields.io/badge/Status-LIVE-brightgreen?style=flat-square" alt="Status">
<img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js" alt="Node">

<br><br>

# 🎰 Color Prediction Chain

### A decentralized color betting game powered by Ethereum smart contracts

Bet **Color Game Tokens (CGT)** on RED, GREEN, or VIOLET. Win instantly. No middleman.

<br>

[![▶ PLAY LIVE NOW](https://img.shields.io/badge/▶_PLAY_LIVE_NOW-FF4500?style=for-the-badge&labelColor=1a1a2e&logo=ethereum&logoColor=white)](https://color-prediction-chain.vercel.app/)

<br>

</div>

---

## 🌐 Live Deployment

The game is **live on Sepolia Testnet**. Play right now — no installation required.

| Component | Link | Status |
|:---|:---|:---:|
| 🎮 **Frontend** | [color-prediction-chain.vercel.app](https://color-prediction-chain.vercel.app/) | 🟢 Online |
| ⚙️ **Backend** | [color-prediction-chain.onrender.com](https://color-prediction-chain.onrender.com/) | 🟢 Online |
| 🪙 **Game Token (CGT)** | [0xfDf4...7fe7A](https://sepolia.etherscan.io/address/0xfDf4343D02330530cC4E3239C5f3F754a767fe7A) | 🟢 Active |
| 📜 **Game Contract** | [0x982A...1dD6](https://sepolia.etherscan.io/address/0x982Ad674Cb4ACE114753ebF2949658e580ca1dD6) | 🟢 Active |

---

## 📱 Mobile App

The game is also available as a **Flutter mobile app** with full WalletConnect integration.

### Features
- **WalletConnect v2**: Connect securely with MetaMask or other mobile wallets
- **Deep Linking**: Seamless redirection back to the app after signing transactions
- **Real-time Updates**: Live game rounds and history
- **Native Experience**: Smooth performance on Android & iOS

### Getting Started

#### Prerequisites
- [Flutter SDK](https://docs.flutter.dev/get-started/install) installed
- An Android Emulator or physical device

#### Installation

1. Navigate to the mobile directory:
   ```bash
   cd game-mobile
   ```

2. Install dependencies:
   ```bash
   flutter pub get
   ```

3. Run the app:
   ```bash
   flutter run
   ```

#### Usage
1. Tap the **Wallet** icon in the top right.
2. Select **MetaMask** (or your preferred wallet).
3. Approve the connection in your wallet app.
4. The app will automatically reopen via the `colorprediction://` deep link scheme.

> **Dev Note:** The deep link scheme is configured in `android/app/src/main/AndroidManifest.xml`. If you change it, remember to update the `redirectUrl` in `WalletService.dart`.

---

## 🎮 How to Play

> ⏱️ Takes about **1 minute** to start playing.

### Step 1 — Connect Your Wallet

Click **"Connect Wallet"** on the game page. MetaMask will ask you to switch to the **Sepolia Testnet** and add a high-speed RPC endpoint. Approve both.

### Step 2 — Get Gas (Free Sepolia ETH)

You need a tiny amount of ETH to pay for gas fees on transactions. Use one of these faucets to get it for free:

| Faucet | Link | Amount |
|:---|:---|:---|
| Google Cloud *(Fastest)* | [cloud.google.com/…/sepolia](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) | 0.01 ETH |
| Alchemy | [alchemy.com/faucets](https://www.alchemy.com/faucets/ethereum-sepolia) | 0.05 ETH |
| QuickNode | [faucet.quicknode.com](https://faucet.quicknode.com/ethereum/sepolia) | 0.05 ETH |

> 💡 **Tip:** Click your wallet address in the top-left corner of the game to copy it instantly.

### Step 3 — Mint Game Tokens

Click **"🪙 Mint 1000 CGT"** in the game. Confirm the MetaMask transaction. You now have **1,000 free Color Game Tokens** to bet with.

### Step 4 — Place Your Bet

1. Pick a color and its multiplier:

| Color | Multiplier | Risk |
|:---|:---:|:---:|
| 🔴 RED | 2x | Low |
| 🟢 GREEN | 2x | Low |
| 🟣 VIOLET | 5x | High |

2. Enter your bet amount (e.g., `10 CGT`)
3. Click **"Place Bet"** and confirm in MetaMask
4. Wait for the round to resolve (~30 seconds)
5. If you win, tokens are sent **instantly** to your wallet by the smart contract

---

## ⚡ Features

| Feature | Description |
|:---|:---|
| 🪙 **Custom ERC-20 Token** | Bets use `Color Game Token (CGT)` — no real money at risk |
| 🔓 **Public Minting** | Anyone can mint tokens freely to play |
| 🤖 **Automated Rounds** | Backend resolves every round every 30 seconds |
| 📡 **Robust RPC** | Load-balanced public RPCs prevent rate-limiting |
| 📊 **Real-time History** | Supabase tracks every round result live |
| ⛓️ **Trustless Payouts** | Smart contract pays winners directly — no manual approval |

---

## 🏗️ Architecture

```
┌─────────────┐   Bets    ┌──────────────────┐   Pays    ┌──────────────┐
│             │  Tokens   │  Smart Contract   │  Tokens   │              │
│   User /    │──────────>│   (The House)     │──────────>│   Winner's   │
│  Frontend   │           │                   │           │   Wallet     │
│             │           │  placeBet()       │           │              │
└──────┬──────┘           │  resolveRound()   │           └──────────────┘
       │                  └────────┬──────────┘
       │                           │
       │ Views History             │ Resolves Round
       ▼                           ▼
┌─────────────┐           ┌──────────────────┐
│  Supabase   │<──────────│  Game Backend    │
│     DB      │  Updates  │   (The Brain)    │
│             │   Stats   │  30s Round Timer │
└─────────────┘           └──────────────────┘
```

**Data Flow:**
1. User places bet → Frontend calls `placeBet()` → Tokens locked in contract
2. 30 seconds pass → Backend detects round end → Generates result
3. Backend calls `resolveRound()` → Contract pays all winners instantly
4. Backend logs result → Supabase updated → Frontend shows live history

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| ⛓️ Blockchain | Ethereum — Sepolia Testnet |
| 📜 Smart Contracts | Solidity 0.8.20 + OpenZeppelin (ERC-20) |
| 🔧 Dev Framework | Hardhat |
| 🌐 Frontend | HTML, CSS, JavaScript, ethers.js, React, Vite |
| 📱 Mobile | Flutter (Dart), WalletConnect v2 |
| 🤖 Backend | Node.js, Express |
| 🗄️ Database | Supabase (PostgreSQL) |
| 🦊 Wallet | MetaMask |

---

## 📂 Project Structure

```
color-prediction-chain/
│
├── contracts/
│   ├── ColorPrediction.sol       # Main game logic (bets, payouts, rounds)
│   └── GameToken.sol             # ERC-20 token contract (CGT)
│
├── game-frontend/
│   ├── index.html                # Game UI
│   ├── src/                      # React components & logic
│   └── vite.config.js            # Build configuration
│
├── game-mobile/
│   ├── lib/                      # Flutter source code
│   ├── android/                  # Android native configuration
│   └── pubspec.yaml              # Dart dependencies
│
├── game-backend/
│   ├── index.js                  # Express server entry point
│   ├── roundEngine.js            # Core game loop (30s timer + resolution)
│   ├── supabaseClient.js         # Supabase connection
│   ├── .env                      # Config (never committed!)
│   └── package.json
│
├── scripts/
│   └── deploy.js                 # Deploys GameToken + ColorPrediction + funds house
│
├── hardhat.config.js             # Hardhat network configuration
├── START_ALL.bat                 # One-click local launcher (Windows)
├── .gitignore                    # Excludes .env, node_modules, artifacts
└── README.md                     # This file
```

---

## 💻 Local Development

Want to run this on your own machine? Follow these steps.

### 1. Clone the Repository

```bash
git clone https://github.com/deeps00007/color-prediction-chain.git
cd color-prediction-chain
```

### 2. Install Dependencies

```bash
npm install
cd game-backend && npm install && cd ..
```

### 3. Start the Local Environment

**Windows:**
```bash
START_ALL.bat
```

This automatically:
- ✅ Starts a local Hardhat blockchain
- ✅ Deploys both contracts (GameToken + ColorPrediction)
- ✅ Funds the house with 50,000 CGT
- ✅ Starts the game backend

### 4. Play Locally

1. Open `game-frontend/index.html` in your browser
2. Switch MetaMask to **Localhost 8545** network
3. Import a Hardhat test account (copy private key from the Hardhat terminal)
4. Mint tokens and start betting

---

## ⚙️ Configuration

All settings live in `game-backend/.env`:

```env
# Blockchain
RPC_URL=http://127.0.0.1:8545                          # Local development
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/...  # Sepolia testnet
PRIVATE_KEY=0x...                                       # Deployer wallet key

# Contracts (updated after deployment)
CONTRACT_ADDRESS=0x...
TOKEN_ADDRESS=0x...

# Game
ROUND_DURATION_SECONDS=30

# Database
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=eyJ...
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|:---|:---|
| **"Transaction reverted"** | Reset MetaMask activity: Settings → Advanced → Clear Activity Tab Data |
| **Balance shows 0 CGT** | Click "Mint 1000 CGT" and confirm in MetaMask |
| **Rounds not progressing** | Check that the backend server is running and `.env` has correct addresses |
| **"Insufficient funds" for gas** | Get free Sepolia ETH from a faucet (see [How to Play](#-how-to-play)) |
| **Contract shows empty** | Fund the house: `npx hardhat run scripts/deploy.js --network localhost` |
| **Can't connect wallet** | Make sure MetaMask is unlocked and you're on the correct network |

---

## 🛡️ Security Notice

This is a **Testnet / Educational** project. Be aware of the following:

| Limitation | Details |
|:---|:---|
| 🎲 Centralized Randomness | Results are generated by the backend, **not** Chainlink VRF |
| 🪙 Infinite Minting | Anyone can mint unlimited CGT tokens |
| 🏗️ No Audit | This contract has not been professionally audited |

**⚠️ Do not use real-value assets with this contract.**

For production, these would need to be addressed: integrate Chainlink VRF for verifiable randomness, remove public minting, add a professional security audit, and implement emergency pause mechanisms.

---

## 🤝 Contributing

Contributions are welcome!

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with by **Deepanshu Singh**

</div>