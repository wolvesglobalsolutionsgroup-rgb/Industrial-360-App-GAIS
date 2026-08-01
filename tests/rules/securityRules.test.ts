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
});

