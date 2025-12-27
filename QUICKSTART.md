# 🚀 快速開始指南

## 步驟 1: 配置環境變量

複製 `.env.example` 並創建 `.env` 文件：

```bash
# Windows PowerShell
Copy-Item .env.example .env

# 或手動創建 .env 文件
```

然後編輯 `.env` 文件，**必須填入你的 OpenAI API Key**：

```env
VISION_API_KEY=sk-your-openai-api-key-here
```

## 步驟 2: 安裝 Python 依賴

```bash
cd python-service
pip install -r requirements.txt
cd ..
```

> **注意**: 需要 Python 3.8+ 和 pip

## 步驟 3: 安裝 FFmpeg

### Windows
1. 下載 FFmpeg: https://www.gyan.dev/ffmpeg/builds/
2. 解壓並添加到 PATH，或在 `.env` 中指定路徑

### Mac
```bash
brew install ffmpeg
```

### Linux
```bash
sudo apt install ffmpeg
```

## 步驟 4: 啟動服務

### 方法 1: 使用啟動腳本（推薦）

**Windows:**
```bash
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

### 方法 2: 手動啟動

**終端 1 - Python 服務:**
```bash
cd python-service
python app.py
```

**終端 2 - Node.js 服務:**
```bash
npm run dev
```

## 步驟 5: 測試 API

### 使用 cURL 上傳影片

```bash
curl -X POST http://localhost:3000/api/videos \
  -F "video=@/path/to/your/video.mp4"
```

### 使用 Postman

1. 創建 POST 請求到 `http://localhost:3000/api/videos`
2. Body 選擇 `form-data`
3. 添加 key: `video`, type: `File`
4. 選擇你的影片文件
5. 發送請求

### 使用測試腳本

```bash
node test/process-example.js /path/to/your/video.mp4
```

## 步驟 6: 查看結果

處理完成後，你會得到：

1. **Scene Spec JSON**: 保存在 `storage/specs/[video-id].json`
2. **關鍵幀圖片**: 保存在 `storage/keyframes/`
3. **音頻文件**: 保存在 `storage/audio/`

### 獲取 Scene Spec

```bash
# 列出所有已處理影片
curl http://localhost:3000/api/videos

# 獲取特定影片的 Scene Spec
curl http://localhost:3000/api/videos/[video-id]
```

## 常見問題

### Q: Python 服務無法啟動
A: 確保已安裝所有 Python 依賴：
```bash
cd python-service
pip install -r requirements.txt
```

### Q: FFmpeg 找不到
A: 
1. 確保 FFmpeg 已安裝並在 PATH 中
2. 或在 `.env` 中指定完整路徑：
```env
FFMPEG_PATH=C:/ffmpeg/bin/ffmpeg.exe
FFPROBE_PATH=C:/ffmpeg/bin/ffprobe.exe
```

### Q: Vision API 錯誤
A: 
1. 確保 `.env` 中的 `VISION_API_KEY` 已正確設置
2. 確保 API key 有效且有足夠的額度
3. 如果使用其他 Vision API，修改 `VISION_API_URL` 和 `VISION_MODEL`

### Q: 處理速度慢
A: 
- Vision API 調用有延遲（每個關鍵幀約 1-2 秒）
- 可以在 `visionAnalysis.service.js` 中調整延遲時間
- 考慮使用本地 Vision 模型（如 LLaVA）以提升速度

## 下一步

- 📖 閱讀 [README.md](README.md) 了解系統架構
- 📊 查看 [examples/scene-spec-example.json](examples/scene-spec-example.json) 了解輸出格式
- 🏗️ 閱讀 [STRUCTURE.md](STRUCTURE.md) 了解項目結構
- 🔧 修改 `sceneBuilder.service.js` 中的規則引擎以自定義分析邏輯

## 需要幫助？

如有問題，請查看：
1. 終端輸出的錯誤信息
2. `storage/` 目錄中的生成文件
3. Python 服務日誌（終端 1）
4. Node.js 服務日誌（終端 2）

---

**祝你使用愉快！** 🎬✨
