# 🏗️ Inovid 系統架構

## 整體架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐              ┌─────────────────────────────┐  │
│  │  Web UI      │              │  API Clients                │  │
│  │  (HTML/JS)   │              │  (cURL, Postman, etc.)      │  │
│  └──────┬───────┘              └─────────────┬───────────────┘  │
│         │                                    │                   │
│         └────────────────┬───────────────────┘                   │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NODE.JS MAIN SERVICE                        │
│                      (Port 3000)                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  API Routes Layer                                         │  │
│  │  • POST /api/videos    (Upload & Process)                │  │
│  │  • GET  /api/videos    (List All)                        │  │
│  │  • GET  /api/videos/:id (Get Scene Spec)                 │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────▼─────────────────────────────────┐  │
│  │  Video Processing Service (Orchestrator)                  │  │
│  │  • Coordinates all analysis steps                         │  │
│  │  • Manages workflow and error handling                    │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                 │
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐        │
│  │  Keyframe   │  │  Vision     │  │  Rhythm          │        │
│  │  Service    │  │  Analysis   │  │  Analysis        │        │
│  │             │  │  Service    │  │  Service         │        │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘        │
│         │                │                   │                  │
│         │                │                   │                  │
│         │         ┌──────▼───────┐           │                  │
│         │         │  OpenAI      │           │                  │
│         │         │  GPT-4       │           │                  │
│         │         │  Vision API  │           │                  │
│         │         └──────────────┘           │                  │
│         │                                    │                  │
│         └──────────────┬─────────────────────┘                  │
│                        │                                        │
│                        ▼                                        │
│         ┌──────────────────────────────────┐                   │
│         │  Scene Spec Builder              │                   │
│         │  (Rules Engine - 100% Logic)     │                   │
│         │  • Combines all analysis         │                   │
│         │  • Applies business rules        │                   │
│         │  • Generates structured JSON     │                   │
│         └──────────────┬───────────────────┘                   │
│                        │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌──────────────┐  ┌─────────────┐
│  FFmpeg     │  │  Python      │  │  Storage    │
│  (Video     │  │  Service     │  │  Layer      │
│  Processing)│  │  (Port 5000) │  │             │
└─────────────┘  └──────────────┘  └─────────────┘
```

## 數據流程圖

```
1. VIDEO UPLOAD
   │
   ├─→ Multer receives file
   ├─→ Save to uploads/
   └─→ Trigger processing pipeline
       │
       ▼
2. METADATA EXTRACTION
   │
   ├─→ FFprobe analyzes video
   └─→ Extract: duration, fps, resolution, codec
       │
       ▼
3. SHOT DETECTION
   │
   ├─→ Send video path to Python service
   ├─→ PySceneDetect analyzes
   ├─→ Retry logic (max 3 attempts)
   └─→ Return: [{shot: 1, start: 0.0, end: 2.1}, ...]
       │
       ▼
4. KEYFRAME EXTRACTION
   │
   ├─→ For each shot, calculate midpoint
   ├─→ FFmpeg extracts frame at timestamp
   └─→ Save to storage/keyframes/
       │
       ▼
5. VISION ANALYSIS (封閉式問題)
   │
   ├─→ For each keyframe:
   │   ├─→ Convert to base64
   │   ├─→ Send to GPT-4 Vision with enum prompt
   │   ├─→ Parse and validate response (Zod)
   │   └─→ Retry if invalid (max 2 retries)
   │
   └─→ Return: [{shot_type, subject, emotion, ...}, ...]
       │
       ▼
6. RHYTHM ANALYSIS
   │
   ├─→ FFmpeg extracts audio
   ├─→ Analyze volume (RMS)
   ├─→ Detect silence segments
   ├─→ Detect beat drops
   └─→ Calculate energy curve
       │
       ▼
7. SCENE SPEC BUILDER (規則引擎)
   │
   ├─→ Combine: shots + semantics + rhythm
   ├─→ Apply rules:
   │   ├─→ Determine scene type
   │   ├─→ Recommend motion
   │   ├─→ Calculate importance
   │   └─→ Generate tags
   │
   └─→ Output: Scene Spec JSON
       │
       ▼
