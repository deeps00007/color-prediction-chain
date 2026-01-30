# 🌍 Going Live: The Ultimate Deployment Guide

So you want to share your game with the world? Let's get it off your computer and onto the internet.

We will deploy to **Sepolia Testnet** first. This is "Public Live" (accessible to everyone) but uses "Fake Money" for gas, so it's free to deploy.

## ✅ Phase 1: Preparation (Do not skip)

You need 3 external accounts:
1. **Alchemy or Infura**: To talk to the blockchain.
   - Signup at [alchemy.com](https://www.alchemy.com/) -> Create App (Chain: Ethereum, Network: Sepolia).
   - Copy the "HTTPS" URL.
2. **GitHub Account**: To host your code.
3. **Deployer Wallet**: A MetaMask account with some Sepolia ETH.
   - Go to [sepoliafaucet.com](https://sepoliafaucet.com) to get free gas ETH.

---

## 🔗 Phase 2: Blockchain Deployment (The Contracts)

1. **Configure Hardhat**:
   - Open `hardhat.config.js`.
   - Uncomment the `sepolia` section (I will do this for you right after this guide).
   - Ensure your `.env` file in `game-backend` has:
     ```env
     SEPOLIA_URL="your_alchemy_url_here"
     PRIVATE_KEY="your_wallet_private_key_here"
     ```

2. **Deploy**:
   Run this command in your VS Code terminal (root folder):
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

3. **Save Addresses**:
   The terminal will print:
   ```
   ✅ GameToken deployed to: 0x123...
   ✅ ColorPrediction deployed to: 0x456...
   ```
   **WRITE THESE DOWN.** You need them for the Frontend and Backend.

---

## 🧠 Phase 3: The Backend (The Brain)

We will use **Render** (easiest for Node.js).

1. **Push Code to GitHub**:
   - Create a new repo on GitHub.
   - Upload your project code.

2. **Deploy on Render**:
   - Go to [render.com](https://render.com) -> New -> **Web Service**.
   - Connect your GitHub repo.
   - **Root Directory**: `game-backend` (Important!).
   - **Build Command**: `npm install`.
   - **Start Command**: `node index.js`.
   - **Environment Variables** (Add these in the Dashboard):
     - `RPC_URL`: Your Alchemy URL (same as Phase 2).
     - `PRIVATE_KEY`: Your Wallet Private Key (same as Phase 2).
     - `CONTRACT_ADDRESS`: The NEW `ColorPrediction` address from Phase 2.
     - `SUPABASE_URL`: Your Supabase URL.
     - `SUPABASE_KEY`: Your Supabase Key.

3. **Wait**: Render will deploy and give you a URL like `https://color-game-backend.onrender.com`.

---

## 🎨 Phase 4: The Frontend (The Website)

We will use **Vercel** or **Netlify**.

1. **Update `app.js`**:
   - Open `game-frontend/app.js`.
   - Replace `CONTRACT_ADDRESS` with your NEW Sepolia `ColorPrediction` address.
   - Replace `TOKEN_ADDRESS` with your NEW Sepolia `GameToken` address.

2. **Deploy**:
   - Go to [vercel.com](https://vercel.com) or [netlify.com](https://netlify.com).
   - Drag and drop the `game-frontend` folder.
   - **Done!** You now have a link like `https://my-color-game.vercel.app`.

3. **Share**: Send that link to your friends. They can install MetaMask, switch to Sepolia, Mint tokens, and play!

---

## ⚠️ Important Production Note

Currently, `GameToken.sol` has a public `mint()` function.
- **For Request/Testnet**: This is PERFECT. Friends can mint free chips to play.
- **For Real Money (Mainnet)**: You MUST remove `mint()` or make it `onlyOwner`. Otherwise, anyone can print money and drain the house.

**Ready to start?**
1. Get your RPC URL (Alchemy).
2. Get your Private Key.
3. Update `.env`.
4. Run the deploy command!
