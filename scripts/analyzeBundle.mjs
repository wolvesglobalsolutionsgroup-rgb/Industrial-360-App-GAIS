import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const distAssetsDir = './dist/assets';
const outputFile = './docs/architecture/BUNDLE_BASELINE.md';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyze() {
  if (!fs.existsSync(distAssetsDir)) {
    console.error('Error: dist/assets folder does not exist. Run "npm run build" first.');
    process.exit(1);
  }

  const files = fs.readdirSync(distAssetsDir).filter(f => f.endsWith('.js') || f.endsWith('.css'));
  const today = new Date().toISOString().split('T')[0];

  const results = [];

  files.forEach(file => {
    const filePath = path.join(distAssetsDir, file);
    const content = fs.readFileSync(filePath);
    const rawSize = content.length;
    const gzipSize = zlib.gzipSync(content).length;

    results.push({
      chunk: file,
      rawSize,
      rawFormatted: formatBytes(rawSize),
      gzipSize,
      gzipFormatted: formatBytes(gzipSize),
      date: today
    });
  });

  // Sort by raw size descending
  results.sort((a, b) => b.rawSize - a.rawSize);

  let markdown = `# Bundle Baseline Report — Industrial Control 360\n\n`;
  markdown += `*Fecha de generación:* ${today}\n\n`;
  markdown += `| chunk | tamaño raw | tamaño gzip | fecha |\n`;
  markdown += `|---|---|---|---|\n`;

  results.forEach(r => {
    markdown += `| \`${r.chunk}\` | ${r.rawFormatted} (${r.rawSize.toLocaleString()} B) | ${r.gzipFormatted} (${r.gzipSize.toLocaleString()} B) | ${r.date} |\n`;
  });

  markdown += `\n\n## Resumen de Entrada (Entrypoint)\n`;
  const entryChunk = results.find(r => r.chunk.startsWith('index-') && r.chunk.endsWith('.js'));
  if (entryChunk) {
    markdown += `- **Chunk Principal (Entry point):** \`${entryChunk.chunk}\`\n`;
    markdown += `- **Tamaño Raw:** ${entryChunk.rawFormatted}\n`;
    markdown += `- **Tamaño Gzip:** ${entryChunk.gzipFormatted}\n`;
  }

  // Ensure docs/architecture directory exists
  const docsArchDir = './docs/architecture';
  if (!fs.existsSync(docsArchDir)) {
    fs.mkdirSync(docsArchDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, markdown, 'utf8');
  console.log(`Bundle baseline analysis generated successfully at ${outputFile}`);
  console.log(`Analyzed ${results.length} chunks.`);
}

analyze();
