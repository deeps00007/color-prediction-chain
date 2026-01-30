# 🎮 Ultimate Color Prediction Game (Blockchain + Supabase)

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)
![Node](https://img.shields.io/badge/Node.js-16+-339933?logo=node.js)
![Hardhat](https://img.shields.io/badge/Hardhat-Latest-yellow)

**A decentralized betting game powered by Ethereum smart contracts**

[Live Demo](#-quick-start) • [Documentation](#-how-it-works) • [Architecture](#-architecture-diagram) • [FAQ](#-frequently-asked-questions)

</div>

---

## ⚠️ TESTNET ONLY - DO NOT USE WITH REAL MONEY

This is a **demonstration project** for educational purposes. Never deploy to mainnet without:
- ✅ Professional security audit
- ✅ Provably fair randomness (Chainlink VRF)
- ✅ Emergency pause mechanisms
- ✅ Comprehensive testing
- ✅ Legal consultation

---

## 🎯 What is This?

A professional betting game where users bet **Color Game Tokens (CGT)** on colors and win based on smart contract outcomes.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔗 **Blockchain-Powered** | Trustless payouts via Ethereum smart contracts |
| 🪙 **Custom Token System** | ERC-20 "Color Game Token" (CGT) - mint infinite test money! |
| ⚡ **Instant Payouts** | Winners get paid automatically in seconds |
| 🤖 **Automated Rounds** | Backend resolves games every 30 seconds |
| 📊 **Real-time History** | Live betting stats via Supabase |
| 💰 **3 Betting Options** | RED (2x), GREEN (2x), VIOLET (5x) multipliers |

---

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ [Node.js](https://nodejs.org/) v16 or higher
- ✅ [MetaMask](https://metamask.io/) browser extension
- ✅ Basic understanding of crypto wallets (nice to have, not required!)

**Total setup time:** ~10 minutes ⏱️

---

## 🚀 Quick Start

### Step 1: Download the Project

```bash
git clone https://github.com/deeps00007/color-prediction-chain.git
cd color-prediction-chain
```

### Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd game-backend
npm install
cd ..
```

### Step 3: Launch the Game 🎮

**Windows Users:**
```bash
# Double-click START_ALL.bat
START_ALL.bat
```

**Mac/Linux Users:**
```bash
chmod +x start-all.sh
./start-all.sh
```

This automatically:
1. ✅ Starts local Hardhat blockchain
2. ✅ Deploys Game Token (CGT) contract
3. ✅ Deploys Color Prediction contract
4. ✅ Funds the house with 50,000 CGT
5. ✅ Starts the game backend engine

**🔴 Important:** Keep all terminal windows open while playing!

### Step 4: Open the Game

Open `game-frontend/index.html` in your browser (Chrome/Brave recommended)

### Step 5: Connect MetaMask 🦊

#### A) Add Localhost Network

1. Open MetaMask → Click network dropdown → **Add Network** → **Add network manually**
2. Enter these details:

| Field | Value |
|-------|-------|
| Network Name | `Localhost 8545` |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | `ETH` |

3. Click **Save**

#### B) Import Test Account

1. Look at the **Hardhat Blockchain** terminal window
2. Find `Account #0: 0x...` (first account)
3. Copy the **Private Key** below it (starts with `0x...`)
4. MetaMask → Click account icon → **Import Account** → Paste private key
5. 🎉 You now have **10,000 test ETH**!

#### C) Get Free Game Tokens 💰

1. In the game UI, click **"🪙 Mint 1000 CGT"** button
2. Approve the MetaMask transaction
3. Wait ~2 seconds
4. You now have **1,000 Color Game Tokens**!
5. Start betting! 🎲

---

## 📸 Screenshots

<div align="center">

### Main Game Interface
![Game Interface](docs/screenshots/game-ui.png)
*Bet on RED, GREEN, or VIOLET with live countdown timer*

### MetaMask Transaction
![MetaMask](docs/screenshots/metamask-bet.png)
*Approve bets directly from your wallet*

### Winner Notification
![Winner](docs/screenshots/winner-popup.png)
*Instant payout when you win!*

</div>

---

## 🏗️ Architecture Diagram

```
┌─────────────────┐
│   👤 User       │
│   (Browser)     │
└────────┬────────┘
         │
         │ 1. Connect Wallet
         │ 2. Mint Tokens
         │ 3. Place Bet
         ▼
┌─────────────────────────────┐
│   🌐 Frontend (HTML/JS)     │
│   - ethers.js               │
│   - MetaMask Integration    │
└────────┬────────────────────┘
         │
         │ Web3 Calls
         ▼
┌─────────────────────────────┐       ┌──────────────────┐
│  ⛓️ Smart Contracts         │       │  🗄️ Supabase DB  │
│  ┌─────────────────────┐   │       │  - Bet History   │
│  │ GameToken.sol       │   │       │  - Round Stats   │
│  │ (ERC-20 Token)      │   │       │  - User Records  │
│  └─────────────────────┘   │       └────────▲─────────┘
│  ┌─────────────────────┐   │                │
│  │ ColorPrediction.sol │   │                │
│  │ - placeBet()        │   │                │
│  │ - resolveRound()    │   │                │
│  └─────────────────────┘   │                │
└────────▲───────────────────┘                │
         │                                     │
         │ Blockchain Events                  │
         │                                     │
┌────────┴─────────────────────────────────────┴───┐
│  🤖 Backend (Node.js)                            │
│  - Round Timer (30s)                             │
│  - Generate Random Result                        │
│  - Call resolveRound()                           │
│  - Update Supabase Stats                         │
└──────────────────────────────────────────────────┘
```

### Data Flow

1. **User places bet** → Frontend calls `placeBet()` → Tokens locked in contract
2. **30 seconds pass** → Backend detects round end
3. **Backend generates result** → Calls `resolveRound()` on contract
4. **Contract pays winners** → Tokens sent to winner wallets
5. **Backend logs stats** → Updates Supabase with round data
6. **Frontend refreshes** → Shows new round + betting history

---

## 🎲 How It Works (Step-by-Step)

### 1️⃣ You Place a Bet

1. Select your prediction: **RED (2x)**, **GREEN (2x)**, or **VIOLET (5x)**
2. Enter bet amount (e.g., 100 CGT)
3. Click **"Place Bet"**
4. Confirm transaction in MetaMask
5. Your tokens are **locked in the smart contract**
6. You'll see a countdown timer (30 seconds)

### 2️⃣ The Round Ends

- The **Game Backend** monitors the blockchain
- When 30 seconds elapse, it triggers round resolution
- A result is generated: RED, GREEN, or VIOLET
- The backend calls `resolveRound(roundId, result)` on the contract

### 3️⃣ Winners Get Paid Instantly

- The smart contract loops through all bets
- **If your color matches:**
  - RED/GREEN bet: You get **2x your bet** (100 CGT → 200 CGT)
  - VIOLET bet: You get **5x your bet** (100 CGT → 500 CGT)
- **If you lose:** Your tokens stay in the house pool
- Payouts are **instant and trustless** (no human approval needed!)

### 4️⃣ Check Your History

- All rounds are logged to **Supabase**
- See your betting history, win rate, and total profit
- Watch real-time stats as others place bets

---

## 🛠️ Tech Stack

<table>
<tr>
<td><b>Layer</b></td>
<td><b>Technology</b></td>
<td><b>Purpose</b></td>
</tr>

<tr>
<td>⛓️ <b>Blockchain</b></td>
<td>Ethereum (Hardhat local network)</td>
<td>Decentralized transaction layer</td>
</tr>

<tr>
<td>📜 <b>Smart Contracts</b></td>
<td>Solidity 0.8.20</td>
<td>Game logic & token management</td>
</tr>

<tr>
<td>🔧 <b>Development</b></td>
<td>Hardhat, OpenZeppelin</td>
<td>Testing & deployment tools</td>
</tr>

<tr>
<td>🎨 <b>Frontend</b></td>
<td>HTML5, CSS3, Vanilla JavaScript</td>
<td>User interface</td>
</tr>

<tr>
<td>🌐 <b>Web3</b></td>
<td>ethers.js v6</td>
<td>Blockchain interaction</td>
</tr>

<tr>
<td>🦊 <b>Wallet</b></td>
<td>MetaMask</td>
<td>Transaction signing</td>
</tr>

<tr>
<td>🤖 <b>Backend</b></td>
<td>Node.js, Express</td>
<td>Game automation</td>
</tr>

<tr>
<td>🗄️ <b>Database</b></td>
<td>Supabase (PostgreSQL)</td>
<td>Betting history & analytics</td>
</tr>
</table>

---

## 📂 Project Structure

```
color-prediction-chain/
│
├── 📜 contracts/
│   ├── ColorPrediction.sol      # Main betting logic
│   │   ├── placeBet()          # Users call to place bets
│   │   ├── resolveRound()      # Backend calls to pay winners
│   │   └── calculatePayout()   # Determines winnings (2x or 5x)
│   │
│   └── GameToken.sol           # ERC-20 Token Contract
│       ├── mint()              # Create new tokens (testnet only!)
│       ├── transfer()          # Send tokens between wallets
│       └── approve()           # Allow contract to spend tokens
│
├── 🌐 game-frontend/
│   ├── index.html              # Main UI
│   ├── style.css               # Beautiful gradients & animations
│   ├── app.js                  # Web3 logic (ethers.js)
│   └── config.js               # Contract addresses & settings
│
├── 🤖 game-backend/
│   ├── index.js                # Express server
│   ├── roundEngine.js          # Core game loop (30s timer)
│   ├── supabaseClient.js       # Database connection
│   ├── .env                    # Configuration (not committed!)
│   └── package.json
│
├── 🛠️ scripts/
│   ├── deploy.js               # Deploys both contracts + funds house
│   ├── fundContract.js         # Add more CGT to house if needed
│   └── checkBalance.js         # View contract balances
│
├── 📝 docs/
│   ├── DEPLOYMENT.md           # How to deploy to testnets
│   ├── API.md                  # Smart contract ABI docs
│   └── screenshots/            # UI images
│
├── ⚙️ Configuration Files
│   ├── hardhat.config.js       # Blockchain settings
│   ├── .gitignore              # Don't commit secrets!
│   ├── package.json
│   └── .env.example            # Template for environment variables
│
├── 🚀 Launchers
│   ├── START_ALL.bat           # Windows launcher
│   └── start-all.sh            # Mac/Linux launcher
│
└── 📖 README.md                # You are here!
```

---

## 🛡️ Security Considerations

### ⚠️ Educational Project Limitations

This is a **learning project** with intentional simplifications:

| Issue | Current State | Production Solution |
|-------|--------------|---------------------|
| 🎲 **Randomness** | Backend uses `Math.random()` | Use Chainlink VRF |
| 🪙 **Token Minting** | Anyone can mint unlimited tokens | Remove `mint()` function |
| 🔐 **Access Control** | Single owner (backend wallet) | Multi-signature wallet |
| 🏦 **Funds Safety** | No insurance fund | Reserve pool for payouts |
| ⏸️ **Emergency Stop** | No pause mechanism | Circuit breaker pattern |
| 🧪 **Testing** | Basic tests only | 100% coverage + audit |

### 🔒 For Production Deployment

**Before deploying to mainnet, you MUST:**

1. ✅ **Remove Token Minting**
   ```solidity
   // DELETE THIS FUNCTION:
   function mint(address to, uint256 amount) public {
       _mint(to, amount);
   }
   ```

2. ✅ **Integrate Chainlink VRF**
   - Replace `Math.random()` with verifiable randomness
   - Costs ~0.25 LINK per round
   - Documentation: https://docs.chain.link/vrf

3. ✅ **Add Emergency Pause**
   ```solidity
   import "@openzeppelin/contracts/security/Pausable.sol";
   
   contract ColorPrediction is Pausable {
       function placeBet(...) external whenNotPaused {
           // ...
       }
   }
   ```

4. ✅ **Get Professional Audit**
   - OpenZeppelin ($15k-50k)
   - Trail of Bits ($50k-100k)
   - CertiK, ConsenSys Diligence

5. ✅ **Implement Real Money System**
   - Accept ETH/USDC instead of custom token
   - Add deposit/withdrawal functions
   - Implement house edge (e.g., 5% fee)

6. ✅ **Legal Compliance**
   - Consult gambling lawyers
   - Check jurisdictional laws
   - Implement age verification
   - Add responsible gaming features

---

## 🔧 Troubleshooting

### ❌ Problem: "Transaction Reverted" Error

**Solutions:**
1. ✅ Ensure all terminals are running (3 windows should be open)
2. ✅ Reset MetaMask: Settings → Advanced → Clear Activity Tab Data
3. ✅ Check you're on `Localhost 8545` network
4. ✅ Verify you have enough CGT tokens (click Mint button)

### ❌ Problem: "Insufficient Funds" in Contract

**Solution:**
```bash
# Give the house more tokens
npx hardhat run scripts/fundContract.js --network localhost
```

### ❌ Problem: Frontend Not Connecting

**Solutions:**
1. ✅ Check browser console (F12) for errors
2. ✅ Verify MetaMask is unlocked
3. ✅ Confirm contract addresses match in `config.js`
4. ✅ Try refreshing the page

### ❌ Problem: Rounds Not Progressing

**Solutions:**
1. ✅ Check backend terminal for errors
2. ✅ Verify backend `.env` has correct contract addresses
3. ✅ Restart `START_ALL.bat`

### ❌ Problem: "Cannot Read Properties of Undefined"

**Solution:**
```bash
# Delete and reinstall node_modules
rm -rf node_modules game-backend/node_modules
npm install
cd game-backend && npm install
```

---

## ⚙️ Configuration

### Change Round Duration

Edit `game-backend/.env`:
```env
ROUND_DURATION=60  # Change from 30s to 60s
```

### Change Bet Multipliers

Edit `contracts/ColorPrediction.sol`:
```solidity
function calculatePayout(uint256 amount, Color color)
    public
    pure
    returns (uint256)
{
    if (color == Color.VIOLET) {
        return amount * 10;  // Changed from 5x to 10x
    }
    return amount * 3;  // Changed from 2x to 3x
}
```

Then redeploy:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Add New Colors

1. Update enum in `ColorPrediction.sol`:
```solidity
enum Color {
    RED,
    GREEN,
    VIOLET,
    BLUE,    // NEW
    YELLOW   // NEW
}
```

2. Update frontend UI with new buttons
3. Redeploy contract

---

## ❓ Frequently Asked Questions

### Q: Is this real money?
**A:** No! This uses:
- Hardhat's **local blockchain** (resets when you close it)
- **Custom tokens** you can mint for free
- **Fake ETH** that has no value

### Q: Can I lose my bet?
**A:** Yes! Just like any betting game:
- If your color doesn't match, you lose your tokens
- But you can always mint more tokens for free (click Mint button)

### Q: How is the result determined?
**A:** Currently, the backend uses JavaScript's `Math.random()`:
```javascript
const colors = ['RED', 'GREEN', 'VIOLET'];
const result = colors[Math.floor(Math.random() * 3)];
```
⚠️ **Not cryptographically secure!** For production, use Chainlink VRF.

### Q: What happens if I bet on VIOLET?
**A:** VIOLET has:
- **Lower probability** (harder to win)
- **Higher payout** (5x instead of 2x)
- Example: Bet 100 CGT → Win 500 CGT

### Q: Can the house run out of money?
**A:** Yes! The contract starts with 50,000 CGT. If many people win big:
- Payouts may fail
- Run `fundContract.js` to add more tokens

### Q: Can I deploy this to real Ethereum?
**A:** Technically yes, but **DO NOT** without:
1. Removing the `mint()` function
2. Adding Chainlink VRF
3. Professional security audit
4. Legal consultation

### Q: How do I verify the contract is fair?
**A:** On Sepolia/mainnet:
1. View contract on Etherscan
2. Read the verified source code
3. Check `resolveRound()` transactions
4. Audit event logs

### Q: What's the house edge?
**A:** Currently **0%** (all winnings paid out):
- RED/GREEN: 2x payout
- VIOLET: 5x payout

For production, add 5-10% house edge to stay profitable.

### Q: Can I play on mobile?
**A:** Yes! Install MetaMask mobile app:
1. Use the in-app browser
2. Navigate to your hosted frontend URL
3. Connect wallet and play

---

## 🧪 For Developers: Testing

### Run Smart Contract Tests

```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/ColorPrediction.test.js

# Run with coverage
npx hardhat coverage
```

### Test Locally

```bash
# Terminal 1: Start blockchain
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Start backend
cd game-backend
npm start

# Browser: Open game-frontend/index.html
```

---

## 🚢 Deployment Guide

### Deploy to Sepolia Testnet

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for full guide.

**Quick Steps:**
```bash
# 1. Get test ETH from faucet
# Visit: https://sepoliafaucet.com

# 2. Set up .env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_metamask_private_key

# 3. Deploy
npx hardhat run scripts/deploy.js --network sepolia

# 4. Verify on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

---

## 📝 TODO / Roadmap

### Phase 1: Core Features ✅
- [x] ERC-20 token system
- [x] Smart contract betting logic
- [x] Automated round resolution
- [x] Frontend UI
- [x] Supabase integration

### Phase 2: Enhancements 🚧
- [ ] Chainlink VRF integration
- [ ] Emergency pause mechanism
- [ ] User statistics dashboard
- [ ] Mobile-responsive design
- [ ] Sound effects & animations

### Phase 3: Advanced Features 🔮
- [ ] Multiplayer chat
- [ ] Leaderboard system
- [ ] Referral program
- [ ] NFT rewards for top players
- [ ] Multi-chain support (Polygon, BSC, Arbitrum)
- [ ] DAO governance for house parameters

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Ideas
- 🎨 Improve UI/UX design
- 🧪 Add more tests
- 📱 Make mobile-responsive
- 🌐 Add internationalization
- 🔊 Add sound effects
- 📊 Create analytics dashboard

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 Deepanshu Singh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## ⚖️ Disclaimer

**READ CAREFULLY:**

🚨 **This project is for EDUCATIONAL PURPOSES ONLY.**

- ❌ **NOT intended for real money gambling**
- ❌ **NOT audited by security professionals**
- ❌ **NOT compliant with gambling regulations**
- ❌ **NOT suitable for production use**

**Legal Notice:**
- Gambling may be **illegal in your jurisdiction**
- Check your local laws before deploying
- The developers assume **NO LIABILITY** for:
  - Financial losses
  - Legal consequences
  - Security breaches
  - Misuse of this software

**Use at your own risk. You have been warned! ⚠️**

---

## 🙏 Acknowledgments

This project was built with amazing open-source tools:

- **[Hardhat](https://hardhat.org/)** - Ethereum development environment
- **[OpenZeppelin](https://openzeppelin.com/)** - Secure smart contract libraries
- **[ethers.js](https://docs.ethers.org/)** - Ethereum JavaScript library
- **[Supabase](https://supabase.com/)** - Open-source Firebase alternative
- **[MetaMask](https://metamask.io/)** - Crypto wallet

Special thanks to the Ethereum and Web3 communities! 🌟


## 🌟 Star This Project!

If you found this helpful, please give it a ⭐️ on GitHub!

It helps others discover the project and motivates us to keep improving it.

---

<div align="center">

**Built with ❤️ for the Blockchain Community**

🎮 Happy Betting! 🎲

[⬆ Back to Top](#-ultimate-color-prediction-game-blockchain--supabase)

</div>