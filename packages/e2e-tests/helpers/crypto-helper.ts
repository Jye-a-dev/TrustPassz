export interface EncryptedPayload {
  encryptedContent: string;
  encryptionIv: string;
  authTag: string;
  contentHash: string;
  exportedKeyHex?: string;
}

export interface DecryptOptions {
  encryptedContent: string;
  encryptionIv: string;
  authTag: string;
  expectedHash?: string;
}

function getSubtle(): SubtleCrypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API (crypto.subtle) is unavailable in current runtime.');
}

export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error(`Invalid hex length (${normalized.length})`);
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Buffer.from(bytes).toString('base64');
}

export function base64ToBuffer(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

export async function hashContent(plainText: string): Promise<string> {
  const subtle = getSubtle();
  const data = new TextEncoder().encode(plainText);
  const digest = await subtle.digest('SHA-256', data);
  return bufferToHex(digest);
}

async function resolveKey(
  passphrase?: string,
): Promise<{ key: CryptoKey; exportedKeyHex?: string }> {
  const subtle = getSubtle();

  if (passphrase && passphrase.trim().length > 0) {
    const trimmed = passphrase.trim();
    if (trimmed.length === 64 && /^[0-9a-fA-F]{64}$/.test(trimmed)) {
      const rawBytes = hexToBuffer(trimmed);
      const key = await subtle.importKey(
        'raw',
        rawBytes as unknown as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt'],
      );
      return { key, exportedKeyHex: trimmed };
    }

    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(trimmed));
    const key = await subtle.importKey(
      'raw',
      digest,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    );
    return { key };
  }

  const randomBytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  const key = await subtle.importKey(
    'raw',
    randomBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
  return { key, exportedKeyHex: bufferToHex(randomBytes) };
}

/**
 * Encrypts sensitive secret string using client-side AES-256-GCM.
 */
export async function encryptSecret(
  plainText: string,
  passphrase?: string,
): Promise<EncryptedPayload> {
  const subtle = getSubtle();
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const { key, exportedKeyHex } = await resolveKey(passphrase);
  const contentHash = await hashContent(plainText);

  const plainBytes = new TextEncoder().encode(plainText);
  const encryptedBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    plainBytes,
  );

  const fullBytes = new Uint8Array(encryptedBuffer);
  const tagLength = 16;
  const cipherBytes = fullBytes.subarray(0, fullBytes.length - tagLength);
  const authTagBytes = fullBytes.subarray(fullBytes.length - tagLength);

  return {
    encryptedContent: bufferToBase64(cipherBytes),
    encryptionIv: bufferToHex(iv),
    authTag: bufferToHex(authTagBytes),
    contentHash,
    exportedKeyHex,
  };
}

/**
 * Decrypts AES-256-GCM ciphertext payload and validates integrity hash.
 */
export async function decryptSecret(
  payload: DecryptOptions,
  passphrase: string,
): Promise<string> {
  const subtle = getSubtle();
  const ivBytes = hexToBuffer(payload.encryptionIv);
  const cipherBytes = base64ToBuffer(payload.encryptedContent);
  const authTagBytes = hexToBuffer(payload.authTag);

  const combined = new Uint8Array(cipherBytes.length + authTagBytes.length);
  combined.set(cipherBytes, 0);
  combined.set(authTagBytes, cipherBytes.length);

  const { key } = await resolveKey(passphrase);
  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes as unknown as BufferSource, tagLength: 128 },
    key,
    combined as unknown as BufferSource,
  );

  const decryptedText = new TextDecoder().decode(decryptedBuffer);

  if (payload.expectedHash) {
    const computedHash = await hashContent(decryptedText);
    if (computedHash.toLowerCase() !== payload.expectedHash.toLowerCase()) {
      throw new Error(
        `Integrity audit mismatch: Expected hash ${payload.expectedHash}, computed ${computedHash}`,
      );
    }
  }

  return decryptedText;
}
