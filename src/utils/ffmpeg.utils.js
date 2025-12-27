import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { AppError } from '../middleware/errorHandler.js';

// 設置 ffmpeg 和 ffprobe 路徑（如果需要）
if (process.env.FFMPEG_PATH) {
    ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}
if (process.env.FFPROBE_PATH) {
    ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

/**
 * 獲取影片 metadata
 * @param {string} videoPath - 影片路徑
 * @returns {Promise<Object>} - 影片元數據
 */
export const getVideoMetadata = (videoPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) {
                reject(new AppError('Failed to extract video metadata', 500));
                return;
            }

            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

            if (!videoStream) {
                reject(new AppError('No video stream found', 400));
                return;
            }

            resolve({
                duration: parseFloat(metadata.format.duration),
                fps: eval(videoStream.r_frame_rate), // 例如 "30/1" -> 30
                width: videoStream.width,
                height: videoStream.height,
                codec: videoStream.codec_name,
                bitrate: parseInt(metadata.format.bit_rate),
                size: parseInt(metadata.format.size),
                hasAudio: !!audioStream,
                audioCodec: audioStream?.codec_name,
                format: metadata.format.format_name
            });
        });
    });
};

/**
 * 提取關鍵幀
 * @param {string} videoPath - 影片路徑
 * @param {number} timestamp - 時間戳（秒）
 * @param {string} outputPath - 輸出路徑
 * @returns {Promise<string>} - 輸出文件路徑
 */
export const extractKeyframe = (videoPath, timestamp, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .seekInput(timestamp)
            .frames(1)
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(new AppError(`Failed to extract keyframe: ${err.message}`, 500)))
            .run();
    });
};

/**
 * 提取音頻波形數據（用於節奏分析）
 * @param {string} videoPath - 影片路徑
 * @param {string} outputPath - 輸出音頻文件路徑
 * @returns {Promise<string>}
 */
export const extractAudio = (videoPath, outputPath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .output(outputPath)
            .noVideo()
            .audioCodec('pcm_s16le')
            .audioFrequency(44100)
            .audioChannels(1)
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(new AppError(`Failed to extract audio: ${err.message}`, 500)))
            .run();
    });
};
