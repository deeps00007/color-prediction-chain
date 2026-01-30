# 🚀 Live Deployment - Step-by-Step Instructions

Your contracts are deployed on **Sepolia Testnet**:
- **GameToken**: `0xfDf4343D02330530cC4E3239C5f3F754a767fe7A`
- **ColorPrediction**: `0x982Ad674Cb4ACE114753ebF2949658e580ca1dD6`

Now let's make the game accessible to everyone!

---

## 📦 STEP 1: Push Code to GitHub

1. **Create a new GitHub repository**:
   - Go to [github.com](https://github.com) → Click "New Repository"
   - Name: `color-prediction-game` (or any name you like)
   - **Important**: Do NOT initialize with README (you already have one)
   - Click "Create Repository"

2. **Upload your code**:
   - Open a terminal in your project folder (`C:\Users\hp\Downloads\color-prediction-chain`)
   - Run these commands (replace `YOUR_USERNAME` with your GitHub username):

   ```bash
   git init
   git add .
   git commit -m "Initial commit - Color Prediction Game"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/color-prediction-game.git
   git push -u origin main
   ```

   If it asks for credentials, use your GitHub username and a **Personal Access Token** (not password).
   Generate token here: https://github.com/settings/tokens

---

## 🧠 STEP 2: Deploy Backend on Render

The backend runs the game rounds every 30 seconds.

### 2.1 Sign Up & Connect GitHub
1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with GitHub (easiest option)

### 2.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository (`color-prediction-game`)
3. Configure:
   - **Name**: `color-game-backend` (or any name)
   - **Root Directory**: `game-backend` ⚠️ **CRITICAL!**
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: `Free`

### 2.3 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**. Add these **EXACTLY**:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://zskfvqfszulwuhshzuxa.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2Z2cWZzenVsd3Voc2h6dXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MDE4NDYsImV4cCI6MjA4NTE3Nzg0Nn0.wAWewC_OZmLUK9DZmJy-YB63l_OA5sTn_Lu0yxY5r2U` |
| `ROUND_DURATION_SECONDS` | `30` |
| `RPC_URL` | `https://eth-sepolia.g.alchemy.com/v2/MVLz5Mko4G4vBF_kkYI9I` |
| `PRIVATE_KEY` | `0xfeb4d05f204df19891ca12c2ba023d40f9b7089f4a13a80ae8336c6d8b4f1282` |
| `CONTRACT_ADDRESS` | `0x982Ad674Cb4ACE114753ebF2949658e580ca1dD6` |

### 2.4 Deploy
1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. You'll get a URL like: `https://color-game-backend.onrender.com`
4. **Check Logs**: You should see `"🟢 New round started"` messages

✅ **Backend is now live and auto-resolving rounds!**

---

## 🎨 STEP 3: Deploy Frontend on Vercel

The frontend is the website users visit.

### Option A: Vercel (Recommended - Easiest)

1. **Sign Up**:
   - Go to [vercel.com](https://vercel.com)
   - Click **"Start Deploying"**
   - Sign up with GitHub

2. **Import Project**:
   - Click **"Add New..."** → **"Project"**
   - Select your GitHub repo: `color-prediction-game`
   - Configure:
     - **Framework Preset**: `Other`
     - **Root Directory**: Click **"Edit"** → Select `game-frontend`
     - **Build Command**: Leave empty
     - **Output Directory**: Leave empty (it's a static site)

3. **Deploy**:
   - Click **"Deploy"**
   - Wait 1-2 minutes
   - You'll get a URL like: `https://color-prediction-game.vercel.app`

### Option B: Netlify (Alternative)

1. Go to [netlify.com](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect GitHub → Select your repo
4. **Important**: Set **Base Directory** to `game-frontend`
5. Click **"Deploy"**

✅ **Frontend is now live!**

---

## 🎮 STEP 4: Test Your Live Game

1. **Open your Vercel URL** in a browser
2. **Connect MetaMask**:
   - Switch network to **Sepolia Testnet**
   - If you don't have Sepolia ETH, get some from: [sepoliafaucet.com](https://sepoliafaucet.com)
3. **Mint Tokens**: Click "💸 Mint 1000 CGT"
4. **Place a Bet**: Select a color and bet!

**Share the URL with friends!** They need:
- MetaMask installed
- Sepolia network added
- Some Sepolia ETH for gas (they can mint tokens for free in the game)

---

## 🔧 Troubleshooting

### Backend Not Starting?
- Check Render logs for errors
- Verify all environment variables are correct (no extra spaces)
- Make sure `Root Directory` is set to `game-backend`

### Frontend Shows Connection Errors?
- Open browser console (F12)
- Make sure you're on **Sepolia network** in MetaMask
- Check that contract addresses in `app.js` match the deployed ones

### Rounds Not Resolving?
- Check Render logs - should see "🎲 Resolving round..." every 30 seconds
- Make sure `PRIVATE_KEY` wallet has Sepolia ETH for gas
- Check Alchemy dashboard for API usage

---

## 💡 What's Next?

### Add Custom Domain (Optional)
Both Vercel and Netlify allow custom domains:
- Buy a domain (e.g., `colorgame.fun` on Namecheap)
- Add it in Vercel/Netlify settings
- Update DNS records

### Monitor Sepolia ETH Balance
Your backend wallet (`0xFcE8755225100263fB9d480751C11f28522C9777`) needs gas:
- Check balance: [sepolia.etherscan.io](https://sepolia.etherscan.io/address/0xFcE8755225100263fB9d480751C11f28522C9777)
- Refill from faucet when low

### Future: Go Mainnet (Real Money)
To deploy with real ETH/USDT:
1. Remove public `mint()` function from `GameToken.sol`
2. Add deposit/withdrawal system
3. Use Chainlink VRF for provably fair randomness
4. Get professional security audit
5. Deploy to Ethereum Mainnet

---

## 🎉 You're Live!

Congratulations! Your game is now public on the blockchain. Anyone in the world can play!

**Your Live URLs**:
- Frontend: `https://your-game.vercel.app` (update after deployment)
- Backend: `https://your-backend.onrender.com` (update after deployment)
- Contracts: View on [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x982Ad674Cb4ACE114753ebF2949658e580ca1dD6)
