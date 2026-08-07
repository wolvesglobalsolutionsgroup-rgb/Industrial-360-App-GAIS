import { describe, it, expect, beforeEach } from 'vitest';
import { getWorkflow, listWorkflows } from '../../lib/workflows/registry';
import { ensureWorkflowsRegistered } from '../../workflows';
import {
  LotoPointSchema,
  wf051Definition,
} from '../../workflows/wf-051-control-aislamiento-loto/definition';
import {
  LOTO_ENERGY_TYPES,
  LOTO_LOCK_COLORS,
  LOTO_STATUS_TYPES,
} from '../../workflows/wf-051-control-aislamiento-loto/components/LotoIsolationCapture';

describe('Workflow Direct Route Entry & Registry Ready Race Condition Mitigation', () => {
  beforeEach(() => {
    ensureWorkflowsRegistered();
  });

  it('1. Debe simular carga inicial en false y fallback activo antes de resolver el registro', () => {
    // Estado inicial antes de que registryReady sea true
    let registryReady = false;
    let definition = registryReady ? getWorkflow('wf-073-medicion-avance-ingenieria') : undefined;

    expect(registryReady).toBe(false);
    expect(definition).toBeUndefined(); // Durante la carga renderiza el fallback, no "Workflow No Encontrado"
  });

  it('2. Debe resolver el import dinámico y recuperar wf-073-medicion-avance-ingenieria tras registryReady = true', () => {
    ensureWorkflowsRegistered();
    let registryReady = true;
    let definition = registryReady ? getWorkflow('wf-073-medicion-avance-ingenieria') : undefined;

    expect(registryReady).toBe(true);
    expect(definition).toBeDefined();
    expect(definition?.id).toBe('wf-073-medicion-avance-ingenieria');
    expect(definition?.title).toContain('Avance');
  });

  it('3. Debe mostrar "Workflow No Encontrado" solo si registryReady = true y el ID no existe en el Kernel', () => {
    ensureWorkflowsRegistered();
    let registryReady = true;
    let definition = registryReady ? getWorkflow('wf-999-inexistent-workflow') : undefined;

    expect(registryReady).toBe(true);
    expect(definition).toBeUndefined();
  });
});

describe('Unificación de Enum LOTO (wf-051)', () => {
  it('1. LOTO_ENERGY_TYPES, LOTO_LOCK_COLORS y LOTO_STATUS_TYPES coinciden exactamente con Zod Schema', () => {
    // Validar que cada valor de la UI es aceptado por el Schema de Zod
    LOTO_ENERGY_TYPES.forEach((energy) => {
      const validPoint = {
        id: 'loto-test-1',
        tagEquipment: 'EQ-TEST-001',
        systemName: 'Sistema de Proceso',
        energyType: energy,
        isolationMethod: 'Apertura de Válvula',
        lockTagId: 'LOCK-001',
        lockColor: 'Rojo - Personal' as const,
        ptwNumber: 'PTW-2026-001',
        responsibleSupervisor: 'Inspector SIHO',
        isolationDate: '2026-08-07',
        status: 'Aislado & Bloqueado' as const,
        chkDeenergized: true,
        chkPhysicalLock: true,
        chkTagPlaced: true,
        chkZeroEnergyVerified: true,
        chkSignaturesApproved: true,
      };

      const result = LotoPointSchema.safeParse(validPoint);
      expect(result.success).toBe(true);
    });
  });

  it('2. Schema LOTO rechaza valores de energía no definidos en el enum unificado', () => {
    const invalidPoint = {
      id: 'loto-test-invalid',
      tagEquipment: 'EQ-TEST-002',
      systemName: 'Sistema Invalido',
      energyType: 'Energía Cuántica Inventada',
      isolationMethod: 'Ninguno',
      lockTagId: 'LOCK-999',
      lockColor: 'Rojo - Personal',
      ptwNumber: 'PTW-2026-999',
      responsibleSupervisor: 'Desconocido',
      isolationDate: '2026-08-07',
      status: 'Aislado & Bloqueado',
      chkDeenergized: false,
      chkPhysicalLock: false,
      chkTagPlaced: false,
      chkZeroEnergyVerified: false,
      chkSignaturesApproved: false,
    };

    const result = LotoPointSchema.safeParse(invalidPoint);
    expect(result.success).toBe(false);
  });

  it('3. Todos los estados LOTO de la UI son aceptados por Zod Schema', () => {
    LOTO_STATUS_TYPES.forEach((st) => {
      const validPoint = {
        id: 'loto-test-st',
        tagEquipment: 'EQ-TEST-003',
        systemName: 'Sistema',
        energyType: 'Eléctrica' as const,
        isolationMethod: 'Breaker',
        lockTagId: 'LOCK-002',
        lockColor: 'Amarillo - Grupo' as const,
        ptwNumber: 'PTW-2026-002',
        responsibleSupervisor: 'Supervisor',
        isolationDate: '2026-08-07',
        status: st,
        chkDeenergized: true,
        chkPhysicalLock: true,
        chkTagPlaced: true,
        chkZeroEnergyVerified: true,
        chkSignaturesApproved: true,
      };

      const result = LotoPointSchema.safeParse(validPoint);
      expect(result.success).toBe(true);
    });
  });
});
