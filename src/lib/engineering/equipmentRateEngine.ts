/**
 * Industrial Control 360 (IC360) - Equipment Hourly Rate, Fuel & Maintenance Engine
 * Module: src/lib/engineering/equipmentRateEngine.ts
 *
 * Pure TypeScript engineering module for calculating:
 * - CHP (Costo Horario de Posesión / Ownership Hourly Cost)
 * - CHO (Costo Horario de Operación / Operational Hourly Cost)
 * - Operating, Standby, and Idle hourly rates
 * - Fuel consumption variance analysis against configurable policy thresholds
 * - Maintenance schedule and horometer overdue status evaluation
 *
 * Rules:
 * - Pure TypeScript module (NO React, NO Firebase client dependencies).
 * - Strict domain error throwing for invalid/missing policies or invalid parameters.
 * - Multi-tenant safe, deterministic computations.
 */

export class InvalidEquipmentPolicyError extends Error {
  constructor(message: string) {
    super(`[InvalidEquipmentPolicyError] ${message}`);
    this.name = 'InvalidEquipmentPolicyError';
  }
}

export class InvalidEquipmentParameterError extends Error {
  constructor(message: string) {
    super(`[InvalidEquipmentParameterError] ${message}`);
    this.name = 'InvalidEquipmentParameterError';
  }
}

// ─── INTERFACES ──────────────────────────────────────────────────────────────

export interface VersionedEquipmentPolicy {
  policyId: string;
  version: string;
  effectiveDate: string; // ISO date string format (Mandatory)
  approvedBy: string; // Approver UID or Officer Name
  status: 'active' | 'ACTIVE' | 'draft' | 'DRAFT' | 'revoked' | 'REVOKED' | 'EXPIRED';
  currency: 'USD' | 'VES';
  // CHP Parameters
  annualInterestRate: number; // e.g. 0.08 (8% p.a.)
  insuranceRate: number; // e.g. 0.02 (2% p.a.)
  storageMaintenanceRate: number; // e.g. 0.015 (1.5% p.a.)
  annualOperatingHours: number; // e.g. 2000 hrs/year
  majorOverhaulFactor: number; // e.g. 0.20 (20% of depreciation)
  // CHO & Operating Mode Multipliers
  lubeFactorPercentOfFuel: number; // e.g. 0.15 (15% of fuel cost)
  standbyChpMultiplier: number; // e.g. 0.70 for standby ownership cost
  idleChoMultiplier: number; // e.g. 0.25 for idling fuel/wear
  alertThresholdPercent?: number; // Configurable fuel variance alert threshold, e.g. 0.15 (15%)
}

export interface ChpParams {
  acquisitionCostUsd: number;
  residualValuePercent: number; // e.g. 0.20 for 20%
  usefulLifeHours: number; // Total useful life in hours, e.g. 10000
  policy: VersionedEquipmentPolicy;
  customAnnualHours?: number;
}

export interface ChpResult {
  depreciationUsdHr: number;
  interestUsdHr: number;
  insuranceUsdHr: number;
  storageUsdHr: number;
  majorOverhaulUsdHr: number;
  totalChpUsdHr: number;
}

export interface ChoParams {
  fuelType: 'DIESEL' | 'GASOLINE' | 'ELECTRIC' | 'NONE';
  fuelConsumptionLitersHr: number; // L/hr
  fuelUnitPriceUsd: number; // $/L
  operatorHourlyRateUsd?: number; // Labor hourly cost from Labor Policy or reference
  tiresOrTracksUsdHr?: number; // Wear rate in $/hr
  repairMaintenanceFactor?: number; // Factor relative to depreciation (default e.g. 0.50)
  depreciationUsdHrForMaintenance?: number; // Reference depreciation rate
  policy: VersionedEquipmentPolicy;
}

export interface ChoResult {
  fuelUsdHr: number;
  lubricantsUsdHr: number;
  tiresOrTracksUsdHr: number;
  repairMaintenanceUsdHr: number;
  operatorUsdHr: number;
  totalChoUsdHr: number;
}

export interface EquipmentHourlyRateInput {
  equipmentTag: string;
  equipmentName: string;
  chpParams: ChpParams;
  choParams: ChoParams;
  policy: VersionedEquipmentPolicy;
}

export interface EquipmentHourlyRateResult {
  equipmentTag: string;
  equipmentName: string;
  operatingHourlyRateUsd: number; // Full Operating (CHP + CHO)
  standbyHourlyRateUsd: number; // Standby (Standby CHP + Operator)
  idleHourlyRateUsd: number; // Idle (CHP + Idle CHO + Operator)
  chpDetail: ChpResult;
  choDetail: ChoResult;
  policyVersion: string;
  effectiveDate: string;
  currency: 'USD' | 'VES';
}

