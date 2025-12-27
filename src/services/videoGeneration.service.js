/**
 * Video Generation Service
 * 使用 Scene Spec JSON 生成 Veo prompts 並調用 Google Veo API
 */

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const VEO_API_KEY = process.env.VEO_API_KEY;
const VEO_API_URL = process.env.VEO_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/veo-001:generateVideo';

/**
 * 從 Scene Spec 生成 Veo prompt
 * @param {Object} scene - 單個場景規格
 * @param {number} index - 場景索引
 * @returns {string} - Veo prompt
 */
export const buildVeoPrompt = (scene, index) => {
    const parts = [];

    // 1. 場景類型描述
    const sceneTypeDescriptions = {
        hook: 'An attention-grabbing opening shot',
        explanation: 'A clear explanatory scene',
        content: 'Main content presentation',
        emphasis: 'An emphasized moment',
        transition: 'A smooth transition',
        establishing: 'An establishing wide shot'
    };
    parts.push(sceneTypeDescriptions[scene.type] || 'A video scene');

    // 2. 鏡頭類型
    const shotTypeDescriptions = {
        close_up: 'close-up shot',
        medium: 'medium shot',
        wide: 'wide angle shot',
        screen: 'screen recording style',
        broll: 'b-roll footage'
    };
    parts.push(`filmed as a ${shotTypeDescriptions[scene.shot_type]}`);

    // 3. 主體描述
    const subjectDescriptions = {
        human_face: 'focusing on a person\'s face',
        human_body: 'showing a person',
        screen_ui: 'displaying a user interface',
        object: 'featuring an object',
        text_only: 'with text overlay'
    };
    parts.push(subjectDescriptions[scene.subject]);

    // 4. 情緒和氛圍
    const emotionDescriptions = {
        curiosity: 'with an intriguing and curious atmosphere',
        excitement: 'with energetic and exciting mood',
        explanation: 'with a calm and informative tone',
        tension: 'with dramatic tension',
        calm: 'with a peaceful and calm feeling'
    };
    parts.push(emotionDescriptions[scene.emotion]);

    // 5. 動作建議
    const motionDescriptions = {
        zoom_in: 'slowly zooming in',
        zoom_out: 'slowly zooming out',
        shake: 'with dynamic camera shake',
        quick_zoom: 'with quick zoom effect',
        slow_pan: 'with slow panning movement',
        punch_in: 'with punch-in effect',
        subtle_zoom: 'with subtle zoom',
        none: 'with static camera'
    };
    if (scene.recommended_motion !== 'none') {
        parts.push(motionDescriptions[scene.recommended_motion]);
    }

    // 6. 時長提示
    parts.push(`Duration: ${scene.duration.toFixed(1)} seconds`);

    // 組合成完整 prompt
    const prompt = parts.join(', ') + '.';

    return {
        sceneIndex: index,
        shotId: scene.shot_id,
        duration: scene.duration,
        prompt,
        importance: scene.importance,
        tags: scene.tags
    };
};

/**
 * 從完整的 Scene Spec 生成所有 Veo prompts
 * @param {Object} sceneSpec - 完整的 Scene Spec JSON
 * @returns {Array} - Veo prompts 數組
 */
export const generateVeoPrompts = (sceneSpec) => {
    const prompts = sceneSpec.scenes.map((scene, index) =>
        buildVeoPrompt(scene, index + 1)
    );

    return {
        videoId: sceneSpec.video_id,
        totalScenes: sceneSpec.total_shots,
        totalDuration: sceneSpec.total_duration,
        prompts,
        metadata: {
            originalResolution: `${sceneSpec.metadata.width}x${sceneSpec.metadata.height}`,
            originalFps: sceneSpec.metadata.fps,
            generatedAt: new Date().toISOString()
        }
    };
};

/**
 * 調用 Google Veo API 生成單個場景
 * @param {Object} promptData - Prompt 數據
 * @returns {Promise<Object>} - 生成結果
 */
export const generateSceneWithVeo = async (promptData) => {
    if (!VEO_API_KEY) {
        throw new Error('VEO_API_KEY not configured in .env');
    }

    try {
        const response = await axios.post(
            VEO_API_URL,
            {
                prompt: promptData.prompt,
                duration: Math.ceil(promptData.duration), // Veo 可能需要整數秒
                aspectRatio: '16:9',
                quality: 'high'
            },
            {
                headers: {
                    'Authorization': `Bearer ${VEO_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 120000 // 2 分鐘超時
            }
        );

        return {
            sceneIndex: promptData.sceneIndex,
            shotId: promptData.shotId,
            success: true,
            videoUrl: response.data.videoUrl || response.data.url,
            status: response.data.status,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error(`Failed to generate scene ${promptData.sceneIndex}:`, error.message);
        return {
            sceneIndex: promptData.sceneIndex,
            shotId: promptData.shotId,
            success: false,
            error: error.message
        };
    }
};

/**
 * 批量生成所有場景（串行，避免 API rate limit）
 * @param {Array} prompts - Prompts 數組
 * @param {Function} progressCallback - 進度回調
 * @returns {Promise<Array>} - 生成結果數組
 */
export const generateAllScenes = async (prompts, progressCallback = null) => {
    const results = [];

    for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];

        console.log(`\n🎬 Generating scene ${i + 1}/${prompts.length}...`);
        console.log(`📝 Prompt: ${prompt.prompt.substring(0, 100)}...`);

        const result = await generateSceneWithVeo(prompt);
        results.push(result);

        if (progressCallback) {
            progressCallback(i + 1, prompts.length, result);
        }

        // 避免 rate limit，每個請求之間延遲
        if (i < prompts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    return results;
};

/**
 * 保存 Veo prompts 到文件
 * @param {Object} promptsData - Prompts 數據
 * @param {string} outputPath - 輸出路徑
 */
export const saveVeoPrompts = async (promptsData, outputPath) => {
    await fs.writeFile(
        outputPath,
        JSON.stringify(promptsData, null, 2),
        'utf-8'
    );
    console.log(`✅ Veo prompts saved to ${outputPath}`);
};

/**
 * 從 Scene Spec 文件生成 Veo prompts
 * @param {string} sceneSpecPath - Scene Spec JSON 文件路徑
 * @returns {Promise<Object>} - Veo prompts
 */
export const generatePromptsFromFile = async (sceneSpecPath) => {
    const content = await fs.readFile(sceneSpecPath, 'utf-8');
    const sceneSpec = JSON.parse(content);
    return generateVeoPrompts(sceneSpec);
};
