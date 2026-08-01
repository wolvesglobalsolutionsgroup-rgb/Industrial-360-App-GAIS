/**
 * Industrial Control 360 (IC360) - APU Calculator & Economic Policies Engine
 * Module: src/lib/engineering/apuCalculator.ts
 *
 * Single source of truth for APU unit cost calculation, Factor K price readjustments,
 * effective economic policy rate validations, labor policy calculations, and IGTF evaluation.
 *
 * Rules:
 * - Pure TypeScript module (no React, no Firebase client dependencies).
 * - High-precision calculations without intermediate undocumented rounding.
 * - Strict domain error throwing when policy rates or approvals are missing or expired (no fallbacks).
 */

// ─── INTERFACES & TYPES ──────────────────────────────────────────────────────

export type ContractCurrency = 'VES' | 'USD' | 'MIXED';
export type ContractType = 'CIVIL_WORKS' | 'OIL_GAS' | 'MAINTENANCE' | 'EPCC';

export interface ApuLabor {
  id: string;
  category: string;
  count: number;
  baseSalaryDailyUsd: number;
  cpttBonusesUsd: number;
}

export interface ApuEquipment {
  id: string;
  name: string;
  hourlyRateActiveUsd: number;
  hourlyRateIdleUsd: number;
  hoursActive: number;
  hoursIdle: number;
}

export interface ApuMaterial {
  id: string;
  description: string;
  unit: string;
  unitPriceUsd: number;
  wastePercent: number; // e.g. 5%
  quantityPerUnit: number;
}

export interface ApuItem {
  id?: string;
  code: string; // WBS code, e.g. "MEC-01-TUB"
  title: string;
  unit: string; // "m", "m3", "kg", "pza", "glb"
  category: string; // "Mecánica", "Civil", "Electricidad", "Instrumentación"
  fcasPercent: number; // e.g. 425.8% FCAS Petrolero
  labor: ApuLabor[];
  equipment: ApuEquipment[];
  materials: ApuMaterial[];
  indirectsPercent: number; // e.g. 12%
  contingencyPercent: number; // e.g. 5%
  profitPercent: number; // e.g. 15%
  performancePerDay: number; // e.g. 35 m/día
  totalDirectCostUsd: number;
  totalUnitCostUsd: number;
  notes?: string;
  createdAt?: string;
}

export interface ApuCalculationResult {
  laborDaily: number;
  laborPerUnit: number;
  equipDaily: number;
  equipPerUnit: number;
  matPerUnit: number;
  laborTotal: number;
  equipTotal: number;
  matTotal: number;
  directCost: number;
  indirectTotal: number;
  totalUnitCost: number;
}

export interface EffectivePolicyRate {
  id: string;
  rateId: string;
  validFrom: string | Date;
  validUntil: string | Date;
  effectiveFrom: string | Date;
  effectiveTo: string | Date;
  source: 'BCV_OFFICIAL' | 'PARALLEL' | 'CONTRACT_FIXED';
  sourceDocumentId?: string;
  sourceUrl?: string;
  approvedBy: string; // UID of superadmin / authorized officer
  approvedAt: string | Date;
  version: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'EXPIRED' | 'DRAFT';
  fxRateUsdVes: number; // Official or contractual exchange rate
  igtfRate: number; // e.g. 0.03 for 3%
  kind: string;
  value: number; // Decimal rate value
  currency: ContractCurrency;
}

export interface LaborPolicyOccupationalLevel {
  levelCode: string; // e.g. "LEVEL_1_HELPERS"
  title: string;
  baseSalaryDailyVes: number;
  baseSalaryDailyUsd: number;
  foodBenefitDailyVes: number; // Cestaticket / Alimentación
  cpttBonusesDailyUsd: number;
}

export interface LaborPolicy {
  id: string;
  version: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'EXPIRED' | 'DRAFT';
  effectiveFrom: string | Date;
  effectiveTo: string | Date;
  approvedBy: string;
  approvedAt: string | Date;
  occupationalLevels: LaborPolicyOccupationalLevel[];
  workingConditions: {
    workDaysPerWeek: number;
    hoursPerDay: number;
    nightShiftPremiumPercent: number; // e.g. 30%
    overtimePremiumPercent: number; // e.g. 50%
  };
  benefits: {
    fcasPercent: number; // e.g. 425.8%
    vacationBonusDays: number;
    profitSharingDays: number; // Utilidades
    socialBenefitsDaysPerYear: number; // Prestaciones sociales
  };
}

