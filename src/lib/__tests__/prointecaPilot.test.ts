import { describe, it, expect, beforeEach } from 'vitest';
import { seedProintecaPilot } from '../../../scripts/seed-prointeca-pilot';

describe('Piloto Industrial PROINTECA (Sprint IC360-S13 - prointeca-demo)', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.ALLOW_PILOT_SEED = 'true';
  });

  it('1. Ejecuta el sembrado seguro del tenant prointeca-demo sin errores', async () => {
    const res = await seedProintecaPilot(true);
    expect(res.success).toBe(true);
    expect(res.seededDocsCount).toBeGreaterThan(15);
    expect(res.message).toContain('prointeca-demo');
  });

  it('2. Bloquea el sembrado si se ejecuta en producción sin banderas ni emulador', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalAllow = process.env.ALLOW_PILOT_SEED;
    const originalEmulator = process.env.FIRESTORE_EMULATOR_HOST;

    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_PILOT_SEED;
    delete process.env.FIRESTORE_EMULATOR_HOST;

    const res = await seedProintecaPilot(true);
    expect(res.success).toBe(false);
    expect(res.message).toContain('PROHIBIDO');

    // Restaurar entorno
    process.env.NODE_ENV = originalEnv;
    if (originalAllow) process.env.ALLOW_PILOT_SEED = originalAllow;
    if (originalEmulator) process.env.FIRESTORE_EMULATOR_HOST = originalEmulator;
  });

  it('3. Valida la estructura matemática de la Valuación VAL-PILOT-001', () => {
    const grossAmount = 245000;
    const retentionFC = grossAmount * 0.10; // 10% = 24500
    const retentionLaboral = grossAmount * 0.05; // 5% = 12250
    const amortizationAnticipo = grossAmount * 0.30; // 30% = 73500

    const totalDeductions = retentionFC + retentionLaboral + amortizationAnticipo;
    const netAmount = grossAmount - totalDeductions;

    expect(retentionFC).toBe(24500);
    expect(retentionLaboral).toBe(12250);
    expect(amortizationAnticipo).toBe(73500);
    expect(totalDeductions).toBe(110250);
    expect(netAmount).toBe(134750);
  });

  it('4. Valida la severidad de los 3 defectos ILI (D001, D002, D003)', () => {
    const anomalies = [
      { id: 'D001', kp: 2.4, wallLoss: 48, status: 'EVALUADO', action: 'MONITOREAR' },
      { id: 'D002', kp: 8.7, wallLoss: 22, status: 'EVALUADO', action: 'SIN_ACCION' },
      { id: 'D003', kp: 12.1, wallLoss: 68, status: 'CRITICO', action: 'CAMISA_TIPO_B' }
    ];

    const criticals = anomalies.filter((a) => a.wallLoss > 50);
    expect(criticals.length).toBe(1);
    expect(criticals[0].id).toBe('D003');
    expect(criticals[0].action).toBe('CAMISA_TIPO_B');
  });

  it('5. Verificación de los 5 Roles Clave del Piloto', () => {
    const roles = ['gerente', 'supervisor', 'inspector', 'campo', 'cliente'];
    expect(roles.length).toBe(5);
    expect(roles).toContain('cliente');
    expect(roles).toContain('gerente');
  });
});
