import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const ALLOWED_SUBCOLLECTIONS = new Set([
  'tasks',
  'expenses',
  'valuations',
  'siho_ptw',
  'weld_joints',
  'field_reports',
  'documents',
  'inventory',
  'routes',
  'engineering_calcs',
  'client_portals',
  'client_portal_access_logs',
  'hot_tap_interventions',
  'procurement',
  'apus',
  'quantity_takeoffs',
  'workers',
  'worker_attendance',
  'wbs_snapshots',
  'settings',
  'fleet_equipment',
  'environmental_aspects',
  'rasda_manifests',
  'environmental_inspections',
  'standby_claims',
  'standby_mocs',
  'instrumentation_loops',
  'civil_works',
  'loto_isolations',
  'alerts'
]);

export const QA_ORG_ID = 'ic360-qa-pilot';
export const QA_PROJECT_ID = 'proj-qa-anaco-001';
export const QA_DATASET_ID = 'DS-IC360-QA-CANONICAL';

export interface SeedResult {
  mode: 'dry-run' | 'apply' | 'reset';
  success: boolean;
  writtenDocsCount: number;
  deletedDocsCount: number;
  collectionsAffected: string[];
  manifestHash?: string;
  auditLogId?: string;
  message: string;
}

export function getAdminApp() {
  const apps = getApps();
  const projectId = process.env.GCP_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID || 'demo-ic360';
  const app = apps.length ? getApp() : initializeApp({ projectId });
  return getFirestore(app);
}

