import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const ALLOWED_STATES = new Set([
  'PLANNED',
  'IN_PROGRESS',
  'LOCAL_EVIDENCE_ONLY',
  'EVIDENCE_READY',
  'AUDITED',
  'FOUNDER_GATE_PENDING',
  'CLOSED',
  'BLOCKED',
  'NO_VERIFICADO',
  'SUPERSEDED',
]);

const REQUIRED_GOVERNANCE_FILES = [
  'docs/governance/SPRINT_LEDGER.md',
  'docs/governance/AUDIT_PROTOCOL.md',
  'docs/governance/SECURITY_DECISIONS.md',
];

const SECRET_PATTERNS = [
  { name: 'Private Key Block', pattern: /-----BEGIN (?:RSA )?PRIVATE KEY-----/ },
  { name: 'Google API Key', pattern: /AIzaSy[0-9a-zA-Z_\-]{33}/ },
  { name: 'Bearer JWT Token', pattern: /Bearer\s+eyJ[0-9a-zA-Z_\-]+\.eyJ[0-9a-zA-Z_\-]+\.[0-9a-zA-Z_\-]+/ },
  { name: 'Service Account Private Key', pattern: /"private_key":\s*"-----BEGIN/ },
  { name: 'Stripe Secret Key', pattern: /sk_live_[0-9a-zA-Z]{24,}/ },
  { name: 'AWS Access Key ID', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
];

let errorsCount = 0;

function error(msg) {
  console.error(`❌ ERROR: ${msg}`);
  errorsCount++;
}

function info(msg) {
  console.log(`ℹ️ ${msg}`);
}

function success(msg) {
  console.log(`✅ ${msg}`);
}

console.log('🔍 Validando archivos de gobernanza e integridad del Sprint Ledger (IC360 T1)...\n');

// 1. Verificación de presencia de archivos requeridos
for (const relPath of REQUIRED_GOVERNANCE_FILES) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    error(`Archivo de gobernanza requerido no existe: ${relPath}`);
  } else {
    success(`Archivo existente: ${relPath}`);
  }
}

// 2. Escaneo de secretos en docs/governance
const govDir = path.join(rootDir, 'docs', 'governance');
if (fs.existsSync(govDir)) {
  const govFiles = fs.readdirSync(govDir).filter((f) => f.endsWith('.md'));
  for (const file of govFiles) {
    const filePath = path.join(govDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const { name, pattern } of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        error(`Se detectó un patrón de secreto (${name}) en docs/governance/${file}`);
      }
    }
  }
  if (errorsCount === 0) {
    success('Cero patrones de secretos detectados en docs/governance/');
  }
}

