import { sanitizePII } from './tamperProofChain';

/**
 * Algoritmo SHA-256 síncrono determinista en TypeScript puro.
 */
export function sha256Sync(ascii: string): string {
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
    if (j >> 8) return ''; // Solo ASCII 8 bits
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
 * Genera el hash SHA-256 de versión visual e inmutable del entregable (visualVersionHash).
 * Combina la carga útil de datos estructurados con la plantilla previa a la firma.
 */
export function calculateVisualVersionHash(
  dataPayload: Record<string, any> | object,
  htmlTemplateString: string = ''
): string {
  const sanitized = sanitizePII(dataPayload);
  const dataString = JSON.stringify(sanitized, Object.keys(sanitized || {}).sort());
  const combinedPayload = `FORMATO_MAESTRO_V1|${dataString}|${htmlTemplateString.trim()}`;
  return sha256Sync(combinedPayload);
}

export const DEFAULT_VERIFY_BASE_URL = 'https://ic360-nexus.pdvsa.com/verify';

/**
 * Genera la URL pública de verificación por QR para el entregable.
 * URL oficial: https://ic360-nexus.pdvsa.com/verify?hash=:visualVersionHash
 */
export function generateQrVerificationUrl(
  visualVersionHash: string,
  baseUrl: string = DEFAULT_VERIFY_BASE_URL
): string {
  if (!visualVersionHash) return '';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBase}?hash=${encodeURIComponent(visualVersionHash)}`;
}
