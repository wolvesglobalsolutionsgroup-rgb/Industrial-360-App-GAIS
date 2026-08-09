import fs from 'fs';
import path from 'path';

console.log('🔍 Executing Tenant Isolation Mechanical Audit (Sprint F-QA.1)...');

const ROOT_DIR = process.cwd();

// Excluded paths and extensions
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

function scanFile(filePath) {
  const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

    // 1. Hardcoded tenant fallbacks in code
    if (/\|\|\s*['"](semax_pino|org_[a-zA-Z0-9_-]+|default_org|test_org)['"]/i.test(line) && !relativePath.includes('scripts/qa')) {
      violations.push({
        file: relativePath,
        line: lineNum,
        rule: 'HARDCODED_TENANT_FALLBACK',
        detail: `Hardcoded tenant fallback detected: ${trimmed}`
      });
    }

    // 2. Logging token/secret strings
    if (/console\.(log|info|warn|error)\(.*(idToken|bearer|authHeader|secretKey|privateKey).*\)/i.test(line)) {
      // Ignore logger.ts or authorized safe logs that mask values
      if (!relativePath.endsWith('logger.ts') && !line.includes('status=') && !line.includes('redact') && !line.includes('length')) {
        violations.push({
          file: relativePath,
          line: lineNum,
          rule: 'TOKEN_OR_SECRET_LOGGING',
          detail: `Potential credential/token logging detected: ${trimmed}`
        });
      }
    }

    // 3. Unchecked orgId usage in Cloud Functions (must use resolveAuthorizedOrgId or requireAuth)
    if (relativePath.startsWith('functions/src/') && !relativePath.includes('authorizer.ts') && !relativePath.includes('middleware/')) {
      if (/const\s+\{\s*orgId\s*\}\s*=\s*req\.(body|query|params)/.test(line)) {
        // Check if resolveAuthorizedOrgId is called nearby or in same file
        if (!content.includes('resolveAuthorizedOrgId') && !content.includes('req.user.orgId')) {
          violations.push({
            file: relativePath,
            line: lineNum,
            rule: 'UNVERIFIED_CLIENT_ORGID',
            detail: `Direct unverified orgId from client request without resolveAuthorizedOrgId: ${trimmed}`
          });
        }
      }
    }
  });
}

function scanDirectory(dir) {
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

// Target directories for audit
const targetDirs = ['functions/src', 'server.ts', 'src/lib/repositories', 'src/pages', 'src/workflows'];

targetDirs.forEach(target => {
  const fullPath = path.join(ROOT_DIR, target);
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (stat.isFile() && !isExcluded(fullPath)) {
      scanFile(fullPath);
    }
  }
});

console.log(`\n--- TENANT ISOLATION AUDIT REPORT ---`);
if (violations.length > 0) {
  console.error(`❌ FAILED: Found ${violations.length} tenant isolation violations:\n`);
  violations.forEach(v => {
    console.error(`  - [${v.rule}] ${v.file}:${v.line}`);
    console.error(`    Detail: ${v.detail}\n`);
  });
  process.exit(1);
} else {
  console.log(`✅ PASSED: 0 tenant isolation violations found across server and repository layers.`);
  process.exit(0);
}
