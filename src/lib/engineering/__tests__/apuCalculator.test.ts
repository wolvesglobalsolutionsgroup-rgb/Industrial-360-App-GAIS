import { describe, it, expect } from 'vitest';
import {
  calculateApuUnitCost,
  calculateReadjustmentFactorK,
  evaluateIgtf,
  validatePolicyRate,
  validateLaborPolicy,
  PolicyNotFoundError,
  PolicyExpiredError,
  InvalidCoefficientError,
  MissingPolicyRateError,
  ApuItem,
  EffectivePolicyRate,
  LaborPolicy,
  ReadjustmentFactorKInput,
  IgtfEvaluationInput,
} from '../apuCalculator';

describe('APU Calculator Engine - Golden Tests & Cost Calculations', () => {
  const referenceApu1: ApuItem = {
    id: 'APU-001',
    code: 'MEC-TUB-16',
    title: 'Tendido, Alineación, Biselado y Soldadura de Tubería de Acero API 5L X52 16" OD x 0.375" WT',
    unit: 'm',
    category: 'Mecánica',
    fcasPercent: 425.8,
    performancePerDay: 40,
    labor: [
      { id: 'l1', category: 'Supervisor Soldadura CWI', count: 1, baseSalaryDailyUsd: 65, cpttBonusesUsd: 25 },
      { id: 'l2', category: 'Soldador 6G ASME Sec. IX', count: 3, baseSalaryDailyUsd: 55, cpttBonusesUsd: 20 },
      { id: 'l3', category: 'Tubero Especialista O&G', count: 2, baseSalaryDailyUsd: 48, cpttBonusesUsd: 18 },
      { id: 'l4', category: 'Obrero de Campo / Ayudante', count: 4, baseSalaryDailyUsd: 28, cpttBonusesUsd: 12 },
    ],
    equipment: [
      { id: 'e1', name: 'Grúa Tendedora Sideboom 50 Ton', hourlyRateActiveUsd: 85, hourlyRateIdleUsd: 35, hoursActive: 8, hoursIdle: 0 },
      { id: 'e2', name: 'Módulo Camión Generador Lincoln Vantage 500A (x2)', hourlyRateActiveUsd: 38, hourlyRateIdleUsd: 15, hoursActive: 8, hoursIdle: 0 },
    ],
    materials: [
      { id: 'm1', description: 'Tubería API 5L PSL2 X52 16" Sch 40 Sin Costura', unit: 'm', unitPriceUsd: 145, wastePercent: 3, quantityPerUnit: 1.03 },
      { id: 'm2', description: 'Electrodos E7018 / E6010 Cellulosic (Caja 20kg)', unit: 'kg', unitPriceUsd: 8.5, wastePercent: 5, quantityPerUnit: 1.2 },
    ],
    indirectsPercent: 12,
    contingencyPercent: 5,
    profitPercent: 15,
    totalDirectCostUsd: 189.4,
    totalUnitCostUsd: 250.0,
  };

  it('calculates APU-001 unit cost matching canonical golden reference', () => {
    const result = calculateApuUnitCost(referenceApu1);

    // FCAS factor = 1 + 4.258 = 5.258
    // l1: (65 * 5.258 + 25) * 1 = 366.77
    // l2: (55 * 5.258 + 20) * 3 = 927.57
    // l3: (48 * 5.258 + 18) * 2 = 540.768
    // l4: (28 * 5.258 + 12) * 4 = 636.896
    // totalLaborDaily = 2471.996 -> / 40 = 61.80

    // Equipment: (85*8) + (38*8) = 680 + 304 = 984 -> / 40 = 24.60
    // Materials: (145 * 1.03 * 1.03) + (8.5 * 1.2 * 1.05) = 153.8305 + 10.71 = 164.5405
    // Direct cost = 61.7999 + 24.60 + 164.5405 = 250.9404 -> ~250.94

    expect(result.laborDaily).toBe(2472);
    expect(result.equipDaily).toBe(984);
    expect(result.laborPerUnit).toBe(61.8);
    expect(result.equipPerUnit).toBe(24.6);
    expect(result.matPerUnit).toBe(164.54);
    expect(result.directCost).toBe(250.94);
    expect(result.totalUnitCost).toBeGreaterThan(300);
  });

  it('handles empty APU item gracefully', () => {
    const emptyResult = calculateApuUnitCost(null as any);
    expect(emptyResult.totalUnitCost).toBe(0);
    expect(emptyResult.directCost).toBe(0);
  });

  it('handles zero performancePerDay without division by zero NaN', () => {
    const zeroPerfApu: ApuItem = {
      ...referenceApu1,
      performancePerDay: 0,
    };
    const result = calculateApuUnitCost(zeroPerfApu);
    expect(result.laborPerUnit).toBe(0);
    expect(result.equipPerUnit).toBe(0);
    expect(Number.isNaN(result.totalUnitCost)).toBe(false);
  });
});

