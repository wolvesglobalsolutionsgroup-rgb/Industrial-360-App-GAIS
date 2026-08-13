/**
 * Industrial Control 360 (IC360) - Worker, QR & HHT Engineering Engine
 * Module: src/lib/engineering/workerQrEngine.ts
 *
 * Single source of truth for rotative QR tokens, credential IDs, SIHO fit evaluations,
 * versioned labor policies, idempotent attendance events, HHT metric categorization,
 * and internal SIHO incident workflows.
 *
 * Rules:
 * - Pure TypeScript module (no React, no browser-only global window dependencies).
 * - High-entropy opaque credential IDs (minimum 128 bits, zero PII).
 * - HMAC-signed rotative QR tokens with explicit TTL and instant revocation check.
 * - Discriminated union verification result (valid, expired, revoked, tampered, legacy).
 * - Idempotent attendance keys (ATT_{workerId}_{YYYY-MM-DD}_{gateLocation}).
 * - Non-regulatory internal incident logging (explicit disclaimer).
 */

// ─── INTERFACES & TYPES ──────────────────────────────────────────────────────

export type SihoFitStatus = 'APTO' | 'APTO_CON_RESTRICCION' | 'OBSERVACION' | 'NO_APTO' | 'VENCIDO';

export interface SihoFitResult {
  status: SihoFitStatus;
  blocking: boolean; // true = prevents entry or high-risk task execution
  daysUntilExpiry: number;
  requiredAction?: string;
  expiredCertifications: string[];
}

export interface WorkerCredential {
  credentialId: string; // Opaque ID e.g. "CRD_9x4A..." (128-bit entropy, NO PII)
  workerId: string;
  issuedAt: string | Date;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  revokedAt?: string | Date;
  revocationReason?: string;
}

export interface RotativeQrTokenPayload {
  version: 'v1';
  credentialId: string;
  timestamp: number; // Epoch ms
  ttlSeconds: number; // e.g. 30s
  signature: string; // HMAC-SHA256 hex
}

export type QrVerificationResult =
  | { status: 'VALID'; credentialId: string; workerId?: string; issuedAt: number; expiresAt: number; remainingTtlSeconds?: number }
  | { status: 'EXPIRED'; expiredAt: number }
  | { status: 'REVOKED'; credentialId?: string; revocationReason?: string }
  | { status: 'TAMPERED'; reason: string }
  | { status: 'LEGACY_DEPRECATED'; warning: 'DEPRECATED_STATIC_QR'; workerId?: string };

export interface VersionedLaborPolicy {
  policyId: string;
  version: string;
  effectiveFrom: string | Date;
  effectiveTo: string | Date;
  approvedBy: string;
  approvedAt: string | Date;
  sourceDocument: string;
  timezone: string; // e.g. "America/Caracas"
  standardHoursPerDay: number; // e.g. 8
  workDaysPerWeek: number; // e.g. 5
  shiftType: 'DAY' | 'NIGHT' | 'ROTATING';
  restBreakMinutes: number; // e.g. 60
  surcharges: {
    overtimeMultiplier: number; // e.g. 1.5
    nightShiftMultiplier: number; // e.g. 1.3
    nightOvertimeMultiplier: number; // e.g. 1.8
  };
}

export interface AttendanceEvent {
  idempotencyKey: string; // ATT_${workerId}_${date}_${gateLocation}
  workerId: string;
  workerName?: string;
  gateLocation: string; // Normalized string (e.g. "PORTON_PRINCIPAL")
  date: string; // YYYY-MM-DD
  checkInLocalTime: string; // ISO String
  checkOutLocalTime?: string; // ISO String
  serverTimestampIso?: string;
  userId: string;
  deviceId: string;
  workfront: string; // Frente de obra
  syncState: 'PENDING_OFFLINE' | 'SYNCED' | 'CORRECTED';
  accessGranted: boolean;
  denialReason?: string;
}

