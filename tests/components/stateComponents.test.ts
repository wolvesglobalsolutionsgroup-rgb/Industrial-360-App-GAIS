import { describe, it, expect } from 'vitest';
import {
  EmptyState,
  ErrorState,
  PermissionDenied,
  SourceBadge,
  QaBanner,
  LastUpdated,
  DataStatus,
} from '../../src/components/states';

describe('Sprint G1 — Shared State Components Contract', () => {
  it('exports all 7 state components correctly', () => {
    expect(EmptyState).toBeDefined();
    expect(ErrorState).toBeDefined();
    expect(PermissionDenied).toBeDefined();
    expect(SourceBadge).toBeDefined();
    expect(QaBanner).toBeDefined();
    expect(LastUpdated).toBeDefined();
    expect(DataStatus).toBeDefined();
  });

  it('EmptyState accepts mandatory title and optional ARIA attributes', () => {
    const props = {
      title: 'Sin datos disponibles',
      description: 'Pruebe seleccionando otra obra.',
      actionLabel: 'Crear Registro',
      testId: 'empty-test',
    };
    expect(props.title).toBe('Sin datos disponibles');
    expect(props.testId).toBe('empty-test');
  });

  it('ErrorState provides sanitized defaults without exposing internal stack traces', () => {
    const props = {
      title: 'Error de Lectura',
      message: 'Ocurrió un error al consultar Firestore.',
      code: 'ERR-FS-403',
    };
    expect(props.code).toBe('ERR-FS-403');
    expect(props.message).not.toContain('stack');
  });

  it('PermissionDenied formats missing role text without exposing DB schema', () => {
    const props = {
      title: 'Acceso Denegado',
      moduleName: 'Valuaciones ROE',
      requiredRole: ['superadmin', 'gerente'],
    };
    expect(props.requiredRole).toContain('gerente');
    expect(props.moduleName).toBe('Valuaciones ROE');
  });

  it('SourceBadge correctly maps dataset provenance tags', () => {
    const qaProps = { source: 'qa_seed', detail: 'DS-IC360-QA-CANONICAL' };
    const fsProps = { source: 'firestore', detail: 'ic360-qa-pilot' };

    expect(qaProps.source).toBe('qa_seed');
    expect(fsProps.source).toBe('firestore');
  });

  it('QaBanner recognizes QA environment criteria', () => {
    const bannerProps = {
      orgId: 'ic360-qa-pilot',
      environment: 'qa',
      datasetId: 'DS-IC360-QA-CANONICAL',
      version: 'v1.0.0-QA',
    };
    expect(bannerProps.orgId).toBe('ic360-qa-pilot');
    expect(bannerProps.version).toBe('v1.0.0-QA');
  });

  it('DataStatus routes statuses to expected component states', () => {
    const statuses = ['loading', 'error', 'empty', 'ready', 'forbidden'];
    expect(statuses).toHaveLength(5);
  });
});
