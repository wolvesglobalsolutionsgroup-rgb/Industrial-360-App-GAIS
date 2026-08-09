/**
 * Utilities for parsing real image dimensions from binary buffers.
 * Zero-dependency, safe, deterministic image dimensions parser.
 */

export interface ImageDimensions {
  width: number;
  height: number;
  type: string;
  hasAlpha?: boolean;
}

/**
 * Extracts width, height, and format type from real image binary buffers (PNG, JPEG, GIF, WebP, BMP).
 * Throws an Error if the buffer is invalid or unsupported.
 */
export function calculateImageDimensions(buffer: Uint8Array | Buffer): ImageDimensions {
  if (!buffer || buffer.length < 8) {
    throw new Error('Unsupported or invalid image file: buffer too short');
  }

  // 1. PNG Signature: 0x89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    if (buffer.length < 24) {
      throw new Error('Unsupported or invalid image file: truncated PNG header');
    }
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const width = view.getUint32(16, false); // Big endian
    const height = view.getUint32(20, false); // Big endian
    
    // Color type at byte 25: 4 (gray+alpha), 6 (RGBA) indicate alpha channel
    const colorType = buffer.length >= 26 ? buffer[25] : 0;
    const hasAlpha = colorType === 4 || colorType === 6;

    return { width, height, type: 'png', hasAlpha };
  }

  // 2. JPEG Signature: 0xFF 0xD8
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2), SOF3 (0xC3)
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        const height = view.getUint16(offset + 5, false);
        const width = view.getUint16(offset + 7, false);
        return { width, height, type: 'jpg', hasAlpha: false };
      }
      const blockLength = (buffer[offset + 2] << 8) + buffer[offset + 3];
      if (blockLength <= 0) break;
      offset += 2 + blockLength;
    }
    throw new Error('Unsupported or invalid image file: JPEG SOF marker not found');
  }

  // 3. GIF Signature: "GIF87a" or "GIF89a"
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const width = view.getUint16(6, true); // Little endian
    const height = view.getUint16(8, true); // Little endian
    return { width, height, type: 'gif', hasAlpha: true };
  }

  // 4. BMP Signature: "BM"
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    if (buffer.length < 26) {
      throw new Error('Unsupported or invalid image file: truncated BMP header');
    }
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const width = view.getInt32(18, true);
    const height = Math.abs(view.getInt32(22, true));
    return { width, height, type: 'bmp', hasAlpha: false };
  }

  // 5. WebP: "RIFF" .... "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    // VP8X extended WebP
    if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x58) {
      const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
      const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
      return { width, height, type: 'webp', hasAlpha: (buffer[20] & 0x10) !== 0 };
    }
    // VP8L lossless WebP
    if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x4c) {
      const b0 = buffer[21];
      const b1 = buffer[22];
      const b2 = buffer[23];
      const b3 = buffer[24];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      return { width, height, type: 'webp', hasAlpha: true };
    }
  }

  throw new Error('Unsupported or invalid image file format');
}

export interface BoundingBox {
  x: number;
  y: number;
  maxW: number;
  maxH: number;
}

export interface PlacedImageDimensions {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Parses image source (data URL or buffer), calculates real dimensions via calculateImageDimensions,
 * and scales image proportionally inside bounding box.
 * Avoids division by zero and rejects invalid buffers gracefully without throwing.
 */
export function calculateProportionalBox(
  imageSource: string | Uint8Array | Buffer | undefined | null,
  box: BoundingBox,
  alignHorizontal: 'left' | 'center' | 'right' = 'center'
): PlacedImageDimensions {
  const fallback = { x: box.x, y: box.y, w: box.maxW, h: box.maxH };
  if (!imageSource) return fallback;

  try {
    let buffer: Uint8Array | Buffer | null = null;
    if (typeof imageSource === 'string') {
      if (imageSource.startsWith('data:image/')) {
        const commaIdx = imageSource.indexOf(',');
        if (commaIdx !== -1) {
          const base64Str = imageSource.substring(commaIdx + 1);
          buffer = typeof Buffer !== 'undefined' ? Buffer.from(base64Str, 'base64') : Uint8Array.from(atob(base64Str), c => c.charCodeAt(0));
        }
      }
    } else {
      buffer = imageSource;
    }

    if (!buffer || buffer.length < 8) return fallback;

    const dims = calculateImageDimensions(buffer);
    if (!dims.width || !dims.height || dims.width <= 0 || dims.height <= 0) {
      return fallback;
    }

    const scale = Math.min(box.maxW / dims.width, box.maxH / dims.height);
    const w = Number((dims.width * scale).toFixed(2));
    const h = Number((dims.height * scale).toFixed(2));

    if (w <= 0 || h <= 0) return fallback;

    let x = box.x;
    if (alignHorizontal === 'center') {
      x = Number((box.x + (box.maxW - w) / 2).toFixed(2));
    } else if (alignHorizontal === 'right') {
      x = Number((box.x + (box.maxW - w)).toFixed(2));
    }

    const y = Number((box.y + (box.maxH - h) / 2).toFixed(2));

    return { x, y, w, h };
  } catch {
    // Return safe default bounding box on invalid image or parsing error
    return fallback;
  }
}
