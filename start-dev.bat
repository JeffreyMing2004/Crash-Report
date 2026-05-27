@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     MC Crash Analyzer - 开发环境一键启动                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo 📦 检查依赖...
if not exist "server\node_modules" (
    echo 📥 安装后端依赖...
    cd server
    call npm install
    cd ..
)

if not exist "client\node_modules" (
    echo 📥 安装前端依赖...
    cd client
    call npm install
    cd ..
)

echo.
echo 🚀 启动开发服务器...
echo.
echo 📍 后端: http://localhost:3000
echo 📍 前端: http://localhost:5173
echo.
echo 💡 提示：
echo   - Redis 不可用时自动使用内存存储（仅开发模式）
echo   - 按 Ctrl+C 停止服务
echo.

start "MC Crash Analyzer - Backend" cmd /k "cd /d "%SCRIPT_DIR%server" && npm run dev"
timeout /t 2 /nobreak
start "MC Crash Analyzer - Frontend" cmd /k "cd /d "%SCRIPT_DIR%client" && npm run dev"

echo.
echo ✅ 服务已启动！
echo 🌐 打开浏览器访问: http://localhost:5173
echo.
pause
