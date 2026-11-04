/**
 * Web Crypto API AES-256-GCM Digital Vault Client Implementation.
 * Zero external crypto dependencies - 100% compliant with W3C Web Cryptography API.
 * Hardened against memory leaks, binary corruption, and stack overflows.
 */

export const DEFAULT_VAULT_PASSPHRASE = "trustpassz-secret-escrow-key";

export interface EncryptedVaultPayload {
  encryptedContent: string; // Base64 encoded ciphertext (without tag)
  encryptionIv: string; // 12-byte IV in 24-character hexadecimal
  authTag: string; // 16-byte authentication tag in 32-character hexadecimal
  contentHash: string; // SHA-256 integrity hash of original plaintext (64 hex characters)
  exportedKeyHex?: string; // Hexadecimal 256-bit key when auto-generated without passphrase
}

export interface DecryptVaultOptions {
  encryptedContent: string;
  encryptionIv: string;
  authTag: string;
  expectedHash?: string;
}

export class IntegrityViolationException extends Error {
  constructor(message = "Toàn vẹn dữ liệu bị xâm phạm: SHA-256 hash không trùng khớp.") {
    super(message);
    this.name = "IntegrityViolationException";
  }
}

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const B64_LOOKUP = new Uint8Array(256);
for (let i = 0; i < B64_CHARS.length; i++) {
  B64_LOOKUP[B64_CHARS.charCodeAt(i)] = i;
}

/**
 * Converts ArrayBuffer or Uint8Array to standard Base64 without String.fromCharCode.apply.
 */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const len = bytes.length;
  let base64 = "";

  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;

    base64 += B64_CHARS[b0 >> 2];
    base64 += B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    base64 += i + 1 < len ? B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    base64 += i + 2 < len ? B64_CHARS[b2 & 63] : "=";
  }

  return base64;
}

/**
 * Decodes standard Base64 string directly into Uint8Array buffer without atob binary conversion.
 */
export function base64ToBuffer(base64: string): Uint8Array {
  const clean = base64.replace(/[\s=]/g, "");
  const len = clean.length;
  const bufferLen = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(bufferLen);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const enc1 = B64_LOOKUP[clean.charCodeAt(i)];
    const enc2 = i + 1 < len ? B64_LOOKUP[clean.charCodeAt(i + 1)] : 0;
    const enc3 = i + 2 < len ? B64_LOOKUP[clean.charCodeAt(i + 2)] : 64;
    const enc4 = i + 3 < len ? B64_LOOKUP[clean.charCodeAt(i + 3)] : 64;

    const b0 = (enc1 << 2) | (enc2 >> 4);
    bytes[p++] = b0;

    if (i + 2 < len) {
      const b1 = ((enc2 & 15) << 4) | (enc3 >> 2);
      bytes[p++] = b1;
    }
    if (i + 3 < len) {
      const b2 = ((enc3 & 3) << 6) | enc4;
      bytes[p++] = b2;
    }
  }

  return bytes.subarray(0, p);
}

/**
 * Accesses standard SubtleCrypto across Browser window, Web Worker, and Node.js environments.
 */
function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error("Web Crypto API (crypto.subtle) is not supported in this runtime environment.");
}

/**
 * Zeroes out sensitive buffers and array buffers immediately in-memory to prevent RAM leaks.
 */
export function wipeMemory(...buffers: (Uint8Array | ArrayBuffer | ArrayBufferView | null | undefined)[]): void {
  for (const buffer of buffers) {
    if (!buffer) continue;
    if (buffer instanceof Uint8Array) {
      buffer.fill(0);
    } else if (buffer instanceof ArrayBuffer) {
      new Uint8Array(buffer).fill(0);
    } else if (ArrayBuffer.isView(buffer)) {
      new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength).fill(0);
    }
  }
}

/**
 * Converts ArrayBuffer or Uint8Array to lowercase hexadecimal string.
 */
export function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * Converts hexadecimal string to Uint8Array buffer.
 */
