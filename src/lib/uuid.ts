import { randomBytes } from 'node:crypto';

/**
 * RFC 9562 UUIDv7: 48-bit big-endian Unix ms timestamp + version/variant bits + randomness.
 * Time-ordered, so it sorts and indexes like a serial column while still being unguessable.
 */
export function uuidv7(): string {
  const unixTsMs = BigInt(Date.now());
  const bytes = new Uint8Array(16);

  bytes[0] = Number((unixTsMs >> 40n) & 0xffn);
  bytes[1] = Number((unixTsMs >> 32n) & 0xffn);
  bytes[2] = Number((unixTsMs >> 24n) & 0xffn);
  bytes[3] = Number((unixTsMs >> 16n) & 0xffn);
  bytes[4] = Number((unixTsMs >> 8n) & 0xffn);
  bytes[5] = Number(unixTsMs & 0xffn);

  const rand = randomBytes(10);

  bytes[6] = 0x70 | (rand[0] & 0x0f); // version 7
  bytes[7] = rand[1];
  bytes[8] = 0x80 | (rand[2] & 0x3f); // variant 10
  bytes[9] = rand[3];
  bytes[10] = rand[4];
  bytes[11] = rand[5];
  bytes[12] = rand[6];
  bytes[13] = rand[7];
  bytes[14] = rand[8];
  bytes[15] = rand[9];

  const hex = Buffer.from(bytes).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Deterministically maps a legacy integer primary key to a UUID-shaped value so old
 * rows (and any bookmarked/hardcoded references to them) keep working after the
 * serial -> uuid primary key migration. Zero-padded and visually distinct from real
 * UUIDv7 values, which always have non-zero high-order timestamp bits.
 */
export function legacyIntToUuid(id: number | string): string {
  const hex = Number(id).toString(16).padStart(12, '0');
  return `00000000-0000-0000-0000-${hex}`;
}

/** True if a uuid string looks like one produced by legacyIntToUuid(). */
export function isLegacyUuid(value: string): boolean {
  return /^00000000-0000-0000-0000-[0-9a-f]{12}$/.test(value);
}