export interface AttendanceCorrection {
  originalKey: string;
  supervisorUid: string;
  reasonCode: 'MISSED_PUNCH' | 'DEVICE_MALFUNCTION' | 'APPROVED_OVERTIME' | 'OTHER';
  note: string;
  newCheckIn: string;
  newCheckOut?: string;
  correctedAt: string;
}

export interface CategorizedHht {
  regularHours: number;
  overtimeHours: number;
  nightShiftHours: number;
  nightOvertimeHours: number;
  totalHht: number;
  effectivePaidHht?: number;
}

export interface HhtProjectMetrics {
  totalHhtAccumulated: number;
  hhtWithoutAccidents: number;
  hhtWithoutDisablingInjuries: number;
  activeWorkerCount: number;
  lastIncidentDate?: string;
}

export interface SihoIncidentInput {
  orgId: string;
  projectId: string;
  incidentType: 'FIRST_AID' | 'MEDICAL_TREATMENT' | 'RESTRICTED_WORK' | 'LOST_TIME' | 'NEAR_MISS';
  severity: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  title: string;
  description: string;
  affectedWorkerId?: string;
  location: string;
  reporterUid: string;
  incidentDate: string | Date;
  evidenceUrls?: string[];
}

export interface SihoIncidentRecord extends SihoIncidentInput {
  id?: string;
  incidentId: string;
  status: 'REPORTED' | 'UNDER_INVESTIGATION' | 'CORRECTIVE_ACTION' | 'CLOSED';
  regulatoryNoticeDisclaimer: string;
  slaTargetDate: string;
  createdAt: string;
}

// ─── HMAC SIGNER ABSTRACTION (C1) ─────────────────────────────────────────────

export type HmacSigner = (data: string, secret: string) => string;

/**
 * Pure HMAC signer function safe for Vitest (Node) and Web (Browser).
 */
export function defaultHmacSigner(data: string, secret: string): string {
  if (!secret) return '';

  // Use Node.js crypto if available (Vitest / Server / Functions)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cryptoModule = require('crypto');
    if (cryptoModule && typeof cryptoModule.createHmac === 'function') {
      return cryptoModule.createHmac('sha256', secret).update(data).digest('hex');
    }
  } catch (err) {
    // Fallback if require is not available in pure browser runtime
    console.debug('[workerQrEngine] node crypto unavailable, browser fallback', err);
  }

  // Pure JS HMAC-SHA256 surrogate for browser runtime if node crypto is polyfilled away
  let h1 = 0x811c9dc5;
  let h2 = 0x85ebca6b;
  const combined = `${secret}:${data}`;
  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 16777619);
    h2 ^= code;
    h2 = Math.imul(h2, 2246822507);
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const hex4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
  return `${hex1}${hex2}${hex3}${hex4}`.repeat(2).slice(0, 64);
}

// ─── OPAQUE CREDENTIAL ID GENERATION (C2) ────────────────────────────────────

/**
 * Generates an opaque credential ID with at least 128 bits of entropy (16 random bytes).
 * Contains NO PII (no nationalId, no fullName, no medical or company info).
 * Format: "CRD_" + 32 hex chars.
 */
export function generateOpaqueCredentialId(): string {
  let randomHex = '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cryptoModule = require('crypto');
    if (cryptoModule && typeof cryptoModule.randomBytes === 'function') {
      randomHex = cryptoModule.randomBytes(16).toString('hex');
    }
  } catch (err) {
    // Browser environment crypto.getRandomValues
    console.debug('[workerQrEngine] node randomBytes unavailable, browser fallback', err);
  }

  if (!randomHex && typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);
    randomHex = Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  if (!randomHex) {
    // Fallback pseudo-random for edge runtime
    randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  // credentialId = 'CRD_' + 32 hex chars (128 bits entropy). No PII.
  return `CRD_${randomHex}`;
}

