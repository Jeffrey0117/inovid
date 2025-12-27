/**
 * CLI 工具 - 從 Scene Spec 生成 Veo prompts
 * 使用方法: node tools/generate-prompts.js <scene-spec-path>
 */

import { generatePromptsFromFile, saveVeoPrompts } from '../src/services/videoGeneration.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sceneSpecPath = process.argv[2];

if (!sceneSpecPath) {
    console.error('❌ Please provide a scene spec JSON file path');
    console.log('Usage: node tools/generate-prompts.js <scene-spec-path>');
    console.log('Example: node tools/generate-prompts.js storage/specs/abc-123.json');
    process.exit(1);
}

const absolutePath = path.resolve(sceneSpecPath);

console.log('🎬 Veo Prompt Generator\n');
console.log(`Reading Scene Spec: ${absolutePath}\n`);

try {
    // 生成 prompts
    const promptsData = await generatePromptsFromFile(absolutePath);

    console.log('📊 Generation Summary:');
    console.log('─'.repeat(60));
    console.log(`Video ID: ${promptsData.videoId}`);
    console.log(`Total Scenes: ${promptsData.totalScenes}`);
    console.log(`Total Duration: ${promptsData.totalDuration}s`);
    console.log(`Original Resolution: ${promptsData.metadata.originalResolution}`);
    console.log('─'.repeat(60));

    console.log('\n📝 Generated Prompts:\n');

    promptsData.prompts.forEach((prompt, index) => {
        console.log(`Scene ${prompt.sceneIndex} (Shot ${prompt.shotId}) - ${prompt.duration}s - Importance: ${prompt.importance}/10`);
        console.log(`  ${prompt.prompt}`);
        console.log(`  Tags: ${prompt.tags.join(', ')}`);
        console.log('');
    });

    // 保存 prompts
    const outputDir = path.join(__dirname, '../storage/veo-prompts');
    const outputPath = path.join(outputDir, `${promptsData.videoId}-prompts.json`);

    await saveVeoPrompts(promptsData, outputPath);

    console.log('\n✨ Prompts generated successfully!');
    console.log(`📄 Saved to: ${outputPath}\n`);

    // 顯示統計
    const highImportance = promptsData.prompts.filter(p => p.importance >= 8).length;
    const mediumImportance = promptsData.prompts.filter(p => p.importance >= 6 && p.importance < 8).length;
    const lowImportance = promptsData.prompts.filter(p => p.importance < 6).length;

    console.log('📈 Importance Distribution:');
    console.log(`  High (8-10): ${highImportance} scenes`);
    console.log(`  Medium (6-7): ${mediumImportance} scenes`);
    console.log(`  Low (1-5): ${lowImportance} scenes`);

    console.log('\n💡 Next Steps:');
    console.log('  1. Review the generated prompts');
    console.log('  2. Use the API to generate videos:');
    console.log(`     POST /api/generate/video/${promptsData.videoId}`);
    console.log('  3. Or generate only important scenes:');
    console.log(`     POST /api/generate/video/${promptsData.videoId}`);
    console.log(`     Body: {"sceneIndices": [${promptsData.prompts.filter(p => p.importance >= 8).map(p => p.sceneIndex).join(', ')}]}`);

} catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
}
