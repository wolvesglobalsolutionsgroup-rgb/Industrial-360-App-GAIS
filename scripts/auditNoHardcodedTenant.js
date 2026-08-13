import fs from 'fs';
import path from 'path';

// C2 — Lista explícita de rutas/patrones excluidos (archivos de documentación, configuración pública de la plataforma, datos de prueba/seed, tests)
const EXCLUDED_PATHS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'functions/lib',
  '__tests__',
  'docs/',
  'scripts/',
  'src/lib/__tests__',
  'functions/src/__tests__',
  'scripts/auditNoHardcodedTenant.js',
  'firebase-applet-config.json',
  '.github/',
];

const EXCLUDED_EXTENSIONS = ['.test.ts', '.spec.ts', '.mock.ts', '.map', '.png', '.jpg', '.pdf', '.ico', '.svg', '.md'];

// Patrones prohibidos en código fuente de producción
const PROHIBITED_PATTERNS = [
  { name: 'Hardcoded legacy orgId (semax_pino)', regex: /\bsemax_pino\b/g },
  { name: 'Hardcoded legacy projId (PROJ-001)', regex: /\bPROJ-001\b/g },
  { name: 'Fallback a orgId legado (|| \'semax_pino\')', regex: /\|\|\s*['"]semax_pino['"]/g },
  { name: 'Fallback a projId legado (|| \'PROJ-001\')', regex: /\|\|\s*['"]PROJ-001['"]/g },
  { name: 'Secreto o API Key expuesta en código client-side', regex: /AIzaSy[A-Za-z0-9_-]{33}/g },
  { name: 'Llave privada RSA o token estático hardcodeado', regex: /-----BEGIN PRIVATE KEY-----/g },
];

let violationCount = 0;
const violations = [];

function isExcluded(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (EXCLUDED_PATHS.some(ex => normalized.includes(ex))) {
    return true;
  }
  if (EXCLUDED_EXTENSIONS.some(ext => normalized.endsWith(ext))) {
    return true;
  }
  return false;
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const normalizedPath = fullPath.replace(/\\/g, '/');

    if (isExcluded(normalizedPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      scanFile(normalizedPath);
    }
  }
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      PROHIBITED_PATTERNS.forEach(pattern => {
        if (pattern.regex.test(line)) {
          // Reset regex state
          pattern.regex.lastIndex = 0;
          violationCount++;
          violations.push({
            file: filePath,
            line: index + 1,
            pattern: pattern.name,
            content: line.trim(),
          });
        }
      });
    });
  } catch (err) {
    // Ignorar archivos no leíbles
    console.warn('[auditNoHardcodedTenant] file read/scan failed', err);
  }
}

console.log('🔍 Iniciando Auditoría de Hardcodes de Tenant y Secretos...');
scanDirectory(process.cwd());

if (violationCount > 0) {
  console.error(`\n❌ AUDITORÍA FALLIDA: Se encontraron ${violationCount} violaciones de hardcode o secretos:\n`);
  violations.forEach(v => {
    console.error(`  - [${v.pattern}] en ${v.file}:${v.line}`);
    console.error(`    Código: ${v.content}\n`);
  });
  process.exit(1);
} else {
  console.log('✅ AUDITORÍA EXITOSA: Cero hardcodes de tenant ni secretos detectados.');
  process.exit(0);
}
