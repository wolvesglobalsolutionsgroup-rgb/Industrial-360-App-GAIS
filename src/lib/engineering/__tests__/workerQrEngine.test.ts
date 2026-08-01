import { describe, it, expect } from 'vitest';
import {
  generateOpaqueCredentialId,
  generateRotativeQrToken,
  verifyRotativeQrToken,
  evaluateSihoFitStatus,
  generateAttendanceIdempotencyKey,
  createAuditedAttendanceCorrection,
  calculateCategorizedHht,
  calculateHhtMetrics,
  createSihoIncidentWorkflow
} from '../workerQrEngine';

describe('S16 — workerQrEngine Unit & Contract Tests', () => {
  const secret = 'TEST_HMAC_SECRET_KEY_2026';

  describe('C2 — Opaque Credential ID', () => {
    it('generates a 128-bit entropy opaque credential ID with CRD_ prefix and no PII', () => {
      const credId = generateOpaqueCredentialId();
      expect(credId).toMatch(/^CRD_[a-f0-9]{32}$/);
      expect(credId).not.toContain('V-');
      expect(credId).not.toContain('Pérez');
    });
  });

  describe('C1, C3, C4 — Rotative QR Token Generation & Verification', () => {
    it('generates a valid rotative QR token and verifies it successfully within TTL', () => {
      const credentialId = generateOpaqueCredentialId();
      const token = generateRotativeQrToken({
        credentialId,
        hmacSecret: secret,
        ttlSeconds: 30
      });

      const res = verifyRotativeQrToken({
        token,
        hmacSecret: secret
      });

      expect(res.status).toBe('VALID');
      if (res.status === 'VALID') {
        expect(res.credentialId).toBe(credentialId);
        expect(res.remainingTtlSeconds).toBeGreaterThan(0);
      }
    });

    it('rejects an expired rotative QR token (TTL expired)', () => {
      const credentialId = generateOpaqueCredentialId();
      // Past timestamp (60 seconds ago)
      const pastMs = Date.now() - 60000;
      const token = generateRotativeQrToken({
        credentialId,
        hmacSecret: secret,
        ttlSeconds: 30,
        nowMs: pastMs
      });

      const res = verifyRotativeQrToken({
        token,
        hmacSecret: secret
      });

      expect(res.status).toBe('EXPIRED');
    });

    it('rejects a revoked credential ID', () => {
      const credentialId = generateOpaqueCredentialId();
      const token = generateRotativeQrToken({
        credentialId,
        hmacSecret: secret,
        ttlSeconds: 30
      });

      const res = verifyRotativeQrToken({
        token,
        hmacSecret: secret,
        revokedCredentialIds: [credentialId]
      });

      expect(res.status).toBe('REVOKED');
      if (res.status === 'REVOKED') {
        expect(res.credentialId).toBe(credentialId);
        expect(res.revocationReason).toBe('Credencial revocada en lista negra SIHO-A');
      }
    });

    it('detects tampered tokens with invalid HMAC signatures', () => {
      const credentialId = generateOpaqueCredentialId();
      const validToken = generateRotativeQrToken({
        credentialId,
        hmacSecret: secret,
        ttlSeconds: 30
      });

      // Alter signature
      const parts = validToken.split('.');
      parts[2] = '0000000000000000000000000000000000000000000000000000000000000000';
      const tamperedToken = parts.join('.');

      const res = verifyRotativeQrToken({
        token: tamperedToken,
        hmacSecret: secret
      });

      expect(res.status).toBe('TAMPERED');
    });

    it('identifies legacy static QR strings with a deprecation warning', () => {
      const legacyQr = 'WORKER_V18492102_JOSE_PEREZ';
      const res = verifyRotativeQrToken({
        token: legacyQr,
        hmacSecret: secret
      });

      expect(res.status).toBe('LEGACY_DEPRECATED');
    });
  });

  describe('C7 — SIHO Fit Status Evaluation', () => {
    it('returns APTO when all certifications are valid and fitStatus is Apto', () => {
      const evalRes = evaluateSihoFitStatus({
        medicalExpiry: '2027-01-01',
        sihoInductionExpiry: '2027-01-01',
        wpqExpiry: '2027-01-01',
        fitStatusOverride: 'Apto'
      });

      expect(evalRes.status).toBe('APTO');
      expect(evalRes.blocking).toBe(false);
      expect(evalRes.expiredCertifications).toHaveLength(0);
    });

    it('returns VENCIDO and blocking: true when medical check is expired', () => {
      const evalRes = evaluateSihoFitStatus({
        medicalExpiry: '2020-01-01',
        sihoInductionExpiry: '2027-01-01',
        fitStatusOverride: 'Apto'
      });

      expect(evalRes.status).toBe('VENCIDO');
      expect(evalRes.blocking).toBe(true);
      expect(evalRes.expiredCertifications).toContain('Ficha Médica Ocupacional');
    });

    it('returns NO_APTO and blocking: true when fitStatusOverride is No Apto', () => {
      const evalRes = evaluateSihoFitStatus({
        medicalExpiry: '2027-01-01',
        sihoInductionExpiry: '2027-01-01',
        fitStatusOverride: 'No Apto'
      });

      expect(evalRes.status).toBe('NO_APTO');
      expect(evalRes.blocking).toBe(true);
    });
  });

  describe('C5 — Canonical Attendance Idempotency Key', () => {
    it('generates canonical idempotency key matching ATT_${workerId}_${YYYY-MM-DD}_${gateLocation}', () => {
      const key = generateAttendanceIdempotencyKey('w_101', '2026-08-01', 'Portón Principal Refinería PLC');
      expect(key).toBe('ATT_w_101_2026-08-01_PORTON_PRINCIPAL_REFINERIA_PLC');
    });
  });

  describe('HHT & Audited Corrections', () => {
    it('calculates categorized HHT for normal, overtime, and night shift hours', () => {
      const hht = calculateCategorizedHht({
        checkInIso: '2026-08-01T08:00:00Z',
        checkOutIso: '2026-08-01T18:00:00Z'
      });

      expect(hht.regularHours).toBe(8);
      expect(hht.overtimeHours).toBe(2);
      expect(hht.effectivePaidHht).toBeGreaterThan(10); // Overtime multiplier applied
    });

    it('creates an audited attendance correction log with supervisor metadata', () => {
      const { updatedRecord, auditLogEntry } = createAuditedAttendanceCorrection({
        originalRecord: {
          idempotencyKey: 'ATT_w101_2026-08-01_p1',
          workerId: 'w101',
          gateLocation: 'p1',
          date: '2026-08-01',
          checkInLocalTime: '2026-08-01T08:00:00Z',
          userId: 'sup1',
          deviceId: 'dev1',
          workfront: 'f1',
          syncState: 'SYNCED',
          accessGranted: true
        },
        supervisorUid: 'SUP_007',
        reasonCode: 'APPROVED_OVERTIME',
        note: 'Horas extras aprobadas para soldadura en caliente.',
        newCheckOut: '2026-08-01T18:00:00Z'
      });

      expect(updatedRecord.syncState).toBe('CORRECTED');
      expect(auditLogEntry.supervisorUid).toBe('SUP_007');
      expect(auditLogEntry.reasonCode).toBe('APPROVED_OVERTIME');
    });

    it('calculates aggregate HHT metrics', () => {
      const metrics = calculateHhtMetrics({
        workers: [{ id: 'w1', totalHhtAccumulated: 100 }, { id: 'w2', totalHhtAccumulated: 200 }],
        todayRecords: [{ hoursWorked: 8 }, { hoursWorked: 8 }]
      });

      expect(metrics.totalHhtAccumulated).toBe(316);
      expect(metrics.ltiAccidentsCount).toBe(0);
      expect(metrics.hhtWithoutAccidents).toBe(316);
    });
  });

  describe('C6 — SIHO Incident Workflow & Regulatory Disclaimer', () => {
    it('creates a SIHO incident workflow with the required INPSASEL disclaimer', () => {
      const incident = createSihoIncidentWorkflow({
        orgId: 'org_01',
        projectId: 'proj_01',
        incidentType: 'NEAR_MISS',
        severity: 'MEDIA',
        title: 'Desprendimiento leve de escoria',
        description: 'Soldador con careta puesta, sin lesiones.',
        location: 'Frente 2 Kp 10+000',
        reporterUid: 'SUP_SIHO_001'
      });

      expect(incident.id).toMatch(/^INC_SIHO_/);
      expect(incident.regulatoryNoticeDisclaimer).toContain('NO constituye notificación oficial ante el INPSASEL');
      expect(incident.regulatoryNoticeDisclaimer).toContain('LOPCYMAT');
    });
  });
});
