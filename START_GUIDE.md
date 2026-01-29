# 🚀 Quick Start Guide - Payout System NOW WORKING!

## ✅ Current Status

All systems are configured and running:

1. ✅ **Hardhat Node** - Running in separate window
2. ✅ **Contract Deployed** - `0x5FbDB2315678afecb367f032d93F642f64180aa3`
3. ✅ **Contract Funded** - 10 ETH house balance
4. ✅ **Backend Running** - Automatically resolves rounds and pays winners
5. ✅ **Frontend Updated** - Shows win/loss amounts

## 🎮 How to Play & Get Paid

### 1. Open the Game
- Open `game-frontend/index.html` in your browser

### 2. Connect Wallet
- Click "Connect Wallet"
- MetaMask will open - select **Account #1** or **Account #2**
- NOT Account #0 (that's the owner/backend account)

### 3. Place a Bet
- Enter amount (e.g., 0.01 ETH)
- Click RED, GREEN, or VIOLET
- Click "Place Bet"
- Approve transaction in MetaMask

### 4. Wait for Result (30 seconds)
- Backend automatically closes the round
- Backend resolves on blockchain → **Pays winners automatically!**
- Frontend shows result

### 5. See Your Payout!

**If you WIN:**
```
🎉 YOU WON 0.02 ETH! (for RED/GREEN)
🎉 YOU WON 0.05 ETH! (for VIOLET)
```
- Money automatically sent to your wallet
- Balance updates in real-time

**If you LOSE:**
```
❌ YOU LOST 0.01 ETH. Result: GREEN
```
- Your bet stays in contract as house funds

## 💰 Payout Structure

| Color  | Chance | Payout | Example          |
|--------|--------|--------|------------------|
| 🔴 RED    | 45%    | 2x     | Bet 0.01 → Get 0.02 |
| 🟢 GREEN  | 45%    | 2x     | Bet 0.01 → Get 0.02 |
| 🟣 VIOLET | 10%    | 5x     | Bet 0.01 → Get 0.05 |

## 🔧 How It Works Now

1. **You place bet** → ETH goes to contract
2. **Round ends** → Backend automatically resolves
3. **Backend calls `contract.resolveRound(roundId, color)`**
4. **Smart contract pays winners** → `payable(player).transfer(payout)`
5. **Frontend detects Payout event** → Shows "🎉 YOU WON!"
6. **Your wallet balance increases!**

## 📊 Check Winnings

After a round resolves, check:
- **Frontend message** - Shows if you won/lost
- **MetaMask balance** - Increases if you won
- **Browser console** - Shows Payout events

## 🐛 Troubleshooting

**"Betting closed"**
- Wait for new round (happens every 30 seconds)

**"Transaction failed"**
- Make sure Hardhat node is running
- Check if you have enough ETH for gas

**Not getting paid?**
- Check backend terminal - should show "⛓️ Blockchain resolved, winners paid!"
- Check browser console for errors
- Refresh the page

## 🎯 Test Accounts

Use these Hardhat accounts (copy private key to MetaMask):

**Account #1:**
- Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

**Account #2:**
- Address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- Private Key: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

## 🎉 You're Ready!

The payout system is fully working. Place a bet and see the magic happen! 🚀