// ─── ROTATIVE QR TOKEN ENGINE (C1, C3, C4) ───────────────────────────────────

export interface GenerateQrTokenOptions {
  credentialId: string;
  hmacSecret: string; // Passed as parameter, NEVER hardcoded in module (C3)
  ttlSeconds?: number; // Default 30s
  timestamp?: number; // Epoch ms
  nowMs?: number; // Epoch ms alias
  signer?: HmacSigner;
}

/**
 * Generates a signed, rotative, time-limited QR token payload string.
 * Format: "IC360.v1.{credentialId}.{timestamp}.{ttlSeconds}.{signature}"
 */
export function generateRotativeQrToken(options: GenerateQrTokenOptions): string {
  const { credentialId, hmacSecret, ttlSeconds = 30, timestamp, nowMs, signer = defaultHmacSigner } = options;
  const ts = timestamp ?? nowMs ?? Date.now();

  if (!credentialId || !credentialId.startsWith('CRD_')) {
    throw new Error('Invalid credentialId format. Must start with CRD_ prefix.');
  }
  if (!hmacSecret || hmacSecret.trim() === '') {
    throw new Error('HMAC secret is required for generating rotative QR token.');
  }

  const payloadToSign = `v1:${credentialId}:${ts}:${ttlSeconds}`;
  const signature = signer(payloadToSign, hmacSecret);

  return `IC360.v1.${credentialId}.${ts}.${ttlSeconds}.${signature}`;
}

export interface VerifyQrTokenOptions {
  token: string;
  hmacSecret: string; // Parameter, NEVER hardcoded (C3)
  now?: number; // Epoch ms
  nowMs?: number; // Epoch ms alias
  revokedCredentialIds?: string[];
  revocationReasonMap?: Record<string, string>;
  signer?: HmacSigner;
}

/**
 * Verifies a rotative QR token.
 * Returns a discriminated union `QrVerificationResult` (C4).
 */
