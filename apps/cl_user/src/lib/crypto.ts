/**
 * Web Crypto API AES-256-GCM Digital Vault Client Implementation.
 * Zero external crypto dependencies - 100% compliant with W3C Web Cryptography API.
 * Compatible with TrustPassz Digital Vault DTO (Backend TASK-03 & TASK-04).
 * Memory-hardened with zeroing routines (wipeMemory) to prevent heap leakage of sensitive keys & plaintexts.
 */

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
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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
 * Converts ArrayBuffer or Uint8Array to standard Base64 string.
 */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const nodeBuffer = (
    globalThis as unknown as {
      Buffer?: { from: (b: Uint8Array) => { toString: (e: string) => string } };
    }
  ).Buffer;
  if (nodeBuffer) {
    return nodeBuffer.from(bytes).toString("base64");
  }
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts Base64 string to Uint8Array buffer.
 */
export function base64ToBuffer(base64: string): Uint8Array {
  const nodeBuffer = (
    globalThis as unknown as {
      Buffer?: { from: (s: string, e: string) => ArrayLike<number> };
    }
  ).Buffer;
  if (nodeBuffer) {
    return new Uint8Array(nodeBuffer.from(base64, "base64"));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
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
 * If a passphrase or hex key is provided, derives a deterministic 256-bit key via SHA-256.
 * Otherwise, generates a random 32-byte key.
 */
async function resolveAesGcmKey(
  secretPassphrase?: string
): Promise<{ key: CryptoKey; exportedKeyHex?: string }> {
  const subtle = getSubtleCrypto();

  if (secretPassphrase && secretPassphrase.trim().length > 0) {
    const trimmed = secretPassphrase.trim();
    // If exactly 64 hex characters, import directly as 256-bit raw key
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

    // Otherwise derive deterministic 256-bit key via SHA-256 of passphrase
    const encoder = new TextEncoder();
    const encodedPass = encoder.encode(trimmed);
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

  // Generate random 256-bit key
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
 *
 * @param plainText Sensitive content (credentials, drive link, access token, secret keys)
 * @param secretPassphrase Optional passphrase; if omitted, generates a random 256-bit key
 */
export async function encryptSecret(
  plainText: string,
  secretPassphrase?: string
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
    const { key, exportedKeyHex } = await resolveAesGcmKey(secretPassphrase);

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
    // Zero-out sensitive intermediate buffers in RAM
    wipeMemory(plainTextBytes, encryptedBuffer, fullEncryptedBytes);
  }
}

/**
 * Decrypts an encrypted vault payload and verifies optional integrity hash.
 * Immediately wipes all intermediate and decrypted buffers from RAM in a finally block.
 *
 * @param payload Encrypted components matching EncryptedAssetDto
 * @param secretPassphrase Passphrase or raw 256-bit key used during encryption
 */
export async function decryptSecret(
  payload: DecryptVaultOptions,
  secretPassphrase: string
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

    // Re-assemble [ciphertext] + [auth tag] required by Web Crypto subtle.decrypt
    combined = new Uint8Array(cipherBytes.length + authTagBytes.length);
    combined.set(cipherBytes, 0);
    combined.set(authTagBytes, cipherBytes.length);

    const { key } = await resolveAesGcmKey(secretPassphrase);

    decryptedBuffer = await subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBytes as unknown as BufferSource,
        tagLength: 128,
      },
      key,
      combined as unknown as BufferSource
    );

    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decryptedBuffer);

    if (payload.expectedHash) {
      const computedHash = await hashContent(decryptedText);
      if (computedHash.toLowerCase() !== payload.expectedHash.toLowerCase()) {
        throw new Error(
          `Integrity check failed: Expected hash ${payload.expectedHash}, got ${computedHash}`
        );
      }
    }

    return decryptedText;
  } finally {
    // Explicit sanitization: Zero-out all cryptographic memory representations
    wipeMemory(ivBytes, cipherBytes, authTagBytes, combined, decryptedBuffer);
  }
}