export interface FuelLogInput {
  equipmentId: string;
  date: string;
  horometerAtRefuel: number;
  litersRefueled: number;
  fuelUnitPriceUsd: number;
  operatingHoursSinceLastRefuel: number;
  expectedLitersPerHr: number;
  alertThresholdPercent?: number; // Configurable threshold (C4)
  evidenceUrl?: string;
  source?: 'MANUAL' | 'IOT_SENSOR' | 'DISPENSER_LOG';
}

export interface FuelVarianceResult {
  equipmentId: string;
  actualLitersPerHr: number;
  expectedLitersPerHr: number;
  expectedTotalLiters: number;
  varianceLiters: number;
  variancePercent: number;
  alert: boolean;
  alertLevel: 'NONE' | 'WARNING' | 'CRITICAL';
  alertThresholdPercent: number;
}

export interface MaintenanceDueParams {
  equipmentId: string;
  currentHorometer: number;
  lastMaintenanceHorometer: number;
  maintenanceIntervalHours: number; // Custom interval per machine criticality/manufacturer
  dueSoonWindowHours?: number; // Window before interval to raise DUE_SOON, default 30h
}

export interface MaintenanceDueResult {
  equipmentId: string;
  currentHorometer: number;
  lastMaintenanceHorometer: number;
  nextMaintenanceHorometer: number;
  hoursRemaining: number;
  hoursOverdue: number;
  criticalityLevel: 'OK' | 'DUE_SOON' | 'OVERDUE' | 'CRITICAL';
  isDue: boolean;
}

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

export function validateEquipmentPolicy(policy: VersionedEquipmentPolicy): void {
  if (!policy) {
    throw new InvalidEquipmentPolicyError('Equipment policy object is missing.');
  }

  if (!policy.effectiveDate || typeof policy.effectiveDate !== 'string' || !policy.effectiveDate.trim()) {
    throw new InvalidEquipmentPolicyError('Policy must have a valid effectiveDate in ISO format.');
  }

  // Check valid ISO date
  const parsedDate = new Date(policy.effectiveDate);
  if (isNaN(parsedDate.getTime())) {
    throw new InvalidEquipmentPolicyError(`Invalid ISO date format for effectiveDate: ${policy.effectiveDate}`);
  }

  const status = (policy.status || '').toUpperCase();
  if (status !== 'ACTIVE') {
    throw new InvalidEquipmentPolicyError(`Equipment policy version ${policy.version || 'unknown'} is inactive (status: ${policy.status}).`);
  }

  if (policy.annualOperatingHours <= 0) {
    throw new InvalidEquipmentPolicyError('annualOperatingHours must be strictly greater than 0.');
  }

  if (!['USD', 'VES'].includes((policy.currency || '').toUpperCase())) {
    throw new InvalidEquipmentPolicyError(`Unsupported currency: ${policy.currency}`);
  }
}

// ─── CORE CALCULATION FUNCTIONS ──────────────────────────────────────────────

/**
 * Calculates Costo Horario de Posesión (CHP)
 */
export function calculateCHP(params: ChpParams): ChpResult {
  validateEquipmentPolicy(params.policy);

  const { acquisitionCostUsd, residualValuePercent, usefulLifeHours, policy, customAnnualHours } = params;

  if (acquisitionCostUsd < 0) {
    throw new InvalidEquipmentParameterError('Acquisition cost cannot be negative.');
  }
  if (residualValuePercent < 0 || residualValuePercent >= 1) {
    throw new InvalidEquipmentParameterError('Residual value percent must be between 0 and 0.99.');
  }
  if (usefulLifeHours <= 0) {
    throw new InvalidEquipmentParameterError('Useful life hours must be strictly greater than 0.');
  }

  const annualHours = customAnnualHours || policy.annualOperatingHours;
  if (annualHours <= 0) {
    throw new InvalidEquipmentParameterError('Annual operating hours must be greater than 0.');
  }

  // 1. Depreciation ($/hr)
  const residualValueUsd = acquisitionCostUsd * residualValuePercent;
  const netDepreciableValue = acquisitionCostUsd - residualValueUsd;
  const depreciationUsdHr = netDepreciableValue / usefulLifeHours;

  // 2. Capital Average Value ($)
  // Standard engineering formula: Pm = Va * (1 + Vr) / 2
  const averageCapitalUsd = (acquisitionCostUsd * (1 + residualValuePercent)) / 2;

  // 3. Financial Costs ($/hr)
  const interestUsdHr = (averageCapitalUsd * policy.annualInterestRate) / annualHours;
  const insuranceUsdHr = (averageCapitalUsd * policy.insuranceRate) / annualHours;
  const storageUsdHr = (averageCapitalUsd * policy.storageMaintenanceRate) / annualHours;

  // 4. Major Overhaul ($/hr)
  const majorOverhaulUsdHr = depreciationUsdHr * (policy.majorOverhaulFactor || 0);

  const totalChpUsdHr = depreciationUsdHr + interestUsdHr + insuranceUsdHr + storageUsdHr + majorOverhaulUsdHr;

  return {
    depreciationUsdHr: round4(depreciationUsdHr),
    interestUsdHr: round4(interestUsdHr),
    insuranceUsdHr: round4(insuranceUsdHr),
    storageUsdHr: round4(storageUsdHr),
    majorOverhaulUsdHr: round4(majorOverhaulUsdHr),
    totalChpUsdHr: round4(totalChpUsdHr),
  };
}

