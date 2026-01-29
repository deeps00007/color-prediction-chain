# 🎮 How the Payout System Works

## 💰 Payout Structure

- **RED/GREEN**: 2x your bet (45% chance each)
- **VIOLET**: 5x your bet (10% chance)

## 📊 Example

If you bet **0.01 ETH**:
- Win on RED/GREEN → Get **0.02 ETH** back
- Win on VIOLET → Get **0.05 ETH** back
- Lose → You lose your 0.01 ETH (stays in contract as house funds)

## ⚙️ How It Works

1. **Contract has house funds** (10 ETH funded via fundContract.js)
2. **You place a bet** → Your ETH goes to the contract
3. **Round closes** → Backend resolves with a random color
4. **If you win**:
   - Smart contract automatically transfers your payout
   - You see "🎉 YOU WON X ETH!" message
   - Your wallet balance updates
5. **If you lose**:
   - Your bet stays in contract (becomes house funds)
   - You see "❌ YOU LOST X ETH" message

## 🔧 Setup Steps (Already Done)

✅ Contract funded with 10 ETH house balance
✅ Frontend shows win/loss amounts
✅ Event listeners track payouts
✅ Real-time balance updates

## 🎯 Test It

1. Start Hardhat: `npx hardhat node`
2. Deploy contract: `npx hardhat run scripts/deploy.js --network localhost`
3. Fund contract: `npx hardhat run scripts/fundContract.js --network localhost`
4. Start backend: `cd game-backend && npm start`
5. Open frontend: `game-frontend/index.html`
6. Connect wallet, place bet, wait for round to resolve!

## 📝 Important Notes

- The contract needs enough balance to pay winners
- Current balance: 10.04 ETH (can pay ~500 max bets)
- Winners get paid automatically via smart contract
- Losers' bets add to house balance
