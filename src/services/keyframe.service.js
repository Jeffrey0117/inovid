import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { extractKeyframe } from '../utils/ffmpeg.utils.js';

const KEYFRAMES_DIR = process.env.STORAGE_DIR
    ? path.join(process.env.STORAGE_DIR, 'keyframes')
    : './storage/keyframes';

// 確保目錄存在
await fs.mkdir(KEYFRAMES_DIR, { recursive: true });

/**
 * 從每個 shot 中提取關鍵幀
 * @param {string} videoPath - 影片路徑
 * @param {Array} shots - 分鏡數組
 * @param {string} videoId - 影片 ID
 * @returns {Promise<Array>} - 關鍵幀信息數組
 */
export const extractKeyframes = async (videoPath, shots, videoId) => {
    const keyframes = [];

    for (const shot of shots) {
        // 計算中間點時間戳
        const midpoint = (shot.start + shot.end) / 2;

        // 生成輸出文件名
        const filename = `${videoId}_shot${shot.shot}_${uuidv4()}.jpg`;
        const outputPath = path.join(KEYFRAMES_DIR, filename);

        try {
            // 提取關鍵幀
            await extractKeyframe(videoPath, midpoint, outputPath);

            keyframes.push({
                shotId: shot.shot,
                timestamp: midpoint,
                path: outputPath,
                filename,
                shotStart: shot.start,
                shotEnd: shot.end
            });

            console.log(`✅ Extracted keyframe for shot ${shot.shot} at ${midpoint.toFixed(2)}s`);
        } catch (error) {
            console.error(`❌ Failed to extract keyframe for shot ${shot.shot}:`, error.message);
            // 繼續處理其他 shots，不中斷整個流程
        }
    }

    return keyframes;
};

/**
 * 提取多個關鍵幀（可選：每個 shot 提取 2 幀）
 * @param {string} videoPath - 影片路徑
 * @param {Array} shots - 分鏡數組
 * @param {string} videoId - 影片 ID
 * @param {number} framesPerShot - 每個 shot 提取的幀數
 * @returns {Promise<Array>}
 */
export const extractMultipleKeyframes = async (videoPath, shots, videoId, framesPerShot = 2) => {
    const keyframes = [];

    for (const shot of shots) {
        const duration = shot.end - shot.start;

        // 計算時間點（均勻分布）
        const timestamps = [];
        for (let i = 0; i < framesPerShot; i++) {
            const position = shot.start + (duration * (i + 1) / (framesPerShot + 1));
            timestamps.push(position);
        }

        // 提取每個時間點的幀
        for (let i = 0; i < timestamps.length; i++) {
            const timestamp = timestamps[i];
            const filename = `${videoId}_shot${shot.shot}_frame${i + 1}_${uuidv4()}.jpg`;
            const outputPath = path.join(KEYFRAMES_DIR, filename);

            try {
                await extractKeyframe(videoPath, timestamp, outputPath);

                keyframes.push({
                    shotId: shot.shot,
                    frameIndex: i + 1,
                    timestamp,
                    path: outputPath,
                    filename,
                    shotStart: shot.start,
                    shotEnd: shot.end
                });

                console.log(`✅ Extracted frame ${i + 1}/${framesPerShot} for shot ${shot.shot}`);
            } catch (error) {
                console.error(`❌ Failed to extract frame for shot ${shot.shot}:`, error.message);
            }
        }
    }

    return keyframes;
};
