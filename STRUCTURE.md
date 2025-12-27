# 項目結構

```
inovid/
├── src/
│   ├── index.js                    # 主應用入口
│   ├── config/
│   │   └── upload.config.js        # Multer 上傳配置
│   ├── middleware/
│   │   └── errorHandler.js         # 錯誤處理中間件
│   ├── routes/
│   │   └── video.routes.js         # API 路由
│   ├── services/
│   │   ├── videoProcessing.service.js    # 主要業務邏輯
│   │   ├── shotDetection.service.js      # 分鏡檢測客戶端
│   │   ├── keyframe.service.js           # 關鍵幀提取
│   │   ├── visionAnalysis.service.js     # 視覺語義分析 ⭐
│   │   ├── rhythmAnalysis.service.js     # 節奏分析
│   │   └── sceneBuilder.service.js       # Scene Spec Builder ⭐⭐
│   └── utils/
│       └── ffmpeg.utils.js         # FFmpeg 工具函數
├── python-service/
│   ├── app.py                      # Python Flask 微服務
│   └── requirements.txt            # Python 依賴
├── test/
│   └── process-example.js          # 測試腳本
├── examples/
│   └── scene-spec-example.json     # 範例輸出
├── uploads/                        # 上傳的影片（gitignored）
├── storage/                        # 生成的文件（gitignored）
│   ├── keyframes/                  # 關鍵幀圖片
│   ├── audio/                      # 提取的音頻
│   └── specs/                      # Scene Spec JSON
├── .env.example                    # 環境變量範例
├── .gitignore
├── package.json
├── start.sh                        # Linux/Mac 啟動腳本
├── start.bat                       # Windows 啟動腳本
├── spec.md                         # 原始規格文檔
└── README.md                       # 項目文檔
```

## 核心模組說明

### ⭐ Vision Analysis Service
- 使用封閉式問題（enum）強制分類
- 包含重試和驗證邏輯
- 這是產品價值核心之一

### ⭐⭐ Scene Builder Service
- 100% 規則引擎（不依賴 AI）
- 合成所有分析結果
- 生成結構化 Scene Spec
- 這是最重要的模組

## 數據流

```
Video Upload
    ↓
Metadata Extraction (FFprobe)
    ↓
Shot Detection (Python/PySceneDetect)
    ↓
Keyframe Extraction (FFmpeg)
    ↓
Vision Analysis (GPT-4 Vision)
    ↓
Rhythm Analysis (FFmpeg Audio)
    ↓
Scene Spec Builder (Rules Engine)
    ↓
JSON Output
```
