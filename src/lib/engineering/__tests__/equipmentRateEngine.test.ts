import { describe, it, expect } from 'vitest';
import { 
  calculateCHP, 
  calculateCHO, 
  calculateHourlyRate, 
  calculateFuelVariance, 
  calculateMaintenanceDue, 
  VersionedEquipmentPolicy,
  InvalidEquipmentPolicyError,
  InvalidEquipmentParameterError
} from '../equipmentRateEngine';
import { calculateApuUnitCost, ApuItem } from '../apuCalculator';

const validActivePolicy: VersionedEquipmentPolicy = {
  policyId: 'EQ-POL-TEST-01',
  version: '2026.1',
  effectiveDate: '2026-01-01T00:00:00.000Z',
  approvedBy: 'Ing. Supervisor de Flota',
  status: 'ACTIVE',
  currency: 'USD',
  annualInterestRate: 0.08, // 8%
  insuranceRate: 0.02, // 2%
  storageMaintenanceRate: 0.015, // 1.5%
  annualOperatingHours: 2000,
  majorOverhaulFactor: 0.20, // 20%
  lubeFactorPercentOfFuel: 0.15, // 15%
  standbyChpMultiplier: 0.70,
  idleChoMultiplier: 0.25,
  alertThresholdPercent: 0.15,
};

