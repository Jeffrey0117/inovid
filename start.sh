#!/bin/bash

# 啟動腳本 - 同時運行 Python 和 Node.js 服務

echo "🚀 Starting Inovid Scene Blueprint Engine..."
echo ""

# 檢查 Python 服務
echo "📍 Checking Python service..."
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.8+"
    exit 1
fi

# 檢查 Node.js
echo "📍 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# 檢查 FFmpeg
echo "📍 Checking FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg not found. Please install FFmpeg for full functionality."
fi

echo ""
echo "✅ All dependencies checked"
echo ""

# 啟動 Python 服務（背景）
echo "🐍 Starting Python microservice..."
cd python-service
python app.py &
PYTHON_PID=$!
cd ..

# 等待 Python 服務啟動
sleep 3

# 啟動 Node.js 服務
echo "🟢 Starting Node.js main service..."
npm run dev &
NODE_PID=$!

echo ""
echo "✨ Services started!"
echo "   Python service: http://localhost:5000"
echo "   Node.js service: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# 捕捉退出信號
trap "kill $PYTHON_PID $NODE_PID; exit" INT TERM

# 等待
wait
