import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { getVideoMetadata } from '../utils/ffmpeg.utils.js';
import { detectShotBoundaries } from './shotDetection.service.js';
import { extractKeyframes } from './keyframe.service.js';
import { analyzeKeyframesSemantics } from './visionAnalysis.service.js';
import { analyzeRhythm } from './rhythmAnalysis.service.js';
import { buildSceneSpec, exportSceneSpec } from './sceneBuilder.service.js';

const SPECS_DIR = process.env.STORAGE_DIR
    ? path.join(process.env.STORAGE_DIR, 'specs')
    : './storage/specs';

import fs from 'fs/promises';
await fs.mkdir(SPECS_DIR, { recursive: true });

/**
 * 完整的影片處理流程
 * @param {string} videoPath - 影片路徑
 * @returns {Promise<Object>} - 處理結果
 */
export const processVideo = async (videoPath) => {
    const videoId = uuidv4();

    // 確保使用絕對路徑
    const absoluteVideoPath = path.isAbsolute(videoPath)
        ? videoPath
        : path.resolve(videoPath);

    console.log(`\n🎬 Starting video processing: ${videoId}`);
    console.log(`📁 Video path: ${absoluteVideoPath}\n`);

    try {
        // ===== 步驟 1: 提取影片元數據 =====
        console.log('📊 Step 1/6: Extracting video metadata...');
        const metadata = await getVideoMetadata(absoluteVideoPath);
        metadata.videoId = videoId;
        console.log(`✅ Duration: ${metadata.duration}s, Resolution: ${metadata.width}x${metadata.height}, FPS: ${metadata.fps}\n`);

        // ===== 步驟 2: 分鏡檢測 =====
        console.log('🎞️  Step 2/6: Detecting shot boundaries...');
        const shots = await detectShotBoundaries(absoluteVideoPath);
        console.log(`✅ Detected ${shots.length} shots\n`);

        // ===== 步驟 3: 提取關鍵幀 =====
        console.log('🖼️  Step 3/6: Extracting keyframes...');
        const keyframes = await extractKeyframes(absoluteVideoPath, shots, videoId);
        console.log(`✅ Extracted ${keyframes.length} keyframes\n`);

        // ===== 步驟 4: 視覺語義分析 =====
        console.log('🔍 Step 4/6: Analyzing visual semantics...');
        const semantics = await analyzeKeyframesSemantics(keyframes);
        console.log(`✅ Analyzed ${semantics.length} frames\n`);

        // ===== 步驟 5: 節奏分析 =====
        console.log('🎵 Step 5/6: Analyzing rhythm and audio...');
        const rhythm = await analyzeRhythm(absoluteVideoPath, videoId, shots);
        console.log(`✅ Energy curve: ${rhythm.energy_curve}, Cut frequency: ${rhythm.cut_frequency.toFixed(2)}/s\n`);

        // ===== 步驟 6: 構建 Scene Spec =====
        console.log('🏗️  Step 6/6: Building scene specification...');
        const sceneSpec = buildSceneSpec(metadata, shots, semantics, rhythm);

        // 導出 JSON
        const specPath = path.join(SPECS_DIR, `${videoId}.json`);
        await exportSceneSpec(sceneSpec, specPath);

        console.log(`\n✨ Processing complete!`);
        console.log(`📄 Scene spec: ${specPath}\n`);

        // ===== 步驟 7: 自動生成 Veo Prompts =====
        console.log('📝 Step 7/7: Generating Veo prompts...');
        const { generateVeoPrompts, saveVeoPrompts } = await import('./videoGeneration.service.js');
        const veoPrompts = generateVeoPrompts(sceneSpec);

        // 保存 prompts
        const PROMPTS_DIR = process.env.STORAGE_DIR
            ? path.join(process.env.STORAGE_DIR, 'veo-prompts')
            : './storage/veo-prompts';
        await fs.mkdir(PROMPTS_DIR, { recursive: true });
        const promptsPath = path.join(PROMPTS_DIR, `${videoId}-prompts.json`);
        await saveVeoPrompts(veoPrompts, promptsPath);

        console.log(`✅ Generated ${veoPrompts.prompts.length} Veo prompts\n`);

        return {
            success: true,
            videoId,
            sceneSpec,
            specPath,
            veoPrompts,  // 添加 prompts 到回應
            promptsPath,
            stats: {
                totalShots: shots.length,
                totalDuration: metadata.duration,
                avgShotLength: sceneSpec.avg_shot_length,
                keyframesExtracted: keyframes.length,
                veoPromptsGenerated: veoPrompts.prompts.length
            }
        };

    } catch (error) {
        console.error(`❌ Processing failed: ${error.message}`);
        throw error;
    }
};

/**
 * 獲取已處理的影片規格
 * @param {string} videoId - 影片 ID
 * @returns {Promise<Object>} - Scene Spec
 */
export const getSceneSpec = async (videoId) => {
    const specPath = path.join(SPECS_DIR, `${videoId}.json`);
    const content = await fs.readFile(specPath, 'utf-8');
    return JSON.parse(content);
};

/**
 * 列出所有已處理的影片
 * @returns {Promise<Array>} - 影片列表
 */
export const listProcessedVideos = async () => {
    const files = await fs.readdir(SPECS_DIR);
    const specs = [];

    for (const file of files) {
        if (file.endsWith('.json')) {
            const content = await fs.readFile(path.join(SPECS_DIR, file), 'utf-8');
            const spec = JSON.parse(content);
            specs.push({
                videoId: spec.video_id,
                duration: spec.total_duration,
                shots: spec.total_shots,
                generatedAt: spec.generated_at
            });
        }
    }

    return specs;
};
