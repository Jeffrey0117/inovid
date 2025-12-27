# 🎬 Inovid - 完整項目總覽

## 📊 項目狀態

✅ **開發完成** - 所有核心功能已實現  
✅ **已部署到 GitHub** - https://github.com/Jeffrey0117/inovid  
✅ **本地運行中** - http://localhost:3000  
✅ **Python 服務運行中** - http://localhost:5000

## 🏗️ 系統架構

```
影片上傳
    ↓
分析與結構化 (Scene Blueprint)
    ├─ 分鏡檢測 (Python/PySceneDetect)
    ├─ 關鍵幀提取 (FFmpeg)
    ├─ 視覺語義分析 (GPT-4 Vision)
    ├─ 節奏分析 (FFmpeg Audio)
    └─ Scene Spec Builder (規則引擎)
    ↓
Scene Spec JSON
    ↓
影片生成 (Google Veo)
    ├─ Prompt Generator
    ├─ Veo API 調用
    └─ 影片片段下載
```

## 📦 已完成的功能模組

### 階段 1: 分析與結構化 ✅

1. **Video Ingest** - 影片輸入層
   - 文件上傳 (Multer)
   - 元數據提取 (FFprobe)
   - 文件驗證

2. **Shot Detection** - 分鏡切割
   - Python 微服務 (Flask + PySceneDetect)
   - 自動重試機制
   - Schema 驗證

3. **Keyframe Extraction** - 關鍵幀提取
   - FFmpeg 提取
   - 支持單幀/多幀模式
   - 自動命名和關聯

4. **Vision Analysis** ⭐ - 視覺語義分析
   - 封閉式問題設計
   - 5 個維度分類（shot_type, subject, subtitle, emotion, motion）
   - 重試和驗證邏輯

5. **Rhythm Analysis** - 節奏分析
   - 音量變化檢測
   - 靜音區段識別
   - Beat drops 檢測
   - 能量曲線判斷

6. **Scene Spec Builder** ⭐⭐ - 規則引擎
   - 100% 確定性邏輯
   - 場景類型判斷
   - 動作推薦
   - 重要性評分
   - 標籤生成

### 階段 2: 影片生成 ✅

7. **Veo Prompt Generator** - Prompt 生成器
   - 自動轉換 Scene Spec → Veo Prompts
   - 優化的 prompt 模板
   - 支持所有場景類型

8. **Video Generation API** - 影片生成 API
   - Veo API 集成
   - 批量生成支持
   - 進度追蹤
   - 結果保存

9. **CLI Tools** - 命令行工具
   - Prompt 生成工具
   - 統計分析
   - 批量處理

## 📡 API 端點

### 影片分析 API

```
POST   /api/videos              # 上傳並分析影片
GET    /api/videos              # 列出所有已處理影片
GET    /api/videos/:videoId     # 獲取 Scene Spec
```

### 影片生成 API

```
POST   /api/generate/prompts/:videoId    # 生成 Veo prompts
POST   /api/generate/video/:videoId      # 生成影片
GET    /api/generate/status/:videoId     # 查看生成狀態
GET    /api/generate/prompts/:videoId    # 獲取 prompts
```

### 健康檢查

```
GET    /health                   # 主服務健康檢查
GET    http://localhost:5000/health  # Python 服務健康檢查
```

## 🎯 核心價值

### 1. 封閉式語義分析
不問「這畫面在幹嘛？」，而是強制分類到預定義的 enum：

```javascript
{
  "shot_type": "close_up",      // [close_up, medium, wide, screen, broll]
  "subject": "human_face",       // [human_face, human_body, screen_ui, object, text_only]
  "emotion": "curiosity",        // [curiosity, excitement, explanation, tension, calm]
  // ...
}
```

### 2. 規則引擎
100% 確定性，可預測、可調整：

```javascript
if (duration < 2.5 && shot_type === 'close_up') {
  sceneType = 'hook';
  recommendedMotion = 'zoom_in';
  importance = 8;
}
```

### 3. 結構化輸出
JSON 格式可直接用於：
- ✅ 模板套用
- ✅ Prompt 生成
- ✅ 內容分析
- ✅ SaaS API

## 📂 項目結構

```
inovid/
├── src/                          # Node.js 主服務
│   ├── services/                # 核心服務（9 個）
│   │   ├── videoProcessing.service.js
│   │   ├── shotDetection.service.js
│   │   ├── keyframe.service.js
│   │   ├── visionAnalysis.service.js
│   │   ├── rhythmAnalysis.service.js
│   │   ├── sceneBuilder.service.js
│   │   └── videoGeneration.service.js
│   ├── routes/                  # API 路由
│   │   ├── video.routes.js
│   │   └── generate.routes.js
│   ├── config/                  # 配置
│   ├── middleware/              # 中間件
│   └── utils/                   # 工具函數
├── python-service/              # Python 微服務
│   ├── app.py                   # Flask 應用
│   └── requirements.txt
├── public/                      # Web UI
│   └── index.html
├── tools/                       # CLI 工具
│   └── generate-prompts.js
├── storage/                     # 生成的文件
│   ├── specs/                   # Scene Spec JSON
│   ├── keyframes/               # 關鍵幀圖片
│   ├── audio/                   # 音頻文件
│   ├── veo-prompts/            # Veo prompts
│   └── generated-videos/        # 生成結果
└── docs/                        # 文檔（10 個）
    ├── README.md
    ├── QUICKSTART.md
    ├── ARCHITECTURE.md
    ├── VIDEO_GENERATION_GUIDE.md
    ├── VEO_QUICKSTART.md
    └── ...
```

