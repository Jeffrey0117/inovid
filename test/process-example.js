/**
 * 測試腳本 - 處理範例影片
 * 使用方法: node test/process-example.js <video-path>
 */

import { processVideo } from '../src/services/videoProcessing.service.js';
import path from 'path';

const videoPath = process.argv[2];

if (!videoPath) {
    console.error('❌ Please provide a video path');
    console.log('Usage: node test/process-example.js <video-path>');
    process.exit(1);
}

const absolutePath = path.resolve(videoPath);

console.log('🎬 Inovid Scene Blueprint Engine - Test Script\n');
console.log(`Processing: ${absolutePath}\n`);

try {
    const result = await processVideo(absolutePath);

    console.log('\n📊 Processing Results:');
    console.log('─'.repeat(50));
    console.log(`Video ID: ${result.videoId}`);
    console.log(`Total Shots: ${result.stats.totalShots}`);
    console.log(`Duration: ${result.stats.totalDuration}s`);
    console.log(`Avg Shot Length: ${result.stats.avgShotLength.toFixed(2)}s`);
    console.log(`Spec Path: ${result.specPath}`);
    console.log('─'.repeat(50));

    console.log('\n🎯 Scene Types:');
    const sceneTypes = {};
    result.sceneSpec.scenes.forEach(scene => {
        sceneTypes[scene.type] = (sceneTypes[scene.type] || 0) + 1;
    });
    Object.entries(sceneTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });

    console.log('\n✨ Top 3 Important Scenes:');
    const topScenes = [...result.sceneSpec.scenes]
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 3);

    topScenes.forEach((scene, i) => {
        console.log(`  ${i + 1}. Shot ${scene.shot_id} (${scene.start.toFixed(1)}s-${scene.end.toFixed(1)}s)`);
        console.log(`     Type: ${scene.type}, Importance: ${scene.importance}/10`);
        console.log(`     Emotion: ${scene.emotion}, Motion: ${scene.recommended_motion}`);
    });

    console.log('\n✅ Test completed successfully!\n');

} catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
}
