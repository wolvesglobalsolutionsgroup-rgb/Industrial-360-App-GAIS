import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  tasksRepo, expensesRepo, valuationsRepo, sihoPtwRepo, weldJointsRepo, wbsSnapshotsRepo 
} from '../../lib/repositories';

/**
 * Pruebas unitarias FinOps Sprint F-C-bis:
 * Verifica que el Dashboard no ejecuta ninguna consulta a Firestore sin límite (limitCount <= 50) al suscribirse a sus repositorios.
 */
describe('FinOps F-C-bis — Dashboard Query Limit Enforcement', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Verifica que todas las suscripciones del Dashboard a los repositorios especifican limitCount <= 50', () => {
    const repos = [
      { name: 'tasksRepo', repo: tasksRepo },
      { name: 'expensesRepo', repo: expensesRepo },
      { name: 'valuationsRepo', repo: valuationsRepo },
      { name: 'sihoPtwRepo', repo: sihoPtwRepo },
      { name: 'weldJointsRepo', repo: weldJointsRepo },
      { name: 'wbsSnapshotsRepo', repo: wbsSnapshotsRepo },
    ];

    const spies = repos.map(r => {
      return {
        name: r.name,
        spy: vi.spyOn(r.repo, 'subscribe').mockImplementation(() => () => {})
      };
    });

    const orgId = 'org-test-finops';
    const projId = 'proj-test-finops';

    // Ejecución de suscripciones (idéntico al montaje en Dashboard.tsx)
    tasksRepo.subscribe(orgId, projId, () => {}, () => {}, { limitCount: 50 });
    expensesRepo.subscribe(orgId, projId, () => {}, undefined, { limitCount: 50 });
    valuationsRepo.subscribe(orgId, projId, () => {}, undefined, { limitCount: 50 });
    sihoPtwRepo.subscribe(orgId, projId, () => {}, undefined, { limitCount: 50 });
    weldJointsRepo.subscribe(orgId, projId, () => {}, undefined, { limitCount: 50 });
    wbsSnapshotsRepo.subscribe(orgId, projId, () => {}, undefined, { limitCount: 50 });

    spies.forEach(({ name, spy }) => {
      expect(spy).toHaveBeenCalledTimes(1);
      const callArgs = spy.mock.calls[0];
      const optionsArg = callArgs[4];

      expect(optionsArg, `El repositorio ${name} debe recibir options`).toBeDefined();
      expect(optionsArg?.limitCount, `El repositorio ${name} debe definir limitCount`).toBeDefined();
      expect(optionsArg?.limitCount, `limitCount en ${name} no debe superar 50`).toBeLessThanOrEqual(50);
      expect(optionsArg?.limitCount, `limitCount en ${name} debe ser exactamente 50`).toBe(50);
    });
  });

  it('Garantiza que ninguna consulta de repositorio en Dashboard se ejecute sin límite (limitCount undefined / > 50)', () => {
    const repos = [
      tasksRepo, expensesRepo, valuationsRepo, sihoPtwRepo, weldJointsRepo, wbsSnapshotsRepo
    ];

    const callsOptions: Array<{ limitCount?: number } | undefined> = [];

    repos.forEach(repo => {
      vi.spyOn(repo, 'subscribe').mockImplementation((orgId, projId, cb, err, options) => {
        callsOptions.push(options);
        return () => {};
      });
    });

    const orgId = 'org-finops';
    const projId = 'proj-finops';

    tasksRepo.subscribe(orgId, projId, () => {}, () => {}, { limitCount: 50 });
    expensesRepo.subscribe(orgId, projId, () => {}, undefined, { limitCount: 50 });
    valuationsRepo.subscribe(orgId, projId, () => {}, undefined, { limitCount: 50 });
    sihoPtwRepo.subscribe(orgId, projId, () => {}, undefined, { limitCount: 50 });
    weldJointsRepo.subscribe(orgId, projId, () => {}, undefined, { limitCount: 50 });
    wbsSnapshotsRepo.subscribe(orgId, projId, () => {}, undefined, { limitCount: 50 });

    expect(callsOptions).toHaveLength(6);
    callsOptions.forEach((opt, index) => {
      expect(opt, `Opción en posición ${index} no debe ser indefinida`).not.toBeUndefined();
      expect(opt?.limitCount, `limitCount en posición ${index} debe ser 50`).toBe(50);
      expect(opt!.limitCount!).toBeLessThanOrEqual(50);
    });
  });
});
