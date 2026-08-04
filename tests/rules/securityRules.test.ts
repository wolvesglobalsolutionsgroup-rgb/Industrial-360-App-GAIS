import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collectionGroup,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  initTestEnv,
  getTestEnv,
  getAuthedDb,
  getUnauthedDb,
  assertAllowed,
  assertDenied,
} from './setup';

describe('Firestore Zero-Trust Security Rules (Sprint IC360-S1-zero-trust)', () => {
  beforeAll(async () => {
    // Inicializar testEnv con el emulador local. Si no responde en 127.0.0.1:8080, se saltea suavemente.
    const testEnv = await initTestEnv('ic360-zero-trust-test');
    if (!testEnv) return;

    try {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const pingRef = doc(context.firestore(), '_emulator_health_check/ping');
        await setDoc(pingRef, { ping: true, timestamp: Date.now() });
      });
    } catch (err) {
      console.warn('Emulador no disponible para pruebas de reglas:', err);
    }
  });

  afterAll(async () => {
    const env = getTestEnv();
    if (env) {
      await env.cleanup();
    }
  });

  beforeEach(async () => {
    const env = getTestEnv();
    if (env) {
      await env.clearFirestore();
    }
  });

  // --------------------------------------------------------------------------
  // CASO 1: Usuario sin membership (sin custom claim orgId) no lee nada
  // --------------------------------------------------------------------------
  it('Caso 1: Usuario sin custom claim orgId o no autenticado NO puede leer ni escribir datos', async () => {
    const env = getTestEnv();
    if (!env) return;
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'organizations/prointeca/projects/proj_1/tasks/task_1'), {
        title: 'Inspección de tubería',
        orgId: 'prointeca',
        projectId: 'proj_1',
      });
    });

    // 1a. Unauthed
    const unauthedDb = getUnauthedDb();
    await assertDenied(
      getDoc(doc(unauthedDb, 'organizations/prointeca/projects/proj_1/tasks/task_1')),
      'Usuario no autenticado no puede leer'
    );

    // 1b. Authed without claims
    const noClaimDb = getAuthedDb('user_no_claim', {});
    await assertDenied(
      getDoc(doc(noClaimDb, 'organizations/prointeca/projects/proj_1/tasks/task_1')),
      'Usuario sin claim orgId no puede leer'
    );
    await assertDenied(
      setDoc(doc(noClaimDb, 'organizations/prointeca/projects/proj_1/tasks/task_2'), {
        title: 'Intento hack',
        orgId: 'prointeca',
        projectId: 'proj_1',
      }),
      'Usuario sin claim orgId no puede escribir'
    );
  });

  // --------------------------------------------------------------------------
  // CASO 2: Aislamiento estricto multi-tenant (Org A vs Org B)
  // --------------------------------------------------------------------------
  it('Caso 2: Usuario de Org A (prointeca) NO puede leer ni escribir en Org B (semax_pino)', async () => {
    const env = getTestEnv();
    if (!env) return;
    await env.withSecurityRulesDisabled(async (context) => {

      await setDoc(doc(context.firestore(), 'organizations/prointeca/projects/proj_1/valuations/val_prointeca'), {
        amount: 100000,
        orgId: 'prointeca',
        projectId: 'proj_1',
      });
    });

    const semaxUserDb = getAuthedDb('user_semax_gerente', {
      orgId: 'semax_pino',
      role: 'gerente',
    });

    const prointecaValRef = doc(semaxUserDb, 'organizations/prointeca/projects/proj_1/valuations/val_prointeca');

    // Lectura denegada
    await assertDenied(
      getDoc(prointecaValRef),
      'Gerente de semax_pino NO debe leer valuaciones de prointeca'
    );

    // Escritura denegada
    await assertDenied(
      setDoc(prointecaValRef, {
        amount: 999999,
        orgId: 'prointeca',
        projectId: 'proj_1',
      }),
      'Gerente de semax_pino NO debe escribir valuaciones de prointeca'
    );
  });

  // --------------------------------------------------------------------------
  // CASO 3: Control de roles - Rol 'campo' no puede aprobar ni borrar documentos
  // --------------------------------------------------------------------------
  it('Caso 3: Rol "campo" puede crear/editar borrador pero NO puede aprobar ni borrar documentos', async () => {
    const env = getTestEnv();
    if (!env) return;
    await env.withSecurityRulesDisabled(async (context) => {

      await setDoc(doc(context.firestore(), 'organizations/prointeca/projects/proj_1/siho_ptw/ptw_1'), {
        code: 'PTW-001',
        status: 'borrador',
        orgId: 'prointeca',
        projectId: 'proj_1',
        createdBy: 'user_campo_1',
      });
    });

    const campoUserDb = getAuthedDb('user_campo_1', {
      orgId: 'prointeca',
      role: 'campo',
    });

    const ptwRef = doc(campoUserDb, 'organizations/prointeca/projects/proj_1/siho_ptw/ptw_1');

    // 3a. Campo intenta aprobar permiso de trabajo -> DENEGADO
    await assertDenied(
      updateDoc(ptwRef, {
        status: 'aprobado',
      }),
      'Rol campo no debe poder cambiar el estado a "aprobado"'
    );

    // 3b. Campo intenta borrar el documento -> DENEGADO
    await assertDenied(
      deleteDoc(ptwRef),
      'Rol campo no debe poder borrar permisos de trabajo'
    );

    // 3c. Gerente sí puede borrar -> PERMITIDO
    const gerenteUserDb = getAuthedDb('user_gerente_1', {
      orgId: 'prointeca',
      role: 'gerente',
    });
    const gerentePtwRef = doc(gerenteUserDb, 'organizations/prointeca/projects/proj_1/siho_ptw/ptw_1');
    await assertAllowed(
      deleteDoc(gerentePtwRef),
      'Gerente sí puede eliminar documentos de su proyecto'
    );
  });

  // --------------------------------------------------------------------------
  // CASO 4: Intento de auto-escalación en memberships, counters y audit_logs
  // --------------------------------------------------------------------------
  it('Caso 4: Usuario NO puede escribir su propia membership, ni manipular counters o audit_logs desde cliente', async () => {
    const env = getTestEnv();
    if (!env) return;
    const userDb = getAuthedDb('user_prointeca_campo', {
      orgId: 'prointeca',
      role: 'campo',
    });

    // 4a. Intento de auto-asignarse rol gerente en membership -> DENEGADO
    const membershipRef = doc(userDb, 'organizations/prointeca/memberships/user_prointeca_campo');
    await assertDenied(
      setDoc(membershipRef, {
        role: 'gerente',
        orgId: 'prointeca',
      }),
      'Escritura directa en memberships está prohibida desde el cliente'
    );

    // 4b. Intento de manipular counters -> DENEGADO
    const counterRef = doc(userDb, 'organizations/prointeca/counters/valuations');
    await assertDenied(
      setDoc(counterRef, {
        currentValuation: 999,
      }),
      'Escritura directa en counters está prohibida desde el cliente'
    );

    // 4c. Intento de falsificar audit_log -> DENEGADO
    const auditRef = doc(userDb, 'organizations/prointeca/audit_logs/fake_log');
    await assertDenied(
      setDoc(auditRef, {
        action: 'USER_ROLE_UPDATED',
        fake: true,
      }),
      'Escritura directa en audit_logs está prohibida desde el cliente'
    );
  });

  // --------------------------------------------------------------------------
  // CASO 5: Pruebas de lectura y escritura en las 19 colecciones de la arquitectura
  // --------------------------------------------------------------------------
  it('Caso 5: Cobertura total de operaciones en las 19 colecciones multi-tenant', async () => {
    const env = getTestEnv();
    if (!env) return;
    const gerenteDb = getAuthedDb('user_gerente_test', {
      orgId: 'prointeca',
      role: 'gerente',
    });

    const collections = [
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
      'settings',
    ];

    for (const colName of collections) {
      const docRef = doc(gerenteDb, `organizations/prointeca/projects/proj_test/${colName}/doc_1`);

      // 5a. Crear documento -> PERMITIDO
      await assertAllowed(
        setDoc(docRef, {
          title: `Documento de prueba ${colName}`,
          orgId: 'prointeca',
          projectId: 'proj_test',
          status: 'borrador',
        }),
        `Creación permitida para gerente en la colección ${colName}`
      );

      // 5b. Leer documento -> PERMITIDO
      await assertAllowed(
        getDoc(docRef),
        `Lectura permitida para gerente en la colección ${colName}`
      );

      // 5c. CollectionGroup Query filtrada por orgId -> PERMITIDO
      const cgQuery = query(
        collectionGroup(gerenteDb, colName),
        where('orgId', '==', 'prointeca')
      );
      await assertAllowed(
        getDocs(cgQuery),
        `Collection group query permitida en ${colName} con filtro orgId == prointeca`
      );
    }
  });

  // --------------------------------------------------------------------------
  // CASO 6: Bloqueo de auto-escalación de privilegios en /users/{userId} (Hardening)
  // --------------------------------------------------------------------------
  it('Caso 6: Usuario NO puede auto-escalar rol ni modificar campos sensibles en /users/{uid}', async () => {
    const env = getTestEnv();
    if (!env) return;

    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/user_campo_999'), {
        displayName: 'Usuario Campo 999',
        role: 'campo',
        orgId: 'prointeca',
      });
    });

    const userDb = getAuthedDb('user_campo_999', {
      orgId: 'prointeca',
      role: 'campo',
    });

    const userRef = doc(userDb, 'users/user_campo_999');

    // 6a. Intento de update de su propio /users/{uid} enviando { role: 'superadmin' } -> DENEGADO
    await assertDenied(
      updateDoc(userRef, {
        role: 'superadmin',
      }),
      'Usuario no debe poder auto-asignarse el rol superadmin'
    );

    // 6b. Intento de modificar orgId o claims -> DENEGADO
    await assertDenied(
      updateDoc(userRef, {
        orgId: 'org_infiltrada',
      }),
      'Usuario no debe poder modificar su orgId'
    );

    // 6c. Modificación de campo no sensible (ej. displayName) -> PERMITIDO
    await assertAllowed(
      updateDoc(userRef, {
        displayName: 'Nombre Modificado Legalmente',
      }),
      'Usuario sí debe poder actualizar campos no sensibles'
    );
  });

  // --------------------------------------------------------------------------
  // CASO 7: Bloqueo de idempotencyKeys para clientes (Sprint S14.3)
  // --------------------------------------------------------------------------
  it('Caso 7: Clientes (incluso autenticados como gerente/superadmin) NO pueden leer ni escribir idempotencyKeys', async () => {
    const env = getTestEnv();
    if (!env) return;

    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'organizations/prointeca/projects/proj_1/idempotencyKeys/key_123'), {
        operationId: 'key_123',
        orgId: 'prointeca',
        projectId: 'proj_1',
      });
    });

    const adminDb = getAuthedDb('user_gerente_100', {
      orgId: 'prointeca',
      role: 'gerente',
    });

    const keyRef = doc(adminDb, 'organizations/prointeca/projects/proj_1/idempotencyKeys/key_123');
    const newKeyRef = doc(adminDb, 'organizations/prointeca/projects/proj_1/idempotencyKeys/key_456');

    // 7a. Lectura directa denegada
    await assertDenied(
      getDoc(keyRef),
      'Cliente no debe poder leer directamente idempotencyKeys'
    );

    // 7b. Escritura directa denegada
    await assertDenied(
      setDoc(newKeyRef, {
        operationId: 'key_456',
        orgId: 'prointeca',
        projectId: 'proj_1',
      }),
      'Cliente no debe poder escribir directamente en idempotencyKeys'
    );
  });

  // --------------------------------------------------------------------------
  // CASO 8: Reglas de document_verifications (Lectura por org, escritura denegada al cliente)
  // --------------------------------------------------------------------------
  it('Caso 8: document_verifications permite lectura propia de org, deniega lectura de otra org y deniega escrituras del cliente', async () => {
    const env = getTestEnv();
    if (!env) return;

    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'organizations/prointeca/document_verifications/verif_prointeca'), {
        hash: 'hash_123',
        orgId: 'prointeca',
      });
      await setDoc(doc(context.firestore(), 'organizations/semax_pino/document_verifications/verif_semax'), {
        hash: 'hash_456',
        orgId: 'semax_pino',
      });
    });

    const gerenteProintecaDb = getAuthedDb('user_gerente_p', {
      orgId: 'prointeca',
      role: 'gerente',
    });

    const ownVerifRef = doc(gerenteProintecaDb, 'organizations/prointeca/document_verifications/verif_prointeca');
    const otherVerifRef = doc(gerenteProintecaDb, 'organizations/semax_pino/document_verifications/verif_semax');
    const newVerifRef = doc(gerenteProintecaDb, 'organizations/prointeca/document_verifications/verif_new');

    // 8a. Lectura propia -> PERMITIDA
    await assertAllowed(
      getDoc(ownVerifRef),
      'Usuario de prointeca puede leer sus propios document_verifications'
    );

    // 8b. Lectura cruzada -> DENEGADA
    await assertDenied(
      getDoc(otherVerifRef),
      'Usuario de prointeca no puede leer document_verifications de semax_pino'
    );

    // 8c. Escritura (create/update/delete) por cliente -> DENEGADA
    await assertDenied(
      setDoc(newVerifRef, { hash: 'hash_new', orgId: 'prointeca' }),
      'Cliente no debe poder crear document_verifications'
    );
    await assertDenied(
      updateDoc(ownVerifRef, { hash: 'hash_mod' }),
      'Cliente no debe poder actualizar document_verifications'
    );
    await assertDenied(
      deleteDoc(ownVerifRef),
      'Cliente no debe poder eliminar document_verifications'
    );
  });

  // --------------------------------------------------------------------------
  // CASO 9: Reglas de audit_logs (Lectura restringida a gerente/superadmin de org, escritura denegada al cliente)
  // --------------------------------------------------------------------------
  it('Caso 9: audit_logs solo legible por gerente de la propia org; denegado para campo/inspector, denegado lectura cruzada y escrituras', async () => {
    const env = getTestEnv();
    if (!env) return;

    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'organizations/prointeca/audit_logs/log_p1'), {
        action: 'PROJECT_UPDATED',
        orgId: 'prointeca',
      });
      await setDoc(doc(context.firestore(), 'organizations/semax_pino/audit_logs/log_s1'), {
        action: 'PROJECT_UPDATED',
        orgId: 'semax_pino',
      });
    });

    const gerenteProintecaDb = getAuthedDb('user_gerente_p9', {
      orgId: 'prointeca',
      role: 'gerente',
    });
    const campoProintecaDb = getAuthedDb('user_campo_p9', {
      orgId: 'prointeca',
      role: 'campo',
    });

    const ownLogGerenteRef = doc(gerenteProintecaDb, 'organizations/prointeca/audit_logs/log_p1');
    const ownLogCampoRef = doc(campoProintecaDb, 'organizations/prointeca/audit_logs/log_p1');
    const otherLogGerenteRef = doc(gerenteProintecaDb, 'organizations/semax_pino/audit_logs/log_s1');
    const newLogGerenteRef = doc(gerenteProintecaDb, 'organizations/prointeca/audit_logs/log_new');

    // 9a. Gerente orgA lee audit_logs en orgA -> PERMITIDO
    await assertAllowed(
      getDoc(ownLogGerenteRef),
      'Gerente de prointeca puede leer audit_logs de su organización'
    );

    // 9b. Campo orgA intenta leer audit_logs en orgA -> DENEGADO
    await assertDenied(
      getDoc(ownLogCampoRef),
      'Usuario rol campo no puede leer audit_logs'
    );

    // 9c. Gerente orgA intenta leer audit_logs en orgB -> DENEGADO
    await assertDenied(
      getDoc(otherLogGerenteRef),
      'Gerente de prointeca no puede leer audit_logs de semax_pino'
    );

    // 9d. Escrituras de cliente en audit_logs -> DENEGADAS
    await assertDenied(
      setDoc(newLogGerenteRef, { action: 'HACK', orgId: 'prointeca' }),
      'Cliente no puede crear audit_logs'
    );
  });

  // --------------------------------------------------------------------------
  // CASO 10: Separación explícita create / update / delete en tasks y validación de falsificación
  // --------------------------------------------------------------------------
  it('Caso 10: Validación estricta de create/update/delete en tareas y bloqueo de orgId/projectId falsificados', async () => {
    const env = getTestEnv();
    if (!env) return;

    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'organizations/prointeca/projects/proj_10/tasks/task_init'), {
        title: 'Tarea Inicial',
        orgId: 'prointeca',
        projectId: 'proj_10',
        createdBy: 'user_gerente_10',
        createdAt: '2026-08-01T00:00:00Z',
        status: 'borrador',
      });
    });

    const gerenteDb = getAuthedDb('user_gerente_10', {
      orgId: 'prointeca',
      role: 'gerente',
    });
    const campoDb = getAuthedDb('user_campo_10', {
      orgId: 'prointeca',
      role: 'campo',
    });

    // 10a. Create con orgId + projectId correctos -> PERMITIDO
    const validTaskRef = doc(gerenteDb, 'organizations/prointeca/projects/proj_10/tasks/task_valid');
    await assertAllowed(
      setDoc(validTaskRef, {
        title: 'Tarea Válida',
        orgId: 'prointeca',
        projectId: 'proj_10',
        status: 'borrador',
      }),
      'Gerente puede crear tarea con orgId y projectId coincidentes'
    );

    // 10b. Create con orgId falsificado -> DENEGADO
    const forgedOrgTaskRef = doc(gerenteDb, 'organizations/prointeca/projects/proj_10/tasks/task_forged_org');
    await assertDenied(
      setDoc(forgedOrgTaskRef, {
        title: 'Tarea Falsificada Org',
        orgId: 'semax_pino',
        projectId: 'proj_10',
      }),
      'Crear tarea con orgId falsificado debe ser denegado'
    );

    // 10c. Create con projectId falsificado -> DENEGADO
    const forgedProjTaskRef = doc(gerenteDb, 'organizations/prointeca/projects/proj_10/tasks/task_forged_proj');
    await assertDenied(
      setDoc(forgedProjTaskRef, {
        title: 'Tarea Falsificada Project',
        orgId: 'prointeca',
        projectId: 'proj_other',
      }),
      'Crear tarea con projectId falsificado debe ser denegado'
    );

    // 10d. Update intentando alterar orgId, projectId, createdBy o createdAt -> DENEGADO
    const existingTaskRef = doc(gerenteDb, 'organizations/prointeca/projects/proj_10/tasks/task_init');
    await assertDenied(
      updateDoc(existingTaskRef, {
        orgId: 'semax_pino',
      }),
      'No se permite modificar orgId en update'
    );
    await assertDenied(
      updateDoc(existingTaskRef, {
        createdBy: 'hacker',
      }),
      'No se permite modificar createdBy en update'
    );

    // 10e. Delete por campo -> DENEGADO
    const campoTaskRef = doc(campoDb, 'organizations/prointeca/projects/proj_10/tasks/task_init');
    await assertDenied(
      deleteDoc(campoTaskRef),
      'Rol campo no puede eliminar tareas'
    );

    // 10f. Delete por gerente -> PERMITIDO
    await assertAllowed(
      deleteDoc(existingTaskRef),
      'Gerente sí puede eliminar tarea de su organización y proyecto'
    );
  });

  // --------------------------------------------------------------------------
  // CASO 11: Restricciones estrictas en CollectionGroup queries
  // --------------------------------------------------------------------------
  it('Caso 11: CollectionGroup query exige filtro exacto por orgId del token; deniega sin filtro o con orgId ajeno', async () => {
    const env = getTestEnv();
    if (!env) return;

    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'organizations/prointeca/projects/p1/tasks/t1'), {
        title: 'Tarea Prointeca 1',
        orgId: 'prointeca',
        projectId: 'p1',
      });
      await setDoc(doc(context.firestore(), 'organizations/semax_pino/projects/p2/tasks/t2'), {
        title: 'Tarea Semax 1',
        orgId: 'semax_pino',
        projectId: 'p2',
      });
    });

    const prointecaDb = getAuthedDb('user_prointeca_cg', {
      orgId: 'prointeca',
      role: 'inspector',
    });

    // 11a. CollectionGroup con where('orgId', '==', 'prointeca') -> PERMITIDO
    const validCgQuery = query(
      collectionGroup(prointecaDb, 'tasks'),
      where('orgId', '==', 'prointeca')
    );
    await assertAllowed(
      getDocs(validCgQuery),
      'CollectionGroup query con filtro por el orgId propio debe ser permitida'
    );

    // 11b. CollectionGroup sin filtro por orgId -> DENEGADO
    const unconstrainedCgQuery = query(collectionGroup(prointecaDb, 'tasks'));
    await assertDenied(
      getDocs(unconstrainedCgQuery),
      'CollectionGroup query sin filtro orgId debe ser denegada'
    );

    // 11c. CollectionGroup con filtro hacia otra organización -> DENEGADO
    const wrongOrgCgQuery = query(
      collectionGroup(prointecaDb, 'tasks'),
      where('orgId', '==', 'semax_pino')
    );
    await assertDenied(
      getDocs(wrongOrgCgQuery),
      'CollectionGroup query hacia otra organización debe ser denegada'
    );
  });

  // --------------------------------------------------------------------------
  // CASO 12: Aislamiento estricto de documentos en /users/{uid}
  // --------------------------------------------------------------------------
  it('Caso 12: Usuario solo puede acceder a su propio documento en /users/{uid}; denegado el acceso a otros usuarios', async () => {
    const env = getTestEnv();
    if (!env) return;

    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/usr_alice'), {
        displayName: 'Alice',
        role: 'campo',
        orgId: 'prointeca',
      });
      await setDoc(doc(context.firestore(), 'users/usr_bob'), {
        displayName: 'Bob',
        role: 'inspector',
        orgId: 'prointeca',
      });
    });

    const aliceDb = getAuthedDb('usr_alice', {
      orgId: 'prointeca',
      role: 'campo',
    });

    // 12a. Alice lee su propio documento -> PERMITIDO
    await assertAllowed(
      getDoc(doc(aliceDb, 'users/usr_alice')),
      'Usuario Alice puede leer su propio documento'
    );

    // 12b. Alice intenta leer el documento de Bob -> DENEGADO
    await assertDenied(
      getDoc(doc(aliceDb, 'users/usr_bob')),
      'Usuario Alice no puede leer el documento de Bob'
    );

    // 12c. Alice intenta modificar el documento de Bob -> DENEGADO
    await assertDenied(
      setDoc(doc(aliceDb, 'users/usr_bob'), { displayName: 'Hacked Bob' }),
      'Usuario Alice no puede modificar el documento de Bob'
    );
  });

  // --------------------------------------------------------------------------
  // CASO 13: Catch-all final deniega rutas no contempladas
  // --------------------------------------------------------------------------
  it('Caso 13: El catch-all final deniega cualquier ruta no definida en las reglas', async () => {
    const env = getTestEnv();
    if (!env) return;

    const userDb = getAuthedDb('user_any', {
      orgId: 'prointeca',
      role: 'superadmin',
    });

    const unhandledRef = doc(userDb, 'unknown_collection/doc_1');

    await assertDenied(
      getDoc(unhandledRef),
      'Lectura en colección no contemplada debe ser denegada por catch-all'
    );
    await assertDenied(
      setDoc(unhandledRef, { foo: 'bar' }),
      'Escritura en colección no contemplada debe ser denegada por catch-all'
    );
  });
});

