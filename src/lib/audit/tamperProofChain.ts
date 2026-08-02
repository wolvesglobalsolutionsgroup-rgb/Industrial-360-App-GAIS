/**
 * Industrial Control 360 — Cadena de Auditoría Inmutable (Tamper-Proof Audit Chain) - S22
 *
 * C2 — Bloque génesis con hashPrev = '0'.repeat(64). Verificación recursiva completa.
 * C4 — Sanitización PII configurable (fieldsToRedact)
 */

export interface PIIRedactionConfig {
  fieldsToRedact: string[];
}

export const DEFAULT_PII_CONFIG: PIIRedactionConfig = {
  fieldsToRedact: ['email', 'phone', 'cedula', 'fullname', 'creditcard', 'password', 'token', 'ssn'],
};

export interface AuditLogBlock {
  id: string;
  timestamp: string;
  orgId: string;
  projectId?: string;
  actor: string;
  requestId: string;
  action: string;
  details: Record<string, any>;
  reason?: string;
  resultStatus: 'SUCCESS' | 'DENIED' | 'ERROR';
  hashPrev: string;
  hashActual: string;
}

/**
 * Algoritmo SHA-256 puro en TypeScript para ejecuciones síncronas cliente/servidor/vitest.
 */
function sha256Sync(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash: number[] = [];
  let k: number[] = [];
  let primeCounter = 0;

  const isPrime = (candidate: number) => {
    for (let factor = 2; factor * factor <= candidate; factor++) {
      if (candidate % factor === 0) return false;
    }
    return true;
  };

  const getFractionalBits = (n: number) => Math.floor((n - Math.floor(n)) * maxWord);

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = getFractionalBits(Math.pow(candidate, 1 / 2));
      }
      k[primeCounter] = getFractionalBits(Math.pow(candidate, 1 / 3));
      primeCounter++;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';

  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return ''; // Solo ASCII de 8 bits para hashes deterministas
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength | 0;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];

      const s0 =
        ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
      const s1 =
        ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);

      w[i] =
        i < 16
          ? w[i]
          : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const temp1 =
        (hash[7] +
          (((hash[4] >>> 6) | (hash[4] << 26)) ^
            ((hash[4] >>> 11) | (hash[4] << 21)) ^
            ((hash[4] >>> 25) | (hash[4] << 7))) +
          ((hash[4] & hash[5]) ^ (~hash[4] & hash[6])) +
          k[i] +
          w[i]) |
        0;

      const temp2 =
        ((((hash[0] >>> 2) | (hash[0] << 30)) ^
          ((hash[0] >>> 13) | (hash[0] << 19)) ^
          ((hash[0] >>> 22) | (hash[0] << 10))) +
          ((hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]))) |
        0;

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

/**
 * Sanitiza recursivamente cualquier objeto descartando o redactando PII (C4).
 */
export function sanitizePII<T>(input: T, config: PIIRedactionConfig = DEFAULT_PII_CONFIG): T {
  if (input === null || input === undefined) return input;

  const redactSet = new Set(config.fieldsToRedact.map(f => f.toLowerCase()));

  if (typeof input === 'string') {
    return input as T;
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizePII(item, config)) as unknown as T;
  }

  if (typeof input === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      if (redactSet.has(key.toLowerCase())) {
        sanitizedObj[key] = '[REDACTED_PII]';
      } else {
        sanitizedObj[key] = sanitizePII(value, config);
      }
    }
    return sanitizedObj as T;
  }

  return input;
}

/**
 * Calcula el hash SHA-256 de un bloque de auditoría a partir de su contenido sanitizado.
 */
export function calculateBlockHash(payload: {
  hashPrev: string;
  timestamp: string;
  action: string;
  actor: string;
  requestId: string;
  resultStatus: string;
  sanitizedDetails: Record<string, any>;
}): string {
  const content = `${payload.hashPrev}|${payload.timestamp}|${payload.action}|${payload.actor}|${payload.requestId}|${payload.resultStatus}|${JSON.stringify(payload.sanitizedDetails)}`;
  return sha256Sync(content);
}

export const GENESIS_HASH_PREV = '0'.repeat(64);

/**
 * Crea un nuevo bloque encadenado con sanitización PII e inmutabilidad cryptographic.
 */
export function createAuditBlock(
  params: {
    id?: string;
    orgId: string;
    projectId?: string;
    actor: string;
    requestId: string;
    action: string;
    details: Record<string, any>;
    reason?: string;
    resultStatus?: 'SUCCESS' | 'DENIED' | 'ERROR';
    prevBlock?: AuditLogBlock;
  },
  piiConfig?: PIIRedactionConfig
): AuditLogBlock {
  const timestamp = new Date().toISOString();
  const hashPrev = params.prevBlock ? params.prevBlock.hashActual : GENESIS_HASH_PREV;
  const sanitizedDetails = sanitizePII(params.details, piiConfig);
  const resultStatus = params.resultStatus || 'SUCCESS';

  const hashActual = calculateBlockHash({
    hashPrev,
    timestamp,
    action: params.action,
    actor: params.actor,
    requestId: params.requestId,
    resultStatus,
    sanitizedDetails,
  });

  return {
    id: params.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp,
    orgId: params.orgId,
    projectId: params.projectId,
    actor: params.actor,
    requestId: params.requestId,
    action: params.action,
    details: sanitizedDetails,
    reason: params.reason,
    resultStatus,
    hashPrev,
    hashActual,
  };
}

/**
 * Recorre recursivamente la cadena de bloques y valida la integridad de cada hash (C2).
 */
export function verifyChainIntegrity(chain: AuditLogBlock[]): {
  valid: boolean;
  brokenAtBlockIndex?: number;
  reason?: string;
} {
  if (!chain || chain.length === 0) {
    return { valid: true };
  }

  // 1. Validar Bloque Génesis
  if (chain[0].hashPrev !== GENESIS_HASH_PREV) {
    return {
      valid: false,
      brokenAtBlockIndex: 0,
      reason: `Bloque génesis inválido: hashPrev esperado '${GENESIS_HASH_PREV}', obtenido '${chain[0].hashPrev}'`,
    };
  }

  for (let i = 0; i < chain.length; i++) {
    const block = chain[i];

    // Recalcular hash del bloque i
    const recalculatedHash = calculateBlockHash({
      hashPrev: block.hashPrev,
      timestamp: block.timestamp,
      action: block.action,
      actor: block.actor,
      requestId: block.requestId,
      resultStatus: block.resultStatus,
      sanitizedDetails: block.details,
    });

    if (recalculatedHash !== block.hashActual) {
      return {
        valid: false,
        brokenAtBlockIndex: i,
        reason: `Alteración detectada en bloque ${i} (${block.id}): hashActual recalculado '${recalculatedHash}' no coincide con registrado '${block.hashActual}'`,
      };
    }

    // Verificar encadenamiento con bloque anterior (i > 0)
    if (i > 0) {
      const prevBlock = chain[i - 1];
      if (block.hashPrev !== prevBlock.hashActual) {
        return {
          valid: false,
          brokenAtBlockIndex: i,
          reason: `Ruptura de cadena en bloque ${i}: hashPrev '${block.hashPrev}' no coincide con hashActual del bloque anterior '${prevBlock.hashActual}'`,
        };
      }
    }
  }

  return { valid: true };
}