describe('Economic Policy & Labor Policy Validation', () => {
  const activePolicyRate: EffectivePolicyRate = {
    id: 'POL-RATE-2026-01',
    rateId: 'BCV-USD-2026-08',
    validFrom: '2026-08-01T00:00:00Z',
    validUntil: '2026-12-31T23:59:59Z',
    effectiveFrom: '2026-08-01T00:00:00Z',
    effectiveTo: '2026-12-31T23:59:59Z',
    source: 'BCV_OFFICIAL',
    approvedBy: 'USR-SUPERADMIN-001',
    approvedAt: '2026-08-01T10:00:00Z',
    version: '1.0.0',
    status: 'ACTIVE',
    fxRateUsdVes: 36.5,
    igtfRate: 0.03,
    kind: 'EXCHANGE_RATE',
    value: 36.5,
    currency: 'USD',
  };

  const activeLaborPolicy: LaborPolicy = {
    id: 'LABOR-POL-2026',
    version: '2.1.0',
    status: 'ACTIVE',
    effectiveFrom: '2026-01-01T00:00:00Z',
    effectiveTo: '2026-12-31T23:59:59Z',
    approvedBy: 'USR-SUPERADMIN-001',
    approvedAt: '2026-01-01T00:00:00Z',
    occupationalLevels: [
      {
        levelCode: 'LEVEL_1',
        title: 'Obrero General / Ayudante',
        baseSalaryDailyVes: 1022,
        baseSalaryDailyUsd: 28,
        foodBenefitDailyVes: 1460,
        cpttBonusesDailyUsd: 12,
      },
    ],
    workingConditions: {
      workDaysPerWeek: 5,
      hoursPerDay: 8,
      nightShiftPremiumPercent: 30,
      overtimePremiumPercent: 50,
    },
    benefits: {
      fcasPercent: 425.8,
      vacationBonusDays: 60,
      profitSharingDays: 120,
      socialBenefitsDaysPerYear: 60,
    },
  };

  it('validates active policy rate successfully', () => {
    expect(() => validatePolicyRate(activePolicyRate, new Date('2026-08-01T12:00:00Z'))).not.toThrow();
  });

  it('throws PolicyNotFoundError when policy rate object is missing', () => {
    expect(() => validatePolicyRate(null as any)).toThrow(PolicyNotFoundError);
  });

  it('throws PolicyExpiredError when policy status is not ACTIVE', () => {
    const draftPolicy: EffectivePolicyRate = {
      ...activePolicyRate,
      status: 'DRAFT',
    };
    expect(() => validatePolicyRate(draftPolicy)).toThrow(PolicyExpiredError);
  });

  it('throws PolicyExpiredError when current date exceeds validUntil', () => {
    const expiredPolicy: EffectivePolicyRate = {
      ...activePolicyRate,
      validUntil: '2026-07-01T00:00:00Z',
      effectiveTo: '2026-07-01T00:00:00Z',
    };
    expect(() => validatePolicyRate(expiredPolicy, new Date('2026-08-01T12:00:00Z'))).toThrow(PolicyExpiredError);
  });

  it('throws MissingPolicyRateError when approvedBy is missing', () => {
    const unapprovedPolicy: EffectivePolicyRate = {
      ...activePolicyRate,
      approvedBy: '',
    };
    expect(() => validatePolicyRate(unapprovedPolicy)).toThrow(MissingPolicyRateError);
  });

  it('throws MissingPolicyRateError when fxRateUsdVes is <= 0', () => {
    const zeroFxPolicy: EffectivePolicyRate = {
      ...activePolicyRate,
      fxRateUsdVes: 0,
    };
    expect(() => validatePolicyRate(zeroFxPolicy)).toThrow(MissingPolicyRateError);
  });

  it('validates active labor policy successfully', () => {
    expect(() => validateLaborPolicy(activeLaborPolicy, new Date('2026-08-01T12:00:00Z'))).not.toThrow();
  });

  it('throws PolicyExpiredError on expired labor policy', () => {
    const expiredLabor: LaborPolicy = {
      ...activeLaborPolicy,
      effectiveTo: '2025-12-31T23:59:59Z',
    };
    expect(() => validateLaborPolicy(expiredLabor, new Date('2026-08-01T12:00:00Z'))).toThrow(PolicyExpiredError);
  });
});

