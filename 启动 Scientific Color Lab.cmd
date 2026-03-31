@echo off
setlocal

cd /d "%~dp0"
title Scientific Color Lab Launcher

set "APP_URL=http://127.0.0.1:4173/workspace"
set "APP_HOST=127.0.0.1"
set "APP_PORT=4173"

where node >nul 2>nul
if errorlevel 1 (
  echo [Error] Node.js is not installed or not in PATH.
  echo Install Node.js 20+ first, then run this launcher again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [Error] npm is not available in PATH.
  echo Reinstall Node.js, then run this launcher again.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri '%APP_URL%' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if not errorlevel 1 (
  echo [Info] Scientific Color Lab is already running.
  start "" "%APP_URL%"
  exit /b 0
)

if not exist "node_modules" (
  echo [Info] Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [Error] npm install failed.
    pause
    exit /b 1
  )
)

if not exist "dist" (
  echo [Info] Building application for preview...
  call npm run build
  if errorlevel 1 (
    echo [Error] npm run build failed.
    pause
    exit /b 1
  )
)

echo [Info] Starting Scientific Color Lab preview server...
start "Scientific Color Lab Server" cmd /k "cd /d ""%~dp0"" && npm run preview -- --host %APP_HOST% --port %APP_PORT%"

echo [Info] Waiting for preview server...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$url='%APP_URL%'; $deadline=(Get-Date).AddSeconds(25); do { try { Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 | Out-Null; Start-Process $url; exit 0 } catch { Start-Sleep -Milliseconds 700 } } while ((Get-Date) -lt $deadline); exit 1"
if errorlevel 1 (
  echo [Warning] The browser was not opened automatically.
  echo Open this URL manually once the server finishes starting:
  echo %APP_URL%
  pause
  exit /b 1
)

echo [Info] Scientific Color Lab is opening in your browser.
exit /b 0