## 🚀 使用流程

### 完整工作流程

```
1. 上傳影片
   curl -X POST http://localhost:3000/api/videos -F "video=@video.mp4"
   
2. 獲取 Scene Spec
   curl http://localhost:3000/api/videos/:videoId
   
3. 生成 Veo Prompts
   curl -X POST http://localhost:3000/api/generate/prompts/:videoId
   
4. 查看 Prompts
   curl http://localhost:3000/api/generate/prompts/:videoId
   
5. 生成影片
   curl -X POST http://localhost:3000/api/generate/video/:videoId
   
6. 查看結果
   curl http://localhost:3000/api/generate/status/:videoId
```

### Web UI 使用

1. 打開 http://localhost:3000
2. 拖放影片文件
3. 等待分析完成
4. 查看 Scene Spec JSON

## 📊 輸出範例

### Scene Spec JSON

```json
{
  "video_id": "abc-123",
  "total_duration": 23.1,
  "scenes": [
    {
      "shot_id": 1,
      "type": "hook",
      "shot_type": "close_up",
      "subject": "human_face",
      "emotion": "curiosity",
      "recommended_motion": "zoom_in",
      "importance": 8,
      "tags": ["hook", "fast_paced", "has_text"]
    }
  ]
}
```

### Veo Prompt

```json
{
  "sceneIndex": 1,
  "prompt": "An attention-grabbing opening shot, filmed as a close-up shot, focusing on a person's face, with an intriguing and curious atmosphere, slowly zooming in. Duration: 2.1 seconds.",
  "importance": 8
}
```

## ⚙️ 配置

### 環境變量 (.env)

```env
# Server
PORT=3000

# Python Service
PYTHON_SERVICE_URL=http://localhost:5000

# Vision AI (分析階段)
VISION_API_KEY=your_openai_api_key

# Google Veo (生成階段)
VEO_API_KEY=your_google_veo_api_key
VEO_API_URL=https://generativelanguage.googleapis.com/v1beta/models/veo-001:generateVideo
```

## 📈 技術指標

### 代碼統計
- **JavaScript 文件**: 15 個
- **Python 文件**: 1 個
- **總代碼行數**: ~2,000 行
- **文檔頁數**: 10 個

### 處理性能
- **20 秒影片**: 1-2 分鐘分析時間
- **分鏡數**: 8-12 個
- **關鍵幀**: 8-12 張
- **Scene Spec**: 5-10 KB JSON

### 依賴項
- **Node.js**: 7 個核心依賴
- **Python**: 3 個核心依賴
- **外部服務**: OpenAI Vision, Google Veo

## 🎓 學習價值

這個項目展示了：

1. **微服務架構** - Node.js + Python 協作
2. **AI 工程化** - 封閉式問題設計
3. **規則引擎** - 確定性 AI 系統
4. **流程編排** - 多步驟異步處理
5. **錯誤處理** - 重試、驗證、降級
6. **API 設計** - RESTful 最佳實踐

## 📝 文檔清單

1. **README.md** - 項目介紹和系統架構
2. **QUICKSTART.md** - 快速開始指南
3. **ARCHITECTURE.md** - 詳細架構圖
4. **STRUCTURE.md** - 項目結構說明
5. **PROJECT_SUMMARY.md** - 功能總結
6. **DELIVERY_REPORT.md** - 開發完成報告
7. **CHECKLIST.md** - 安裝測試清單
8. **TROUBLESHOOTING.md** - 故障排除
9. **VIDEO_GENERATION_GUIDE.md** - 影片生成詳細指南
10. **VEO_QUICKSTART.md** - Veo 快速開始

## 🔗 相關鏈接

- **GitHub**: https://github.com/Jeffrey0117/inovid
- **本地應用**: http://localhost:3000
- **Python 服務**: http://localhost:5000
- **API 文檔**: 查看 README.md

## 🎯 下一步發展

### 短期（已完成）
- [x] 影片分析與結構化
- [x] Scene Spec 生成
- [x] Veo Prompt 生成
- [x] Veo API 集成

### 中期（可選）
- [ ] WebSocket 進度通知
- [ ] 影片片段自動合併
- [ ] 批量處理優化
- [ ] Web UI 增強

### 長期（擴展）
- [ ] 支持更多 AI 模型
- [ ] 自定義規則配置 UI
- [ ] SaaS API 商業化
- [ ] 管理後台

---

**項目已完成並可立即使用！** 🎬✨

**GitHub**: https://github.com/Jeffrey0117/inovid  
**本地應用**: http://localhost:3000

所有代碼已推送，文檔齊全，隨時可以開始使用！
