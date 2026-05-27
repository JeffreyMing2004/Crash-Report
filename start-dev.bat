@echo off
cd /d "%~dp0"
start cmd /k "cd server && npm run dev"
timeout /t 1 /nobreak
start cmd /k "cd client && npm run dev"