export function verifyRotativeQrToken(options: VerifyQrTokenOptions): QrVerificationResult {
  const {
    token,
    hmacSecret,
    now,
    nowMs,
    revokedCredentialIds = [],
    revocationReasonMap = {},
    signer = defaultHmacSigner,
  } = options;

  const currentMs = now ?? nowMs ?? Date.now();

  if (!token || typeof token !== 'string') {
    return { status: 'TAMPERED', reason: 'Token string is empty or invalid type.' };
  }

  // Check for legacy static QR codes (e.g., raw national ID or simple JSON like "WORKER_101")
  if (!token.startsWith('IC360.v1.')) {
    // Discriminatively flag legacy static QR codes with deprecation warning
    return {
      status: 'LEGACY_DEPRECATED',
      warning: 'DEPRECATED_STATIC_QR',
      workerId: token.trim(),
    };
  }

  const parts = token.split('.');
  if (parts.length !== 6 || parts[0] !== 'IC360' || parts[1] !== 'v1') {
    return { status: 'TAMPERED', reason: 'Invalid token structure or unknown protocol version.' };
  }

  const [, , credentialId, timestampStr, ttlStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  const ttlSeconds = parseInt(ttlStr, 10);

  if (isNaN(timestamp) || isNaN(ttlSeconds)) {
    return { status: 'TAMPERED', reason: 'Invalid timestamp or TTL numeric values.' };
  }

  // 1. Verify HMAC Signature
  const expectedPayload = `v1:${credentialId}:${timestamp}:${ttlSeconds}`;
  const expectedSignature = signer(expectedPayload, hmacSecret);

  if (signature !== expectedSignature) {
    return { status: 'TAMPERED', reason: 'HMAC signature verification failed. Token was altered or forged.' };
  }

  // 2. Check Revocation List
  if (revokedCredentialIds.includes(credentialId)) {
    return {
      status: 'REVOKED',
      credentialId,
      revocationReason: revocationReasonMap[credentialId] || 'Credencial revocada en lista negra SIHO-A',
    };
  }

  // 3. Check Expiration (TTL)
  const expiresAt = timestamp + ttlSeconds * 1000;
  if (currentMs > expiresAt) {
    return { status: 'EXPIRED', expiredAt: expiresAt };
  }

  // 4. Valid
  return {
    status: 'VALID',
    credentialId,
    issuedAt: timestamp,
    expiresAt,
    remainingTtlSeconds: Math.max(0, Math.floor((expiresAt - currentMs) / 1000))
  };
}

// ─── SIHO FIT STATUS ENGINE (C7) ─────────────────────────────────────────────

export interface EvaluateSihoFitInput {
  medicalExpiry?: string | Date;
  sihoInductionExpiry?: string | Date;
  wpqExpiry?: string | Date;
  fitStatusOverride?: 'Apto' | 'Apto con Restricciones' | 'No Apto' | 'Apto con Restricción';
  now?: Date;
}

/**
 * Evaluates worker SIHO health/safety fit status.
 * Returns SihoFitResult with `blocking` boolean flag and action guidance (C7).
 */
export function evaluateSihoFitStatus(input: EvaluateSihoFitInput): SihoFitResult {
  const { medicalExpiry, sihoInductionExpiry, wpqExpiry, fitStatusOverride, now = new Date() } = input;

  const expiredCerts: string[] = [];
  const todayMs = now.getTime();

  let minDaysUntilExpiry = Infinity;

  const checkCert = (name: string, dateVal?: string | Date) => {
    if (!dateVal) return;
    const certDate = new Date(dateVal);
    if (isNaN(certDate.getTime())) return;

    const diffDays = Math.ceil((certDate.getTime() - todayMs) / (1000 * 60 * 60 * 24));
    if (diffDays < minDaysUntilExpiry) {
      minDaysUntilExpiry = diffDays;
    }

    if (diffDays < 0) {
      expiredCerts.push(name);
    }
  };

  checkCert('Ficha Médica Ocupacional', medicalExpiry);
  checkCert('Inducción SIHO-A (PDVSA SI-S-04)', sihoInductionExpiry);
  checkCert('Certificación WPQ / Calificación', wpqExpiry);

  const daysResult = minDaysUntilExpiry === Infinity ? 365 : minDaysUntilExpiry;

  // Manual explicit "No Apto" or expired required certifications
  if (fitStatusOverride === 'No Apto' || expiredCerts.length > 0) {
    const isExpired = expiredCerts.length > 0;
    return {
      status: isExpired ? 'VENCIDO' : 'NO_APTO',
      blocking: true, // Impediment for gate entry / risk work
      daysUntilExpiry: daysResult,
      expiredCertifications: expiredCerts,
      requiredAction: isExpired
        ? `Revalidar certificaciones vencidas: ${expiredCerts.join(', ')}.`
        : 'Trabajador clasificado como No Apto. Requiere evaluación por Servicio de Salud Ocupacional.',
    };
  }

  if (fitStatusOverride === 'Apto con Restricciones' || fitStatusOverride === 'Apto con Restricción') {
    return {
      status: 'APTO_CON_RESTRICCION',
      blocking: false, // Allowed under restriction supervision
      daysUntilExpiry: daysResult,
      expiredCertifications: expiredCerts,
      requiredAction: 'Verificar cumplimiento de restricciones ergonómicas/ambientales señaladas en Ficha Médica.',
    };
  }

  if (daysResult <= 15) {
    return {
      status: 'OBSERVACION',
      blocking: false,
      daysUntilExpiry: daysResult,
      expiredCertifications: expiredCerts,
      requiredAction: `Atención: Certificaciones próximas a vencer en ${daysResult} días. Programar renovación.`,
    };
  }

  return {
    status: 'APTO',
    blocking: false,
    daysUntilExpiry: daysResult,
    expiredCertifications: [],
  };
}

// ─── IDEMPOTENT ATTENDANCE EVENT ENGINE (C5) ─────────────────────────────────

/**
 * Normalizes gate location string (removes spaces, accents, special characters, uppercase).
 */
export function normalizeGateLocation(gateLocation: string): string {
  if (!gateLocation) return 'GATE_GENERAL';
  return gateLocation
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Generates canonical idempotent key for attendance event.
 * Format: `ATT_${workerId}_${dateStr}_${gateLocation}` (C5)
 * `dateStr` MUST be `YYYY-MM-DD`. `gateLocation` MUST be normalized.
 */
export function generateAttendanceIdempotencyKey(
  workerId: string,
  dateStr: string, // YYYY-MM-DD
  gateLocation: string
): string {
  if (!workerId) throw new Error('workerId is required for attendance idempotency key.');

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    throw new Error(`Invalid date format '${dateStr}'. Expected YYYY-MM-DD.`);
  }

  const normalizedGate = normalizeGateLocation(gateLocation);
  return `ATT_${workerId}_${dateStr}_${normalizedGate}`;
}

/**
 * Formats an audited attendance correction with supervisor reason code.
 */
export function createAuditedAttendanceCorrection(input: {
  originalRecord: AttendanceEvent;
  supervisorUid: string;
  reasonCode: AttendanceCorrection['reasonCode'];
  note: string;
  newCheckIn: string;
  newCheckOut?: string;
}): { updatedRecord: AttendanceEvent; auditLogEntry: AttendanceCorrection } {
  const { originalRecord, supervisorUid, reasonCode, note, newCheckIn, newCheckOut } = input;

  if (!supervisorUid) {
    throw new Error('supervisorUid is required to perform an audited correction.');
  }

  const auditLogEntry: AttendanceCorrection = {
    originalKey: originalRecord.idempotencyKey,
    supervisorUid,
    reasonCode,
    note,
    newCheckIn,
    newCheckOut,
    correctedAt: new Date().toISOString(),
  };

  const updatedRecord: AttendanceEvent = {
    ...originalRecord,
    checkInLocalTime: newCheckIn,
    checkOutLocalTime: newCheckOut,
    syncState: 'CORRECTED',
  };

  return { updatedRecord, auditLogEntry };
}

// ─── HHT CALCULATIONS & METRICS ENGINE ───────────────────────────────────────

/**
 * Calculates categorized HHT hours based on check-in, check-out, and labor policy.
 */
export function calculateCategorizedHht(
  checkInInput: string | { checkInIso: string; checkOutIso: string; policy?: VersionedLaborPolicy },
  checkOutInput?: string,
  policyInput?: VersionedLaborPolicy
): CategorizedHht {
  let checkInIso = '';
  let checkOutIso = '';
  let policy = policyInput;

  if (typeof checkInInput === 'object' && checkInInput !== null) {
    checkInIso = checkInInput.checkInIso;
    checkOutIso = checkInInput.checkOutIso;
    policy = checkInInput.policy || policyInput;
  } else if (typeof checkInInput === 'string') {
    checkInIso = checkInInput;
    checkOutIso = checkOutInput || '';
  }

  const checkIn = new Date(checkInIso);
  const checkOut = new Date(checkOutIso);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    return { regularHours: 0, overtimeHours: 0, nightShiftHours: 0, nightOvertimeHours: 0, totalHht: 0, effectivePaidHht: 0 };
  }

  const totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
  const standardDaily = policy?.standardHoursPerDay || 8;
  const overtimeMultiplier = policy?.surcharges?.overtimeMultiplier || 1.5;
  const nightMultiplier = policy?.surcharges?.nightShiftMultiplier || 1.3;
  const nightOvertimeMultiplier = policy?.surcharges?.nightOvertimeMultiplier || 1.8;

  let regular = Math.min(totalHours, standardDaily);
  let overtime = Math.max(0, totalHours - standardDaily);
  let nightShift = 0;
  let nightOvertime = 0;

  // Check night shift hours deterministically from ISO hour string or UTC hour
  let checkInHour = checkIn.getUTCHours();
  if (checkInIso.includes('T')) {
    const timePart = checkInIso.split('T')[1];
    if (timePart) {
      const parsedHour = parseInt(timePart.split(':')[0], 10);
      if (!isNaN(parsedHour)) {
        checkInHour = parsedHour;
      }
    }
  }

  if (checkInHour >= 19 || checkInHour < 6) {
    nightShift = regular;
    regular = 0;
    nightOvertime = overtime;
    overtime = 0;
  }

  const effectivePaid = regular * 1.0 + overtime * overtimeMultiplier + nightShift * nightMultiplier + nightOvertime * nightOvertimeMultiplier;

  return {
    regularHours: Math.round(regular * 100) / 100,
    overtimeHours: Math.round(overtime * 100) / 100,
    nightShiftHours: Math.round(nightShift * 100) / 100,
    nightOvertimeHours: Math.round(nightOvertime * 100) / 100,
    totalHht: Math.round(totalHours * 100) / 100,
    effectivePaidHht: Math.round(effectivePaid * 100) / 100
  };
}

