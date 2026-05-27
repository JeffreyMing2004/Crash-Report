#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     MC Crash Analyzer - 开发环境一键启动                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📦 检查依赖..."
if [ ! -d "server/node_modules" ]; then
    echo "📥 安装后端依赖..."
    cd server
    npm install
    cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📥 安装前端依赖..."
    cd client
    npm install
    cd ..
fi

echo ""
echo "🚀 启动开发服务器..."
echo ""
echo "📍 后端: http://localhost:3000"
echo "📍 前端: http://localhost:5173"
echo ""
echo "💡 提示："
echo "  - Redis 不可用时自动使用内存存储（仅开发模式）"
echo "  - 按 Ctrl+C 停止服务"
echo ""

cd "$SCRIPT_DIR/server"
npm run dev &
BACKEND_PID=$!

sleep 2

cd "$SCRIPT_DIR/client"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 服务已启动！"
echo "🌐 打开浏览器访问: http://localhost:5173"
echo ""
echo "后端进程 PID: $BACKEND_PID"
echo "前端进程 PID: $FRONTEND_PID"
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '已停止服务'; exit" SIGINT SIGTERM

wait
