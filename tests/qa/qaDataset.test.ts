import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generateManifest } from '../../scripts/qa/generateManifest';
import { runQaDatasetEngine, getAdminApp, QA_ORG_ID, QA_PROJECT_ID } from '../../scripts/qa/seedQaDataset';

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';

describe('Sprint A2: QA Dataset Engine & Multi-tenant Isolation', () => {
  beforeAll(() => {
    process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;
    getAdminApp();
  });

  afterAll(async () => {
    // Cleanup admin SDK connections if needed
  });

  it('1. Manifest generation calculates valid SHA-256 and correct document counts', () => {
    const manifest = generateManifest();
    expect(manifest.datasetId).toBe('DS-IC360-QA-CANONICAL');
    expect(manifest.version).toBe('1.0.0-QA');
    expect(manifest.sha256).toBeDefined();
    expect(manifest.sha256.length).toBe(64);
    expect(manifest.counts.tasks).toBe(5);
    expect(manifest.counts.expenses).toBe(4);
    expect(manifest.counts.valuations).toBe(2);
    expect(manifest.counts.wbs_snapshots).toBe(4);
  });

  it('2. Dry-run mode produces execution plan without making DB changes', async () => {
    const result = await runQaDatasetEngine('dry-run');
    expect(result.mode).toBe('dry-run');
    expect(result.success).toBe(true);
    expect(result.writtenDocsCount).toBe(41);
    expect(result.deletedDocsCount).toBe(0);
    expect(result.collectionsAffected.length).toBeGreaterThan(10);
  });

  it('3. Apply mode writes dataset idempotently to emulator and records audit log', async () => {
    // First Apply
    const result1 = await runQaDatasetEngine('apply', { emulatorHost: EMULATOR_HOST });
    expect(result1.success).toBe(true);
    expect(result1.writtenDocsCount).toBe(41);
    expect(result1.auditLogId).toBeDefined();

    const db = getAdminApp();

    // Verify Organization document
    const orgSnap = await db.doc(`organizations/${QA_ORG_ID}`).get();
    expect(orgSnap.exists).toBe(true);
    expect(orgSnap.data()?.name).toContain('Constructora Río Verde S.A.');
    expect(orgSnap.data()?.datasetId).toBe('DS-IC360-QA-CANONICAL');

    // Verify Tasks
    const tasksSnap = await db.collection(`organizations/${QA_ORG_ID}/projects/${QA_PROJECT_ID}/tasks`).get();
    expect(tasksSnap.docs.length).toBe(5);

    // Second Apply (Idempotency test)
    const result2 = await runQaDatasetEngine('apply', { emulatorHost: EMULATOR_HOST });
    expect(result2.success).toBe(true);
    expect(result2.writtenDocsCount).toBe(41);

    const tasksSnap2 = await db.collection(`organizations/${QA_ORG_ID}/projects/${QA_PROJECT_ID}/tasks`).get();
    expect(tasksSnap2.docs.length).toBe(5); // No duplicates created
  });

  it('4. Reset mode deletes ONLY QA tenant data and maintains strict tenant isolation', async () => {
    const db = getAdminApp();

    // Seed a document in a different organization (Prointeca)
    const otherOrgId = 'prointeca-prod-pilot';
    const otherDocRef = db.doc(`organizations/${otherOrgId}/projects/proj-001/tasks/task-other-001`);
    await otherDocRef.set({
      id: 'task-other-001',
      orgId: otherOrgId,
      title: 'Tarea Real Producción Prointeca (NO TOCAR)',
      isQa: false
    });

    // Execute Reset on QA tenant
    const resetResult = await runQaDatasetEngine('reset', { emulatorHost: EMULATOR_HOST });
    expect(resetResult.success).toBe(true);
    expect(resetResult.deletedDocsCount).toBeGreaterThan(0);

    // Verify QA tenant was reset
    const qaTasksSnap = await db.collection(`organizations/${QA_ORG_ID}/projects/${QA_PROJECT_ID}/tasks`).get();
    expect(qaTasksSnap.empty).toBe(true);

    const qaOrgSnap = await db.doc(`organizations/${QA_ORG_ID}`).get();
    expect(qaOrgSnap.exists).toBe(false);

    // Verify OTHER org document was 100% UNTOUCHED
    const otherDocSnap = await otherDocRef.get();
    expect(otherDocSnap.exists).toBe(true);
    expect(otherDocSnap.data()?.title).toBe('Tarea Real Producción Prointeca (NO TOCAR)');

    // Clean up test doc
    await otherDocRef.delete();
  });
});
