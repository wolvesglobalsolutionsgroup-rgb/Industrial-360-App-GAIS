import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({ projectId: 'gen-lang-client-0105758299' });
}

async function run() {
  const uid = 'eSs06Zjt1cRAk3NcFpL7bu4r25B2';
  const email = 'wolvesglobalsolutionsgroup@gmail.com';
  console.log(`🔒 Aprovisionando cuenta Founder UID: [${uid}] (${email})...`);

  try {
    // 1. Asignar Custom Claims JWT autoritativos
    await getAuth().setCustomUserClaims(uid, {
      role: 'superadmin',
      orgId: 'prointeca-demo',
      platformAdmin: true
    });
    console.log('✅ 1. Custom Claims JWT (role: superadmin, orgId: prointeca-demo, platformAdmin: true) asignados.');

    // 2. Crear documento de Membership en Firestore (Database: ai-studio-523dfb11-e14e-4c7a-983b-450003ceb0ee)
    const db = getFirestore('ai-studio-523dfb11-e14e-4c7a-983b-450003ceb0ee');
    const membershipRef = db.doc(`organizations/prointeca-demo/memberships/${uid}`);
    await membershipRef.set({
      orgId: 'prointeca-demo',
      uid: uid,
      email: email,
      role: 'superadmin',
      platformAdmin: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'founder-qa-bootstrap'
    }, { merge: true });
    console.log(`✅ 2. Membresía en Firestore creada/actualizada en /organizations/prointeca-demo/memberships/${uid}.`);

    const updatedUser = await getAuth().getUser(uid);
    console.log('🎉 PROVISIONAMIENTO COMPLETADO EXITOSAMENTE PARA EL FUNDADOR:');
    console.log('   UID:', updatedUser.uid);
    console.log('   Email:', updatedUser.email);
    console.log('   Custom Claims en Token:', updatedUser.customClaims);
  } catch (err) {
    console.error('❌ Error durante el aprovisionamiento:', err);
    process.exit(1);
  }
}

run();
