/**
 * Scene Spec Builder - 核心模組
 * 100% 由規則主導，不依賴 AI
 * 合成所有分析結果，生成結構化的 Scene Spec
 */

/**
 * 構建完整的 Scene Spec
 * @param {Object} videoMetadata - 影片元數據
 * @param {Array} shots - 分鏡數組
 * @param {Array} semantics - 語義分析結果
 * @param {Object} rhythm - 節奏分析結果
 * @returns {Object} - Scene Spec JSON
 */
export const buildSceneSpec = (videoMetadata, shots, semantics, rhythm) => {
    // 計算基本統計
    const totalDuration = videoMetadata.duration;
    const avgShotLength = calculateAvgShotLength(shots);

    // 構建每個場景的規格
    const scenes = shots.map((shot, index) => {
        const semantic = semantics.find(s => s.shotId === shot.shot) || {};
        return buildSingleSceneSpec(shot, semantic, rhythm, avgShotLength, index, shots.length);
    });

    // 生成整體規格
    return {
        video_id: videoMetadata.videoId,
        total_duration: totalDuration,
        total_shots: shots.length,
        avg_shot_length: avgShotLength,
        cut_frequency: rhythm.cut_frequency,
        overall_energy: rhythm.energy_curve,
        scenes,
        metadata: {
            width: videoMetadata.width,
            height: videoMetadata.height,
            fps: videoMetadata.fps,
            has_audio: videoMetadata.hasAudio
        },
        generated_at: new Date().toISOString()
    };
};

/**
 * 構建單個場景的規格（規則引擎）
 * @param {Object} shot - 分鏡信息
 * @param {Object} semantic - 語義分析
 * @param {Object} rhythm - 節奏分析
 * @param {number} avgShotLength - 平均鏡頭長度
 * @param {number} shotIndex - 場景索引
 * @param {number} totalShots - 總場景數
 * @returns {Object} - 單個場景規格
 */
const buildSingleSceneSpec = (shot, semantic, rhythm, avgShotLength, shotIndex, totalShots) => {
    const duration = shot.end - shot.start;
    const position = shotIndex / totalShots; // 0-1 之間，表示在影片中的位置

    // 如果沒有 Vision API 數據，使用智能推斷
    const hasVisionData = semantic.shot_type && !semantic.error;
    if (!hasVisionData) {
        semantic = inferSemanticFromContext(duration, position, shotIndex, rhythm);
    }

    // 規則 1: 判斷場景類型
    const sceneType = determineSceneType(duration, semantic, avgShotLength, position);

    // 規則 2: 推薦動作效果
    const recommendedMotion = recommendMotion(semantic, duration, rhythm, position);

    // 規則 3: 判斷重要性
    const importance = calculateImportance(duration, semantic, sceneType, avgShotLength, position);

    // 規則 4: 判斷是否適合剪接點
    const isCutPoint = isSuitableForCut(shot, rhythm);

    return {
        shot_id: shot.shot,
        start: shot.start,
        end: shot.end,
        duration,
        type: sceneType,
        shot_type: semantic.shot_type || 'medium',
        subject: semantic.subject || 'object',
        text_density: semantic.subtitle || 'none',
        emotion: semantic.emotion || 'calm',
        motion_level: semantic.motion || 'slight_motion',
        recommended_motion: recommendedMotion,
        importance,
        is_cut_point: isCutPoint,
        tags: generateTags(semantic, sceneType, duration)
    };
};

/**
 * 從上下文推斷語義（當沒有 Vision API 時）
 */
const inferSemanticFromContext = (duration, position, shotIndex, rhythm) => {
    const semantic = {};

    // 根據時長推斷鏡頭類型
    if (duration < 1.5) {
        semantic.shot_type = shotIndex === 0 ? 'close_up' : 'medium'; // 第一個短鏡頭可能是特寫
    } else if (duration > 4) {
        semantic.shot_type = 'wide'; // 長鏡頭可能是遠景
    } else {
        semantic.shot_type = position < 0.3 ? 'close_up' : 'medium'; // 前30%更可能是特寫
    }

    // 根據位置推斷主體
    if (position < 0.2) {
        semantic.subject = 'human_face'; // 開頭更可能是人臉
    } else if (position > 0.8) {
        semantic.subject = 'text_only'; // 結尾可能是文字
    } else {
        semantic.subject = duration > 3 ? 'screen_ui' : 'object';
    }

    // 根據時長推斷字幕
    if (duration < 1) {
        semantic.subtitle = 'short_hook';
    } else if (duration > 4) {
        semantic.subtitle = 'paragraph';
    } else {
        semantic.subtitle = position < 0.3 ? 'short_hook' : 'sentence';
    }

    // 根據位置和節奏推斷情緒
    if (position < 0.15) {
        semantic.emotion = 'curiosity'; // 開頭引起好奇
    } else if (rhythm.energy_curve === 'high_to_low') {
        semantic.emotion = position < 0.5 ? 'excitement' : 'calm';
    } else {
        semantic.emotion = duration < 2 ? 'excitement' : 'explanation';
    }

    // 根據時長推斷動態
    if (duration < 1.5) {
        semantic.motion = 'strong_motion'; // 短鏡頭通常動態強
    } else if (duration > 4) {
        semantic.motion = 'static'; // 長鏡頭通常靜態
    } else {
        semantic.motion = 'slight_motion';
    }

    return semantic;
};

