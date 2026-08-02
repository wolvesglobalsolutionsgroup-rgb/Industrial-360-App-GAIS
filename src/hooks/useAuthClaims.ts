import { useEffect, useState } from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
import { auth } from '../firebase';

export interface AuthClaimsState {
  user: User | null;
  role?: string;
  orgId?: string;
  isPlatformAdmin: boolean;
  claimsVersion?: number | string;
  loading: boolean;
  error?: string;
  isPendingMembership: boolean;
  refreshToken: () => Promise<void>;
}

export function useAuthClaims(): AuthClaimsState {
  const [state, setState] = useState<Omit<AuthClaimsState, 'refreshToken'>>({
    user: null,
    role: undefined,
    orgId: undefined,
    isPlatformAdmin: false,
    claimsVersion: undefined,
    loading: true,
    error: undefined,
    isPendingMembership: false,
  });

  const refresh = async () => {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
  };

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(
      auth,
      async (user) => {
        if (!user) {
          setState({
            user: null,
            role: undefined,
            orgId: undefined,
            isPlatformAdmin: false,
            claimsVersion: undefined,
            loading: false,
            error: undefined,
            isPendingMembership: false,
          });
          return;
        }

        try {
          const tokenResult = await user.getIdTokenResult();
          const claims = tokenResult.claims || {};
          const role = claims.role as string | undefined;
          const orgId = claims.orgId as string | undefined;
          const isPlatformAdmin = claims.platformAdmin === true;
          const claimsVersion = (claims.auth_time || claims.iat) as number | string | undefined;

          const isPending = !role || !orgId;

          setState({
            user,
            role,
            orgId,
            isPlatformAdmin,
            claimsVersion,
            loading: false,
            error: undefined,
            isPendingMembership: isPending,
          });
        } catch (err: any) {
          setState({
            user,
            role: undefined,
            orgId: undefined,
            isPlatformAdmin: false,
            claimsVersion: undefined,
            loading: false,
            error: err?.message || 'Error al obtener los custom claims del JWT.',
            isPendingMembership: true,
          });
        }
      },
      (err) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message,
        }));
      }
    );

    return () => unsubscribe();
  }, []);

  return { ...state, refreshToken: refresh };
}
