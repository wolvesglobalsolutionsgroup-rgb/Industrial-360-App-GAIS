import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { WorkflowRegistry } from '../registry';
import { WorkflowDefinition } from '../contracts';

describe('F-REGRACE — WorkflowRegistry Concurrency & Race Condition Suite', () => {
  beforeEach(() => {
    WorkflowRegistry.clearRegistryForTesting();
  });

  const createDummyWorkflow = (id: string, phase: 1 | 2 | 3 | 4 | 5 | 6 | 7 = 1): WorkflowDefinition => ({
    id,
    title: `Workflow Concurrente ${id}`,
    phase,
    description: `Descripción para el workflow concurrente ${id}`,
    rolesAllowed: ['superadmin', 'gerente', 'inspector'],
    schema: z.object({
      id: z.string(),
      status: z.string(),
    }),
    initialState: { status: 'draft' },
    states: {
      draft: {
        label: 'Borrador',
        allowedTransitions: ['submitted'],
      },
      submitted: {
        label: 'Enviado',
        allowedTransitions: ['approved'],
      },
      approved: {
        label: 'Aprobado',
        allowedTransitions: [],
      },
    },
    hardGates: [],
    generateDeliverableModel: async (_ctx, data) => ({
      title: `Entregable ${id}`,
      code: id,
      version: '1.0',
      header: {
        title: `Entregable ${id}`,
        code: id,
        version: '1.0',
        estatus: 'CLOSED_APPROVED' as const,
        operadorLogoVisible: true,
        contratistaLogoVisible: false,
      },
      metadataGrid: [],
      sections: [],
      tables: [],
      firmasDigitales: [],
      visualVersionHash: 'hash-test',
      qrVerificationUrl: 'https://ic360-nexus.pdvsa.com/verify?docId=test',
    }),
  });

  it('1. Debe registrar de forma concurrente 100 workflows únicos sin pérdida ni corrupción', async () => {
    const TOTAL_WORKFLOWS = 100;
    const workflowDefs = Array.from({ length: TOTAL_WORKFLOWS }, (_, i) =>
      createDummyWorkflow(`wf-concurrent-${String(i + 1).padStart(3, '0')}`, ((i % 7) + 1) as any)
    );

    // Concurrent execution simulating multi-module asynchronous initialization
    await Promise.all(
      workflowDefs.map((def) =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            WorkflowRegistry.registerWorkflow(def);
            resolve();
          }, Math.floor(Math.random() * 10));
        })
      )
    );

    const registeredList = WorkflowRegistry.listWorkflows();
    expect(registeredList.length).toBe(TOTAL_WORKFLOWS);

    // Verify each workflow is retrievable by ID and intact
    for (let i = 0; i < TOTAL_WORKFLOWS; i++) {
      const id = `wf-concurrent-${String(i + 1).padStart(3, '0')}`;
      const retrieved = WorkflowRegistry.getWorkflow(id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(id);
      expect(retrieved?.title).toBe(`Workflow Concurrente ${id}`);
    }
  });

  it('2. Debe prevenir registros duplicados concurrentes (exactamente 1 éxito y N-1 rechazos)', async () => {
    const CONCURRENT_ATTEMPTS = 20;
    const DUPLICATE_ID = 'wf-duplicate-race-condition';
    const targetDef = createDummyWorkflow(DUPLICATE_ID);

    const results = await Promise.allSettled(
      Array.from({ length: CONCURRENT_ATTEMPTS }, () =>
        new Promise<void>((resolve, reject) => {
          try {
            WorkflowRegistry.registerWorkflow(targetDef);
            resolve();
          } catch (err) {
            reject(err);
          }
        })
      )
    );

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(CONCURRENT_ATTEMPTS - 1);

    rejected.forEach((r) => {
      if (r.status === 'rejected') {
        expect((r.reason as Error).message).toMatch(/ya está registrado/);
      }
    });

    const registered = WorkflowRegistry.getWorkflow(DUPLICATE_ID);
    expect(registered).toBeDefined();
    expect(registered?.id).toBe(DUPLICATE_ID);
  });

  it('3. Debe rechazar concurrentemente cualquier intento de registro si el Registry está bloqueado', async () => {
    WorkflowRegistry.registerWorkflow(createDummyWorkflow('wf-initial-001'));
    WorkflowRegistry.lockRegistry();

    const ATTEMPTS = 10;
    const results = await Promise.allSettled(
      Array.from({ length: ATTEMPTS }, (_, i) =>
        new Promise<void>((resolve, reject) => {
          try {
            WorkflowRegistry.registerWorkflow(createDummyWorkflow(`wf-locked-attempt-${i}`));
            resolve();
          } catch (err) {
            reject(err);
          }
        })
      )
    );

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(0);
    expect(rejected.length).toBe(ATTEMPTS);

    rejected.forEach((r) => {
      if (r.status === 'rejected') {
        expect((r.reason as Error).message).toMatch(/bloqueado e inmutable/);
      }
    });

    expect(WorkflowRegistry.listWorkflows().length).toBe(1);
  });
});
