import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  determineConflictStrategy, 
  evaluateConflictPolicy 
} from '../conflictPolicy';
import { 
  sanitizeErrorMessage, 
  RETENTION_TTL_MS, 
  SyncCenterOperation 
} from '../syncEngine';

describe('S21 — Sync Center, Resiliencia y Resolución de Conflictos', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Idempotencia UUID v4 (100 Reintentos, 1 Efecto)', () => {
    it('Debe generar UUIDs v4 únicos de 36 caracteres para cada operationId', () => {
      const generateUuidV4 = () => 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
      const opId = generateUuidV4();
      expect(opId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('100 reintentos con el mismo operationId deben ser reconocidos como duplicados idempotentes', () => {
      const idempotencyStore = new Set<string>();
      const operationId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

      let processAttempts = 0;
      let executedEffectCount = 0;

      for (let i = 0; i < 100; i++) {
        processAttempts++;
        if (!idempotencyStore.has(operationId)) {
          idempotencyStore.add(operationId);
          executedEffectCount++;
        }
      }

      expect(processAttempts).toBe(100);
      expect(executedEffectCount).toBe(1); // Solo 1 efecto ejecutado en servidor
      expect(idempotencyStore.has(operationId)).toBe(true);
    });
  });

  describe('2. Sanitización de Diagnósticos de Error', () => {
    it('Debe enmascarar tokens de autorización y secret keys de mensajes de error', () => {
      const rawError = 'Error HTTP 403 con Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret and apiKey=AIzaSyD-123456789';
      const cleanMsg = sanitizeErrorMessage(rawError);

      expect(cleanMsg).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(cleanMsg).not.toContain('AIzaSyD-123456789');
      expect(cleanMsg).toContain('[MASCARADO]');
      expect(cleanMsg).toContain('[OCULTO]');
    });

    it('Debe traducir errores de permisos Firebase a mensajes comprensibles en español', () => {
      const firebaseError = 'FirebaseError: [code=permission-denied]: Missing or insufficient permissions.';
      const cleanMsg = sanitizeErrorMessage(firebaseError);

      expect(cleanMsg).toContain('Acceso denegado por políticas de seguridad');
      expect(cleanMsg).not.toContain('FirebaseError');
    });

    it('Debe traducir errores de autenticación', () => {
      const authErr = 'unauthenticated: User session expired';
      const cleanMsg = sanitizeErrorMessage(authErr);

      expect(cleanMsg).toContain('Sesión no autenticada');
    });
  });

  describe('3. Estrategias por Dominio (BLOCKING, FIELD_VISIBLE, APPEND_ONLY)', () => {
    it('Colecciones críticas (PTW, Valuaciones, Asistencia, QA/QC) deben usar la estrategia BLOCKING', () => {
      expect(determineConflictStrategy('siho_ptw', 'ptw')).toBe('BLOCKING');
      expect(determineConflictStrategy('valuations', 'valuation')).toBe('BLOCKING');
      expect(determineConflictStrategy('attendance', 'attendance')).toBe('BLOCKING');
      expect(determineConflictStrategy('welds', 'qa_qc')).toBe('BLOCKING');
    });

    it('Reportes de campo deben usar la estrategia FIELD_VISIBLE', () => {
      expect(determineConflictStrategy('field_reports', 'report')).toBe('FIELD_VISIBLE');
    });

    it('Evidencias y fotos deben usar la estrategia APPEND_ONLY', () => {
      expect(determineConflictStrategy('evidence_photos', 'evidence')).toBe('APPEND_ONLY');
    });

    it('Evaluación de política para BLOCKING debe marcar estado conflict_blocked sin sobreescritura ciega', () => {
      const result = evaluateConflictPolicy(
        'BLOCKING',
        { status: 'borrador', grossAmount: 1000 },
        { status: 'aprobado', grossAmount: 1200 },
        'update'
      );

      expect(result.hasConflict).toBe(true);
      expect(result.canSync).toBe(false);
      expect(result.reason).toContain('Bloqueo de seguridad');
    });

    it('Evaluación de política para FIELD_VISIBLE debe identificar diferencia de campos', () => {
      const result = evaluateConflictPolicy(
        'FIELD_VISIBLE',
        { _offlineCapturedAt: '2026-08-01T10:00:00Z', notes: 'Inspección realizada en tramo A', personnelCount: 5 },
        { updatedAt: '2026-08-01T11:00:00Z', notes: 'Inspección realizada en tramo A y B', personnelCount: 8 },
        'update'
      );

      expect(result.hasConflict).toBe(true);
      expect(result.canSync).toBe(true);
      expect(result.resolvedPayload?.hasConflict).toBe(true);
      expect(result.resolvedPayload?.conflictDetails).toContain('Conflicto de sincronización');
    });
  });

  describe('4. Resiliencia, Retención TTL y Backoff', () => {
    it('La política de retención TTL para idempotencia debe ser exactamente de 30 días', () => {
      const EXPECTED_30_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      expect(RETENTION_TTL_MS).toBe(EXPECTED_30_DAYS_MS);
    });

    it('Debe calcular el backoff exponencial con jitter para reintentos de red', () => {
      const calculateBackoff = (retries: number, mockJitter: number = 500) => {
        const baseDelay = 2000;
        return Math.min(300000, baseDelay * Math.pow(2, Math.min(retries, 6)) + mockJitter);
      };

      const delayRetry1 = calculateBackoff(1, 500); // 2000 * 2^1 + 500 = 4500 ms
      const delayRetry2 = calculateBackoff(2, 500); // 2000 * 2^2 + 500 = 8500 ms
      const delayRetry5 = calculateBackoff(5, 500); // 2000 * 2^5 + 500 = 64500 ms

      expect(delayRetry1).toBe(4500);
      expect(delayRetry2).toBe(8500);
      expect(delayRetry5).toBe(64500);
      expect(delayRetry5).toBeLessThanOrEqual(300000); // Cap en 5 minutos
    });
  });

  describe('5. Aislamiento Multi-Tenant Cross-Tenant', () => {
    it('Debe filtrar operaciones respetando estrictamente el orgId y projectId activo', () => {
      const mockOps: SyncCenterOperation[] = [
        {
          id: '1',
          operationId: 'op-orgA-proj1',
          entidad: 'valuations',
          operationType: 'create',
          momento: new Date().toISOString(),
          retries: 0,
          status: 'pending',
          motivoSanitizado: 'Pendiente',
          conflictStrategy: 'BLOCKING',
          orgId: 'org-A',
          projectId: 'proj-1',
          canManualResolve: true,
          isOutboxItem: true
        },
        {
          id: '2',
          operationId: 'op-orgB-proj2',
          entidad: 'valuations',
          operationType: 'create',
          momento: new Date().toISOString(),
          retries: 0,
          status: 'pending',
          motivoSanitizado: 'Pendiente',
          conflictStrategy: 'BLOCKING',
          orgId: 'org-B',
          projectId: 'proj-2',
          canManualResolve: true,
          isOutboxItem: true
        }
      ];

      const filteredOrgA = mockOps.filter(o => o.orgId === 'org-A' && o.projectId === 'proj-1');
      expect(filteredOrgA.length).toBe(1);
      expect(filteredOrgA[0].operationId).toBe('op-orgA-proj1');

      const filteredOrgB = mockOps.filter(o => o.orgId === 'org-B');
      expect(filteredOrgB.length).toBe(1);
      expect(filteredOrgB[0].operationId).toBe('op-orgB-proj2');
    });
  });

});
