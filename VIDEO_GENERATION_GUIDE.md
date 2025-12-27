# 🎬 影片生成指南 - 使用 Google Veo

## 概述

現在你可以使用 Scene Spec JSON 來生成影片！系統會：
1. 將每個場景轉換為優化的 Veo prompt
2. 調用 Google Veo API 生成影片片段
3. 返回生成的影片 URL

## 🚀 快速開始

### 1. 配置 Veo API Key

在 `.env` 文件中添加：

```env
VEO_API_KEY=your_google_veo_api_key_here
VEO_API_URL=https://generativelanguage.googleapis.com/v1beta/models/veo-001:generateVideo
```

### 2. 工作流程

```
Scene Spec JSON
    ↓
生成 Veo Prompts
    ↓
調用 Veo API
    ↓
獲取生成的影片
```

## 📡 API 使用

### 步驟 1: 生成 Prompts（不調用 API）

```bash
POST /api/generate/prompts/:videoId
```

**範例**:
```bash
curl -X POST http://localhost:3000/api/generate/prompts/abc-123
```

**回應**:
```json
{
  "success": true,
  "data": {
    "videoId": "abc-123",
    "totalScenes": 10,
    "prompts": [
      {
        "sceneIndex": 1,
        "shotId": 1,
        "duration": 2.1,
        "prompt": "An attention-grabbing opening shot, filmed as a close-up shot, focusing on a person's face, with an intriguing and curious atmosphere, slowly zooming in. Duration: 2.1 seconds.",
        "importance": 8,
        "tags": ["hook", "fast_paced", "has_text"]
      }
    ]
  }
}
```

### 步驟 2: 生成影片（調用 Veo API）

```bash
POST /api/generate/video/:videoId
```

**範例 - 生成所有場景**:
```bash
curl -X POST http://localhost:3000/api/generate/video/abc-123
```

**範例 - 只生成特定場景**:
```bash
curl -X POST http://localhost:3000/api/generate/video/abc-123 \
  -H "Content-Type: application/json" \
  -d '{"sceneIndices": [1, 2, 3]}'
```

**回應**:
```json
{
  "success": true,
  "data": {
    "videoId": "abc-123",
    "totalScenes": 10,
    "successCount": 9,
    "failedCount": 1,
    "results": [
      {
        "sceneIndex": 1,
        "shotId": 1,
        "success": true,
        "videoUrl": "https://storage.googleapis.com/...",
        "status": "completed"
      }
    ]
  }
}
```

### 步驟 3: 查看生成狀態

```bash
GET /api/generate/status/:videoId
```

### 步驟 4: 獲取 Prompts

```bash
GET /api/generate/prompts/:videoId
```

## 🎨 Prompt 生成邏輯

系統會根據 Scene Spec 自動生成優化的 Veo prompts：

### 場景類型 → 描述
- `hook` → "An attention-grabbing opening shot"
- `explanation` → "A clear explanatory scene"
- `content` → "Main content presentation"
- `emphasis` → "An emphasized moment"

### 鏡頭類型 → 描述
- `close_up` → "close-up shot"
- `medium` → "medium shot"
- `wide` → "wide angle shot"
- `screen` → "screen recording style"

### 情緒 → 氛圍
- `curiosity` → "with an intriguing and curious atmosphere"
- `excitement` → "with energetic and exciting mood"
- `calm` → "with a peaceful and calm feeling"

### 動作 → 鏡頭運動
- `zoom_in` → "slowly zooming in"
- `shake` → "with dynamic camera shake"
- `slow_pan` → "with slow panning movement"

## 📝 完整範例

### 1. 先分析影片

```bash
# 上傳並分析影片
curl -X POST http://localhost:3000/api/videos \
  -F "video=@my-video.mp4"

# 回應會包含 videoId
# {"data": {"videoId": "abc-123", ...}}
```

### 2. 生成 Veo Prompts

```bash
curl -X POST http://localhost:3000/api/generate/prompts/abc-123
```

### 3. 查看生成的 Prompts

```bash
curl http://localhost:3000/api/generate/prompts/abc-123
```

### 4. 生成影片

```bash
# 生成所有場景
curl -X POST http://localhost:3000/api/generate/video/abc-123

# 或只生成重要場景（importance >= 7）
# 你需要先查看 prompts，找出重要場景的 index
curl -X POST http://localhost:3000/api/generate/video/abc-123 \
  -H "Content-Type: application/json" \
  -d '{"sceneIndices": [1, 3, 5]}'
```

### 5. 檢查生成狀態

```bash
curl http://localhost:3000/api/generate/status/abc-123
```

## 🎯 使用策略

### 策略 1: 先測試單個場景

```bash
# 只生成第一個場景測試
curl -X POST http://localhost:3000/api/generate/video/abc-123 \
  -H "Content-Type: application/json" \
  -d '{"sceneIndices": [1]}'
```

### 策略 2: 只生成重要場景

根據 `importance` 分數選擇：
- importance >= 8: 非常重要（hook, 關鍵時刻）
- importance >= 6: 重要（主要內容）
- importance < 6: 次要（可選）

### 策略 3: 分批生成

避免一次生成太多場景（API 限制和成本）：

```bash
# 第一批：場景 1-3
curl -X POST ... -d '{"sceneIndices": [1, 2, 3]}'

# 第二批：場景 4-6
curl -X POST ... -d '{"sceneIndices": [4, 5, 6]}'
```

## 📂 文件結構

生成的文件會保存在：

```
storage/
├── specs/                    # Scene Spec JSON
│   └── abc-123.json
├── veo-prompts/             # 生成的 Veo prompts
│   └── abc-123-prompts.json
└── generated-videos/        # 生成結果
    └── abc-123-results.json
```

## 🔧 自定義 Prompts

如果你想自定義 prompt 生成邏輯，編輯：

`src/services/videoGeneration.service.js` 中的 `buildVeoPrompt()` 函數

範例：
```javascript
// 添加更多細節
parts.push('cinematic lighting');
parts.push('4K quality');
parts.push('professional color grading');
```

## ⚠️ 注意事項

### API 限制
- Veo API 可能有 rate limits
- 系統會在每個請求之間延遲 2 秒
- 建議分批生成，不要一次生成太多

### 成本考慮
- 每個場景生成都會消耗 API 額度
- 先生成 prompts 查看，再決定生成哪些場景
- 優先生成高 importance 的場景

### 時長限制
- Veo 可能對單個片段時長有限制
- 系統會自動調整為整數秒

## 🎬 下一步：合併影片

生成所有場景後，你可以：

1. **手動合併**: 下載所有影片片段，用剪輯軟件合併
2. **使用 FFmpeg**: 自動合併（未來功能）
3. **使用雲端服務**: 如 Cloudinary, AWS MediaConvert

## 📊 範例 Prompt 輸出

```json
{
  "sceneIndex": 1,
  "prompt": "An attention-grabbing opening shot, filmed as a close-up shot, focusing on a person's face, with an intriguing and curious atmosphere, slowly zooming in. Duration: 2.1 seconds.",
  "duration": 2.1,
  "importance": 8
}
```

這個 prompt 會生成：
- ✅ 特寫鏡頭
- ✅ 聚焦人臉
- ✅ 好奇的氛圍
- ✅ 緩慢推進
- ✅ 2.1 秒時長

---

**開始使用 Veo 生成你的第一個場景吧！** 🚀