export function hexToBuffer(hex: string): Uint8Array {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error(`Invalid hexadecimal string length (${normalized.length}). Must be even.`);
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Computes SHA-256 cryptographic digest of a string, returning 64-char hex string.
 */
export async function hashContent(plainText: string): Promise<string> {
  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  try {
    const hashBuffer = await subtle.digest("SHA-256", data);
    return bufferToHex(hashBuffer);
  } finally {
    wipeMemory(data);
  }
}

/**
 * Derives or generates a CryptoKey for AES-GCM (256-bit).
 * Supports PBKDF2 with 16-byte dealId salt, SHA-256 derivation, or raw 64-hex key import.
 */
async function resolveAesGcmKey(
  secretPassphrase?: string,
  dealId?: string
): Promise<{ key: CryptoKey; exportedKeyHex?: string }> {
  const subtle = getSubtleCrypto();

  if (secretPassphrase && secretPassphrase.trim().length > 0) {
    const trimmed = secretPassphrase.trim();
    if (trimmed.length === 64 && /^[0-9a-fA-F]{64}$/.test(trimmed)) {
      const rawBytes = hexToBuffer(trimmed);
      try {
        const key = await subtle.importKey(
          "raw",
          rawBytes as unknown as BufferSource,
          { name: "AES-GCM" },
          false,
          ["encrypt", "decrypt"]
        );
        return { key, exportedKeyHex: trimmed };
      } finally {
        wipeMemory(rawBytes);
      }
    }

    const encoder = new TextEncoder();
    const encodedPass = encoder.encode(trimmed);

    // If dealId provided, use PBKDF2 with 16-byte fixed salt derived from dealId
    if (dealId && dealId.trim().length > 0) {
      let saltBuffer: ArrayBuffer | null = null;
      let salt16: Uint8Array | null = null;
      let baseKey: CryptoKey | null = null;
      try {
        saltBuffer = await subtle.digest("SHA-256", encoder.encode(dealId.trim()));
        salt16 = new Uint8Array(saltBuffer).slice(0, 16);
        baseKey = await subtle.importKey("raw", encodedPass, "PBKDF2", false, ["deriveKey"]);
        const key = await subtle.deriveKey(
          {
            name: "PBKDF2",
            salt: salt16 as unknown as BufferSource,
            iterations: 100000,
            hash: "SHA-256",
          },
          baseKey,
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt", "decrypt"]
        );
        return { key };
      } finally {
        wipeMemory(encodedPass, saltBuffer, salt16);
      }
    }

    // Default derivation: SHA-256 hash of passphrase
    let keyDigest: ArrayBuffer | null = null;
    try {
      keyDigest = await subtle.digest("SHA-256", encodedPass);
      const key = await subtle.importKey(
        "raw",
        keyDigest,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
      );
      return { key };
    } finally {
      wipeMemory(encodedPass, keyDigest);
    }
  }

  // Generate random 256-bit key when secretPassphrase is omitted
  const randomKeyBytes = (typeof window !== "undefined" ? window.crypto : globalThis.crypto).getRandomValues(
    new Uint8Array(32)
  );
  try {
    const key = await subtle.importKey(
      "raw",
      randomKeyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
    return { key, exportedKeyHex: bufferToHex(randomKeyBytes) };
  } finally {
    wipeMemory(randomKeyBytes);
  }
}

/**
 * Encrypts sensitive plaintext using AES-256-GCM with a 96-bit (12 bytes) IV.
 * Separates ciphertext and 16-byte authentication tag to strictly conform with backend DTO schema.
 * Computes SHA-256 hash of plaintext for end-to-end zero-knowledge integrity verification.
 */
export async function encryptSecret(
  plainText: string,
  secretPassphrase?: string,
  dealId?: string
): Promise<EncryptedVaultPayload> {
  const subtle = getSubtleCrypto();
  const cryptoSource = typeof window !== "undefined" ? window.crypto : globalThis.crypto;

  let iv: Uint8Array | null = null;
  let plainTextBytes: Uint8Array | null = null;
  let encryptedBuffer: ArrayBuffer | null = null;
  let fullEncryptedBytes: Uint8Array | null = null;

  try {
    // 1. Generate 96-bit (12-byte) IV for GCM mode
    iv = cryptoSource.getRandomValues(new Uint8Array(12));

    // 2. Resolve AES-256 key
    const { key, exportedKeyHex } = await resolveAesGcmKey(secretPassphrase, dealId);

    // 3. Compute plaintext integrity hash (SHA-256, 64 hex characters)
    const contentHash = await hashContent(plainText);

    // 4. Encrypt via AES-GCM (tagLength: 128 bits = 16 bytes)
    const encoder = new TextEncoder();
    plainTextBytes = encoder.encode(plainText);
    encryptedBuffer = await subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv as unknown as BufferSource,
        tagLength: 128,
      },
      key,
      plainTextBytes as unknown as BufferSource
    );

    // 5. In Web Crypto API, the output buffer contains [ciphertext bytes] + [16 bytes auth tag]
    fullEncryptedBytes = new Uint8Array(encryptedBuffer);
    const tagLengthBytes = 16;
    const cipherBytes = fullEncryptedBytes.subarray(0, fullEncryptedBytes.length - tagLengthBytes);
    const authTagBytes = fullEncryptedBytes.subarray(fullEncryptedBytes.length - tagLengthBytes);

    return {
      encryptedContent: bufferToBase64(cipherBytes),
      encryptionIv: bufferToHex(iv),
      authTag: bufferToHex(authTagBytes),
      contentHash,
      exportedKeyHex,
    };
  } finally {
    wipeMemory(plainTextBytes, encryptedBuffer, fullEncryptedBytes);
  }
}

