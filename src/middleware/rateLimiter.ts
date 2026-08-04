import rateLimit from 'express-rate-limit';

export const geminiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req: any) => req.uid ?? req.ip ?? 'unknown',
  message: { error: 'Rate limit exceeded. Intenta en 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const emailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req: any) => req.uid ?? req.ip ?? 'unknown',
  message: { error: 'Email rate limit exceeded.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req: any) => req.ip ?? 'unknown',
  message: { error: 'Too many requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});
