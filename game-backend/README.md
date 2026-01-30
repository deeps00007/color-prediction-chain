# Ultimate Color Prediction Game (Blockchain + Supabase)

## ?? TESTNET ONLY - DO NOT USE WITH REAL MONEY

This is a demonstration project. Never deploy to mainnet without:
- ? Professional security audit
- ? Provably fair randomness (Chainlink VRF)
- ? Emergency pause mechanisms
- ? Comprehensive testing

---

## ?? What is This?

A professional betting game where users bet **Color Game Tokens (CGT)** on colors (RED, GREEN, or VIOLET).

**Key Features:**
- **Blockchain**: Holds funds & pays winners instantly (Trustless Payouts)
- **Token System**: Uses custom ERC-20 tokens ("Game Token") so you can mint infinite test money!
- **Backend**: Auto-resolves rounds every 30 seconds
- **Supabase**: Real-time betting history & smooth UI data

---

## ?? Prerequisites

- [Node.js](https://nodejs.org/) v16+ installed
- [MetaMask](https://metamask.io/) browser extension
- No prior blockchain experience needed!

---

## ?? Installation & Quick Start

Everything is automated. You don't need complex commands.

### 1. Download Project
Clone this repository or download the ZIP.

```bash
git clone <your-repo-url>
cd color-prediction-chain
```

### 2. Install Dependencies (First time only)
Open a terminal in this folder and run:

```bash
npm install
cd game-backend && npm install
cd ..
```

### 3. Start Everything
Double-click **`START_ALL.bat`** in this folder.

This will automatically:
- ? Start the Hardhat Blockchain
- ? Deploy the **Game Token (CGT)**
- ? Deploy the **Prediction Contract**
- ? Fund the House with 50,000 CGT
- ? Start the Game Backend logic

**Keep all terminal windows open while playing!**

### 4. Play the Game
Open `game-frontend/index.html` in your browser.

### 5. Connect Your Wallet

1. **Add Localhost Network to MetaMask:**
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Import a Test Account:**
   - Look at the **"Hardhat Blockchain"** terminal window
   - Find `Account #0: 0x...`
   - Copy the **Private Key** below it
   - Open MetaMask ? Click circle icon ? **Import Account** ? Paste Key

3. **Get Free Money:**
   - In the game, click **"?? Mint 1000 CGT"**
   - Approve the transaction in MetaMask
   - You are now rich! ??

---

## ?? Architecture Diagram

```
+-------------+          +------------------+          +--------------+
¦   User/     ¦  Bets    ¦  Smart Contract  ¦  Pays    ¦   Winner's  ¦
¦  Frontend   ¦--------->¦   (The House)    ¦--------->¦    Wallet    ¦
¦             ¦  Tokens  ¦                  ¦  Tokens  ¦              ¦
+-------------+          +------------------+          +--------------+
       ¦                          ¦
       ¦ Views History            ¦ Resolves Round
       ¦                          ¦
       ?                          ?
+-------------+          +------------------+
¦  Supabase   ¦<---------¦  Game Backend    ¦
¦     DB      ¦  Updates ¦   (The Brain)    ¦
+-------------+  Stats   +------------------+
```

---

## ?? How It Works (Simple Terms)

### 1. You Place a Bet
- You select **RED (2x)**, **GREEN (2x)**, or **VIOLET (5x)**
- You click "Place Bet" (this sends Tokens to the contract)
- The contract locks your money safely on the blockchain

### 2. The Round Ends
- The **Game Backend** watches the clock (30 seconds per round)
- When time is up, it generates a result (Red/Green/Violet)

### 3. You Get Paid
- The Backend commands the Smart Contract to `resolveRound()`
- The Contract checks all bets and determines winners
- **If you won:** The Contract INSTANTLY transfers Tokens to your wallet
- **If you lost:** The Tokens stay in the house pool

---

## ??? Tech Stack

| Component | Technology |
|-----------|-----------|
| **Smart Contracts** | Solidity, Hardhat, OpenZeppelin (ERC20) |
| **Blockchain** | Ethereum (Local: Hardhat Network) |
| **Frontend** | HTML, CSS, JavaScript, ethers.js |
| **Backend** | Node.js, Express |
| **Database** | Supabase (PostgreSQL) |
| **Wallet** | MetaMask |

---

## ?? Project Structure

```
color-prediction-chain/
¦
+-- contracts/
¦   +-- ColorPrediction.sol      # Main Game Logic
¦   +-- GameToken.sol            # Custom ERC-20 Token ("Color Game Token")
¦
+-- game-frontend/               # The Website (UI)
¦   +-- index.html              # Main game interface
¦   +-- style.css               # Styling
¦   +-- app.js                  # Connects to Blockchain & Supabase
¦
+-- game-backend/                # The Brain (Game Loop)
¦   +-- index.js                # - Starts/ends rounds (30s timer)
¦   +-- roundEngine.js          # - Core logic
¦   +-- .env                    # - Config
¦
+-- scripts/                     # Helper Tools
¦   +-- deploy.js               # Deploys Token & Contract + Funds House
¦
+-- START_ALL.bat               # One-click launcher
+-- hardhat.config.js           # Blockchain Config
+-- README.md                   # You are here!
```

---

## ? FAQ & Troubleshooting

### **Q: Why does the Round ID not reset to 1?**
If you cleared the database, the ID counter continues from where it left off (e.g., 1432). This is normal database behavior. To force a reset to 1, you must run this SQL in your Supabase Dashboard:
```sql
TRUNCATE TABLE rounds RESTART IDENTITY CASCADE;
TRUNCATE TABLE round_results_history RESTART IDENTITY CASCADE;
```

### **Q: I clicked "Mint" but didn't get tokens?**
1. Check the browser console (F12) for errors.
2. Ensure you are connected to **Localhost 8545** in MetaMask.
3. Import the Account #0 Private Key from the Hardhat terminal.

### **Q: How can I reset the game?**
To wipe all history:
```bash
cd game-backend
node resetDb.js
```

---

## ??? Security Considerations

### ?? Educational Project Limitations:
1. **Centralized Randomness**: Backend controls results.
2. **Infinite Minting**: Anyone can mint tokens (great for testing, bad for production).
3. **No Audits**: Do not put real money in this.

### For Production:
1. Remove the `mint()` function from the Token.
2. Use Chainlink VRF for random numbers.
3. Add a "Deposit/Withdraw" system for real ETH/USDT.

