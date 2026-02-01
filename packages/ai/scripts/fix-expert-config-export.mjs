/**
 * Post-build script to fix ExpertConfig export
 *
 * Issue: tsup generates ExpertConfig as a re-export with alias (E as ExpertConfig)
 * which causes TypeScript to treat it as a namespace (TS2709)
 *
 * Solution: Replace the re-export with a direct interface export in index.d.ts
 * and remove the export from the chunk file
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '../dist');
const indexDtsPath = join(distDir, 'index.d.ts');

console.log('🔧 Fixing ExpertConfig export in type definition files...');

try {
  // Step 1: Fix index.d.ts
  let indexContent = readFileSync(indexDtsPath, 'utf-8');

  // Check if already fixed
  if (indexContent.includes('// Direct export to avoid namespace issue') && !indexContent.match(/E as ExpertConfig/)) {
    console.log('✅ index.d.ts already fixed');
  } else {
    // Import AIConfig for the interface definition
    indexContent = indexContent.replace(
      /import { A as AIClient } from '\.\/index-C7btgk39\.js';/,
      `import { A as AIClient, a as AIConfig } from './index-C7btgk39.js';`
    );

    // Remove "E as ExpertConfig" from the export list
    indexContent = indexContent.replace(
      /E as ExpertConfig, /g,
      ''
    );

    // Add direct interface export after imports if not already present
    if (!indexContent.includes('// Direct export to avoid namespace issue')) {
      indexContent = indexContent.replace(
        /import 'ai';/,
        `import 'ai';

// Direct export to avoid namespace issue (TS2709)
export interface ExpertConfig {
    id: string;
    name: string;
    expertise: string;
    systemPrompt: string;
    aiConfig: AIConfig;
}`
      );
    }

    writeFileSync(indexDtsPath, indexContent, 'utf-8');
    console.log('✅ index.d.ts fixed');
  }

  // Step 2: Fix the chunk file (index-*.d.ts)
  const chunkFiles = readdirSync(distDir).filter(f => f.match(/^index-[A-Za-z0-9]+\.d\.ts$/));

  for (const chunkFile of chunkFiles) {
    const chunkPath = join(distDir, chunkFile);
    let chunkContent = readFileSync(chunkPath, 'utf-8');

    // Remove "type ExpertConfig as E" from exports
    const originalChunkContent = chunkContent;
    chunkContent = chunkContent.replace(
      /type ExpertConfig as E, /g,
      ''
    );

    if (chunkContent !== originalChunkContent) {
      writeFileSync(chunkPath, chunkContent, 'utf-8');
      console.log(`✅ ${chunkFile} fixed (removed ExpertConfig export)`);
    }
  }

  console.log('✅ All ExpertConfig exports fixed successfully');
} catch (error) {
  console.error('❌ Error fixing ExpertConfig export:', error.message);
  process.exit(1);
}