export interface ReadjustmentCoefficient {
  componentCode: string; // "M" (Materials), "E" (Equipment), "L" (Labor), "I" (Indirects)
  name: string;
  weight: number; // Weight ratio in contract (must sum to 1.0)
  initialIndex: number; // Base price index at contract signing (I_0)
  currentIndex: number; // Current price index at recalculation (I_t)
  isImported?: boolean; // True if component price is tied to foreign index / currency
}

export interface ReadjustmentFactorKInput {
  contractCurrency: ContractCurrency;
  contractType: ContractType;
  coefficients: ReadjustmentCoefficient[];
  effectivePolicyRate: EffectivePolicyRate;
  contractualComponentShare?: number; // Share subjected to adjustment (default 1.0)
  tolerance?: number; // Sum tolerance for coefficients (default 0.001)
}

export interface ReadjustmentResult {
  factorK: number; // Multiplier K factor (e.g. 1.0854)
  readjustmentPercent: number; // e.g. +8.54%
  coefficientsSum: number; // Verified sum of weights
  componentBreakdown: {
    componentCode: string;
    weight: number;
    initialIndex: number;
    currentIndex: number;
    indexRatio: number; // I_t / I_0
    weightedContribution: number; // weight * (I_t / I_0)
    isImported: boolean;
  }[];
  contractualAdjustmentApplied: boolean;
}

export interface IgtfEvaluationInput {
  transactionType: 'FOREIGN_CURRENCY_PAYMENT' | 'VES_LOCAL_PAYMENT' | 'EXEMPT_CONTRACT';
  paymentCurrency: ContractCurrency;
  amount: number;
  effectivePolicyRate: EffectivePolicyRate;
}

export interface IgtfEvaluationResult {
  applies: boolean;
  igtfRate: number; // e.g. 0.03
  igtfAmount: number; // Tax amount calculated
  netAmountToPay: number; // Base amount + igtfAmount
  justification: string;
}

// ─── DOMAIN ERRORS ───────────────────────────────────────────────────────────

export class PolicyNotFoundError extends Error {
  constructor(message: string = 'No active economic policy or policy rate found.') {
    super(message);
    this.name = 'PolicyNotFoundError';
  }
}

export class PolicyExpiredError extends Error {
  constructor(policyId: string, validUntil: string | Date) {
    super(`Economic policy [${policyId}] expired on ${new Date(validUntil).toISOString()}. Updates required before calculation.`);
    this.name = 'PolicyExpiredError';
  }
}

export class InvalidCoefficientError extends Error {
  constructor(reason: string) {
    super(`Invalid Readjustment Coefficients: ${reason}`);
    this.name = 'InvalidCoefficientError';
  }
}

export class MissingPolicyRateError extends Error {
  constructor(rateName: string) {
    super(`Required policy rate [${rateName}] is missing, zero, or unapproved.`);
    this.name = 'MissingPolicyRateError';
  }
}

// ─── ECONOMIC POLICY VALIDATION HELPERS ─────────────────────────────────────

/**
 * Validates that an EffectivePolicyRate is active, not expired, and fully approved.
 * Throws typed domain errors if validation fails.
 */
export function validatePolicyRate(policy: EffectivePolicyRate, now: Date = new Date()): void {
  if (!policy) {
    throw new PolicyNotFoundError('EffectivePolicyRate object is missing.');
  }

  if (policy.status !== 'ACTIVE') {
    throw new PolicyExpiredError(policy.id || policy.rateId || 'UNKNOWN', policy.validUntil || policy.effectiveTo);
  }

  const validUntilDate = new Date(policy.validUntil || policy.effectiveTo);
  if (isNaN(validUntilDate.getTime()) || now > validUntilDate) {
    throw new PolicyExpiredError(policy.id || policy.rateId || 'UNKNOWN', policy.validUntil || policy.effectiveTo);
  }

  if (!policy.approvedBy || policy.approvedBy.trim() === '') {
    throw new MissingPolicyRateError('approvedBy');
  }

  if (typeof policy.fxRateUsdVes !== 'number' || policy.fxRateUsdVes <= 0 || isNaN(policy.fxRateUsdVes)) {
    throw new MissingPolicyRateError('fxRateUsdVes');
  }
}

/**
 * Validates that a LaborPolicy is active, approved, and within validity window.
 */
