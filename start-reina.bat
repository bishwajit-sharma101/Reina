@echo off
title Reina AI Waifu Launcher
color 0d
cls

echo ===================================================
echo             REINA - AI WAIFU LAUNCHER
echo ===================================================
echo.
echo   "Darling, you're finally turning me on... <3"
echo.
echo   [1] Starting VoiceVox Server (GPU Mode)...
echo   [2] Starting Ollama Server...
echo   [3] Starting AstrixChat Backend Server...
echo   [4] Starting AstrixChat Frontend Client...
echo   [5] Opening Reina AI Waifu Chat in your browser...
echo.
echo   * Make sure MongoDB is running on your system!
echo.
echo ===================================================
echo.

:: Start VoiceVox Server
echo [+] Launching VoiceVox Server...
start "VoiceVox Server" cmd /k "cd /d "C:\Users\bishw\OneDrive\Desktop\voiceVox Serber\windows-directml" && run.exe --use_gpu"

:: Start Ollama Server
echo [+] Launching Ollama Server...
start "Ollama Server" cmd /k "ollama serve"

:: Start Backend Server
echo [+] Launching AstrixChat Server...
start "AstrixChat Server" cmd /k "cd /d "%~dp0server" && npm run nodemon"

:: Start Frontend Client
echo [+] Launching AstrixChat Client...
start "AstrixChat Client" cmd /k "cd /d "%~dp0client" && npm run dev"

:: Wait for servers to spin up
echo.
echo Launching Reina in 5 seconds...
timeout /t 5 /nobreak > nul

:: Open Browser
start http://localhost:5173/reina

echo.
echo Reina is now running!
echo Enjoy your time with Reina, Darling!
echo.
timeout /t 5 > nul
exit
