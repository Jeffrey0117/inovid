import axios from 'axios';
import fs from 'fs/promises';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';

const VISION_API_KEY = process.env.VISION_API_KEY;
const VISION_API_URL = process.env.VISION_API_URL || 'https://api.openai.com/v1/chat/completions';
const VISION_MODEL = process.env.VISION_MODEL || 'gpt-4-vision-preview';

// 定義語義分析的 enum 和 schema
export const ShotTypeEnum = z.enum(['close_up', 'medium', 'wide', 'screen', 'broll']);
export const SubjectEnum = z.enum(['human_face', 'human_body', 'screen_ui', 'object', 'text_only']);
export const SubtitleEnum = z.enum(['none', 'short_hook', 'sentence', 'paragraph']);
export const EmotionEnum = z.enum(['curiosity', 'excitement', 'explanation', 'tension', 'calm']);
export const MotionEnum = z.enum(['static', 'slight_motion', 'strong_motion']);

const SemanticAnalysisSchema = z.object({
    shot_type: ShotTypeEnum,
    subject: SubjectEnum,
    subtitle: SubtitleEnum,
    emotion: EmotionEnum,
    motion: MotionEnum
});

/**
 * 構建視覺語義分析的 prompt（封閉式問題）
 */
const buildSemanticPrompt = () => {
    return `請分析這張影片截圖，並用以下 enum 回答，不要解釋，只回答 JSON 格式：

{
  "shot_type": "[close_up, medium, wide, screen, broll] 選一個",
  "subject": "[human_face, human_body, screen_ui, object, text_only] 選一個",
  "subtitle": "[none, short_hook, sentence, paragraph] 選一個",
  "emotion": "[curiosity, excitement, explanation, tension, calm] 選一個",
  "motion": "[static, slight_motion, strong_motion] 選一個"
}

定義：
- shot_type: 鏡頭類型（特寫/中景/遠景/螢幕/B-roll）
- subject: 主體（人臉/人體/螢幕UI/物體/純文字）
- subtitle: 字幕密度（無/短鉤子/句子/段落）
- emotion: 視覺情緒（好奇/興奮/解釋/緊張/平靜）
- motion: 畫面動態感（靜態/輕微動態/強烈動態）

只回答 JSON，不要其他文字。`;
};

/**
 * 分析單張關鍵幀的語義
 * @param {string} imagePath - 圖片路徑
 * @param {number} retries - 重試次數
 * @returns {Promise<Object>} - 語義分析結果
 */
export const analyzeFrameSemantics = async (imagePath, retries = 0) => {
    try {
        // 讀取圖片並轉換為 base64
        const imageBuffer = await fs.readFile(imagePath);
        const base64Image = imageBuffer.toString('base64');

        // 調用 Vision API
        const response = await axios.post(
            VISION_API_URL,
            {
                model: VISION_MODEL,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: buildSemanticPrompt() },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 300,
                temperature: 0.1 // 低溫度以獲得更一致的結果
            },
            {
                headers: {
                    'Authorization': `Bearer ${VISION_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        // 提取回應
        const content = response.data.choices[0].message.content;

        // 解析 JSON（可能需要清理）
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Schema 驗證 - 如果不合法就重問
        const validated = SemanticAnalysisSchema.parse(parsed);

        return validated;

    } catch (error) {
        // Retry 邏輯
        if (retries < 2 && (error.name === 'ZodError' || error.message.includes('JSON'))) {
            console.log(`⚠️ Invalid response, retrying... (${retries + 1}/2)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return analyzeFrameSemantics(imagePath, retries + 1);
        }

        console.error('Vision analysis error:', error.message);

        // 返回默認值而不是失敗
        return {
            shot_type: 'medium',
            subject: 'object',
            subtitle: 'none',
            emotion: 'calm',
            motion: 'slight_motion',
            error: true
        };
    }
};

/**
 * 批量分析多個關鍵幀
 * @param {Array} keyframes - 關鍵幀數組
 * @returns {Promise<Array>} - 語義分析結果數組
 */
export const analyzeKeyframesSemantics = async (keyframes) => {
    const results = [];

    for (const keyframe of keyframes) {
        console.log(`🔍 Analyzing shot ${keyframe.shotId}...`);

        const semantics = await analyzeFrameSemantics(keyframe.path);

        results.push({
            shotId: keyframe.shotId,
            timestamp: keyframe.timestamp,
            ...semantics
        });

        // 避免 API rate limit
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
};
