import express from 'express';
import path from 'path';
import {
    generatePromptsFromFile,
    generateAllScenes,
    saveVeoPrompts
} from '../services/videoGeneration.service.js';
import { getSceneSpec } from '../services/videoProcessing.service.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

const PROMPTS_DIR = process.env.STORAGE_DIR
    ? path.join(process.env.STORAGE_DIR, 'veo-prompts')
    : './storage/veo-prompts';

const VIDEOS_DIR = process.env.STORAGE_DIR
    ? path.join(process.env.STORAGE_DIR, 'generated-videos')
    : './storage/generated-videos';

import fs from 'fs/promises';
await fs.mkdir(PROMPTS_DIR, { recursive: true });
await fs.mkdir(VIDEOS_DIR, { recursive: true });

/**
 * POST /api/generate/prompts/:videoId
 * 從 Scene Spec 生成 Veo prompts（不調用 API）
 */
router.post('/prompts/:videoId', async (req, res, next) => {
    try {
        const { videoId } = req.params;

        console.log(`📝 Generating Veo prompts for video: ${videoId}`);

        // 獲取 Scene Spec
        const sceneSpec = await getSceneSpec(videoId);

        // 生成 prompts
        const { generateVeoPrompts } = await import('../services/videoGeneration.service.js');
        const promptsData = generateVeoPrompts(sceneSpec);

        // 保存 prompts
        const promptsPath = path.join(PROMPTS_DIR, `${videoId}-prompts.json`);
        await saveVeoPrompts(promptsData, promptsPath);

        res.json({
            success: true,
            message: 'Veo prompts generated successfully',
            data: {
                videoId,
                totalScenes: promptsData.totalScenes,
                promptsPath,
                prompts: promptsData.prompts
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/generate/video/:videoId
 * 生成完整影片（調用 Veo API）
 */
router.post('/video/:videoId', async (req, res, next) => {
    try {
        const { videoId } = req.params;
        const { sceneIndices } = req.body; // 可選：只生成特定場景

        console.log(`🎬 Starting video generation for: ${videoId}`);

        // 讀取 prompts
        const promptsPath = path.join(PROMPTS_DIR, `${videoId}-prompts.json`);
        let promptsData;

        try {
            const content = await fs.readFile(promptsPath, 'utf-8');
            promptsData = JSON.parse(content);
        } catch (error) {
            // 如果 prompts 不存在，先生成
            console.log('Prompts not found, generating...');
            const sceneSpec = await getSceneSpec(videoId);
            const { generateVeoPrompts } = await import('../services/videoGeneration.service.js');
            promptsData = generateVeoPrompts(sceneSpec);
            await saveVeoPrompts(promptsData, promptsPath);
        }

        // 選擇要生成的場景
        let promptsToGenerate = promptsData.prompts;
        if (sceneIndices && Array.isArray(sceneIndices)) {
            promptsToGenerate = promptsData.prompts.filter(p =>
                sceneIndices.includes(p.sceneIndex)
            );
        }

        console.log(`Generating ${promptsToGenerate.length} scenes...`);

        // 生成影片
        const results = await generateAllScenes(promptsToGenerate, (current, total, result) => {
            console.log(`Progress: ${current}/${total} - Scene ${result.sceneIndex} ${result.success ? '✅' : '❌'}`);
        });

        // 保存結果
        const resultsPath = path.join(VIDEOS_DIR, `${videoId}-results.json`);
        await fs.writeFile(resultsPath, JSON.stringify({
            videoId,
            generatedAt: new Date().toISOString(),
            totalScenes: results.length,
            successCount: results.filter(r => r.success).length,
            results
        }, null, 2));

        res.json({
            success: true,
            message: 'Video generation completed',
            data: {
                videoId,
                totalScenes: results.length,
                successCount: results.filter(r => r.success).length,
                failedCount: results.filter(r => !r.success).length,
                results,
                resultsPath
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/generate/status/:videoId
 * 獲取生成狀態
 */
router.get('/status/:videoId', async (req, res, next) => {
    try {
        const { videoId } = req.params;

        const resultsPath = path.join(VIDEOS_DIR, `${videoId}-results.json`);
        const content = await fs.readFile(resultsPath, 'utf-8');
        const results = JSON.parse(content);

        res.json({
            success: true,
            data: results
        });

    } catch (error) {
        if (error.code === 'ENOENT') {
            next(new AppError('Generation results not found', 404));
        } else {
            next(error);
        }
    }
});

/**
 * GET /api/generate/prompts/:videoId
 * 獲取已生成的 prompts
 */
router.get('/prompts/:videoId', async (req, res, next) => {
    try {
        const { videoId } = req.params;

        const promptsPath = path.join(PROMPTS_DIR, `${videoId}-prompts.json`);
        const content = await fs.readFile(promptsPath, 'utf-8');
        const prompts = JSON.parse(content);

        res.json({
            success: true,
            data: prompts
        });

    } catch (error) {
        if (error.code === 'ENOENT') {
            next(new AppError('Prompts not found', 404));
        } else {
            next(error);
        }
    }
});

export default router;
