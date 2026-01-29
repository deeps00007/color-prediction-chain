@echo off
title Game Backend - Keep This Window Open
cd /d C:\Users\hp\Downloads\color-prediction-chain\game-backend
echo ========================================
echo   GAME BACKEND ENGINE
echo ========================================
echo.
echo Waiting 5 seconds for Hardhat...
timeout /t 5 /nobreak >nul
echo.
echo Starting backend...
echo KEEP THIS WINDOW OPEN!
echo.
npm start
echo.
echo Backend stopped! Press any key to close...
pause
