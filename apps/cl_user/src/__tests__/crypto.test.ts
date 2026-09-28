import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  encryptSecret,
  decryptSecret,
  hashContent,
  bufferToHex,
  hexToBuffer,
  bufferToBase64,
  base64ToBuffer,
} from "../lib/crypto.ts";

describe("Web Crypto API AES-256-GCM Digital Vault Unit Tests", () => {
  const samplePlaintext = "https://drive.google.com/drive/folders/trustpassz-secret-source-code-v1";
  const samplePassphrase = "trustpassz-vault-super-secret-key-2026";

  it("should compute valid 64-character SHA-256 content hash", async () => {
    const hash = await hashContent(samplePlaintext);
    assert.equal(typeof hash, "string");
    assert.equal(hash.length, 64, "SHA-256 hash must be exactly 64 hex characters");
    assert.match(hash, /^[0-9a-f]{64}$/, "SHA-256 hash must be valid hexadecimal");

    // Deterministic check
    const secondHash = await hashContent(samplePlaintext);
    assert.equal(hash, secondHash, "SHA-256 must be deterministic");
  });

  it("should encrypt plaintext into payload with 4 mandatory fields matching backend DTO", async () => {
    const payload = await encryptSecret(samplePlaintext, samplePassphrase);

    // Verify presence of all 4 required fields
    assert.ok(payload.encryptedContent, "encryptedContent must be defined");
    assert.ok(payload.encryptionIv, "encryptionIv must be defined");
    assert.ok(payload.authTag, "authTag must be defined");
    assert.ok(payload.contentHash, "contentHash must be defined");

    // 12 bytes IV = 24 hex characters
    assert.equal(
      payload.encryptionIv.length,
      24,
      "IV must be 12 bytes (24 hexadecimal characters)"
    );

    // 16 bytes Auth Tag = 32 hex characters
    assert.equal(
      payload.authTag.length,
      32,
      "Auth Tag must be 16 bytes (32 hexadecimal characters)"
    );

    // Plaintext integrity hash matches
    const expectedHash = await hashContent(samplePlaintext);
    assert.equal(
      payload.contentHash,
      expectedHash,
      "contentHash must match SHA-256 of plaintext"
    );

    // Plaintext is NEVER leaked in ciphertext or payload
    assert.equal(
      payload.encryptedContent.includes(samplePlaintext),
      false,
      "Ciphertext must not contain plaintext"
    );
  });

  it("should successfully decrypt ciphertext back to original plaintext (Round-trip)", async () => {
    const payload = await encryptSecret(samplePlaintext, samplePassphrase);

    const decrypted = await decryptSecret(
      {
        encryptedContent: payload.encryptedContent,
        encryptionIv: payload.encryptionIv,
        authTag: payload.authTag,
        expectedHash: payload.contentHash,
      },
      samplePassphrase
    );

    assert.equal(decrypted, samplePlaintext, "Decrypted text must match original plaintext");
  });

  it("should fail decryption when given wrong passphrase", async () => {
    const payload = await encryptSecret(samplePlaintext, samplePassphrase);

    await assert.rejects(
      async () => {
        await decryptSecret(
          {
            encryptedContent: payload.encryptedContent,
            encryptionIv: payload.encryptionIv,
            authTag: payload.authTag,
          },
          "wrong-passphrase-attempt"
        );
      },
      (err: Error) => {
        return err !== null;
      },
      "Decryption with wrong passphrase must be rejected by AES-GCM auth tag verification"
    );
  });

  it("should support auto-generated 256-bit key when no passphrase is provided", async () => {
    const payload = await encryptSecret(samplePlaintext);

    assert.ok(payload.exportedKeyHex, "Auto-generated key must be exported in hex");
    const exportedKeyHex = payload.exportedKeyHex!;
    assert.equal(
      exportedKeyHex.length,
      64,
      "Auto-generated key must be 32 bytes (64 hex characters)"
    );

    const decrypted = await decryptSecret(
      {
        encryptedContent: payload.encryptedContent,
        encryptionIv: payload.encryptionIv,
        authTag: payload.authTag,
        expectedHash: payload.contentHash,
      },
      exportedKeyHex
    );

    assert.equal(decrypted, samplePlaintext, "Decrypted text with exported key must match plaintext");
  });

  it("should accurately serialize and deserialize buffers between Hex and Base64", () => {
    const testBytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x01, 0x02, 0x03, 0xff]);
    const hex = bufferToHex(testBytes);
    assert.equal(hex, "deadbeef010203ff");

    const fromHex = hexToBuffer(hex);
    assert.deepEqual(Array.from(fromHex), Array.from(testBytes));

    const base64 = bufferToBase64(testBytes);
    const fromBase64 = base64ToBuffer(base64);
    assert.deepEqual(Array.from(fromBase64), Array.from(testBytes));
  });
});