export async function runQaDatasetEngine(mode: 'dry-run' | 'apply' | 'reset', options: { emulatorHost?: string } = {}): Promise<SeedResult> {
  if (options.emulatorHost) {
    process.env.FIRESTORE_EMULATOR_HOST = options.emulatorHost;
  }

  const fixturesDir = path.resolve(process.cwd(), 'scripts/qa/fixtures');
  if (!fs.existsSync(fixturesDir)) {
    throw new Error(`Directorio de fixtures no encontrado en ${fixturesDir}`);
  }

  const manifestPath = path.join(fixturesDir, 'manifest.json');
  let manifestHash = 'N/A';
  if (fs.existsSync(manifestPath)) {
    const manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    manifestHash = manifestData.sha256;
  }

  if (mode === 'dry-run') {
    console.log(`🔍 --- RUNNING QA DATASET ENGINE IN [DRY-RUN] MODE ---`);
    const files = fs.readdirSync(fixturesDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');
    let totalDocs = 0;
    const collectionsAffected: string[] = [];

    for (const file of files) {
      const colName = file.replace('.json', '');
      if (colName !== 'organization' && colName !== 'project' && !ALLOWED_SUBCOLLECTIONS.has(colName)) {
        console.warn(`⚠️ Advertencia: La colección '${colName}' no está en el inventario D-SEC-08`);
      }
      const content = JSON.parse(fs.readFileSync(path.join(fixturesDir, file), 'utf-8'));
      const count = Array.isArray(content) ? content.length : 1;
      totalDocs += count;
      collectionsAffected.push(colName);
      console.log(`  • [DRY-RUN] Colección '${colName}': ${count} documento(s) preparados.`);
    }

    console.log(`✅ [DRY-RUN] Verificación completada. Total documentos a sembrar: ${totalDocs}`);
    return {
      mode: 'dry-run',
      success: true,
      writtenDocsCount: totalDocs,
      deletedDocsCount: 0,
      collectionsAffected,
      manifestHash,
      message: `[DRY-RUN] Plan generado: ${totalDocs} documentos en ${collectionsAffected.length} colecciones.`
    };
  }

  const db = getAdminApp();

  if (mode === 'reset') {
    console.log(`🧹 --- RUNNING QA DATASET ENGINE IN [RESET] MODE FOR ORG '${QA_ORG_ID}' ---`);
    let deletedCount = 0;
    const collectionsAffected: string[] = [];

    // Delete subcollections under projects
    const projRef = db.collection(`organizations/${QA_ORG_ID}/projects`).doc(QA_PROJECT_ID);
    const projSnap = await projRef.get();

    for (const colName of ALLOWED_SUBCOLLECTIONS) {
      const subColRef = projRef.collection(colName);
      const docsSnap = await subColRef.get();
      if (!docsSnap.empty) {
        collectionsAffected.push(colName);
        const batch = db.batch();
        docsSnap.docs.forEach(docSnap => {
          batch.delete(docSnap.ref);
          deletedCount++;
        });
        await batch.commit();
      }
    }

    // Delete project doc
    if (projSnap.exists) {
      await projRef.delete();
      deletedCount++;
    }

    // Delete organization doc
    const orgRef = db.doc(`organizations/${QA_ORG_ID}`);
    const orgSnap = await orgRef.get();
    if (orgSnap.exists) {
      await orgRef.delete();
      deletedCount++;
    }

    // Create Audit Log event for Reset
    const auditRef = db.collection(`organizations/${QA_ORG_ID}/audit_logs`).doc(`audit_reset_${Date.now()}`);
    await auditRef.set({
      id: auditRef.id,
      action: 'QA_DATASET_RESET',
      datasetId: QA_DATASET_ID,
      orgId: QA_ORG_ID,
      deletedDocsCount: deletedCount,
      timestamp: new Date().toISOString(),
      performedBy: 'ADMIN_QA_ENGINE',
      manifestHash
    });

    console.log(`✅ [RESET] Organización '${QA_ORG_ID}' reseteada. Total borrados: ${deletedCount}`);
    return {
      mode: 'reset',
      success: true,
      writtenDocsCount: 0,
      deletedDocsCount: deletedCount,
      collectionsAffected,
      manifestHash,
      auditLogId: auditRef.id,
      message: `[RESET] Exitoso. ${deletedCount} documentos eliminados exclusivamente de '${QA_ORG_ID}'.`
    };
  }

  if (mode === 'apply') {
    console.log(`🚀 --- RUNNING QA DATASET ENGINE IN [APPLY] MODE FOR ORG '${QA_ORG_ID}' ---`);
    let writtenCount = 0;
    const collectionsAffected: string[] = [];

    // 1. Write Organization
    const orgPath = path.join(fixturesDir, 'organization.json');
    if (fs.existsSync(orgPath)) {
      const orgData = JSON.parse(fs.readFileSync(orgPath, 'utf-8'));
      await db.doc(`organizations/${QA_ORG_ID}`).set(orgData, { merge: true });
      writtenCount++;
      collectionsAffected.push('organization');
    }

    // 2. Write Project
    const projPath = path.join(fixturesDir, 'project.json');
    if (fs.existsSync(projPath)) {
      const projData = JSON.parse(fs.readFileSync(projPath, 'utf-8'));
      await db.doc(`organizations/${QA_ORG_ID}/projects/${QA_PROJECT_ID}`).set(projData, { merge: true });
      writtenCount++;
      collectionsAffected.push('project');
    }

    // 3. Write Subcollections
    const files = fs.readdirSync(fixturesDir).filter(f => f.endsWith('.json') && f !== 'manifest.json' && f !== 'organization.json' && f !== 'project.json');

    for (const file of files) {
      const colName = file.replace('.json', '');
      if (!ALLOWED_SUBCOLLECTIONS.has(colName)) {
        console.warn(`⚠️ Colección '${colName}' ignorada por no pertenecer al inventario D-SEC-08`);
        continue;
      }

      const records = JSON.parse(fs.readFileSync(path.join(fixturesDir, file), 'utf-8'));
      const recordsArr = Array.isArray(records) ? records : [records];

      const batch = db.batch();
      for (const rec of recordsArr) {
        const docId = rec.id || `qa_${colName}_${Date.now()}`;
        const docRef = db.collection(`organizations/${QA_ORG_ID}/projects/${QA_PROJECT_ID}/${colName}`).doc(docId);
        batch.set(docRef, rec, { merge: true });
        writtenCount++;
      }
      await batch.commit();
      collectionsAffected.push(colName);
      console.log(`  ✓ Sembrados ${recordsArr.length} registro(s) en subcolección '${colName}'`);
    }

    // 4. Record Audit Log Event
    const auditRef = db.collection(`organizations/${QA_ORG_ID}/audit_logs`).doc(`audit_seed_${Date.now()}`);
    await auditRef.set({
      id: auditRef.id,
      action: 'QA_DATASET_SEED',
      datasetId: QA_DATASET_ID,
      orgId: QA_ORG_ID,
      projectId: QA_PROJECT_ID,
      writtenDocsCount: writtenCount,
      timestamp: new Date().toISOString(),
      performedBy: 'ADMIN_QA_ENGINE',
      manifestHash
    });

    console.log(`✅ [APPLY] Sembrado QA completado exitosamente. Total documentos: ${writtenCount}`);
    return {
      mode: 'apply',
      success: true,
      writtenDocsCount: writtenCount,
      deletedDocsCount: 0,
      collectionsAffected,
      manifestHash,
      auditLogId: auditRef.id,
      message: `[APPLY] Sembrado exitoso. ${writtenCount} documentos escritos en '${QA_ORG_ID}'.`
    };
  }

  throw new Error(`Modo no reconocido: ${mode}`);
}

async function main() {
  const args = process.argv.slice(2);
  let mode: 'dry-run' | 'apply' | 'reset' = 'dry-run';

  if (args.includes('--apply')) {
    mode = 'apply';
  } else if (args.includes('--reset')) {
    mode = 'reset';
  } else if (args.includes('--dry-run')) {
    mode = 'dry-run';
  }

  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';

  try {
    const result = await runQaDatasetEngine(mode, { emulatorHost });
    console.log(`\n📋 RESUMEN DE EJECUCIÓN QA ENGINE:`, JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`❌ Error ejecutando QA Dataset Engine:`, error);
    process.exit(1);
  }
}

if (process.argv[1]?.includes('seedQaDataset')) {
  main();
}
