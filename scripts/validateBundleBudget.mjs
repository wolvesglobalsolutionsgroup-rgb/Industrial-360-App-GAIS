import fs from 'fs';
import path from 'path';

console.log('🔍 Executing Bundle Budget Mechanical Audit (Sprint F-QA.1)...');

const DIST_DIR = path.join(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const MAX_RAW_BYTES = 800 * 1024; // 819,200 bytes (800 KB)

if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('❌ FAILED: dist/index.html does not exist. Please run "npm run build" first.');
  process.exit(1);
}

const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

// 1. Extract entrypoint script tag from index.html
const entryMatch = htmlContent.match(/src=["']\/?assets\/([^"']+\.js)["']/);
if (!entryMatch) {
  console.error('❌ FAILED: Could not find entrypoint script in dist/index.html');
  process.exit(1);
}

const entryFileName = entryMatch[1];
const entryFilePath = path.join(DIST_DIR, 'assets', entryFileName);

if (!fs.existsSync(entryFilePath)) {
  console.error(`❌ FAILED: Entrypoint file assets/${entryFileName} does not exist in dist.`);
  process.exit(1);
}

const stats = fs.statSync(entryFilePath);
const rawBytes = stats.size;
const rawKb = (rawBytes / 1024).toFixed(2);

console.log(`\n--- BUNDLE ENTRYPOINT ANALYSIS ---`);
console.log(`Entrypoint File : ${entryFileName}`);
console.log(`Raw Size        : ${rawBytes.toLocaleString()} B (${rawKb} KB)`);
console.log(`Budget Limit    : ${MAX_RAW_BYTES.toLocaleString()} B (800.00 KB)`);

// 2. Check forbidden modulepreload for heavy chunks
const FORBIDDEN_PRELOAD_PATTERNS = ['pdf', 'excel', 'charts', '3d', 'firebase-firestore'];
const preloadMatches = htmlContent.match(/<link\s+rel=["']modulepreload["'][^>]*href=["']\/?assets\/([^"']+)["']/g) || [];

let forbiddenPreloadsFound = [];

preloadMatches.forEach(tag => {
  FORBIDDEN_PRELOAD_PATTERNS.forEach(pattern => {
    if (tag.includes(pattern)) {
      forbiddenPreloadsFound.push({ tag, pattern });
    }
  });
});

let failed = false;

if (rawBytes > MAX_RAW_BYTES) {
  console.error(`❌ BUDGET EXCEEDED: Entrypoint raw size ${rawKb} KB exceeds 800 KB limit!`);
  failed = true;
} else {
  console.log(`✅ BUDGET PASSED: Entrypoint is within the 800 KB limit.`);
}

if (forbiddenPreloadsFound.length > 0) {
  console.error(`❌ FORBIDDEN MODULEPRELOAD DETECTED: Found modulepreload links for heavy chunks:`);
  forbiddenPreloadsFound.forEach(f => console.error(`  - Pattern: ${f.pattern} in tag: ${f.tag}`));
  failed = true;
} else {
  console.log(`✅ MODULEPRELOAD PASSED: No forbidden heavy chunk preloads found in index.html.`);
}

if (failed) {
  process.exit(1);
} else {
  console.log(`\n✅ ALL BUNDLE BUDGET CHECKS PASSED SUCCESSFULLY.`);
  process.exit(0);
}
