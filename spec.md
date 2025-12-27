你現在的前提是：
影片生成先擱置（不管是逐 scene image→video，還是一口氣 video model），
你要先把「分析與結構化」這一側完整做出來。

這個決策是對的，而且是工程上最聰明的切法。

一、先校正一個關鍵認知（很重要）

你現在要開發的不是「AI 影片工具」，而是：

Short Video → Scene Blueprint Engine

也就是：
把任何短影片，轉成「可以重播、可以套模板、可以生成」的結構描述

這個東西本身就能：

當教學工具

當內容工廠的前置

當 prompt generator

當 SaaS API

二、你現在要做的「完整開發範圍」
❌ 暫時不做

影片生成

motion 渲染

真正剪片

✅ 你要做的是
影片 → 分鏡 → 語義 → 節奏 → Scene Spec（JSON）

三、Node.js 系統模組拆解（實戰版）

我直接用工程 repo 結構來講。

1️⃣ Video Ingest（影片輸入層）

目標

能穩定接收影片

不要碰內容理解

功能

接收 upload / URL

存到 object storage

取得 metadata

Node 技術

multer

ffprobe

POST /videos
→ { videoId, duration, fps, width, height }


你此階段不需要

encode

transcode

preview

2️⃣ Shot Boundary Detection（分鏡切割）

這層 Node 不跑模型，只做 orchestration。

實作方式（建議）

起一個 Python microservice

PySceneDetect

Node 丟影片 URL

Python 回傳時間段

[
  { "shot": 1, "start": 0.0, "end": 2.1 },
  { "shot": 2, "start": 2.1, "end": 4.8 }
]


Node 職責：

retry

timeout

schema validation

👉 這一層你不用想 AI prompt

3️⃣ Keyframe Extractor（畫面抽樣）

目的
不是還原畫面，是為了「語義判斷」。

策略

每個 shot 抽 1～2 張 keyframe

中間點即可

ffmpeg -ss 3.2 -i video.mp4 -frames:v 1 frame.jpg


Node 做：

排程

命名

關聯 shotId

4️⃣ Vision Semantic Analysis（畫面語義）

這一層是「看起來像 AI，其實是結構分類器」。

你要問的不是自由問題，而是「封閉題」

❌ 不要問：

「這畫面在幹嘛？」

✅ 你要問：

請用下列 enum 回答，不要解釋：

1. 鏡頭類型：
[close_up, medium, wide, screen, broll]

2. 主體：
[human_face, human_body, screen_ui, object, text_only]

3. 是否有字幕：
[none, short_hook, sentence, paragraph]

4. 視覺情緒：
[curiosity, excitement, explanation, tension, calm]

5. 畫面動態感：
[static, slight_motion, strong_motion]


Node.js 的真正任務：

控 prompt

把回答 強制轉 enum

有不合法就重問

👉 這是產品價值核心之一

5️⃣ Audio / Rhythm Analyzer（節奏層）

你這階段 不需要理解語音內容。

只做「剪接感」。

可用資訊

音量變化（RMS）

靜音區段

剪接頻率

輸出像這樣：

{
  "beat_drop_at": [1.8],
  "silence_segments": [[6.2, 6.6]],
  "energy_curve": "high_to_low"
}

6️⃣ Scene Spec Builder（最重要）

這個 module 100% 由你主導，不是 AI。

合成規則（範例）

shot < 2.5s → hook 或 emphasis

有 beat_drop → 適合 cut

close_up + text → hook scene

screen + medium → explanation scene

function buildSceneSpec(shots): SceneSpec


輸出：

{
  "total_duration": 23.1,
  "avg_shot_length": 2.3,
  "scenes": [
    {
      "type": "hook",
      "shot_type": "close_up",
      "text_density": "low",
      "emotion": "curiosity",
      "recommended_motion": "zoom_in"
    },
    {
      "type": "explanation",
      "shot_type": "screen",
      "emotion": "calm"
    }
  ]
}


👉 這份 JSON 就是你未來接 Image→Video 的接口

