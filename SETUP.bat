@echo off
title Setup Color Prediction Game
cd /d C:\Users\hp\Downloads\color-prediction-chain

echo ========================================
echo   COLOR PREDICTION GAME - SETUP
echo ========================================
echo.

echo [1/5] Waiting for Hardhat to be ready...
timeout /t 8 /nobreak >nul

echo [2/5] Deploying contract...
call npx hardhat run scripts/deploy.js --network localhost
if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy contract!
    echo Make sure Hardhat node is running!
    pause
    exit /b 1
)

echo [3/5] Funding contract with 10 ETH...
call npx hardhat run scripts/fundContract.js --network localhost
if %errorlevel% neq 0 (
    echo ERROR: Failed to fund contract!
    pause
    exit /b 1
)

echo [4/5] Funding backend with 100 ETH...
call npx hardhat run scripts/fundBackend.js --network localhost
if %errorlevel% neq 0 (
    echo ERROR: Failed to fund backend!
    pause
    exit /b 1
)

echo [5/5] Setup complete!
echo.
echo ========================================
echo   READY TO PLAY!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure START_HARDHAT.bat is running
echo 2. Run START_BACKEND.bat
echo 3. Open game-frontend/index.html
echo.
pause