/**
 * Calculates Costo Horario de Operación (CHO)
 */
export function calculateCHO(params: ChoParams): ChoResult {
  validateEquipmentPolicy(params.policy);

  const {
    fuelType,
    fuelConsumptionLitersHr,
    fuelUnitPriceUsd,
    operatorHourlyRateUsd = 0,
    tiresOrTracksUsdHr = 0,
    repairMaintenanceFactor = 0.50,
    depreciationUsdHrForMaintenance = 0,
    policy,
  } = params;

  if (fuelConsumptionLitersHr < 0 || fuelUnitPriceUsd < 0) {
    throw new InvalidEquipmentParameterError('Fuel consumption and fuel price cannot be negative.');
  }
  if (operatorHourlyRateUsd < 0) {
    throw new InvalidEquipmentParameterError('Operator hourly rate cannot be negative.');
  }

  // 1. Fuel ($/hr)
  const fuelUsdHr = fuelType === 'NONE' ? 0 : fuelConsumptionLitersHr * fuelUnitPriceUsd;

  // 2. Lubricants ($/hr) - policy percentage of fuel cost
  const lubricantsUsdHr = fuelUsdHr * (policy.lubeFactorPercentOfFuel || 0);

  // 3. Tires/Tracks ($/hr)
  const tiresUsdHr = Math.max(0, tiresOrTracksUsdHr);

  // 4. Minor Repairs & Maintenance ($/hr)
  const repairMaintenanceUsdHr = depreciationUsdHrForMaintenance * Math.max(0, repairMaintenanceFactor);

  // 5. Operator ($/hr)
  const operatorUsdHr = Math.max(0, operatorHourlyRateUsd);

  const totalChoUsdHr = fuelUsdHr + lubricantsUsdHr + tiresUsdHr + repairMaintenanceUsdHr + operatorUsdHr;

  return {
    fuelUsdHr: round4(fuelUsdHr),
    lubricantsUsdHr: round4(lubricantsUsdHr),
    tiresOrTracksUsdHr: round4(tiresUsdHr),
    repairMaintenanceUsdHr: round4(repairMaintenanceUsdHr),
    operatorUsdHr: round4(operatorUsdHr),
    totalChoUsdHr: round4(totalChoUsdHr),
  };
}

/**
 * Calculates complete equipment hourly rates across modes (Operating, Standby, Idle)
 */
export function calculateHourlyRate(input: EquipmentHourlyRateInput): EquipmentHourlyRateResult {
  validateEquipmentPolicy(input.policy);

  const chpDetail = calculateCHP(input.chpParams);

  // Pass depreciation to CHO for repair factor calculation if needed
  const choParamsWithDep = {
    ...input.choParams,
    depreciationUsdHrForMaintenance: input.choParams.depreciationUsdHrForMaintenance ?? chpDetail.depreciationUsdHr,
  };
  const choDetail = calculateCHO(choParamsWithDep);

  // Operating Hourly Rate = CHP + CHO
  const operatingHourlyRateUsd = chpDetail.totalChpUsdHr + choDetail.totalChoUsdHr;

  // Standby Hourly Rate = (CHP * standbyChpMultiplier) + Operator
  const standbyChp = chpDetail.totalChpUsdHr * (input.policy.standbyChpMultiplier ?? 0.70);
  const standbyHourlyRateUsd = standbyChp + choDetail.operatorUsdHr;

  // Idle Hourly Rate = CHP + (Fuel * idleChoMultiplier) + Lubricants(idle) + Repair(idle) + Operator
  const idleFuel = choDetail.fuelUsdHr * (input.policy.idleChoMultiplier ?? 0.25);
  const idleLube = choDetail.lubricantsUsdHr * (input.policy.idleChoMultiplier ?? 0.25);
  const idleRepair = choDetail.repairMaintenanceUsdHr * 0.10;
  const idleChoTotal = idleFuel + idleLube + idleRepair + choDetail.tiresOrTracksUsdHr + choDetail.operatorUsdHr;
  const idleHourlyRateUsd = chpDetail.totalChpUsdHr + idleChoTotal;

  return {
    equipmentTag: input.equipmentTag,
    equipmentName: input.equipmentName,
    operatingHourlyRateUsd: round4(operatingHourlyRateUsd),
    standbyHourlyRateUsd: round4(standbyHourlyRateUsd),
    idleHourlyRateUsd: round4(idleHourlyRateUsd),
    chpDetail,
    choDetail,
    policyVersion: input.policy.version,
    effectiveDate: input.policy.effectiveDate,
    currency: input.policy.currency,
  };
}

