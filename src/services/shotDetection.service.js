import axios from 'axios';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';
const MAX_RETRIES = 3;
const TIMEOUT = 60000; // 60 seconds

// Schema 驗證
const ShotSchema = z.object({
    shot: z.number(),
    start: z.number(),
    end: z.number()
});

const ShotsResponseSchema = z.array(ShotSchema);

/**
 * 調用 Python microservice 進行分鏡檢測
 * @param {string} videoPath - 影片路徑或 URL
 * @returns {Promise<Array>} - 分鏡時間段數組
 */
export const detectShotBoundaries = async (videoPath, retries = 0) => {
    try {
        const response = await axios.post(
            `${PYTHON_SERVICE_URL}/detect-shots`,
            { video_path: videoPath },
            {
                timeout: TIMEOUT,
                headers: { 'Content-Type': 'application/json' }
            }
        );

        // Schema 驗證
        const validatedShots = ShotsResponseSchema.parse(response.data.shots);

        return validatedShots;
    } catch (error) {
        // Retry 邏輯
        if (retries < MAX_RETRIES) {
            console.log(`Retrying shot detection... (${retries + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
            return detectShotBoundaries(videoPath, retries + 1);
        }

        // 錯誤處理
        if (error.code === 'ECONNREFUSED') {
            throw new AppError('Python service is not available', 503);
        }
        if (error.name === 'ZodError') {
            throw new AppError('Invalid response from shot detection service', 500);
        }
        throw new AppError(`Shot detection failed: ${error.message}`, 500);
    }
};

/**
 * 檢查 Python service 健康狀態
 * @returns {Promise<boolean>}
 */
export const checkPythonServiceHealth = async () => {
    try {
        const response = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout: 5000 });
        return response.status === 200;
    } catch (error) {
        return false;
    }
};