export function validateLaborPolicy(policy: LaborPolicy, now: Date = new Date()): void {
  if (!policy) {
    throw new PolicyNotFoundError('LaborPolicy object is missing.');
  }

  if (policy.status !== 'ACTIVE') {
    throw new PolicyExpiredError(policy.id || 'LABOR_POLICY', policy.effectiveTo);
  }

  const effectiveToDate = new Date(policy.effectiveTo);
  if (isNaN(effectiveToDate.getTime()) || now > effectiveToDate) {
    throw new PolicyExpiredError(policy.id || 'LABOR_POLICY', policy.effectiveTo);
  }

  if (!policy.approvedBy || policy.approvedBy.trim() === '') {
    throw new MissingPolicyRateError('approvedBy (LaborPolicy)');
  }
}

// ─── APU UNIT COST CALCULATOR ────────────────────────────────────────────────

/**
 * Calculates APU (Análisis de Precios Unitarios) direct and indirect unit costs in USD.
 * Preserves exact numerical logic from canonical formula.
 */
export function calculateApuUnitCost(item: ApuItem): ApuCalculationResult {
  if (!item) {
    return {
      laborDaily: 0,
      laborPerUnit: 0,
      equipDaily: 0,
      equipPerUnit: 0,
      matPerUnit: 0,
      laborTotal: 0,
      equipTotal: 0,
      matTotal: 0,
      directCost: 0,
      indirectTotal: 0,
      totalUnitCost: 0,
    };
  }

  const fcasFactor = 1 + (item.fcasPercent / 100);

  // 1. Labor Cost per day
  const totalLaborDaily = (item.labor || []).reduce((acc, l) => {
    const dailyBaseWithFcas = (l.baseSalaryDailyUsd * fcasFactor) + l.cpttBonusesUsd;
    return acc + (dailyBaseWithFcas * l.count);
  }, 0);
  const laborPerUnit = item.performancePerDay > 0 ? totalLaborDaily / item.performancePerDay : 0;

  // 2. Equipment Cost per day (8 hours standard)
  const totalEquipmentDaily = (item.equipment || []).reduce((acc, e) => {
    const activeCost = e.hourlyRateActiveUsd * e.hoursActive;
    const idleCost = e.hourlyRateIdleUsd * e.hoursIdle;
    return acc + activeCost + idleCost;
  }, 0);
  const equipPerUnit = item.performancePerDay > 0 ? totalEquipmentDaily / item.performancePerDay : 0;

  // 3. Materials Cost per Unit
  const matPerUnit = (item.materials || []).reduce((acc, m) => {
    const wasteFactor = 1 + (m.wastePercent / 100);
    return acc + (m.unitPriceUsd * m.quantityPerUnit * wasteFactor);
  }, 0);

  // 4. Totals & Indirects Calculation
  const directCost = laborPerUnit + equipPerUnit + matPerUnit;

  const indirectsCost = directCost * (item.indirectsPercent / 100);
  const contingencyCost = directCost * (item.contingencyPercent / 100);
  const profitCost = (directCost + indirectsCost + contingencyCost) * (item.profitPercent / 100);

  const totalUnitCost = directCost + indirectsCost + contingencyCost + profitCost;

  return {
    laborDaily: Math.round(totalLaborDaily * 100) / 100,
    laborPerUnit: Math.round(laborPerUnit * 100) / 100,
    equipDaily: Math.round(totalEquipmentDaily * 100) / 100,
    equipPerUnit: Math.round(equipPerUnit * 100) / 100,
    matPerUnit: Math.round(matPerUnit * 100) / 100,
    laborTotal: Math.round(laborPerUnit * 100) / 100,
    equipTotal: Math.round(equipPerUnit * 100) / 100,
    matTotal: Math.round(matPerUnit * 100) / 100,
    directCost: Math.round(directCost * 100) / 100,
    indirectTotal: Math.round((indirectsCost + contingencyCost + profitCost) * 100) / 100,
    totalUnitCost: Math.round(totalUnitCost * 100) / 100,
  };
}

// ─── FACTOR K PRICE READJUSTMENT ENGINE ──────────────────────────────────────

/**
 * Calculates Factor K (Fórmula Polinómica de Reajuste de Precios)
 * K = sum( weight_i * (Index_t_i / Index_0_i) )
 *
 * Rules:
 * - Validates EffectivePolicyRate.
 * - Sum of weights must equal 1.0 within tolerance.
 * - Applies to contractual component defined by policy.
 */