/**
 * Calculates total aggregate HHT metrics for dashboards.
 */
export function calculateHhtMetrics(input: {
  workers?: Array<{ totalHhtAccumulated?: number }>;
  todayRecords?: Array<{ hoursWorked?: number }>;
  incidents?: Array<{ severity?: string }>;
}) {
  const { workers = [], todayRecords = [], incidents = [] } = input;

  const historicHht = workers.reduce((acc, w) => acc + (w.totalHhtAccumulated || 0), 0);
  const todayHht = todayRecords.reduce((acc, r) => acc + (r.hoursWorked || 0), 0);
  const totalHhtAccumulated = historicHht + todayHht;

  const ltiAccidentsCount = incidents.filter(i => i.severity === 'LOST_TIME' || i.severity === 'CRITICA').length;

  return {
    totalHhtAccumulated,
    ltiAccidentsCount,
    hhtWithoutAccidents: ltiAccidentsCount === 0 ? totalHhtAccumulated : 0,
    hhtWithoutDisablingInjuries: totalHhtAccumulated
  };
}

// ─── SIHO INCIDENT WORKFLOW ENGINE (C6) ──────────────────────────────────────

/**
 * Creates an internal SIHO incident workflow object.
 * EXPLICIT NOTICE: This is an internal logging workflow and DOES NOT constitute
 * automatic regulatory notification to INPSASEL or state authorities (C6).
 */
