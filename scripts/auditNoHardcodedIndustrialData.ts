import fs from 'fs';
import path from 'path';

console.log('🔍 Executing Industrial Data & Secret Scanning Mechanical Audit (Sprint F-QA.1)...');

const ROOT_DIR = process.cwd();

const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage', 'docs', 'tests', 'stubs'];
const EXCLUDED_EXTENSIONS = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx', '.d.ts', '.md', '.json', '.map', '.png', '.jpg', '.pdf', '.ico', '.svg'];

let violations: Array<{ file: string; line: number; rule: string; detail: string }> = [];

function isExcluded(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  if (EXCLUDED_DIRS.some(d => normalized.includes(`/${d}/`) || normalized.startsWith(`${d}/`))) {
    return true;
  }
  if (normalized.includes('/__tests__/') || normalized.includes('/fixtures/') || normalized.includes('scripts/qa/')) {
    return true;
  }
  if (EXCLUDED_EXTENSIONS.some(ext => normalized.endsWith(ext))) {
    return true;
  }
  return false;
}

const SUSPICIOUS_FICTITIOUS_PATTERNS = [
  { rule: 'FAKE_OPERATOR_NAME', regex: /\b(PetroFake|ACME Oil|FakeRefinery|SimulatedCompany)\b/i },
  { rule: 'HARDCODED_API_KEY', regex: /\bAIzaSy[A-Za-z0-9_-]{33}\b/ },
  { rule: 'PRIVATE_KEY_HEADER', regex: /-----BEGIN PRIVATE KEY-----/ },
  { rule: 'HARDCODED_JWT_SECRET', regex: /secretKey\s*:\s*['"][a-zA-Z0-9_-]{16,}['"]/i }
];

function scanFile(filePath: string) {
  const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

    SUSPICIOUS_FICTITIOUS_PATTERNS.forEach(pat => {
      if (pat.regex.test(line)) {
        violations.push({
          file: relativePath,
          line: lineNum,
          rule: pat.rule,
          detail: `Suspicious pattern detected: ${trimmed}`
        });
      }
    });
  });
}

function scanDirectory(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!isExcluded(fullPath)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      if (!isExcluded(fullPath)) {
        scanFile(fullPath);
      }
    }
  }
}

const TARGET_PATHS = ['src', 'functions/src', 'server.ts'];

TARGET_PATHS.forEach(p => {
  const fullPath = path.join(ROOT_DIR, p);
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) scanDirectory(fullPath);
    else if (stat.isFile() && !isExcluded(fullPath)) scanFile(fullPath);
  }
});

console.log(`\n--- INDUSTRIAL DATA & SECRETS AUDIT REPORT ---`);
if (violations.length > 0) {
  console.error(`❌ FAILED: Found ${violations.length} violations:\n`);
  violations.forEach(v => {
    console.error(`  - [${v.rule}] ${v.file}:${v.line}`);
    console.error(`    Detail: ${v.detail}\n`);
  });
  process.exit(1);
} else {
  console.log(`✅ PASSED: 0 fictitious data / hardcoded secrets found in production code.`);
  process.exit(0);
}
