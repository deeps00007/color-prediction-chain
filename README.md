# 🎮 Color Prediction Chain

A decentralized color prediction game built on Ethereum blockchain using Solidity smart contracts and Web3 technology. Players bet on color outcomes (Red, Green, or Violet) with ETH, featuring two game modes: instant play and timed rounds.

## 📋 Overview

This project demonstrates a fully functional blockchain-based gambling game where:
- Players predict colors and place bets in ETH
- Smart contracts handle random color generation using blockchain randomness
- Winners receive 2x their bet amount from the contract's house balance
- All game logic is transparent and verifiable on-chain

## 🎯 Features

### Smart Contract V1 (ColorPrediction.sol)
- **Instant Play**: Immediate game resolution on each bet
- **Fixed Bet**: 0.01 ETH per game
- **3 Color Options**: Red (45% chance), Green (45% chance), Violet (10% chance)
- **2x Payout**: Win double your bet amount
- **Game History**: All games stored on-chain
- **Events**: Emit game results for frontend tracking

### Smart Contract V2 (ColorPredictionV2.sol)
- **Round-Based**: 30-second betting rounds
- **Flexible Betting**: Min 0.001 ETH, Max 0.05 ETH
- **Equal Odds**: 33.33% chance for each color
- **Player Statistics**: Track total won/lost amounts per player
- **Last 10 Results**: Historical result tracking
- **Batch Resolution**: Resolve all bets at round end

### Frontend Features
- **MetaMask Integration**: Connect Web3 wallet
- **Real-time Updates**: Live balance and round timer
- **Visual UI**: Color-coded betting buttons
- **History Display**: Last 10 game results
- **Input Validation**: Prevents invalid bets
- **Stats Dashboard**: Personal win/loss tracking

## 🏗️ Project Structure

```
color-prediction-chain/
├── contracts/
│   ├── ColorPrediction.sol      # V1: Instant game contract
│   ├── ColorPredictionV2.sol    # V2: Round-based contract
│   └── Lock.sol                 # Example Hardhat contract
├── frontend/
│   ├── index.html               # Web interface
│   ├── app.js                   # Web3 integration logic
│   └── style.css                # UI styling
├── scripts/
│   └── deploy.js                # Deployment script
├── test/
│   └── Lock.js                  # Test examples
├── hardhat.config.js            # Hardhat configuration
└── package.json                 # Project dependencies
```

## 🛠️ Technology Stack

- **Blockchain**: Ethereum (Local/Testnet/Mainnet)
- **Smart Contracts**: Solidity ^0.8.28
- **Development Framework**: Hardhat 2.28.4
- **Frontend**: Vanilla JavaScript + HTML/CSS
- **Web3 Library**: Ethers.js v6.10.0
- **Wallet**: MetaMask

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd color-prediction-chain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Compile smart contracts**
   ```bash
   npx hardhat compile
   ```

## 🚀 Deployment

### Local Network

1. **Start Hardhat node**
   ```bash
   npx hardhat node
   ```

2. **Deploy contract** (in new terminal)
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Note the deployed contract address** and update `CONTRACT_ADDRESS` in [frontend/app.js](frontend/app.js)

4. **Fund the contract** (house balance)
   ```bash
   # Send ETH to contract address using MetaMask or Hardhat console
   ```

### Testnet/Mainnet

1. **Configure network** in [hardhat.config.js](hardhat.config.js):
   ```javascript
   module.exports = {
     networks: {
       sepolia: {
         url: "YOUR_RPC_URL",
         accounts: ["YOUR_PRIVATE_KEY"]
       }
     }
   };
   ```

2. **Deploy**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

## 🎮 How to Play

1. **Setup MetaMask**
   - Install MetaMask browser extension
   - Connect to local Hardhat network (RPC: http://localhost:8545, Chain ID: 31337)
   - Import test accounts from Hardhat node output

2. **Open Frontend**
   - Open [frontend/index.html](frontend/index.html) in browser
   - Connect your MetaMask wallet

3. **Place Bets**
   - Enter bet amount (0.001 - 0.05 ETH)
   - Click Red, Green, or Violet button
   - Confirm transaction in MetaMask
   - Wait for round to resolve (30 seconds)

4. **View Results**
   - Check if you won (2x payout)
   - See result in history dots
   - Track your stats (total won/lost)

## 🔧 Smart Contract Functions

### ColorPredictionV2 (Main Contract)

| Function | Description | Parameters |
|----------|-------------|------------|
| `placeBet(Color)` | Place a bet on a color | color (0=Red, 1=Green, 2=Violet) |
| `currentRound()` | Get current round number | - |
| `roundStartTime()` | Get round start timestamp | - |
| `totalWon(address)` | Get total winnings for player | player address |
| `totalLost(address)` | Get total losses for player | player address |
| `lastResults(uint)` | Get historical result | index (0-9) |

## 🧪 Testing

```bash
npx hardhat test
```

## ⚠️ Important Notes

### Randomness
- Uses `block.timestamp` and `block.prevrandao` for randomness
- **Not secure for production** on mainnet (miners can influence)
- For production, use Chainlink VRF or similar oracle

### House Balance
- Contract must maintain sufficient balance to pay winners
- Minimum house balance = 2x max bet amount
- Fund contract address with ETH before allowing bets

### Gas Costs
- ColorPredictionV2 uses ~100k-200k gas per bet
- Round resolution costs scale with number of bets
- Consider gas optimization for mainnet deployment

## 🔐 Security Considerations

⚠️ **This is a demonstration project. Before production deployment:**

1. **Audit smart contracts** for vulnerabilities
2. **Implement proper randomness** (Chainlink VRF)
3. **Add access control** for owner functions
4. **Implement withdrawal patterns** for house funds
5. **Add pause mechanism** for emergencies
6. **Test thoroughly** on testnets
7. **Consider regulatory compliance** for gambling applications

## 📊 Game Economics

### V1 Odds
- Red: 45% (wins 2x)
- Green: 45% (wins 2x)
- Violet: 10% (wins 2x)
- **House Edge**: ~10%

### V2 Odds
- Red: 33.33% (wins 2x)
- Green: 33.33% (wins 2x)
- Violet: 33.33% (wins 2x)
- **House Edge**: ~50%

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

ISC License - see package.json for details

## 🆘 Troubleshooting

**MetaMask not connecting?**
- Ensure you're on the correct network
- Reset account in MetaMask settings if needed

**Transaction failing?**
- Check contract has sufficient house balance
- Verify bet amount is within limits (0.001 - 0.05 ETH)
- Ensure you have enough ETH for gas + bet

**Contract not found?**
- Verify `CONTRACT_ADDRESS` in [frontend/app.js](frontend/app.js) matches deployed address
- Ensure Hardhat node is running for localhost

## 📞 Support

For issues or questions:
- Check existing issues in repository
- Review Hardhat documentation
- Consult Ethers.js documentation

---

**⚠️ Disclaimer**: This is an educational project. Gambling may be illegal in your jurisdiction. Use responsibly and only on testnets unless properly licensed.

