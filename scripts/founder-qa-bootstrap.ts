import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * CLI de Aprovisionamiento Seguro del Fundador en QA/Preview (S14.2A)
 * Estándares: Zero-Trust, SOC2, Multi-Tenant Isolation
 * 
 * Uso:
 *   npx tsx scripts/founder-qa-bootstrap.ts --email="wolvesglobalsolutionsgroup@gmail.com" --orgId="prointeca-demo" --role="superadmin" --execute
 */

if (!getApps().length) {
  initializeApp({ projectId: 'industrial-control-360' });
}

async function main() {
  const args = process.argv.slice(2);
  const emailArg = args.find(a => a.startsWith('--email='))?.split('=')[1];
  const uidArg = args.find(a => a.startsWith('--uid='))?.split('=')[1];
  const orgIdArg = args.find(a => a.startsWith('--orgId='))?.split('=')[1] || 'prointeca-demo';
  const roleArg = args.find(a => a.startsWith('--role='))?.split('=')[1] || 'superadmin';
  const isExecute = args.includes('--execute');
  const isRevoke = args.includes('--revoke');

  const email = emailArg || 'wolvesglobalsolutionsgroup@gmail.com';

  console.log('🔒 CLI de Aprovisionamiento Server-Side QA (S14.2A)');
  console.log(`   Modo: ${isExecute ? '⚡ EJECUCIÓN REAL' : '🔍 SIMULACIÓN (DRY-RUN)'}`);
  console.log(`   Acción: ${isRevoke ? 'REVOCAR MEMBRESÍA' : 'OTORGAR MEMBRESÍA Y CLAIMS'}`);

  let uid = uidArg;

  if (!uid) {
    try {
      const user = await getAuth().getUserByEmail(email);
      uid = user.uid;
      console.log(`✅ Usuario autenticado hallado por email [${email}] -> UID: [${uid}]`);
    } catch (err) {
      console.error(`❌ No se encontró usuario en Firebase Auth con email: ${email}`);
      process.exit(1);
    }
  }

  if (isRevoke) {
    if (!isExecute) {
      console.log(`[DRY-RUN] Se revocaría la membresía del UID: ${uid} en la organización: ${orgIdArg}`);
      return;
    }
    await getAuth().setCustomUserClaims(uid, null);
    const db = getFirestore();
    await db.doc(`organizations/${orgIdArg}/memberships/${uid}`).delete();
    console.log(`✅ Membresía revocada exitosamente para UID: ${uid}`);
    return;
  }

  const claims = {
    role: roleArg,
    orgId: orgIdArg,
    platformAdmin: true
  };

  console.log('   Custom Claims objetivo:', JSON.stringify(claims, null, 2));

  if (!isExecute) {
    console.log('💡 Ejecución en modo SIMULACIÓN. Pasa la bandera --execute para aplicar los cambios en el servidor.');
    return;
  }

  // 1. Asignar Custom Claims JWT autoritativos
  await getAuth().setCustomUserClaims(uid, claims);
  console.log('✅ 1. Custom Claims JWT asignados en Firebase Auth.');

  // 2. Crear/Actualizar documento de Membership en Firestore
  const db = getFirestore();
  const membershipRef = db.doc(`organizations/${orgIdArg}/memberships/${uid}`);
  await membershipRef.set({
    orgId: orgIdArg,
    uid: uid,
    email: email,
    role: roleArg,
    platformAdmin: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'founder-qa-bootstrap-cli'
  }, { merge: true });
  console.log(`✅ 2. Documento de Membresía resguardado en /organizations/${orgIdArg}/memberships/${uid}`);

  const updatedUser = await getAuth().getUser(uid);
  console.log('🎉 3. PROVISIONAMIENTO COMPLETADO EXITOSAMENTE.');
  console.log('   Claims en Token JWT:', updatedUser.customClaims);
}

main().catch(err => {
  console.error('❌ Error no controlado durante la ejecución:', err);
  process.exit(1);
});
