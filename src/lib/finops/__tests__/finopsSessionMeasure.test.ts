import { describe, it, expect } from 'vitest';
import { measureUserSessionReads, TYPICAL_TENANT_DATASET_COUNTS } from '../../../../scripts/measureFinOpsSessionReads';

describe('Sprint F-FINOPS-MEASURE: Measurement & FinOps Projection', () => {
  it('1. Calculates measured session reads and compares against projection of 435', () => {
    const result = measureUserSessionReads();

    // Verify session measured reads
    expect(result.projectedReads).toBe(435);
    expect(result.totalUncachedReads).toBe(347); // Measured uncached value
    expect(result.totalCachedReads).toBe(145);   // Measured cached value

    // Deviation calculation
    const deviationReads = result.totalUncachedReads - result.projectedReads;
    const deviationPercent = (deviationReads / result.projectedReads) * 100;
    expect(deviationPercent).toBeCloseTo(-20.2, 1);
  });

  it('2. Confirms daily read consumption for 10 active clients exceeds Spark free limit without cache', () => {
    const result = measureUserSessionReads();

    // Uncached 10 clients: 150 sessions/day * 347 reads/session = 52,050 reads/day
    expect(result.uncachedDailyReads10Clients).toBe(52050);
    expect(result.sparkFreeLimitDaily).toBe(50000);
    expect(result.exceedsUncached).toBe(true);
  });

  it('3. Confirms proposed in-memory query cache reduces daily reads below Spark free limit', () => {
    const result = measureUserSessionReads();

    // Cached 10 clients: 150 sessions/day * 145 reads/session = 21,750 reads/day
    expect(result.cachedDailyReads10Clients).toBe(21750);
    expect(result.exceedsCached).toBe(false);
    expect(result.savingPercent).toBeGreaterThan(50); // > 50% savings
  });

  it('4. Validates tenant dataset document distribution in test measurement', () => {
    expect(TYPICAL_TENANT_DATASET_COUNTS.tasks).toBe(25);
    expect(TYPICAL_TENANT_DATASET_COUNTS.expenses).toBe(15);
    expect(TYPICAL_TENANT_DATASET_COUNTS.valuations).toBe(10);
    expect(TYPICAL_TENANT_DATASET_COUNTS.siho_ptw).toBe(12);
    expect(TYPICAL_TENANT_DATASET_COUNTS.weld_joints).toBe(20);
    expect(TYPICAL_TENANT_DATASET_COUNTS.field_reports).toBe(18);
  });
});
