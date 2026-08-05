import rateLimit from 'express-rate-limit';

export const getLimiterKey = (req: any): string => req.uid ?? req.ip ?? 'unknown';

export const geminiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: getLimiterKey,
  message: { error: 'Rate limit exceeded. Intenta en 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const emailLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: getLimiterKey,
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
