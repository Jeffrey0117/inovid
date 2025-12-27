# 🎬 Inovid - Scene Blueprint Engine

> 將短影片轉換成可重播、可套模板的結構化描述

## 📖 概述

Inovid 不是一個「AI 影片工具」，而是一個 **Short Video → Scene Blueprint Engine**。

它能將任何短影片分析並轉換成結構化的 JSON 描述，包含：
- 🎞️ 分鏡切割
- 🖼️ 畫面語義（鏡頭類型、主體、情緒等）
- 🎵 節奏分析（beat drops、靜音區段、能量曲線）
- 🏗️ 場景規格（可用於模板套用、內容生成）

## 🎯 應用場景

- ✅ 教學工具
- ✅ 內容工廠的前置分析
- ✅ Prompt Generator
- ✅ SaaS API

## 🏗️ 系統架構

```
┌─────────────────┐
│  Video Upload   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Video Metadata  │ ◄── FFprobe
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Shot Detection  │ ◄── Python (PySceneDetect)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Keyframe Extract│ ◄── FFmpeg
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Vision Analysis │ ◄── GPT-4 Vision (封閉式問題)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Rhythm Analysis │ ◄── FFmpeg Audio Analysis
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Scene Spec      │ ◄── 規則引擎（100% 確定性）
│   Builder       │
└─────────────────┘
         │
         ▼
    📄 JSON Output
```

## 🚀 快速開始

### 前置需求

- Node.js 18+
- Python 3.8+
- FFmpeg
- OpenAI API Key（用於 Vision Analysis）

### 安裝

1. **安裝 Node.js 依賴**
```bash
npm install
```

2. **設置環境變量**
```bash
cp .env.example .env
# 編輯 .env 文件，填入你的 API keys
```

3. **安裝 Python 服務依賴**
```bash
cd python-service
pip install -r requirements.txt
```

### 運行

1. **啟動 Python 微服務**（分鏡檢測）
```bash
cd python-service
python app.py
# 運行在 http://localhost:5000
```

2. **啟動 Node.js 主服務**
```bash
npm run dev
# 運行在 http://localhost:3000
```

## 📡 API 使用

### 1. 上傳並處理影片

```bash
POST /api/videos
Content-Type: multipart/form-data

{
  "video": <file>
}
```

**回應範例：**
```json
{
  "success": true,
  "data": {
    "videoId": "abc-123",
    "sceneSpec": { ... },
    "stats": {
      "totalShots": 12,
      "totalDuration": 23.5,
      "avgShotLength": 1.96
    }
  }
}
```

### 2. 獲取 Scene Spec

```bash
GET /api/videos/:videoId
```

### 3. 列出所有已處理影片

```bash
GET /api/videos
```

## 📊 Scene Spec 格式

```json
{
  "video_id": "abc-123",
  "total_duration": 23.1,
  "total_shots": 10,
  "avg_shot_length": 2.3,
  "cut_frequency": 0.43,
  "overall_energy": "high_to_low",
  "scenes": [
    {
      "shot_id": 1,
      "start": 0.0,
      "end": 2.1,
      "duration": 2.1,
      "type": "hook",
      "shot_type": "close_up",
      "subject": "human_face",
      "text_density": "short_hook",
      "emotion": "curiosity",
      "motion_level": "slight_motion",
      "recommended_motion": "zoom_in",
      "importance": 8,
      "is_cut_point": true,
      "tags": ["hook", "fast_paced", "has_text"]
    }
  ]
}
```

## 🧩 模組說明

### 1️⃣ Video Ingest
- 接收影片上傳
- 提取 metadata（duration, fps, resolution）
- 使用 `multer` + `ffprobe`

### 2️⃣ Shot Boundary Detection
- Python 微服務
- 使用 PySceneDetect
- Node.js 負責 orchestration、retry、validation

### 3️⃣ Keyframe Extractor
- 每個 shot 抽取 1-2 張關鍵幀
- 用於語義判斷
- FFmpeg 提取

### 4️⃣ Vision Semantic Analysis ⭐
- **核心價值模組**
- 使用封閉式問題（enum）
- 強制分類：shot_type, subject, subtitle, emotion, motion
- 包含重試和驗證邏輯

### 5️⃣ Audio/Rhythm Analyzer
- 音量變化（RMS）
- 靜音區段檢測
- Beat drops 檢測
- 能量曲線判斷

### 6️⃣ Scene Spec Builder ⭐⭐
- **最重要的模組**
- 100% 規則引擎（不依賴 AI）
- 合成所有分析結果
- 輸出結構化 JSON

## 🎯 規則引擎範例

```javascript
// 規則：shot < 2.5s → hook 或 emphasis
if (duration < 2.5) {
  return semantic.shot_type === 'close_up' ? 'hook' : 'emphasis';
}

// 規則：close_up + text → hook scene
if (semantic.shot_type === 'close_up' && semantic.subtitle !== 'none') {
  return 'hook';
}

// 規則：screen + medium → explanation scene
if (semantic.shot_type === 'screen') {
  return 'explanation';
}
```

## 🔧 配置

在 `.env` 文件中配置：

```env
# Server
PORT=3000

# Storage
UPLOAD_DIR=./uploads
STORAGE_DIR=./storage

# Python Service
PYTHON_SERVICE_URL=http://localhost:5000

# Vision API
VISION_API_KEY=your_openai_api_key
VISION_MODEL=gpt-4-vision-preview
```

## 📝 開發計劃

### ✅ 已完成
- [x] 影片輸入層
- [x] 分鏡檢測
- [x] 關鍵幀提取
- [x] 視覺語義分析
- [x] 節奏分析
- [x] Scene Spec Builder

### 🚧 未來擴展
- [ ] URL 影片下載
- [ ] 批量處理
- [ ] WebSocket 進度通知
- [ ] 更精細的音頻分析
- [ ] 自定義規則引擎
- [ ] 影片生成接口（Image→Video）

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

ISC License

---

**Made with ❤️ for content creators**