export function calculateReadjustmentFactorK(input: ReadjustmentFactorKInput): ReadjustmentResult {
  const {
    contractCurrency,
    coefficients,
    effectivePolicyRate,
    contractualComponentShare = 1.0,
    tolerance = 0.001,
  } = input;

  // Validate economic policy active state
  validatePolicyRate(effectivePolicyRate);

  if (!coefficients || coefficients.length === 0) {
    throw new InvalidCoefficientError('Coefficients array cannot be empty.');
  }

  // Validate coefficient weights sum
  const sumWeights = coefficients.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(sumWeights - 1.0) > tolerance) {
    throw new InvalidCoefficientError(
      `Sum of coefficient weights must equal 1.0 (actual: ${sumWeights.toFixed(4)}, tolerance: ±${tolerance})`
    );
  }

  const breakdown = coefficients.map((c) => {
    if (c.weight < 0) {
      throw new InvalidCoefficientError(`Weight for component [${c.componentCode}] cannot be negative.`);
    }
    if (c.initialIndex <= 0) {
      throw new InvalidCoefficientError(`Initial index (I_0) for component [${c.componentCode}] must be > 0.`);
    }
    if (c.currentIndex < 0) {
      throw new InvalidCoefficientError(`Current index (I_t) for component [${c.componentCode}] cannot be negative.`);
    }

    const ratio = c.currentIndex / c.initialIndex;
    const weightedContribution = c.weight * ratio;

    return {
      componentCode: c.componentCode,
      weight: c.weight,
      initialIndex: c.initialIndex,
      currentIndex: c.currentIndex,
      indexRatio: ratio,
      weightedContribution,
      isImported: Boolean(c.isImported),
    };
  });

  const rawFactorK = breakdown.reduce((sum, b) => sum + b.weightedContribution, 0);

  // Apply contractual component share if defined
  // K_effective = 1 + contractualComponentShare * (K_raw - 1)
  const effectiveFactorK = 1 + contractualComponentShare * (rawFactorK - 1);
  const readjustmentPercent = Math.round((effectiveFactorK - 1) * 10000) / 100;

  return {
    factorK: Math.round(effectiveFactorK * 10000) / 10000,
    readjustmentPercent,
    coefficientsSum: Math.round(sumWeights * 10000) / 10000,
    componentBreakdown: breakdown,
    contractualAdjustmentApplied: contractCurrency === 'VES' || contractCurrency === 'MIXED' || contractualComponentShare < 1.0,
  };
}

// ─── IGTF EVALUATION ENGINE ──────────────────────────────────────────────────

/**
 * Evaluates IGTF (Impuesto a las Grandes Transacciones Financieras) applicability.
 *
 * Rules:
 * - Applies to foreign currency (USD) payments or foreign currency transaction types.
 * - Does NOT apply to direct VES local payments or exempt contracts.
 * - Requires active EffectivePolicyRate with approved igtfRate.
 */
export function evaluateIgtf(input: IgtfEvaluationInput): IgtfEvaluationResult {
  const { transactionType, paymentCurrency, amount, effectivePolicyRate } = input;

  validatePolicyRate(effectivePolicyRate);

  if (amount < 0) {
    throw new Error('Transaction amount cannot be negative.');
  }

  const isForeignCurrencyPayment =
    transactionType === 'FOREIGN_CURRENCY_PAYMENT' ||
    (paymentCurrency === 'USD' && transactionType !== 'EXEMPT_CONTRACT');

  if (transactionType === 'EXEMPT_CONTRACT' || transactionType === 'VES_LOCAL_PAYMENT' || !isForeignCurrencyPayment) {
    return {
      applies: false,
      igtfRate: 0,
      igtfAmount: 0,
      netAmountToPay: Math.round(amount * 100) / 100,
      justification:
        'IGTF no aplica a pagos en bolívares (VES) directos ni a contratos expresamente exentos conforme a la Ley de IGTF vigente.',
    };
  }

  if (typeof effectivePolicyRate.igtfRate !== 'number' || effectivePolicyRate.igtfRate < 0) {
    throw new MissingPolicyRateError('igtfRate');
  }

  const rate = effectivePolicyRate.igtfRate;
  const igtfAmount = Math.round(amount * rate * 100) / 100;
  const netAmountToPay = Math.round((amount + igtfAmount) * 100) / 100;

  return {
    applies: true,
    igtfRate: rate,
    igtfAmount,
    netAmountToPay,
    justification:
      'IGTF aplica a pagos en divisas / moneda extranjera conforme a Providencia Administrativa Ley de IGTF vigente y política económica activa.',
  };
}