// 3. Parser y validación del SPRINT_LEDGER.md
const ledgerPath = path.join(rootDir, 'docs/governance/SPRINT_LEDGER.md');
if (fs.existsSync(ledgerPath)) {
  const content = fs.readFileSync(ledgerPath, 'utf-8');
  const lines = content.split('\n');

  let tableStarted = false;
  let headers = [];
  const seenIds = new Set();
  const rows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) {
      if (tableStarted && line === '') {
        // Fin de la tabla principal
        break;
      }
      continue;
    }

    const cells = line.split('|').map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    if (cells.length === 0) continue;

    // Detectar encabezado
    if (!tableStarted && cells[0].toLowerCase() === 'id') {
      tableStarted = true;
      headers = cells.map((h) => h.toLowerCase());
      continue;
    }

    // Saltar separador markdown (|---|---|...)
    if (tableStarted && cells[0].startsWith('---')) {
      continue;
    }

    if (tableStarted) {
      rows.push({ lineNum: i + 1, cells });
    }
  }

  if (rows.length === 0) {
    error('No se encontraron filas de datos en la tabla principal de SPRINT_LEDGER.md');
  } else {
    info(`Procesando ${rows.length} registros del Sprint Ledger...`);

    const idIdx = headers.indexOf('id');
    const stateIdx = headers.indexOf('estado');
    const shaBaseIdx = headers.indexOf('sha base');
    const shaDeliveryIdx = headers.indexOf('sha entrega');
    const evidenceIdx = headers.indexOf('evidencia');
    const auditIdx = headers.indexOf('auditoría');
    const gateIdx = headers.indexOf('gate fundador');

    if (idIdx === -1 || stateIdx === -1) {
      error('Encabezados obligatorios ("ID" y "Estado") no encontrados en la tabla de SPRINT_LEDGER.md');
    } else {
      for (const { lineNum, cells } of rows) {
        const id = cells[idIdx];
        const state = cells[stateIdx];
        const shaBase = shaBaseIdx !== -1 ? cells[shaBaseIdx] : '';
        const shaDelivery = shaDeliveryIdx !== -1 ? cells[shaDeliveryIdx] : '';
        const evidence = evidenceIdx !== -1 ? cells[evidenceIdx] : '';
        const audit = auditIdx !== -1 ? cells[auditIdx] : '';
        const gate = gateIdx !== -1 ? cells[gateIdx] : '';

        // Check ID duplicado
        if (!id) {
          error(`Línea ${lineNum}: ID vacío`);
        } else if (seenIds.has(id)) {
          error(`Línea ${lineNum}: ID duplicado "${id}" en Sprint Ledger`);
        } else {
          seenIds.add(id);
        }

        // Check Estado permitido
        if (!ALLOWED_STATES.has(state)) {
          error(`Línea ${lineNum} (${id}): Estado no permitido "${state}". Permitidos: ${Array.from(ALLOWED_STATES).join(', ')}`);
        }

        // Formato SHA (si se especifica y no es NO_VERIFICADO)
        const validateSha = (shaVal, fieldName) => {
          if (!shaVal || shaVal === 'NO_VERIFICADO' || shaVal === '-') return;
          const isHexFull = /^[0-9a-fA-F]{40}$/.test(shaVal);
          const isHexShort = /^[0-9a-fA-F]{7,12}$/.test(shaVal);
          if (!isHexFull && !isHexShort) {
            error(`Línea ${lineNum} (${id}): ${fieldName} malformado "${shaVal}". Debe ser SHA hexadecimal de 40 caracteres o NO_VERIFICADO.`);
          }
        };

        validateSha(shaBase, 'SHA base');
        validateSha(shaDelivery, 'SHA entrega');

        // Exigencias para AUDITED / CLOSED
        if (state === 'AUDITED' || state === 'CLOSED') {
          if (!shaDelivery || shaDelivery === 'NO_VERIFICADO' || shaDelivery === '-') {
            error(`Línea ${lineNum} (${id}): Estado "${state}" requiere un SHA entrega remota válido (40 caracteres hex).`);
          }
          if (!evidence || evidence === 'NO_VERIFICADO' || evidence === '-') {
            error(`Línea ${lineNum} (${id}): Estado "${state}" requiere especificar evidencia de auditoría reproducible.`);
          }
        }

        // Exigencias exclusivas para CLOSED
        if (state === 'CLOSED') {
          if (!audit || audit === 'NO_VERIFICADO' || audit.toLowerCase().includes('pendiente') || audit === '-') {
            error(`Línea ${lineNum} (${id}): Estado "CLOSED" requiere auditoría independiente completada (no "Pendiente").`);
          }
          if (!gate || gate === 'NO_VERIFICADO' || gate.toLowerCase().includes('pendiente') || gate === '-') {
            error(`Línea ${lineNum} (${id}): Estado "CLOSED" requiere gate fundador aprobado.`);
          }
        }
      }
    }
  }
}

if (errorsCount > 0) {
  console.error(`\n❌ Validación del Sprint Ledger FALLÓ con ${errorsCount} error(es).`);
  process.exit(1);
} else {
  console.log('\n🎉 Validación del Sprint Ledger EXITOSA. Todos los documentos de gobernanza son válidos.');
  process.exit(0);
}
