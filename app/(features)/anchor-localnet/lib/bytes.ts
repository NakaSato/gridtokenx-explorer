/**
 * Realm-agnostic little-endian readers over account bytes.
 *
 * On-chain account data reaches the browser as a plain `Uint8Array`, which does
 * NOT carry Node `Buffer`'s `readBig*` / `readUInt*` / `toString(encoding)`
 * methods — calling them throws `readBigUInt64LE is not a function` at runtime
 * (fixture tests pass because they feed real Buffers). Decoding through
 * `DataView` + manual byte walks keeps the same code correct in the browser, in
 * jsdom, and under Node, regardless of whether the input is a Buffer or a
 * Uint8Array.
 */

function view(d: Uint8Array): DataView {
  return new DataView(d.buffer, d.byteOffset, d.byteLength);
}

export function readU64LE(d: Uint8Array, offset: number): bigint {
  return view(d).getBigUint64(offset, true);
}

export function readI64LE(d: Uint8Array, offset: number): bigint {
  return view(d).getBigInt64(offset, true);
}

export function readU32LE(d: Uint8Array, offset: number): number {
  return view(d).getUint32(offset, true);
}

export function readI32LE(d: Uint8Array, offset: number): number {
  return view(d).getInt32(offset, true);
}

export function readU16LE(d: Uint8Array, offset: number): number {
  return view(d).getUint16(offset, true);
}

export function bytesToHex(d: Uint8Array): string {
  let s = '';
  for (let i = 0; i < d.length; i++) s += d[i].toString(16).padStart(2, '0');
  return s;
}

export function bytesToAscii(d: Uint8Array): string {
  let s = '';
  for (let i = 0; i < d.length; i++) s += String.fromCharCode(d[i]);
  return s;
}

/**
 * Decode a fixed-width byte id the way the seeders store it: an ASCII string
 * with trailing NUL/space padding, falling back to hex when the bytes aren't
 * printable ASCII.
 */
export function decodeAsciiId(d: Uint8Array): string {
  const ascii = bytesToAscii(d).replace(/[\x00\s]+$/g, '');
  return /^[\x20-\x7e]+$/.test(ascii) ? ascii : bytesToHex(d);
}
