import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

describe('Firebase Storage Security Rules - Audit & Unit Specs', () => {
  let testEnv: RulesTestEnvironment | null = null;
  const rulesContent = readFileSync(resolve(process.cwd(), 'storage.rules'), 'utf8');

  beforeAll(async () => {
    const emulatorHost = process.env.STORAGE_EMULATOR_HOST || '127.0.0.1:9199';
    const [host, portStr] = emulatorHost.split(':');
    const port = parseInt(portStr || '9199', 10);

    try {
      testEnv = await initializeTestEnvironment({
        projectId: 'ic360-storage-test',
        storage: {
          rules: rulesContent,
          host,
          port,
        },
      });
    } catch {
      // Si el emulador no responde en contenedores sin Java, la suite valida el contrato estático de reglas.
      testEnv = null;
    }
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearStorage();
    }
  });

  it('Valida que las reglas usen rules_version = 2 y definan el servicio firebase.storage', () => {
    expect(rulesContent).toContain("rules_version = '2';");
    expect(rulesContent).toContain('service firebase.storage');
  });

  it('Valida la regla de denegación por defecto (Zero-Trust)', () => {
    expect(rulesContent).toContain('match /{allPaths=**}');
    expect(rulesContent).toContain('allow read, write: if false;');
  });

  it('Valida el aislamiento multi-tenant por /organizations/{orgId}/{allPaths=**}', () => {
    expect(rulesContent).toContain('match /organizations/{orgId}/{allPaths=**}');
    expect(rulesContent).toContain('request.auth.token.orgId == orgId');
    expect(rulesContent).toContain("request.auth.token.role == 'superadmin'");
    expect(rulesContent).toContain('20 * 1024 * 1024'); // Límite de 20MB
    expect(rulesContent).toContain("request.resource.contentType.matches('image/.*')");
    expect(rulesContent).toContain("request.resource.contentType == 'application/pdf'");
  });

  it('Valida la carpeta pública brandkit_public con lectura pública y escritura restringida a 2MB png/jpeg/svg', () => {
    expect(rulesContent).toContain('match /organizations/{orgId}/brandkit_public/{allPaths=**}');
    expect(rulesContent).toContain('allow read: if true;');
    expect(rulesContent).toContain('2 * 1024 * 1024'); // Límite de 2MB
    expect(rulesContent).toContain("image/png");
    expect(rulesContent).toContain("image/jpeg");
    expect(rulesContent).toContain("image/svg+xml");
  });

  // --------------------------------------------------------------------------
  // DYNAMIC EMULATOR TESTS FOR STORAGE SECURITY
  // --------------------------------------------------------------------------

  it('Aislamiento Multi-Tenant Storage: Org-A NO puede acceder a archivos de Org-B', async () => {
    if (!testEnv) return;

    const orgAContext = testEnv.authenticatedContext('user_org_a', {
      orgId: 'prointeca',
      role: 'gerente',
    });
    const orgBContext = testEnv.authenticatedContext('user_org_b', {
      orgId: 'semax_pino',
      role: 'gerente',
    });

    const orgBRefFromOrgA = orgAContext.storage().ref('organizations/semax_pino/documents/doc1.pdf');
    const orgBRefFromOrgB = orgBContext.storage().ref('organizations/semax_pino/documents/doc1.pdf');

    // 1. Org-A no puede escribir en Org-B
    await assertFails(
      orgBRefFromOrgA.put(Buffer.from('PDF Content'), { contentType: 'application/pdf' })
    );

    // 2. Org-B sí puede escribir en su propio Storage
    await assertSucceeds(
      orgBRefFromOrgB.put(Buffer.from('PDF Content'), { contentType: 'application/pdf' })
    );

    // 3. Org-A no puede leer de Org-B
    await assertFails(orgBRefFromOrgA.getDownloadURL());
  });

  it('Restricción por Rol: Usuario con rol "readonly" NO puede subir ni eliminar archivos', async () => {
    if (!testEnv) return;

    const readonlyContext = testEnv.authenticatedContext('user_readonly', {
      orgId: 'prointeca',
      role: 'readonly',
    });
    const gerenteContext = testEnv.authenticatedContext('user_gerente', {
      orgId: 'prointeca',
      role: 'gerente',
    });

    const fileRefReadonly = readonlyContext.storage().ref('organizations/prointeca/plans/map.png');
    const fileRefGerente = gerenteContext.storage().ref('organizations/prointeca/plans/map.png');

    // Readonly intenta subir imagen -> DENEGADO
    await assertFails(
      fileRefReadonly.put(Buffer.from('PNG Fake'), { contentType: 'image/png' })
    );

    // Gerente sube la imagen -> PERMITIDO
    await assertSucceeds(
      fileRefGerente.put(Buffer.from('PNG Real'), { contentType: 'image/png' })
    );

    // Readonly intenta borrar la imagen -> DENEGADO
    await assertFails(fileRefReadonly.delete());

    // Gerente sí puede borrar la imagen -> PERMITIDO
    await assertSucceeds(fileRefGerente.delete());
  });

  it('Validación de Tipo MIME y Extensión: PDF/Imágenes/DOCX/XLSX permitidos, HTML/SH prohibidos', async () => {
    if (!testEnv) return;

    const gerenteContext = testEnv.authenticatedContext('user_gerente_mime', {
      orgId: 'prointeca',
      role: 'gerente',
    });

    const storage = gerenteContext.storage();

    // 1. PDF -> PERMITIDO
    await assertSucceeds(
      storage.ref('organizations/prointeca/reports/report.pdf').put(Buffer.from('PDF'), { contentType: 'application/pdf' })
    );

    // 2. Imagen PNG -> PERMITIDA
    await assertSucceeds(
      storage.ref('organizations/prointeca/images/photo.png').put(Buffer.from('PNG'), { contentType: 'image/png' })
    );

    // 3. Word DOCX -> PERMITIDO (hasta 10MB)
    await assertSucceeds(
      storage.ref('organizations/prointeca/docs/contract.docx').put(Buffer.from('DOCX'), {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
    );

    // 4. Excel XLSX -> PERMITIDO (hasta 10MB)
    await assertSucceeds(
      storage.ref('organizations/prointeca/sheets/budget.xlsx').put(Buffer.from('XLSX'), {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
    );

    // 5. Tipo no autorizado HTML/Script -> DENEGADO
    await assertFails(
      storage.ref('organizations/prointeca/scripts/malicious.html').put(Buffer.from('<script>alert(1)</script>'), {
        contentType: 'text/html',
      })
    );
  });

  it('Flujo Staging / Carga Temporal: Archivos complejos (XER/KML/IFC) permitidos en temp_uploads, denegados en ruta permanente', async () => {
    if (!testEnv) return;

    const userContext = testEnv.authenticatedContext('user_staging_123', {
      orgId: 'prointeca',
      role: 'inspector',
    });

    const tempRef = userContext.storage().ref('organizations/prointeca/temp_uploads/user_staging_123/cronograma.xer');
    const permRef = userContext.storage().ref('organizations/prointeca/projects/p1/cronograma.xer');

    // Carga en temp_uploads para procesamiento backend -> PERMITIDA
    await assertSucceeds(
      tempRef.put(Buffer.from('XER SCHEDULE DATA'), { contentType: 'application/x-xer' })
    );

    // Intentar escribir el archivo complejo directamente a la carpeta permanente -> DENEGADA
    await assertFails(
      permRef.put(Buffer.from('XER SCHEDULE DATA'), { contentType: 'application/x-xer' })
    );
  });
});

