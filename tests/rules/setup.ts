import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { Firestore } from 'firebase/firestore';

let testEnv: RulesTestEnvironment | null = null;

export async function initTestEnv(projectId = 'ic360-security-test'): Promise<RulesTestEnvironment> {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8088';
  const [host, portStr] = emulatorHost.split(':');
  const port = parseInt(portStr || '8080', 10);

  try {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8'),
        host,
        port,
      },
    });
    return testEnv;
  } catch (err) {
    console.warn(`[WARNING] Emulador de Firestore no disponible en ${emulatorHost}. Se saltean pruebas de emulador.`);
    testEnv = null;
    return null as any;
  }
}

export function getTestEnv(): RulesTestEnvironment | null {
  return testEnv;
}

export function getAuthedDb(uid: string, claims: Record<string, any> = {}): Firestore {
  const env = getTestEnv();
  if (!env) return null as any;
  return env.authenticatedContext(uid, claims).firestore() as unknown as Firestore;
}

export function getUnauthedDb(): Firestore {
  const env = getTestEnv();
  if (!env) return null as any;
  return env.unauthenticatedContext().firestore() as unknown as Firestore;
}

export async function assertAllowed<T>(pr: Promise<T>, message?: string): Promise<T> {
  try {
    return await assertSucceeds(pr);
  } catch (err) {
    const detail = message ? `: ${message}` : '';
    throw new Error(`[ASSERT_ALLOWED_FAILED] Se esperaba que la operación fuera PERMITIDA, pero fue DENEGADA${detail}.\nDetalle: ${err}`);
  }
}

export async function assertDenied<T>(pr: Promise<T>, message?: string): Promise<any> {
  try {
    return await assertFails(pr);
  } catch (err) {
    const detail = message ? `: ${message}` : '';
    throw new Error(`[ASSERT_DENIED_FAILED] Se esperaba que la operación fuera DENEGADA, pero fue PERMITIDA${detail}.\nDetalle: ${err}`);
  }
}
