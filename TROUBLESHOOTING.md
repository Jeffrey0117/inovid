# 🐛 故障排除指南

## 常見問題和解決方案

### 1. Python 服務 404 錯誤

**錯誤信息**: `Shot detection failed: Request failed with status code 404`

**原因**: 
- Python 服務沒有正常啟動
- numpy/opencv 版本不兼容

**解決方案**:
```bash
# 1. 重新安裝 Python 依賴
cd python-service
pip uninstall -y numpy opencv-python
pip install numpy opencv-python

# 2. 重新啟動 Python 服務
python app.py
```

### 2. Python 服務無法連接

**錯誤信息**: `Python service is not available`

**解決方案**:
```bash
# 檢查 Python 服務是否運行
curl http://localhost:5000/health

# 如果沒有響應，重新啟動服務
cd python-service
python app.py
```

### 3. 路徑問題

**錯誤信息**: `Video file not found`

**原因**: 文件路徑不正確

**解決方案**: 
- ✅ 已修復：系統現在自動將相對路徑轉換為絕對路徑
- 確保上傳的文件存在於 `uploads/` 目錄

### 4. Vision API 錯誤

**錯誤信息**: `Vision analysis failed` 或 API 相關錯誤

**解決方案**:
```bash
# 1. 確保 .env 文件中配置了 API Key
VISION_API_KEY=sk-your-openai-key-here

# 2. 檢查 API 額度
# 訪問 OpenAI 控制台確認

# 3. 重啟 Node.js 服務
# 關閉並重新運行 npm run dev
```

### 5. FFmpeg 錯誤

**錯誤信息**: `ffmpeg/ffprobe not found`

**解決方案**:

**Windows**:
1. 下載 FFmpeg: https://www.gyan.dev/ffmpeg/builds/
2. 解壓到 `C:\ffmpeg`
3. 添加到 PATH 或在 `.env` 中配置:
```env
FFMPEG_PATH=C:/ffmpeg/bin/ffmpeg.exe
FFPROBE_PATH=C:/ffmpeg/bin/ffprobe.exe
```

**Mac**:
```bash
brew install ffmpeg
```

**Linux**:
```bash
sudo apt install ffmpeg
```

### 6. 端口被占用

**錯誤信息**: `Port 3000/5000 already in use`

**解決方案**:

**Windows**:
```powershell
# 查找占用端口的進程
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# 結束進程（替換 PID）
taskkill /PID <PID> /F
```

**Linux/Mac**:
```bash
# 查找並結束進程
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

### 7. 處理速度慢

**原因**: Vision API 調用需要時間

**優化建議**:
1. 減少關鍵幀數量（修改 `keyframe.service.js`）
2. 使用本地 Vision 模型（如 LLaVA）
3. 調整 API 調用延遲（修改 `visionAnalysis.service.js`）

### 8. Node.js 依賴問題

**錯誤信息**: `Cannot find module` 或類似錯誤

**解決方案**:
```bash
# 刪除並重新安裝依賴
rm -rf node_modules package-lock.json
npm install
```

## 檢查服務狀態

### Python 服務健康檢查
```bash
curl http://localhost:5000/health
# 應返回: {"status": "ok", "service": "shot-detection"}
```

### Node.js 服務健康檢查
```bash
curl http://localhost:3000/health
# 應返回: {"status": "ok", "service": "inovid-scene-blueprint-engine"}
```

## 日誌查看

### Python 服務日誌
- 查看運行 Python 服務的終端窗口
- 會顯示 Flask 請求日誌和錯誤信息

### Node.js 服務日誌
- 查看運行 Node.js 服務的終端窗口
- 會顯示處理進度和錯誤信息

## 完整重啟流程

如果遇到問題，嘗試完整重啟：

```bash
# 1. 停止所有服務（關閉所有終端窗口）

# 2. 清理並重新安裝依賴
npm install
cd python-service
pip install -r requirements.txt
cd ..

# 3. 確保 .env 配置正確
# 編輯 .env 文件，填入 API Key

# 4. 重新啟動服務
# Windows:
start.bat

# Linux/Mac:
./start.sh
```

## 需要幫助？

如果以上方法都無法解決問題：

1. 查看終端日誌中的詳細錯誤信息
2. 檢查 `storage/` 目錄中的生成文件
3. 確認所有依賴都已正確安裝
4. 在 GitHub Issues 中報告問題

---

**最近更新**: 2025-12-28
- ✅ 修復路徑問題：自動轉換為絕對路徑
- ✅ 改進錯誤處理
- ✅ 添加更詳細的日誌
