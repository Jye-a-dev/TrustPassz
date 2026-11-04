import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EVIDENCE_LIMITS,
  validateEvidenceFile,
  EvidenceFileItem,
  SignedUrlResponse,
} from "../types/evidence-upload";

describe("TASK-b-15: Dispute Evidence Multi-Upload & Validation Logic Tests", () => {
  it("should enforce upload constraints: max 5 files, 15MB images, 50MB videos", () => {
    assert.equal(EVIDENCE_LIMITS.MAX_FILES, 5);
    assert.equal(EVIDENCE_LIMITS.MAX_IMAGE_SIZE_BYTES, 15 * 1024 * 1024);
    assert.equal(EVIDENCE_LIMITS.MAX_VIDEO_SIZE_BYTES, 50 * 1024 * 1024);
  });

  it("should accept valid PNG images with proper magic bytes", async () => {
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);
    const mockFile = new File([pngHeader], "evidence_defect.png", { type: "image/png" });

    const result = await validateEvidenceFile(mockFile);
    assert.equal(result.valid, true);
    assert.equal(result.type, "image");
  });

  it("should accept valid JPEG images with proper magic bytes", async () => {
    const jpgHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 0, 0, 0, 0, 0]);
    const mockFile = new File([jpgHeader], "receipt_scan.jpg", { type: "image/jpeg" });

    const result = await validateEvidenceFile(mockFile);
    assert.equal(result.valid, true);
    assert.equal(result.type, "image");
  });

  it("should accept valid MP4 videos with ISO-BMFF magic bytes", async () => {
    // 00 00 00 20 'f' 't' 'y' 'p' 'i' 's' 'o' 'm'
    const mp4Header = new Uint8Array([
      0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0,
    ]);
    const mockFile = new File([mp4Header], "unbox_seal.mp4", { type: "video/mp4" });

    const result = await validateEvidenceFile(mockFile);
    assert.equal(result.valid, true);
    assert.equal(result.type, "video");
  });

  it("should reject image exceeding 15MB quota", async () => {
    const largeSize = 16 * 1024 * 1024;
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    // Create sparse blob or dummy file
    const mockFile = {
      name: "massive_screenshot.png",
      size: largeSize,
      type: "image/png",
      slice: () => new Blob([pngHeader]),
    } as unknown as File;

    const result = await validateEvidenceFile(mockFile);
    assert.equal(result.valid, false);
    assert.match(result.error || "", /vượt quá giới hạn 15MB/);
  });

  it("should reject video exceeding 50MB quota", async () => {
    const largeSize = 52 * 1024 * 1024;
    const mp4Header = new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]);
    const mockFile = {
      name: "long_recording.mp4",
      size: largeSize,
      type: "video/mp4",
      slice: () => new Blob([mp4Header]),
    } as unknown as File;

    const result = await validateEvidenceFile(mockFile);
    assert.equal(result.valid, false);
    assert.match(result.error || "", /vượt quá giới hạn 50MB/);
  });

  it("should reject disallowed extensions (.exe, .zip, .bat)", async () => {
    const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // MZ executable
    const mockFile = new File([exeBytes], "malware.exe", { type: "application/x-msdownload" });

    const result = await validateEvidenceFile(mockFile);
    assert.equal(result.valid, false);
    assert.match(result.error || "", /không hợp lệ/);
  });

  it("should correctly structure EvidenceFileItem and SignedUrlResponse models", () => {
    const signedRes: SignedUrlResponse = {
      signedUrl: "https://eixscrzogbnjrwfbcqst.supabase.co/storage/v1/object/upload/sign/dispute-evidences/proof.png",
      storagePath: "evidence/deal-1/proof.png",
      publicUrl: "https://eixscrzogbnjrwfbcqst.supabase.co/storage/v1/object/public/dispute-evidences/evidence/deal-1/proof.png",
      token: "signed-jwt-token",
    };

    assert.ok(signedRes.signedUrl.includes("/upload/sign/"));
    assert.ok(signedRes.storagePath.startsWith("evidence/"));

    const item: EvidenceFileItem = {
      id: "item-1",
      file: new File([], "proof.png", { type: "image/png" }),
      name: "proof.png",
      size: 1024,
      mimeType: "image/png",
      type: "image",
      previewUrl: "blob:http://localhost:5000/mock-uuid",
      progress: 100,
      status: "success",
      storagePath: signedRes.storagePath,
      publicUrl: signedRes.publicUrl,
    };

    assert.equal(item.status, "success");
    assert.equal(item.progress, 100);
    assert.equal(item.publicUrl, signedRes.publicUrl);
  });
});

