import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface QaManifest {
  datasetId: string;
  version: string;
  generatedAt: string;
  source: string;
  orgId: string;
  projectId: string;
  sha256: string;
  counts: Record<string, number>;
  collections: string[];
}

export function generateManifest(): QaManifest {
  const fixturesDir = path.resolve(process.cwd(), 'scripts/qa/fixtures');
  if (!fs.existsSync(fixturesDir)) {
    throw new Error(`Directorio de fixtures no encontrado: ${fixturesDir}`);
  }

  const files = fs.readdirSync(fixturesDir).filter(f => f.endsWith('.json') && f !== 'manifest.json');
  const counts: Record<string, number> = {};
  const collections: string[] = [];

  let combinedContent = '';

  for (const file of files.sort()) {
    const filePath = path.join(fixturesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    combinedContent += content;

    const collectionName = file.replace('.json', '');
    collections.push(collectionName);

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        counts[collectionName] = parsed.length;
      } else if (typeof parsed === 'object' && parsed !== null) {
        counts[collectionName] = 1;
      } else {
        counts[collectionName] = 0;
      }
    } catch (e) {
      console.error(`Error parseando ${file}:`, e);
      counts[collectionName] = 0;
    }
  }

  const sha256 = crypto.createHash('sha256').update(combinedContent).digest('hex');

  const manifest: QaManifest = {
    datasetId: 'DS-IC360-QA-CANONICAL',
    version: '1.0.0-QA',
    generatedAt: '2026-08-04T12:00:00.000Z',
    source: 'CONSORCIO O&G QA PILOT (DATOS SINTÉTICOS)',
    orgId: 'ic360-qa-pilot',
    projectId: 'proj-qa-anaco-001',
    sha256,
    counts,
    collections,
  };

  const manifestPath = path.join(fixturesDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ Manifest de QA generado exitosamente en: ${manifestPath}`);
  console.log(`📊 Hash SHA-256: ${sha256}`);
  console.log(`📁 Colecciones procesadas:`, counts);

  return manifest;
}

if (process.argv[1]?.includes('generateManifest')) {
  generateManifest();
}
