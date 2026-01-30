#  Ultimate Color Prediction Game (Blockchain + Supabase)

A professional betting game where users bet ETH on colors.
- **Blockchain**: Holds funds & pays winners instantly (Trustless Payouts).
- **Backend**: Auto-resolves rounds every 30 seconds.
- **Supabase**: Real-time history & smooth UI data.

##  Quick Start (Play Now)

**Everything is automated.** You don`'t need complex commands.

1.  **Start Everything**:
    Double-click **`START_ALL.bat`** in this folder.
    *(This starts the Blockchain, Deploys contract, and Starts the Backend engine)*

2.  **Play**:
    Open `game-frontend/index.html` in your browser.

3.  **Connect Wallet**:
    - Network: **Localhost 8545**
    - Import a test account from the Hardhat terminal window.
    - **Bet Limit**: Max 100 ETH per bet (Safe mode).

---

##  How It Works (Simple Terms)

1.  **You Place a Bet** 
    - You select **RED (2x)**, **GREEN (2x)**, or **VIOLET (5x)**.
    - Your ETH goes directly into the **Smart Contract**.
    - The contract locks your money safely.

2.  **The Round Ends** 
    - The **Game Backend** watches the clock (30 seconds per round).
    - When time is up, it generates a result (Red/Green/Violet).

3.  **You Get Paid** 
    - The Backend commands the Smart Contract to `resolveRound()`.
    - The Contract checks if you won.
    - **If you won:** The Contract INSTANTLY sends ETH to your wallet.
    - **If you lost:** The ETH stays in the house pool.

---

##  Project Structure

- **`contracts/ColorPrediction.sol`**:
    The Smart Contract. It acts as the "Bank". It has `placeBet()` and `resolveRound()`.
    *Note: Only the Owner (Backend) can call resolveRound to prevent cheating.*

- **`game-frontend/`**:
    The website you see. It connects to:
    - **Blockchain** (to send money).
    - **Supabase** (to show betting history graph/dots).

- **`game-backend/`**:
    The brain. Running `node index.js`.
    - Starts/Ends rounds.
    - Tells the Blockchain who won.

- **`scripts/`**:
    Tools to deploy or fund the contract.
    - `deploy.js`: Puts contract on chain.
    - `fundContract.js`: Gives the contract money to pay winners.

---

##  Troubleshooting

**"Transaction reverted" or Payout issues?**
1.  Is `START_ALL.bat` running? (Keep the black windows open!)
2.  Did you reset MetaMask? (Settings -> Advanced -> Reset Activity).

**"Contract Empty"?**
Run this to give the house more money:
```bash
npx hardhat run scripts/fundTo50k.js --network localhost
```

**Changing Settings**
Check `.env` files in root or `game-backend/` to change round time (default 30s).

---

**Made with  by GitHub Copilot**