/**
 * 規則引擎：判斷場景類型
 */
const determineSceneType = (duration, semantic, avgShotLength) => {
    // 規則：shot < 2.5s → hook 或 emphasis
    if (duration < 2.5) {
        if (semantic.shot_type === 'close_up' && semantic.subtitle !== 'none') {
            return 'hook';
        }
        return 'emphasis';
    }

    // 規則：close_up + text → hook scene
    if (semantic.shot_type === 'close_up' && semantic.subtitle !== 'none') {
        return 'hook';
    }

    // 規則：screen + medium → explanation scene
    if (semantic.shot_type === 'screen' ||
        (semantic.shot_type === 'medium' && semantic.subject === 'screen_ui')) {
        return 'explanation';
    }

    // 規則：wide shot → establishing
    if (semantic.shot_type === 'wide') {
        return 'establishing';
    }

    // 規則：broll → transition
    if (semantic.shot_type === 'broll') {
        return 'transition';
    }

    // 默認：content
    return 'content';
};

/**
 * 規則引擎：推薦動作效果
 */
const recommendMotion = (semantic, duration, rhythm) => {
    // 規則：close_up + curiosity → zoom_in
    if (semantic.shot_type === 'close_up' && semantic.emotion === 'curiosity') {
        return 'zoom_in';
    }

    // 規則：excitement → shake 或 quick_zoom
    if (semantic.emotion === 'excitement') {
        return duration < 2 ? 'quick_zoom' : 'shake';
    }

    // 規則：wide + calm → slow_pan
    if (semantic.shot_type === 'wide' && semantic.emotion === 'calm') {
        return 'slow_pan';
    }

    // 規則：有 beat drop → punch_in
    if (rhythm.beat_drop_at && rhythm.beat_drop_at.length > 0) {
        return 'punch_in';
    }

    // 規則：screen → none (保持清晰)
    if (semantic.shot_type === 'screen') {
        return 'none';
    }

    // 默認：subtle_zoom
    return 'subtle_zoom';
};

/**
 * 計算場景重要性 (1-10)
 */
const calculateImportance = (duration, semantic, sceneType, avgShotLength) => {
    let score = 5; // 基礎分數

    // hook 場景 +3
    if (sceneType === 'hook') score += 3;

    // 有字幕 +2
    if (semantic.subtitle !== 'none') score += 2;

    // 特寫鏡頭 +1
    if (semantic.shot_type === 'close_up') score += 1;

    // 強烈情緒 +1
    if (semantic.emotion === 'excitement' || semantic.emotion === 'tension') score += 1;

    // 比平均長度短很多 +1 (可能是重點)
    if (duration < avgShotLength * 0.6) score += 1;

    return Math.min(10, Math.max(1, score));
};

/**
 * 判斷是否適合作為剪接點
 */
const isSuitableForCut = (shot, rhythm) => {
    // 有 beat drop
    if (rhythm.beat_drop_at?.some(t => Math.abs(t - shot.start) < 0.3)) {
        return true;
    }

    // 在靜音區段後
    if (rhythm.silence_segments?.some(([_, end]) => Math.abs(end - shot.start) < 0.2)) {
        return true;
    }

    return false;
};

/**
 * 生成標籤
 */
const generateTags = (semantic, sceneType, duration) => {
    const tags = [sceneType];

    if (duration < 2) tags.push('fast_paced');
    if (duration > 5) tags.push('slow_paced');
    if (semantic.subtitle !== 'none') tags.push('has_text');
    if (semantic.subject === 'human_face') tags.push('talking_head');
    if (semantic.shot_type === 'screen') tags.push('screen_recording');

    return tags;
};

/**
 * 計算平均鏡頭長度
 */
const calculateAvgShotLength = (shots) => {
    if (shots.length === 0) return 0;
    const totalDuration = shots.reduce((sum, shot) => sum + (shot.end - shot.start), 0);
    return totalDuration / shots.length;
};

/**
 * 導出場景規格為 JSON 文件
 * @param {Object} sceneSpec - 場景規格
 * @param {string} outputPath - 輸出路徑
 */
export const exportSceneSpec = async (sceneSpec, outputPath) => {
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, JSON.stringify(sceneSpec, null, 2), 'utf-8');
    console.log(`✅ Scene spec exported to ${outputPath}`);
};