describe('S17 — equipmentRateEngine Unit Tests', () => {

  describe('C3 — Policy Validation', () => {
    it('should throw InvalidEquipmentPolicyError if effectiveDate is missing', () => {
      const invalidPolicy = { ...validActivePolicy, effectiveDate: '' };
      expect(() => calculateCHP({
        acquisitionCostUsd: 100000,
        residualValuePercent: 0.20,
        usefulLifeHours: 10000,
        policy: invalidPolicy as VersionedEquipmentPolicy,
      })).toThrow(InvalidEquipmentPolicyError);
    });

    it('should throw InvalidEquipmentPolicyError if policy is inactive or draft', () => {
      const draftPolicy = { ...validActivePolicy, status: 'draft' as any };
      expect(() => calculateCHP({
        acquisitionCostUsd: 100000,
        residualValuePercent: 0.20,
        usefulLifeHours: 10000,
        policy: draftPolicy,
      })).toThrow(InvalidEquipmentPolicyError);
    });
  });

  describe('C2 — CHP & CHO Itemized Calculation', () => {
    it('should calculate itemized CHP correctly', () => {
      const chp = calculateCHP({
        acquisitionCostUsd: 200000,
        residualValuePercent: 0.20, // residual = 40,000, depreciable = 160,000
        usefulLifeHours: 10000, // dep/hr = 16.0
        policy: validActivePolicy,
      });

      // dep = 16.0
      expect(chp.depreciationUsdHr).toBe(16.0);
      // Pm = 200,000 * 1.20 / 2 = 120,000
      // interest = 120,000 * 0.08 / 2000 = 4.8
      expect(chp.interestUsdHr).toBe(4.8);
      // insurance = 120,000 * 0.02 / 2000 = 1.2
      expect(chp.insuranceUsdHr).toBe(1.2);
      // storage = 120,000 * 0.015 / 2000 = 0.9
      expect(chp.storageUsdHr).toBe(0.9);
      // major overhaul = 16.0 * 0.20 = 3.2
      expect(chp.majorOverhaulUsdHr).toBe(3.2);

      const expectedTotal = 26.1;
      expect(chp.totalChpUsdHr).toBeCloseTo(expectedTotal, 4);
    });

    it('should calculate itemized CHO correctly', () => {
      const cho = calculateCHO({
        fuelType: 'DIESEL',
        fuelConsumptionLitersHr: 10,
        fuelUnitPriceUsd: 1.00, // fuel = 10.0
        operatorHourlyRateUsd: 12.00,
        tiresOrTracksUsdHr: 2.00,
        repairMaintenanceFactor: 0.50,
        depreciationUsdHrForMaintenance: 16.0, // repair = 8.0
        policy: validActivePolicy,
      });

      expect(cho.fuelUsdHr).toBe(10.0);
      expect(cho.lubricantsUsdHr).toBe(1.5); // 10.0 * 15%
      expect(cho.tiresOrTracksUsdHr).toBe(2.0);
      expect(cho.repairMaintenanceUsdHr).toBe(8.0);
      expect(cho.operatorUsdHr).toBe(12.0);

      const expectedTotal = 10.0 + 1.5 + 2.0 + 8.0 + 12.0; // 33.5
      expect(cho.totalChoUsdHr).toBe(expectedTotal);
    });
  });

  describe('C1 & C2 — Operating, Standby, and Idle Rates', () => {
    it('should compute combined hourly rates across operational modes', () => {
      const result = calculateHourlyRate({
        equipmentTag: 'GRU-01',
        equipmentName: 'Grúa Telescópica 80T',
        chpParams: {
          acquisitionCostUsd: 200000,
          residualValuePercent: 0.20,
          usefulLifeHours: 10000,
          policy: validActivePolicy,
        },
        choParams: {
          fuelType: 'DIESEL',
          fuelConsumptionLitersHr: 10,
          fuelUnitPriceUsd: 1.00,
          operatorHourlyRateUsd: 12.00,
          tiresOrTracksUsdHr: 2.00,
          policy: validActivePolicy,
        },
        policy: validActivePolicy,
      });

      expect(result.operatingHourlyRateUsd).toBe(59.6); // 26.1 CHP + 33.5 CHO
      expect(result.standbyHourlyRateUsd).toBeGreaterThan(0);
      expect(result.idleHourlyRateUsd).toBeGreaterThan(0);
      expect(result.policyVersion).toBe('2026.1');
      expect(result.effectiveDate).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  describe('C4 — Fuel Variance Analysis', () => {
    it('should detect CRITICAL alert level if fuel consumption exceeds threshold x 2', () => {
      const res = calculateFuelVariance({
        equipmentId: 'EQ-01',
        date: '2026-08-01',
        horometerAtRefuel: 1050,
        litersRefueled: 300, // 30 L/h
        fuelUnitPriceUsd: 1.0,
        operatingHoursSinceLastRefuel: 10, // actual = 30 L/h vs expected = 15 L/h (+100% variance)
        expectedLitersPerHr: 15,
        alertThresholdPercent: 0.15,
      });

      expect(res.actualLitersPerHr).toBe(30);
      expect(res.variancePercent).toBe(1.0); // +100%
      expect(res.alert).toBe(true);
      expect(res.alertLevel).toBe('CRITICAL');
    });

    it('should detect WARNING alert if fuel consumption exceeds threshold', () => {
      const res = calculateFuelVariance({
        equipmentId: 'EQ-01',
        date: '2026-08-01',
        horometerAtRefuel: 1050,
        litersRefueled: 180, // 18 L/h (+20% variance vs 15 L/h)
        fuelUnitPriceUsd: 1.0,
        operatingHoursSinceLastRefuel: 10,
        expectedLitersPerHr: 15,
        alertThresholdPercent: 0.15,
      });

      expect(res.actualLitersPerHr).toBe(18);
      expect(res.variancePercent).toBe(0.20);
      expect(res.alert).toBe(true);
      expect(res.alertLevel).toBe('WARNING');
    });
  });

  describe('C5 — Maintenance Schedule Due Calculation', () => {
    it('should evaluate OVERDUE criticality when horometer exceeds maintenance interval', () => {
      const res = calculateMaintenanceDue({
        equipmentId: 'EQ-01',
        currentHorometer: 1260,
        lastMaintenanceHorometer: 1000,
        maintenanceIntervalHours: 250, // due at 1250, current = 1260 (10 hrs overdue)
      });

      expect(res.nextMaintenanceHorometer).toBe(1250);
      expect(res.hoursOverdue).toBe(10);
      expect(res.criticalityLevel).toBe('OVERDUE');
      expect(res.isDue).toBe(true);
    });

    it('should evaluate DUE_SOON when remaining hours are within window', () => {
      const res = calculateMaintenanceDue({
        equipmentId: 'EQ-01',
        currentHorometer: 1235,
        lastMaintenanceHorometer: 1000,
        maintenanceIntervalHours: 250, // due at 1250 (15 hrs remaining vs 30h window)
        dueSoonWindowHours: 30,
      });

      expect(res.hoursRemaining).toBe(15);
      expect(res.criticalityLevel).toBe('DUE_SOON');
      expect(res.isDue).toBe(true);
    });
  });

  describe('C8 — APU Equipment Integration', () => {
    it('should consume equipment rate output in apuCalculator without apuCalculator importing rate engine', () => {
      const rateResult = calculateHourlyRate({
        equipmentTag: 'GRU-01',
        equipmentName: 'Grúa Telescópica 80T',
        chpParams: {
          acquisitionCostUsd: 200000,
          residualValuePercent: 0.20,
          usefulLifeHours: 10000,
          policy: validActivePolicy,
        },
        choParams: {
          fuelType: 'DIESEL',
          fuelConsumptionLitersHr: 10,
          fuelUnitPriceUsd: 1.00,
          operatorHourlyRateUsd: 12.00,
          policy: validActivePolicy,
        },
        policy: validActivePolicy,
      });

      const sampleApuItem: ApuItem = {
        code: 'APU-EQUIP-01',
        title: 'Izamiento Estructural de Tubería 24"',
        unit: 'pza',
        category: 'Mecánica',
        fcasPercent: 425.8,
        labor: [],
        equipment: [
          {
            id: 'eq-1',
            name: rateResult.equipmentName,
            equipmentId: 'EQ-GRU-01',
            hourlyRateActiveUsd: rateResult.operatingHourlyRateUsd,
            hourlyRateIdleUsd: rateResult.idleHourlyRateUsd,
            hoursActive: 8,
            hoursIdle: 0,
            chpUsd: rateResult.chpDetail.totalChpUsdHr,
            choUsd: rateResult.choDetail.totalChoUsdHr,
          }
        ],
        materials: [],
        indirectsPercent: 10,
        contingencyPercent: 5,
        profitPercent: 15,
        performancePerDay: 5,
        totalDirectCostUsd: 0,
        totalUnitCostUsd: 0,
      };

      const apuResult = calculateApuUnitCost(sampleApuItem);

      expect(apuResult.equipDaily).toBe(rateResult.operatingHourlyRateUsd * 8);
      expect(apuResult.equipPerUnit).toBe((rateResult.operatingHourlyRateUsd * 8) / 5);
      expect(apuResult.totalUnitCost).toBeGreaterThan(0);
    });
  });

});
