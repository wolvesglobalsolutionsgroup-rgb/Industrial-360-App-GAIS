import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({ projectId: 'gen-lang-client-0105758299' });
}

async function run() {
  const email = 'wolvesglobalsolutionsgroup@gmail.com';
  console.log('🔍 Buscando usuario en el proyecto de producción Firebase:', email);

  try {
    const user = await getAuth().getUserByEmail(email);
    console.log('✅ Usuario hallado! UID:', user.uid);

    // 1. Asignar Custom Claims JWT autoritativos
    await getAuth().setCustomUserClaims(user.uid, {
      role: 'superadmin',
      orgId: 'prointeca-demo',
      platformAdmin: true
    });
    console.log('✅ 1. Custom Claims JWT (superadmin + prointeca-demo + platformAdmin) asignados en Firebase Auth!');

    // 2. Crear documento de Membership en Firestore (Database: ai-studio-523dfb11-e14e-4c7a-983b-450003ceb0ee)
    const db = getFirestore('ai-studio-523dfb11-e14e-4c7a-983b-450003ceb0ee');
    const membershipRef = db.doc(`organizations/prointeca-demo/memberships/${user.uid}`);
    await membershipRef.set({
      orgId: 'prointeca-demo',
      uid: user.uid,
      email: email,
      role: 'superadmin',
      platformAdmin: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'founder-qa-bootstrap'
    }, { merge: true });
    console.log('✅ 2. Documento de Membresía resguardado en Firestore!');

    const updatedUser = await getAuth().getUser(user.uid);
    console.log('🎉 PROVISIONAMIENTO EN LA NUBE COMPLETADO CON ÉXITO:');
    console.log('   UID:', user.uid);
    console.log('   Custom Claims en Token JWT:', updatedUser.customClaims);
  } catch (err) {
    console.error('❌ Error durante el aprovisionamiento:', err);
  }
}

run();