/**
 * Decrypts an encrypted vault payload and verifies optional integrity hash.
 * Immediately wipes all intermediate and decrypted buffers from RAM in a finally block.
 */
export async function decryptVaultPayload(
  payload: DecryptVaultOptions,
  secretPassphrase: string,
  dealId?: string
): Promise<string> {
  const subtle = getSubtleCrypto();

  let ivBytes: Uint8Array | null = null;
  let cipherBytes: Uint8Array | null = null;
  let authTagBytes: Uint8Array | null = null;
  let combined: Uint8Array | null = null;
  let decryptedBuffer: ArrayBuffer | null = null;

  try {
    ivBytes = hexToBuffer(payload.encryptionIv);
    cipherBytes = base64ToBuffer(payload.encryptedContent);
    authTagBytes = hexToBuffer(payload.authTag);

    if (authTagBytes.length !== 16) {
      throw new Error(`Invalid authTag length (${authTagBytes.length} bytes). Must be exactly 16 bytes.`);
    }

    // Re-assemble [ciphertext] + [auth tag] required by Web Crypto subtle.decrypt
    combined = new Uint8Array(cipherBytes.length + authTagBytes.length);
    combined.set(cipherBytes, 0);
    combined.set(authTagBytes, cipherBytes.length);

    try {
      const { key } = await resolveAesGcmKey(secretPassphrase, dealId);
      decryptedBuffer = await subtle.decrypt(
        {
          name: "AES-GCM",
          iv: ivBytes as unknown as BufferSource,
          tagLength: 128,
        },
        key,
        combined as unknown as BufferSource
      );
    } catch (err: unknown) {
      if (dealId) {
        const fallback = await resolveAesGcmKey(secretPassphrase);
        decryptedBuffer = await subtle.decrypt(
          {
            name: "AES-GCM",
            iv: ivBytes as unknown as BufferSource,
            tagLength: 128,
          },
          fallback.key,
          combined as unknown as BufferSource
        );
      } else {
        throw err;
      }
    }

    const decoder = new TextDecoder("utf-8", { fatal: true });
    const decryptedText = decoder.decode(decryptedBuffer);

    if (payload.expectedHash && payload.expectedHash.trim().length > 0) {
      const computedHash = await hashContent(decryptedText);
      if (computedHash.toLowerCase() !== payload.expectedHash.trim().toLowerCase()) {
        throw new IntegrityViolationException(
          `Toàn vẹn dữ liệu bị xâm phạm: Expected hash ${payload.expectedHash}, got ${computedHash}`
        );
      }
    }

    return decryptedText;
  } finally {
    wipeMemory(ivBytes, cipherBytes, authTagBytes, combined, decryptedBuffer);
  }
}

export const decryptSecret = decryptVaultPayload;
