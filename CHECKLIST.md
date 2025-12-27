# ✅ 項目檢查清單

## 📦 安裝前檢查

- [ ] Node.js 18+ 已安裝
- [ ] Python 3.8+ 已安裝
- [ ] FFmpeg 已安裝並在 PATH 中
- [ ] 有 OpenAI API Key（或其他 Vision API）

## 🔧 配置檢查

- [ ] 已複製 `.env.example` 為 `.env`
- [ ] 已在 `.env` 中填入 `VISION_API_KEY`
- [ ] 已運行 `npm install`
- [ ] 已在 `python-service/` 中運行 `pip install -r requirements.txt`

## 🚀 啟動檢查

### Python 服務（端口 5000）
- [ ] 運行 `cd python-service && python app.py`
- [ ] 訪問 `http://localhost:5000/health` 應返回 `{"status": "ok"}`

### Node.js 服務（端口 3000）
- [ ] 運行 `npm run dev`
- [ ] 訪問 `http://localhost:3000/health` 應返回 `{"status": "ok"}`
- [ ] 訪問 `http://localhost:3000` 應顯示測試頁面

## 🧪 功能測試

### 1. Web UI 測試
- [ ] 打開 `http://localhost:3000`
- [ ] 拖放或選擇一個短影片（建議 10-30 秒）
- [ ] 點擊「上傳並分析」
- [ ] 等待處理完成（可能需要 1-3 分鐘）
- [ ] 查看統計數據和 Scene Spec JSON

### 2. API 測試
```bash
# 上傳影片
curl -X POST http://localhost:3000/api/videos \
  -F "video=@/path/to/video.mp4"

# 列出所有影片
curl http://localhost:3000/api/videos

# 獲取特定影片的 Scene Spec
curl http://localhost:3000/api/videos/[video-id]
```

### 3. CLI 測試
```bash
node test/process-example.js /path/to/video.mp4
```

## 📁 輸出檢查

處理完成後，檢查以下目錄：

- [ ] `uploads/` - 應包含上傳的影片
- [ ] `storage/keyframes/` - 應包含提取的關鍵幀圖片
- [ ] `storage/audio/` - 應包含提取的音頻文件
- [ ] `storage/specs/` - 應包含生成的 Scene Spec JSON

## 🔍 Scene Spec 驗證

打開生成的 JSON 文件，確認包含：

- [ ] `video_id`
- [ ] `total_duration`
- [ ] `total_shots`
- [ ] `avg_shot_length`
- [ ] `scenes` 數組
- [ ] 每個 scene 包含：
  - [ ] `type` (hook, explanation, content, etc.)
  - [ ] `shot_type` (close_up, medium, wide, etc.)
  - [ ] `subject` (human_face, screen_ui, etc.)
  - [ ] `emotion` (curiosity, excitement, etc.)
  - [ ] `recommended_motion` (zoom_in, shake, etc.)
  - [ ] `importance` (1-10)
  - [ ] `tags` 數組

## 🐛 常見問題排查

### Python 服務無法啟動
```bash
# 檢查 Python 版本
python --version

# 重新安裝依賴
cd python-service
pip install --upgrade -r requirements.txt
```

### FFmpeg 錯誤
```bash
# 檢查 FFmpeg 是否安裝
ffmpeg -version
ffprobe -version

# Windows: 在 .env 中指定完整路徑
FFMPEG_PATH=C:/ffmpeg/bin/ffmpeg.exe
FFPROBE_PATH=C:/ffmpeg/bin/ffprobe.exe
```

### Vision API 錯誤
- [ ] 確認 API key 正確
- [ ] 檢查 API 額度
- [ ] 查看 Node.js 服務日誌中的錯誤信息

### 處理速度慢
這是正常的！每個關鍵幀需要調用 Vision API（約 1-2 秒/幀）。

優化建議：
- 使用本地 Vision 模型（如 LLaVA）
- 減少每個 shot 的關鍵幀數量
- 調整 `visionAnalysis.service.js` 中的延遲時間

## 📊 性能基準

典型的 20 秒短影片：
- 分鏡數：8-12 個
- 關鍵幀：8-12 張
- 處理時間：1-2 分鐘
- 輸出 JSON：約 5-10 KB

## 🎯 下一步

- [ ] 閱讀 `README.md` 了解系統架構
- [ ] 查看 `examples/scene-spec-example.json` 了解輸出格式
- [ ] 修改 `src/services/sceneBuilder.service.js` 自定義規則
- [ ] 嘗試不同類型的影片（教學、vlog、產品介紹等）

## 📝 開發建議

### 自定義規則引擎
編輯 `src/services/sceneBuilder.service.js`：

```javascript
// 添加新的場景類型判斷規則
const determineSceneType = (duration, semantic, avgShotLength) => {
  // 你的自定義邏輯
  if (/* 你的條件 */) {
    return 'your_scene_type';
  }
  // ...
};
```

### 更換 Vision API
編輯 `src/services/visionAnalysis.service.js`：

```javascript
// 修改 API URL 和請求格式
const VISION_API_URL = 'your-api-url';
// 調整請求 payload
```

### 添加新的分析維度
在 `visionAnalysis.service.js` 中添加新的 enum：

```javascript
export const YourNewEnum = z.enum(['option1', 'option2', 'option3']);
```

## ✨ 完成！

如果所有檢查項都通過，恭喜你！系統已經可以正常使用了。

開始分析你的第一個影片吧！🎬