describe('Factor K Price Readjustment Engine', () => {
  const activePolicyRate: EffectivePolicyRate = {
    id: 'POL-RATE-2026-01',
    rateId: 'BCV-USD-2026-08',
    validFrom: '2026-08-01T00:00:00Z',
    validUntil: '2026-12-31T23:59:59Z',
    effectiveFrom: '2026-08-01T00:00:00Z',
    effectiveTo: '2026-12-31T23:59:59Z',
    source: 'BCV_OFFICIAL',
    approvedBy: 'USR-SUPERADMIN-001',
    approvedAt: '2026-08-01T10:00:00Z',
    version: '1.0.0',
    status: 'ACTIVE',
    fxRateUsdVes: 36.5,
    igtfRate: 0.03,
    kind: 'EXCHANGE_RATE',
    value: 36.5,
    currency: 'VES',
  };

  it('calculates Factor K accurately for valid coefficients (sum = 1.0)', () => {
    const input: ReadjustmentFactorKInput = {
      contractCurrency: 'VES',
      contractType: 'OIL_GAS',
      effectivePolicyRate: activePolicyRate,
      coefficients: [
        { componentCode: 'M', name: 'Materiales', weight: 0.4, initialIndex: 100, currentIndex: 110 }, // 0.4 * 1.1 = 0.44
        { componentCode: 'L', name: 'Mano de Obra', weight: 0.3, initialIndex: 100, currentIndex: 115 }, // 0.3 * 1.15 = 0.345
        { componentCode: 'E', name: 'Equipos', weight: 0.2, initialIndex: 100, currentIndex: 105 }, // 0.2 * 1.05 = 0.21
        { componentCode: 'I', name: 'Indirectos', weight: 0.1, initialIndex: 100, currentIndex: 100 }, // 0.1 * 1.0 = 0.1
      ],
    };

    // Expected K = 0.44 + 0.345 + 0.21 + 0.1 = 1.095
    const result = calculateReadjustmentFactorK(input);
    expect(result.factorK).toBe(1.095);
    expect(result.readjustmentPercent).toBe(9.5);
    expect(result.coefficientsSum).toBe(1.0);
    expect(result.contractualAdjustmentApplied).toBe(true);
  });

  it('throws InvalidCoefficientError when coefficient sum is not 1.0', () => {
    const invalidInput: ReadjustmentFactorKInput = {
      contractCurrency: 'VES',
      contractType: 'CIVIL_WORKS',
      effectivePolicyRate: activePolicyRate,
      coefficients: [
        { componentCode: 'M', name: 'Materiales', weight: 0.5, initialIndex: 100, currentIndex: 110 },
        { componentCode: 'L', name: 'Mano de Obra', weight: 0.3, initialIndex: 100, currentIndex: 110 },
      ], // Sum = 0.8
    };

    expect(() => calculateReadjustmentFactorK(invalidInput)).toThrow(InvalidCoefficientError);
  });

  it('throws InvalidCoefficientError when initial index is <= 0', () => {
    const invalidIndexInput: ReadjustmentFactorKInput = {
      contractCurrency: 'VES',
      contractType: 'CIVIL_WORKS',
      effectivePolicyRate: activePolicyRate,
      coefficients: [
        { componentCode: 'M', name: 'Materiales', weight: 0.5, initialIndex: 0, currentIndex: 110 },
        { componentCode: 'L', name: 'Mano de Obra', weight: 0.5, initialIndex: 100, currentIndex: 110 },
      ],
    };

    expect(() => calculateReadjustmentFactorK(invalidIndexInput)).toThrow(InvalidCoefficientError);
  });

  it('applies fractional contractual component share correctly', () => {
    const input: ReadjustmentFactorKInput = {
      contractCurrency: 'MIXED',
      contractType: 'EPCC',
      effectivePolicyRate: activePolicyRate,
      contractualComponentShare: 0.8, // Only 80% subjected to readjustment
      coefficients: [
        { componentCode: 'M', name: 'Materiales', weight: 0.5, initialIndex: 100, currentIndex: 120 }, // 0.5 * 1.2 = 0.6
        { componentCode: 'L', name: 'Mano de Obra', weight: 0.5, initialIndex: 100, currentIndex: 120 }, // 0.5 * 1.2 = 0.6
      ], // Raw K = 1.2 (+20%)
    };

    // K_effective = 1 + 0.8 * (1.2 - 1) = 1.16 (+16%)
    const result = calculateReadjustmentFactorK(input);
    expect(result.factorK).toBe(1.16);
    expect(result.readjustmentPercent).toBe(16.0);
  });
});