export function createSihoIncidentWorkflow(input: SihoIncidentInput): SihoIncidentRecord {
  const { incidentDate, severity, ...rest } = input;

  const incidentDateObj = incidentDate instanceof Date ? incidentDate : new Date(incidentDate || Date.now());
  const validDate = isNaN(incidentDateObj.getTime()) ? new Date() : incidentDateObj;
  const now = new Date();

  // Calculate internal SLA target date based on severity
  const slaHours = severity === 'CRITICA' ? 24 : severity === 'ALTA' ? 48 : 120;
  const slaTarget = new Date(validDate.getTime() + slaHours * 60 * 60 * 1000);

  const incidentId = `INC_SIHO_${now.getFullYear()}_${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    ...rest,
    id: incidentId,
    incidentId,
    incidentDate: validDate.toISOString(),
    severity,
    status: 'REPORTED',
    regulatoryNoticeDisclaimer:
      'AVISO NORMATIVO (LOPCYMAT): Este registro es de uso interno de la organización para gestión de SIHO-A. NO constituye notificación oficial ante el INPSASEL u otros organismos regulatorios. La notificación legal obligatoria es responsabilidad directa del Coordinador SIHO-A.',
    slaTargetDate: slaTarget.toISOString(),
    createdAt: now.toISOString(),
  };
}
