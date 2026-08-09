import fs from 'fs';
import path from 'path';

console.log('🔍 Executing Firestore Guardrails Mechanical Audit (Sprint F-QA.1)...');

const ROOT_DIR = process.cwd();
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage', 'docs', 'stubs'];
const EXCLUDED_EXTENSIONS = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx', '.d.ts', '.md', '.json', '.map'];

let violations = [];

function isExcluded(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (EXCLUDED_DIRS.some(d => normalized.includes(`/${d}/`) || normalized.startsWith(`${d}/`))) {
    return true;
  }
  if (normalized.includes('/__tests__/') || normalized.includes('/fixtures/')) {
    return true;
  }
  if (EXCLUDED_EXTENSIONS.some(ext => normalized.endsWith(ext))) {
    return true;
  }
  return false;
}

// 1. Audit src/pages for unconstrained queries / listeners
const pagesDir = path.join(ROOT_DIR, 'src/pages');
if (fs.existsSync(pagesDir)) {
  const files = fs.readdirSync(pagesDir).filter(f => (f.endsWith('.tsx') || f.endsWith('.ts')) && !isExcluded(f));
  
  files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Skip comments
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

      // Check onSnapshot or getDocs direct calls in src/pages that lack limit / limitCount
      if (/(onSnapshot|getDocs)\s*\(/.test(line)) {
        // Look at surrounding 10 lines for limit, limitCount, or repository call
        const windowStart = Math.max(0, index - 5);
        const windowEnd = Math.min(lines.length - 1, index + 5);
        const snippet = lines.slice(windowStart, windowEnd).join('\n');

        if (!/limit|limitCount|getPaginated|doc\(|doc\s*=/i.test(snippet)) {
          violations.push({
            file: `src/pages/${file}`,
            line: lineNum,
            rule: 'UNLIMITED_FIRESTORE_QUERY',
            detail: `Direct onSnapshot/getDocs without limit in page component: ${trimmed}`
          });
        }
      }
    });
  });
}

// 2. Audit firestore.rules for global read/write or mutable orgId or client-editable quotaUsage
const rulesPath = path.join(ROOT_DIR, 'firestore.rules');
if (fs.existsSync(rulesPath)) {
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  const rulesLines = rulesContent.split('\n');

  // Check for allow write: if true / allow read: if true
  rulesLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (/allow\s+(read|write|create|update|delete)\s*:\s*if\s+true\s*;/i.test(trimmed)) {
      violations.push({
        file: 'firestore.rules',
        line: idx + 1,
        rule: 'GLOBAL_FIRESTORE_RULE_PERMISSIVE',
        detail: `Wildcard allow rule without auth/tenant check: ${trimmed}`
      });
    }
  });

  // Check if quotaUsage allows client write
  const quotaUsageBlockMatch = rulesContent.match(/match\s+\/quotaUsage\/[\s\S]*?\{[\s\S]*?\}/);
  if (quotaUsageBlockMatch) {
    const block = quotaUsageBlockMatch[0];
    if (/allow\s+(write|create|update|delete)\s*:\s*if\s+(true|request\.auth)/i.test(block)) {
      if (!block.includes('allow write: if false') && !block.includes('allow create: if false')) {
        violations.push({
          file: 'firestore.rules',
          line: 1,
          rule: 'QUOTA_USAGE_CLIENT_WRITE',
          detail: `quotaUsage collection rule permits client-side write access`
        });
      }
    }
  }

  // Check orgId immutability rule on update
  if (!rulesContent.includes('request.resource.data.orgId == resource.data.orgId')) {
    violations.push({
      file: 'firestore.rules',
      line: 1,
      rule: 'ORGID_MUTABLE_IN_RULES',
      detail: `firestore.rules does not enforce orgId immutability on document update`
    });
  }
}

console.log(`\n--- FIRESTORE GUARDRAILS AUDIT REPORT ---`);
if (violations.length > 0) {
  console.error(`❌ FAILED: Found ${violations.length} Firestore guardrails violations:\n`);
  violations.forEach(v => {
    console.error(`  - [${v.rule}] ${v.file}:${v.line}`);
    console.error(`    Detail: ${v.detail}\n`);
  });
  process.exit(1);
} else {
  console.log(`✅ PASSED: 0 Firestore query/rule guardrail violations found.`);
  process.exit(0);
}
