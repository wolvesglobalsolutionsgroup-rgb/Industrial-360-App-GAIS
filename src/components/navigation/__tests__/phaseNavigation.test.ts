import { describe, it, expect } from 'vitest';
import {
  PROJECT_PHASES,
  getPhaseByNumber,
  getPhaseForPath,
  getBreadcrumbsForPath,
  searchNavigation,
} from '../phaseNavigation';

describe('Sprint F-UX Phase Navigation Unit Tests', () => {
  it('should define exactly 7 canonical industrial project phases', () => {
    expect(PROJECT_PHASES).toHaveLength(7);
    const phaseNumbers = PROJECT_PHASES.map((p) => p.phaseNumber);
    expect(phaseNumbers).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('should retrieve phase by numeric ID (1-7)', () => {
    const phase4 = getPhaseByNumber(4);
    expect(phase4).toBeDefined();
    expect(phase4?.code).toBe('EXEC');
    expect(phase4?.shortTitle).toContain('Fase 4');

    const phase7 = getPhaseByNumber(7);
    expect(phase7?.code).toBe('GOV');
  });

  it('should map standard module paths to their correct industrial phase', () => {
    const dashInfo = getPhaseForPath('/');
    expect(dashInfo.phase.phaseNumber).toBe(1);

    const tasksInfo = getPhaseForPath('/tasks');
    expect(tasksInfo.phase.phaseNumber).toBe(2);

    const toolsInfo = getPhaseForPath('/tools');
    expect(toolsInfo.phase.phaseNumber).toBe(3);

    const ptwInfo = getPhaseForPath('/siho-ptw');
    expect(ptwInfo.phase.phaseNumber).toBe(4);

    const qaqcInfo = getPhaseForPath('/qa-qc-welding');
    expect(qaqcInfo.phase.phaseNumber).toBe(5);

    const valuationsInfo = getPhaseForPath('/valuations');
    expect(valuationsInfo.phase.phaseNumber).toBe(6);

    const brainInfo = getPhaseForPath('/project-brain');
    expect(brainInfo.phase.phaseNumber).toBe(7);
  });

  it('should map registered workflows to their declared industrial phase', () => {
    const wf042Info = getPhaseForPath('/workflows/wf-042-inspeccion-izaje/demo');
    expect(wf042Info.phase.phaseNumber).toBe(4);
    expect(wf042Info.workflowId).toBe('wf-042-inspeccion-izaje');

    const wf043Info = getPhaseForPath('/workflows/wf-043-aprobacion-ptw/demo');
    expect(wf043Info.phase.phaseNumber).toBe(4);

    const wf044Info = getPhaseForPath('/workflows/wf-044-reporte-tabular/demo');
    expect(wf044Info.phase.phaseNumber).toBe(5);
  });

  it('should generate hierarchical breadcrumbs for any path', () => {
    const breadcrumbs = getBreadcrumbsForPath(
      '/workflows/wf-042-inspeccion-izaje/demo',
      'Gasoducto Anaco-Barinas',
      'BORRADOR'
    );

    expect(breadcrumbs).toHaveLength(3);
    expect(breadcrumbs[0].label).toBe('Gasoducto Anaco-Barinas');
    expect(breadcrumbs[1].label).toContain('Fase 4');
    expect(breadcrumbs[2].label).toContain('Izaje');
    expect(breadcrumbs[2].badge).toBe('BORRADOR');
  });

  it('should search modules and group by phase respecting role permissions', () => {
    const results = searchNavigation('izaje', 'campo');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].phase.phaseNumber).toBe(4);
    expect(results[0].module.id).toBe('wf-042');

    // Test role restriction for superadmin-only module
    const superAdminResults = searchNavigation('saas', 'superadmin');
    expect(superAdminResults.length).toBeGreaterThan(0);

    const campoResults = searchNavigation('saas', 'campo');
    expect(campoResults).toHaveLength(0);
  });
});