8. SAVE & RETURN
   │
   ├─→ Save JSON to storage/specs/
   └─→ Return to client
```

## 模組依賴關係

```
videoProcessing.service.js (主協調器)
    │
    ├─→ shotDetection.service.js
    │       └─→ Python Service (PySceneDetect)
    │
    ├─→ keyframe.service.js
    │       └─→ ffmpeg.utils.js (FFmpeg)
    │
    ├─→ visionAnalysis.service.js
    │       └─→ OpenAI Vision API
    │
    ├─→ rhythmAnalysis.service.js
    │       └─→ ffmpeg.utils.js (FFmpeg)
    │
    └─→ sceneBuilder.service.js (純邏輯，無外部依賴)
```

## 規則引擎邏輯流程

```
Scene Spec Builder
    │
    ├─→ determineSceneType()
    │   ├─→ IF duration < 2.5s
    │   │   └─→ IF close_up + text → "hook"
    │   │   └─→ ELSE → "emphasis"
    │   ├─→ IF close_up + text → "hook"
    │   ├─→ IF screen OR screen_ui → "explanation"
    │   ├─→ IF wide → "establishing"
    │   ├─→ IF broll → "transition"
    │   └─→ ELSE → "content"
    │
    ├─→ recommendMotion()
    │   ├─→ IF close_up + curiosity → "zoom_in"
    │   ├─→ IF excitement → "shake" OR "quick_zoom"
    │   ├─→ IF wide + calm → "slow_pan"
    │   ├─→ IF has beat_drop → "punch_in"
    │   ├─→ IF screen → "none"
    │   └─→ ELSE → "subtle_zoom"
    │
    ├─→ calculateImportance()
    │   ├─→ Base score: 5
    │   ├─→ IF hook → +3
    │   ├─→ IF has subtitle → +2
    │   ├─→ IF close_up → +1
    │   ├─→ IF excitement/tension → +1
    │   └─→ IF short duration → +1
    │
    └─→ generateTags()
        ├─→ Add scene type
        ├─→ IF duration < 2s → "fast_paced"
        ├─→ IF duration > 5s → "slow_paced"
        ├─→ IF has text → "has_text"
        ├─→ IF human_face → "talking_head"
        └─→ IF screen → "screen_recording"
```

## 錯誤處理策略

```
Each Service Layer:
    │
    ├─→ Retry Logic
    │   ├─→ Shot Detection: 3 retries with backoff
    │   ├─→ Vision Analysis: 2 retries for invalid responses
    │   └─→ Timeout: 30-60 seconds
    │
    ├─→ Validation
    │   ├─→ Zod schema validation
    │   └─→ Type checking
    │
    └─→ Graceful Degradation
        ├─→ Vision API fails → Use default values
        ├─→ Rhythm analysis fails → Return empty data
        └─→ Continue processing other shots
```

## 存儲結構

```
inovid/
├── uploads/                    # 原始上傳影片
│   └── [uuid].mp4
│
├── storage/
│   ├── keyframes/             # 提取的關鍵幀
│   │   └── [videoId]_shot[N]_[uuid].jpg
│   │
│   ├── audio/                 # 提取的音頻
│   │   └── [videoId].wav
│   │
│   └── specs/                 # 生成的 Scene Spec
│       └── [videoId].json
```

## API 端點詳細

```
POST /api/videos
├─→ Input: multipart/form-data (video file)
├─→ Process: Full pipeline (6 steps)
└─→ Output: {
      success: true,
      data: {
        videoId: "...",
        sceneSpec: { ... },
        stats: { ... }
      }
    }

GET /api/videos
├─→ Input: None
└─→ Output: {
      success: true,
      count: N,
      data: [{ videoId, duration, shots, generatedAt }, ...]
    }

GET /api/videos/:videoId
├─→ Input: videoId (URL param)
└─→ Output: {
      success: true,
      data: { ...sceneSpec }
    }
```

---

這個架構設計的核心理念：

1. **關注點分離**：每個服務只負責一件事
2. **可測試性**：每個模組可獨立測試
3. **可擴展性**：易於添加新的分析維度
4. **確定性**：規則引擎 100% 可預測
5. **容錯性**：多層錯誤處理和降級策略
