@echo off
title Complete Game Setup
cd /d C:\Users\hp\Downloads\color-prediction-chain

echo ========================================
echo   COLOR PREDICTION GAME - AUTO SETUP
echo ========================================
echo.

REM Check if Hardhat is running
echo [1/6] Checking if Hardhat node is running...
powershell -Command "$result = Test-NetConnection -ComputerName 127.0.0.1 -Port 8545 -WarningAction SilentlyContinue; if ($result.TcpTestSucceeded) { exit 0 } else { exit 1 }"
if %errorlevel% neq 0 (
    echo.
    echo ================================================
    echo   ERROR: Hardhat node is NOT running!
    echo ================================================
    echo.
    echo You need to START HARDHAT FIRST in a separate window:
    echo.
    echo   1. Open a NEW PowerShell window
    echo   2. Run: cd C:\Users\hp\Downloads\color-prediction-chain
    echo   3. Run: npx hardhat node
    echo   4. KEEP THAT WINDOW OPEN
    echo   5. Come back and run this script again
    echo.
    pause
    exit /b 1
)
echo    ✓ Hardhat is running!
echo.

REM Deploy contract
echo [2/6] Deploying smart contract...
call npx hardhat run scripts/deploy.js --network localhost > temp_deploy.txt
if %errorlevel% neq 0 (
    echo    ✗ Deployment failed!
    type temp_deploy.txt
    del temp_deploy.txt
    pause
    exit /b 1
)

REM Extract contract address from deployment output
for /f "tokens=*" %%a in ('findstr /C:"deployed to:" temp_deploy.txt') do set DEPLOY_LINE=%%a
for /f "tokens=5" %%a in ("%DEPLOY_LINE%") do set CONTRACT_ADDRESS=%%a
del temp_deploy.txt

if "%CONTRACT_ADDRESS%"=="" (
    echo    ✗ Could not find contract address!
    pause
    exit /b 1
)
echo    ✓ Contract deployed to: %CONTRACT_ADDRESS%
echo.

REM Update frontend
echo [3/6] Updating frontend with new contract address...
powershell -Command "(Get-Content game-frontend\app.js) -replace 'const CONTRACT_ADDRESS = \"0x[a-fA-F0-9]{40}\";', 'const CONTRACT_ADDRESS = \"%CONTRACT_ADDRESS%\";' | Set-Content game-frontend\app.js"
echo    ✓ Frontend updated!
echo.

REM Update backend
echo [4/6] Updating backend with new contract address...
powershell -Command "(Get-Content game-backend\.env) -replace 'CONTRACT_ADDRESS=0x[a-fA-F0-9]{40}', 'CONTRACT_ADDRESS=%CONTRACT_ADDRESS%' | Set-Content game-backend\.env"
echo    ✓ Backend updated!
echo.

REM Fund contract
echo [5/6] Funding contract with 10 ETH...
call npx hardhat run scripts/fundContract.js --network localhost
if %errorlevel% neq 0 (
    echo    ✗ Failed to fund contract!
    pause
    exit /b 1
)
echo.

REM Fund player account
echo [6/6] Funding player account with 50,000 ETH...
call npx hardhat run scripts/fundTo50k.js --network localhost
if %errorlevel% neq 0 (
    echo    ✗ Failed to fund player!
    pause
    exit /b 1
)
echo.

echo ========================================
echo   ✓ SETUP COMPLETE!
echo ========================================
echo.
echo Contract Address: %CONTRACT_ADDRESS%
echo.
echo NEXT STEPS:
echo ===========
echo.
echo 1. Start the backend:
echo    ^> cd game-backend
echo    ^> npm start
echo.
echo 2. Open the game:
echo    ^> Open game-frontend\index.html in browser
echo.
echo 3. Connect MetaMask:
echo    - Network: Localhost 8545
echo    - Account: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
echo.
echo 4. Play and win!
echo.
pause
