import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { Request, Response, NextFunction } from 'express';

if (!getApps().length) {
  initializeApp();
}

declare global {
  namespace Express {
    interface Request {
      uid: string;
      email: string;
    }
  }
}

export async function verifyFirebaseToken(
  req: Request, res: Response, next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing token' });
    return;
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    req.email = decoded.email ?? '';
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
}
