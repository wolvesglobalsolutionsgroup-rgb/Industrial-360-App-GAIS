import { initializeApp } from 'firebase/app';
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut,
  signInWithEmailAndPassword,
  signInAnonymously, onAuthStateChanged
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import firebaseConfig from '../firebase-applet-config.json';
import { DEMO_AUTH_ENABLED } from './config';
import { logger } from './lib/logger';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const functionsInstance = getFunctions(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Manejo de resultado de redirección para entornos donde las ventanas emergentes estén bloqueadas o restringidas
if (typeof window !== 'undefined') {
  getRedirectResult(auth)
    .then(async (userCredential) => {
      if (userCredential?.user) {
        await ensureUserClaimsAndRefreshToken(userCredential.user);
      }
    })
    .catch((err) => {
      if (err?.code !== 'auth/operation-not-supported-in-this-environment') {
        logger.warn('Error al procesar getRedirectResult de Google Auth:', err?.message || err);
      }
    });
}

/**
 * Invoca la Cloud Function 'ensureOwnClaims' para sincronizar Custom Claims
 * a partir de /users/{uid} y refresca el ID Token.
 */
export async function ensureUserClaimsAndRefreshToken(user: any) {
  if (!user || user.isAnonymous) return;
  try {
    const ensureFn = httpsCallable(functionsInstance, 'ensureOwnClaims');
    await ensureFn();
    await user.getIdTokenResult(true);
  } catch (err: any) {
    logger.warn('Sincronización de Custom Claims (ensureOwnClaims):', err?.message || err);
    try {
      await user.getIdTokenResult(true);
    } catch {}
  }
}

const DEMO_USER_DEFAULT = {
  uid: 'demo-operator-360',
  displayName: 'Ing. Supervisor Demostración',
  email: 'demo@industrial360.app',
  photoURL: null,
};

// Cache local del usuario para modo offline/fallback
let localDemoUser: any = null;

function setLocalUser(user: any) {
  localDemoUser = user;
  try { localStorage.setItem('ic360_user', JSON.stringify(user)); } catch {}
  window.dispatchEvent(new CustomEvent('ic360_auth_change'));
}

export function getStoredUser(): any {
  try {
    const raw = localStorage.getItem('ic360_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getAuthUser() {
  if (auth.currentUser) return auth.currentUser;
  if (!DEMO_AUTH_ENABLED) return null;
  return localDemoUser || getStoredUser();
}

export async function loginWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await ensureUserClaimsAndRefreshToken(userCredential.user);
    }
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('Cuenta no registrada. Contacte al administrador de su organización.');
    }
    const message = error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential'
      ? 'Correo o contraseña incorrectos'
      : error.code === 'auth/too-many-requests'
        ? 'Demasiados intentos. Intenta de nuevo más tarde'
        : (error.message || 'Error al iniciar sesión');
    throw new Error(message);
  }
}

export async function loginAnonymously() {
  if (!DEMO_AUTH_ENABLED) {
    throw new Error('El modo demo no está habilitado en este entorno.');
  }
  try {
    await signInAnonymously(auth);
  } catch {
    // Fallback a demo local si anonymous no está habilitado en Firebase Auth
    setLocalUser(DEMO_USER_DEFAULT);
  }
}

export const loginWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    if (userCredential.user) {
      await ensureUserClaimsAndRefreshToken(userCredential.user);
    }
    return userCredential.user;
  } catch (error: any) {
    logger.warn("Error signing in with Google via popup:", error?.code || error?.message || error);
    
    // Si la ventana emergente es bloqueada por el navegador o entorno iframe, intentar signInWithRedirect
    if (
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/internal-error'
    ) {
      logger.info("Intentando signInWithRedirect como fallback para Google Auth...");
      try {
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch (redirectErr) {
        logger.error("Error signing in with Google via redirect:", redirectErr);
        throw redirectErr;
      }
    }

    if (DEMO_AUTH_ENABLED) {
      setLocalUser(DEMO_USER_DEFAULT);
      return DEMO_USER_DEFAULT;
    } else {
      throw error;
    }
  }
};


export const logout = async () => {
  try {
    localStorage.removeItem('ic360_user');
    localDemoUser = null;
    window.dispatchEvent(new CustomEvent('ic360_auth_change'));
    await signOut(auth);
  } catch (error) {
    logger.error("Error signing out", error);
  }
};

export function useAppAuthState() {
  const [user, setUser] = useState<any>(() => {
    if (auth.currentUser) return auth.currentUser;
    if (DEMO_AUTH_ENABLED) return getStoredUser();
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authInitialized = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
      } else if (DEMO_AUTH_ENABLED && !authInitialized) {
        authInitialized = true;
        try {
          const credential = await signInAnonymously(auth);
          if (mounted && credential.user) {
            setUser(credential.user);
            setLoading(false);
          }
        } catch (err: any) {
          logger.warn('Anonymous auth auto-signin notice:', err?.message || err);
          if (mounted) {
            const stored = getStoredUser();
            setUser(stored || DEMO_USER_DEFAULT);
            setLoading(false);
          }
        }
      } else {
        const stored = DEMO_AUTH_ENABLED ? getStoredUser() : null;
        setUser(stored);
        setLoading(false);
      }
    });

    const onLocal = () => {
      if (!mounted) return;
      if (DEMO_AUTH_ENABLED) {
        const stored = getStoredUser();
        setUser(stored || auth.currentUser || DEMO_USER_DEFAULT);
      } else {
        setUser(auth.currentUser || null);
      }
      setLoading(false);
    };
    window.addEventListener('ic360_auth_change', onLocal);

    return () => {
      mounted = false;
      unsubscribe();
      window.removeEventListener('ic360_auth_change', onLocal);
    };
  }, []);

  return [user, loading] as const;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType | string;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType | string, path: string | null = null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  logger.error('Firestore Error:', errInfo);
}

