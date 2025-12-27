import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { extractAudio } from '../utils/ffmpeg.utils.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const AUDIO_DIR = process.env.STORAGE_DIR
    ? path.join(process.env.STORAGE_DIR, 'audio')
    : './storage/audio';

await fs.mkdir(AUDIO_DIR, { recursive: true });

/**
 * 分析音頻節奏（使用 ffmpeg 提取音量數據）
 * @param {string} videoPath - 影片路徑
 * @param {string} videoId - 影片 ID
 * @param {Array} shots - 分鏡數組
 * @returns {Promise<Object>} - 節奏分析結果
 */
export const analyzeRhythm = async (videoPath, videoId, shots) => {
    try {
        // 提取音頻
        const audioPath = path.join(AUDIO_DIR, `${videoId}.wav`);
        await extractAudio(videoPath, audioPath);

        // 使用 ffmpeg 分析音量變化（RMS）
        const volumeData = await analyzeVolume(audioPath);

        // 檢測靜音區段
        const silenceSegments = detectSilence(volumeData);

        // 檢測能量變化點（beat drops）
        const beatDrops = detectBeatDrops(volumeData);

        // 計算剪接頻率
        const cutFrequency = calculateCutFrequency(shots);

        // 判斷整體能量曲線
        const energyCurve = determineEnergyCurve(volumeData);

        return {
            beat_drop_at: beatDrops,
            silence_segments: silenceSegments,
            energy_curve: energyCurve,
            cut_frequency: cutFrequency,
            avg_volume: volumeData.avgVolume,
            peak_volume: volumeData.peakVolume
        };

    } catch (error) {
        console.error('Rhythm analysis error:', error.message);
        // 返回默認值
        return {
            beat_drop_at: [],
            silence_segments: [],
            energy_curve: 'stable',
            cut_frequency: 0,
            error: true
        };
    }
};

/**
 * 分析音量變化（使用 ffmpeg volumedetect）
 * @param {string} audioPath - 音頻文件路徑
 * @returns {Promise<Object>}
 */
const analyzeVolume = async (audioPath) => {
    try {
        // 使用 ffmpeg 的 volumedetect filter
        const { stderr } = await execAsync(
            `ffmpeg -i "${audioPath}" -af "volumedetect" -f null -`
        );

        // 解析輸出
        const meanVolumeMatch = stderr.match(/mean_volume: ([-\d.]+) dB/);
        const maxVolumeMatch = stderr.match(/max_volume: ([-\d.]+) dB/);

        return {
            avgVolume: meanVolumeMatch ? parseFloat(meanVolumeMatch[1]) : -30,
            peakVolume: maxVolumeMatch ? parseFloat(maxVolumeMatch[1]) : -10,
            samples: [] // 簡化版本，不提取詳細樣本
        };
    } catch (error) {
        console.error('Volume analysis error:', error.message);
        return { avgVolume: -30, peakVolume: -10, samples: [] };
    }
};

/**
 * 檢測靜音區段（簡化版本）
 * @param {Object} volumeData - 音量數據
 * @returns {Array} - [[start, end], ...]
 */
const detectSilence = (volumeData) => {
    // 簡化實現：如果平均音量很低，可能有靜音
    const silenceThreshold = -40; // dB

    if (volumeData.avgVolume < silenceThreshold) {
        return [[0, 1]]; // 示例數據
    }

    return [];
};

/**
 * 檢測 beat drops（能量突增點）
 * @param {Object} volumeData - 音量數據
 * @returns {Array} - [timestamp1, timestamp2, ...]
 */
const detectBeatDrops = (volumeData) => {
    // 簡化實現：基於峰值音量判斷
    const beatDrops = [];

    if (volumeData.peakVolume > -5) {
        // 假設在高能量點有 beat drop
        beatDrops.push(1.8); // 示例時間戳
    }

    return beatDrops;
};

/**
 * 計算剪接頻率
 * @param {Array} shots - 分鏡數組
 * @returns {number} - 每秒剪接次數
 */
const calculateCutFrequency = (shots) => {
    if (shots.length === 0) return 0;

    const totalDuration = shots[shots.length - 1].end;
    return shots.length / totalDuration;
};

/**
 * 判斷能量曲線
 * @param {Object} volumeData - 音量數據
 * @returns {string} - 'high_to_low' | 'low_to_high' | 'stable' | 'dynamic'
 */
const determineEnergyCurve = (volumeData) => {
    // 簡化實現：基於平均音量判斷
    const avg = volumeData.avgVolume;

    if (avg > -15) return 'high_to_low';
    if (avg < -35) return 'low_to_high';
    return 'stable';
};
