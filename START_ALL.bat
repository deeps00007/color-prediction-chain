@echo off
title Start Hardhat + Auto Setup
cd /d C:\Users\hp\Downloads\color-prediction-chain

echo ========================================
echo   COMPLETE GAME LAUNCHER
echo ========================================
echo.
echo This will:
echo  1. Start Hardhat blockchain
echo  2. Deploy and setup everything
echo  3. Start the backend
echo.
echo Press any key to continue...
pause >nul
echo.

REM Start Hardhat in a new window
echo Starting Hardhat blockchain...
start "Hardhat Blockchain" cmd /k "cd C:\Users\hp\Downloads\color-prediction-chain && npx hardhat node"

echo Waiting 15 seconds for Hardhat to initialize...
timeout /t 15 /nobreak >nul

REM Run auto setup
echo.
echo Running auto setup...
call AUTO_SETUP.bat

if %errorlevel% neq 0 (
    echo.
    echo Setup failed! Check errors above.
    pause
    exit /b 1
)

REM Start backend
echo.
echo ========================================
echo   Starting backend...
echo ========================================
echo.
start "Game Backend" cmd /k "cd C:\Users\hp\Downloads\color-prediction-chain\game-backend && npm start"

echo.
echo ========================================
echo   ✓ EVERYTHING IS RUNNING!
echo ========================================
echo.
echo Windows opened:
echo  - Hardhat Blockchain (keep open!)
echo  - Game Backend (keep open!)
echo.
echo Now open: game-frontend\index.html
echo.
echo IMPORTANT: Keep both CMD windows open!
echo.
pause
