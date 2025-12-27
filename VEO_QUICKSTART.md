# 🎬 Scene Spec → Veo 影片生成 - 快速開始

## 📋 你現在有什麼

✅ **Scene Spec JSON** - 結構化的影片描述  
✅ **Veo Prompt Generator** - 自動生成優化的 prompts  
✅ **API 端點** - 調用 Google Veo 生成影片  
✅ **CLI 工具** - 命令行快速生成

## 🚀 三種使用方式

### 方式 1: 使用 API（推薦）

```bash
# 步驟 1: 生成 prompts（不調用 Veo，只生成 JSON）
curl -X POST http://localhost:3000/api/generate/prompts/your-video-id

# 步驟 2: 查看生成的 prompts
curl http://localhost:3000/api/generate/prompts/your-video-id

# 步驟 3: 生成影片（調用 Veo API）
curl -X POST http://localhost:3000/api/generate/video/your-video-id

# 步驟 4: 查看生成狀態
curl http://localhost:3000/api/generate/status/your-video-id
```

### 方式 2: 使用 CLI 工具

```bash
# 從 Scene Spec 生成 prompts
node tools/generate-prompts.js storage/specs/your-video-id.json

# 會顯示所有 prompts 並保存到 storage/veo-prompts/
```

### 方式 3: 只生成重要場景

```bash
# 只生成 importance >= 8 的場景
curl -X POST http://localhost:3000/api/generate/video/your-video-id \
  -H "Content-Type: application/json" \
  -d '{"sceneIndices": [1, 3, 5]}'
```

## 📝 Prompt 範例

**輸入** (Scene Spec):
```json
{
  "shot_id": 1,
  "type": "hook",
  "shot_type": "close_up",
  "subject": "human_face",
  "emotion": "curiosity",
  "recommended_motion": "zoom_in",
  "duration": 2.1
}
```

**輸出** (Veo Prompt):
```
An attention-grabbing opening shot, filmed as a close-up shot, 
focusing on a person's face, with an intriguing and curious atmosphere, 
slowly zooming in. Duration: 2.1 seconds.
```

## 🎯 使用策略

### 策略 1: 先測試一個場景
```bash
# 只生成第一個場景
curl -X POST http://localhost:3000/api/generate/video/abc-123 \
  -H "Content-Type: application/json" \
  -d '{"sceneIndices": [1]}'
```

### 策略 2: 分批生成
```bash
# 第一批：重要場景（importance >= 8）
# 第二批：次要場景（importance >= 6）
# 第三批：其他場景
```

### 策略 3: 只生成關鍵場景
根據 `tags` 選擇：
- `hook` - 開場鉤子
- `has_text` - 有字幕的場景
- `talking_head` - 人物講話

## ⚙️ 配置

在 `.env` 文件中添加：

```env
# Google Veo API
VEO_API_KEY=your_google_veo_api_key_here
VEO_API_URL=https://generativelanguage.googleapis.com/v1beta/models/veo-001:generateVideo
```

## 📂 生成的文件

```
storage/
├── specs/                      # 原始 Scene Spec
│   └── abc-123.json
├── veo-prompts/               # 生成的 Veo prompts
│   └── abc-123-prompts.json
└── generated-videos/          # 生成結果
    └── abc-123-results.json
```

## 🔧 自定義 Prompts

編輯 `src/services/videoGeneration.service.js` 中的 `buildVeoPrompt()` 函數：

```javascript
// 添加更多細節
parts.push('cinematic lighting');
parts.push('professional color grading');
parts.push('shallow depth of field');
```

## 💡 完整工作流程

```
1. 上傳影片
   ↓
2. 分析生成 Scene Spec
   ↓
3. 生成 Veo Prompts
   ↓
4. 查看並選擇要生成的場景
   ↓
5. 調用 Veo API 生成影片
   ↓
6. 下載生成的影片片段
   ↓
7. 合併成完整影片
```

## ⚠️ 注意事項

1. **API 限制**: Veo API 可能有 rate limits，系統會自動延遲
2. **成本**: 每個場景生成都會消耗 API 額度
3. **時長**: Veo 可能對單個片段時長有限制
4. **質量**: 先測試單個場景，確認效果後再批量生成

## 📊 範例輸出

**Prompts JSON**:
```json
{
  "videoId": "abc-123",
  "totalScenes": 10,
  "prompts": [
    {
      "sceneIndex": 1,
      "prompt": "An attention-grabbing opening shot...",
      "duration": 2.1,
      "importance": 8
    }
  ]
}
```

**Generation Results**:
```json
{
  "videoId": "abc-123",
  "successCount": 9,
  "results": [
    {
      "sceneIndex": 1,
      "success": true,
      "videoUrl": "https://storage.googleapis.com/..."
    }
  ]
}
```

## 🎬 下一步

1. **測試 Prompt 生成**: 使用 CLI 工具查看生成的 prompts
2. **配置 Veo API**: 獲取 API key 並添加到 `.env`
3. **生成第一個場景**: 測試單個場景的效果
4. **批量生成**: 生成所有重要場景
5. **合併影片**: 使用 FFmpeg 或剪輯軟件合併

---

**詳細文檔**: 查看 `VIDEO_GENERATION_GUIDE.md`

**現在就開始生成你的第一個 Veo prompt 吧！** 🚀
