#!/usr/bin/env node

// Copy PDF.js worker file to public directory
import { copyFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const publicDir = join(__dirname, '..', 'public');
  mkdirSync(publicDir, { recursive: true });

  const source = join(__dirname, '..', '..', '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
  const dest = join(publicDir, 'pdf.worker.min.mjs');

  copyFileSync(source, dest);
  console.log('[OK] PDF worker copied to public directory');
} catch (error) {
  console.log('[INFO] PDF worker copy skipped (not critical)');
  // Non-critical, continue installation
  process.exit(0);
}
