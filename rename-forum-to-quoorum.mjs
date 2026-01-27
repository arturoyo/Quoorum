#!/usr/bin/env node
import { readdir, readFile, writeFile, rename as renameFile } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build', '.git', '.turbo'];
const INCLUDE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.sql', '.sh'];

// Reemplazos a hacer (en orden)
const REPLACEMENTS = [
  // Package name
  { from: '@quoorum/forum', to: '@quoorum/quoorum' },

  // Import paths
  { from: /from ['"]@quoorum\/forum/g, to: 'from "@quoorum/quoorum' },
  { from: /import\(['"]@quoorum\/forum/g, to: 'import("@quoorum/quoorum' },

  // Specific names (preserving case)
  { from: /ForumLogger/g, to: 'QuoorumLogger' },
  { from: /forumLogger/g, to: 'quoorumLogger' },
  { from: /FORUM_AGENTS/g, to: 'QUOORUM_AGENTS' },
  { from: /ForumSystem/g, to: 'QuoorumSystem' },
  { from: /forumSystem/g, to: 'quoorumSystem' },

  // Table/schema names with prefix
  { from: /forum_/g, to: 'quoorum_' },
  { from: /forumDebates/g, to: 'quoorumDebates' },
  { from: /forumDeals/g, to: 'quoorumDeals' },
  { from: /forumConsultations/g, to: 'quoorumConsultations' },
  { from: /forumReports/g, to: 'quoorumReports' },
  { from: /forumNotifications/g, to: 'quoorumNotifications' },
  { from: /forumFeedback/g, to: 'quoorumFeedback' },
  { from: /forumApi/g, to: 'quoorumApi' },

  // Enum names
  { from: /forumNotificationTypeEnum/g, to: 'quoorumNotificationTypeEnum' },
  { from: /forumDealStatusEnum/g, to: 'quoorumDealStatusEnum' },
  { from: /forumReportTypeEnum/g, to: 'quoorumReportTypeEnum' },

  // Routes
  { from: /\/forum\//g, to: '/quoorum/' },
  { from: /['"]\/forum['"]/g, to: '"/quoorum"' },

  // Comments and docs (case-sensitive)
  { from: /Forum Dynamic System/g, to: 'Quoorum Dynamic System' },
  { from: /Forum system/g, to: 'Quoorum system' },
  { from: /forum system/g, to: 'quoorum system' },
];

// Files to rename
const FILE_RENAMES = [
  { from: 'forum.ts', to: 'quoorum.ts' },
  { from: 'forum.tsx', to: 'quoorum.tsx' },
  { from: 'forum-', to: 'quoorum-' }, // Prefix match
  { from: 'use-forum', to: 'use-quoorum' },
];

let stats = { filesProcessed: 0, filesModified: 0, filesRenamed: 0 };

async function shouldProcessFile(filePath) {
  const ext = filePath.substring(filePath.lastIndexOf('.'));
  return INCLUDE_EXTENSIONS.includes(ext);
}

async function shouldExcludeDir(dirPath) {
  const dirName = basename(dirPath);
  return EXCLUDE_DIRS.some(exclude => dirPath.includes(`\\${exclude}\\`) || dirPath.endsWith(`\\${exclude}`));
}

async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    let modified = content;
    let hasChanges = false;

    // Apply replacements
    for (const { from, to } of REPLACEMENTS) {
      const newContent = modified.replace(from, to);
      if (newContent !== modified) {
        hasChanges = true;
        modified = newContent;
      }
    }

    if (hasChanges) {
      await writeFile(filePath, modified, 'utf8');
      stats.filesModified++;
      console.log(`[OK] Modified: ${filePath}`);
    }

    stats.filesProcessed++;
  } catch (error) {
    console.error(`[ERROR] Error processing ${filePath}:`, error.message);
  }
}

async function renameFiles(dirPath) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (await shouldExcludeDir(fullPath)) continue;
        await renameFiles(fullPath);
      } else if (entry.isFile()) {
        // Check if file needs renaming
        for (const { from, to } of FILE_RENAMES) {
          if (from.endsWith('-') && entry.name.startsWith(from)) {
            const newName = entry.name.replace(from, to);
            const newPath = join(dirPath, newName);
            await renameFile(fullPath, newPath);
            stats.filesRenamed++;
            console.log(`[OK] Renamed: ${entry.name} → ${newName}`);
            break;
          } else if (entry.name === from) {
            const newPath = join(dirPath, to);
            await renameFile(fullPath, newPath);
            stats.filesRenamed++;
            console.log(`[OK] Renamed: ${entry.name} → ${to}`);
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error(`[ERROR] Error in directory ${dirPath}:`, error.message);
  }
}

async function processDirectory(dirPath) {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (await shouldExcludeDir(fullPath)) {
          console.log(`[SKIP] Skipping: ${fullPath}`);
          continue;
        }
        await processDirectory(fullPath);
      } else if (entry.isFile()) {
        if (await shouldProcessFile(fullPath)) {
          await processFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`[ERROR] Error reading directory ${dirPath}:`, error.message);
  }
}

async function main() {
  console.log('[INFO] Starting Forum → Quoorum refactoring...\n');

  const startTime = Date.now();

  // Step 1: Rename files first
  console.log('[INFO] Step 1: Renaming files...');
  await renameFiles(__dirname);
  console.log(`\n[OK] Files renamed: ${stats.filesRenamed}\n`);

  // Step 2: Process content
  console.log('[INFO] Step 2: Updating file contents...');
  await processDirectory(__dirname);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n[OK] Refactoring complete!');
  console.log(`\nStats:`);
  console.log(`  Files processed: ${stats.filesProcessed}`);
  console.log(`  Files modified: ${stats.filesModified}`);
  console.log(`  Files renamed: ${stats.filesRenamed}`);
  console.log(`  Duration: ${duration}s`);
}

main().catch(console.error);
