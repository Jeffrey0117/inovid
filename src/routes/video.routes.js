import express from 'express';
import { upload } from '../config/upload.config.js';
import {
    processVideo,
    getSceneSpec,
    listProcessedVideos
} from '../services/videoProcessing.service.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/videos
 * 上傳並處理影片
 */
router.post('/', upload.single('video'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new AppError('No video file uploaded', 400);
        }

        console.log(`📤 Received video upload: ${req.file.originalname}`);

        // 處理影片
        const result = await processVideo(req.file.path);

        res.status(201).json({
            success: true,
            message: 'Video processed successfully',
            data: result
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/videos
 * 列出所有已處理的影片
 */
router.get('/', async (req, res, next) => {
    try {
        const videos = await listProcessedVideos();

        res.json({
            success: true,
            count: videos.length,
            data: videos
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/videos/:videoId
 * 獲取特定影片的 Scene Spec
 */
router.get('/:videoId', async (req, res, next) => {
    try {
        const { videoId } = req.params;
        const sceneSpec = await getSceneSpec(videoId);

        res.json({
            success: true,
            data: sceneSpec
        });

    } catch (error) {
        if (error.code === 'ENOENT') {
            next(new AppError('Video not found', 404));
        } else {
            next(error);
        }
    }
});

/**
 * POST /api/videos/url
 * 從 URL 處理影片（未來擴展）
 */
router.post('/url', async (req, res, next) => {
    try {
        const { url } = req.body;

        if (!url) {
            throw new AppError('URL is required', 400);
        }

        // TODO: 下載影片並處理
        res.status(501).json({
            success: false,
            message: 'URL processing not implemented yet'
        });

    } catch (error) {
        next(error);
    }
});

export default router;
