# 🚀 COMPLETE STARTUP GUIDE

## ⚠️ PROBLEM SOLVED

**Issue:** Backend account ran out of ETH for gas fees
**Solution:** Funded backend account with 100 ETH

---

## 📋 STARTUP SEQUENCE (Do these in order!)

### 1️⃣ Start Hardhat Node (Blockchain)
```powershell
# Open CMD window and run:
cd C:\Users\hp\Downloads\color-prediction-chain
npx hardhat node

# KEEP THIS WINDOW OPEN! Don't close it.
```

### 2️⃣ Deploy Contract (New PowerShell)
```powershell
cd C:\Users\hp\Downloads\color-prediction-chain
npx hardhat run scripts/deploy.js --network localhost
# Note the contract address
```

### 3️⃣ Fund Contract (House Balance)
```powershell
npx hardhat run scripts/fundContract.js --network localhost
# Adds 10 ETH for paying winners
```

### 4️⃣ Fund Backend Account (Gas Money)  
```powershell
npx hardhat run scripts/fundBackend.js --network localhost
# Adds 100 ETH for transaction gas fees
```

### 5️⃣ Start Backend Engine
```powershell
cd game-backend
npm start
# This resolves rounds and pays winners
```

### 6️⃣ Open Frontend
- Open `game-frontend/index.html` in browser
- Connect MetaMask
- Start playing!

---

## 🔧 QUICK RESTART (If everything crashes)

```powershell
# 1. Kill everything
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# 2. Start Hardhat in new CMD
Start-Process cmd -ArgumentList '/k', 'cd C:\Users\hp\Downloads\color-prediction-chain && npx hardhat node'

# 3. Wait 10 seconds, then:
cd C:\Users\hp\Downloads\color-prediction-chain
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/fundContract.js --network localhost
npx hardhat run scripts/fundBackend.js --network localhost
cd game-backend
npm start
```

---

## ⚠️ COMMON ERRORS

### "Sender doesn't have enough funds"
**Problem:** Backend out of gas money  
**Solution:** Run `npx hardhat run scripts/fundBackend.js --network localhost`

### "ECONNREFUSED 127.0.0.1:8545"
**Problem:** Hardhat node not running  
**Solution:** Start Hardhat in separate CMD window (step 1)

### "Contract address not found"
**Problem:** Need to redeploy after Hardhat restart  
**Solution:** Run deploy + fund scripts again (steps 2-4)

---

## 📊 CHECK STATUS

### Is Hardhat Running?
```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 8545 -InformationLevel Quiet
# Should return: True
```

### Backend Account Balance
```powershell
# In Hardhat console or script:
# Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
# Should have 100+ ETH for gas
```

### Contract Balance  
```powershell
# Should have 10+ ETH to pay winners
```

---

## 💡 PRO TIPS

1. **Always keep Hardhat CMD window open** - If it closes, you lose everything
2. **Fund backend regularly** - It uses gas with every round (~0.000025 ETH per round)
3. **After 4000 rounds** - Backend will need refunding (100 ETH / 0.000025 per round)
4. **Use Account #1 or #2 for playing** - Account #0 is for backend
5. **Save MetaMask private keys** - From Hardhat startup output

---

## 🎯 CURRENTLY DEPLOYED

- Contract: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- Backend Account: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (100 ETH)
- Contract Balance: 10 ETH
- Backend: Running ✓
- Hardhat: Should be running in CMD window