/**
 * Calculates fuel consumption variance against expected benchmark with configurable alert threshold (C4)
 */
export function calculateFuelVariance(input: FuelLogInput): FuelVarianceResult {
  const {
    equipmentId,
    litersRefueled,
    operatingHoursSinceLastRefuel,
    expectedLitersPerHr,
    alertThresholdPercent = input.alertThresholdPercent ?? 0.15, // Configurable parameter (C4)
  } = input;

  if (operatingHoursSinceLastRefuel <= 0) {
    return {
      equipmentId,
      actualLitersPerHr: 0,
      expectedLitersPerHr,
      expectedTotalLiters: 0,
      varianceLiters: litersRefueled,
      variancePercent: 0,
      alert: false,
      alertLevel: 'NONE',
      alertThresholdPercent,
    };
  }

  const actualLitersPerHr = litersRefueled / operatingHoursSinceLastRefuel;
  const expectedTotalLiters = expectedLitersPerHr * operatingHoursSinceLastRefuel;
  const varianceLiters = litersRefueled - expectedTotalLiters;
  
  const variancePercent = expectedTotalLiters > 0 ? (litersRefueled - expectedTotalLiters) / expectedTotalLiters : 0;

  let alertLevel: 'NONE' | 'WARNING' | 'CRITICAL' = 'NONE';
  let alert = false;

  if (variancePercent > alertThresholdPercent * 2) {
    alertLevel = 'CRITICAL';
    alert = true;
  } else if (variancePercent > alertThresholdPercent) {
    alertLevel = 'WARNING';
    alert = true;
  }

  return {
    equipmentId,
    actualLitersPerHr: round4(actualLitersPerHr),
    expectedLitersPerHr: round4(expectedLitersPerHr),
    expectedTotalLiters: round4(expectedTotalLiters),
    varianceLiters: round4(varianceLiters),
    variancePercent: round4(variancePercent),
    alert,
    alertLevel,
    alertThresholdPercent,
  };
}

/**
 * Calculates maintenance schedule status based on current horometer vs last service and custom interval (C5)
 */
export function calculateMaintenanceDue(params: MaintenanceDueParams): MaintenanceDueResult {
  const {
    equipmentId,
    currentHorometer,
    lastMaintenanceHorometer,
    maintenanceIntervalHours,
    dueSoonWindowHours = 30,
  } = params;

  if (currentHorometer < 0 || lastMaintenanceHorometer < 0) {
    throw new InvalidEquipmentParameterError('Horometer values cannot be negative.');
  }

  if (maintenanceIntervalHours <= 0) {
    throw new InvalidEquipmentParameterError('Maintenance interval hours must be strictly greater than 0.');
  }

  const nextMaintenanceHorometer = lastMaintenanceHorometer + maintenanceIntervalHours;
  const hoursAccumulated = currentHorometer - lastMaintenanceHorometer;
  const hoursRemaining = nextMaintenanceHorometer - currentHorometer;
  const hoursOverdue = Math.max(0, currentHorometer - nextMaintenanceHorometer);

  let criticalityLevel: 'OK' | 'DUE_SOON' | 'OVERDUE' | 'CRITICAL' = 'OK';
  let isDue = false;

  if (hoursOverdue > 100) {
    criticalityLevel = 'CRITICAL';
    isDue = true;
  } else if (hoursOverdue > 0) {
    criticalityLevel = 'OVERDUE';
    isDue = true;
  } else if (hoursRemaining <= dueSoonWindowHours) {
    criticalityLevel = 'DUE_SOON';
    isDue = true;
  }

  return {
    equipmentId,
    currentHorometer,
    lastMaintenanceHorometer,
    nextMaintenanceHorometer,
    hoursRemaining: round4(hoursRemaining),
    hoursOverdue: round4(hoursOverdue),
    criticalityLevel,
    isDue,
  };
}

function round4(val: number): number {
  return Math.round(val * 10000) / 10000;
}