describe('IGTF Evaluation Engine', () => {
  const activePolicyRate: EffectivePolicyRate = {
    id: 'POL-RATE-2026-01',
    rateId: 'BCV-USD-2026-08',
    validFrom: '2026-08-01T00:00:00Z',
    validUntil: '2026-12-31T23:59:59Z',
    effectiveFrom: '2026-08-01T00:00:00Z',
    effectiveTo: '2026-12-31T23:59:59Z',
    source: 'BCV_OFFICIAL',
    approvedBy: 'USR-SUPERADMIN-001',
    approvedAt: '2026-08-01T10:00:00Z',
    version: '1.0.0',
    status: 'ACTIVE',
    fxRateUsdVes: 36.5,
    igtfRate: 0.03, // 3%
    kind: 'EXCHANGE_RATE',
    value: 36.5,
    currency: 'USD',
  };

  it('applies 3% IGTF to foreign currency USD payment', () => {
    const input: IgtfEvaluationInput = {
      transactionType: 'FOREIGN_CURRENCY_PAYMENT',
      paymentCurrency: 'USD',
      amount: 10000,
      effectivePolicyRate: activePolicyRate,
    };

    const result = evaluateIgtf(input);
    expect(result.applies).toBe(true);
    expect(result.igtfRate).toBe(0.03);
    expect(result.igtfAmount).toBe(300);
    expect(result.netAmountToPay).toBe(10300);
    expect(result.justification).toContain('IGTF aplica a pagos en divisas');
  });

  it('does NOT apply IGTF to direct VES local payment', () => {
    const input: IgtfEvaluationInput = {
      transactionType: 'VES_LOCAL_PAYMENT',
      paymentCurrency: 'VES',
      amount: 365000,
      effectivePolicyRate: activePolicyRate,
    };

    const result = evaluateIgtf(input);
    expect(result.applies).toBe(false);
    expect(result.igtfRate).toBe(0);
    expect(result.igtfAmount).toBe(0);
    expect(result.netAmountToPay).toBe(365000);
    expect(result.justification).toContain('IGTF no aplica a pagos en bolívares');
  });

  it('does NOT apply IGTF to EXEMPT_CONTRACT', () => {
    const input: IgtfEvaluationInput = {
      transactionType: 'EXEMPT_CONTRACT',
      paymentCurrency: 'USD',
      amount: 50000,
      effectivePolicyRate: activePolicyRate,
    };

    const result = evaluateIgtf(input);
    expect(result.applies).toBe(false);
    expect(result.igtfAmount).toBe(0);
    expect(result.netAmountToPay).toBe(50000);
  });

  it('throws MissingPolicyRateError if igtfRate is invalid or missing in active policy', () => {
    const invalidIgtfPolicy: EffectivePolicyRate = {
      ...activePolicyRate,
      igtfRate: -1 as any,
    };

    const input: IgtfEvaluationInput = {
      transactionType: 'FOREIGN_CURRENCY_PAYMENT',
      paymentCurrency: 'USD',
      amount: 1000,
      effectivePolicyRate: invalidIgtfPolicy,
    };

    expect(() => evaluateIgtf(input)).toThrow(MissingPolicyRateError);
  });
});
