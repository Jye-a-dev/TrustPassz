/**
 * Types and validation constraints for Dispute Evidence Multi-Upload.
 * TrustPassz Escrow Platform - TASK-b-15
 */

export type EvidenceMediaType = "image" | "video";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

export interface EvidenceFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  type: EvidenceMediaType;
  previewUrl: string;
  thumbnailUrl?: string;
  progress: number;
  status: UploadStatus;
  storagePath?: string;
  publicUrl?: string;
  error?: string;
  duration?: number;
}

export interface UploadProgress {
  fileId: string;
  progress: number;
  loaded: number;
  total: number;
  status: UploadStatus;
}

export interface SignedUrlRequest {
  dealId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export interface SignedUrlResponse {
  signedUrl: string;
  storagePath: string;
  publicUrl: string;
  token?: string;
}

export const EVIDENCE_LIMITS = {
  MAX_FILES: 5,
  MAX_IMAGE_SIZE_BYTES: 15 * 1024 * 1024, // 15MB
  MAX_VIDEO_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
} as const;

export const ALLOWED_IMAGE_MIMES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ALLOWED_VIDEO_MIMES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const ACCEPTED_FILE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".mp4",
  ".mov",
  ".webm",
] as const;

export interface ValidationResult {
  valid: boolean;
  type?: EvidenceMediaType;
  error?: string;
}

/**
 * Validates a candidate evidence file using mime type, size quota, and magic bytes.
 */
export async function validateEvidenceFile(file: File): Promise<ValidationResult> {
  const extension = "." + (file.name.split(".").pop() || "").toLowerCase();
  const isImageMime = (ALLOWED_IMAGE_MIMES as readonly string[]).includes(file.type);
  const isVideoMime = (ALLOWED_VIDEO_MIMES as readonly string[]).includes(file.type);
  const isAllowedExt = (ACCEPTED_FILE_EXTENSIONS as readonly string[]).includes(extension);

  if (!isImageMime && !isVideoMime && !isAllowedExt) {
    return {
      valid: false,
      error: `Định dạng "${file.name}" không hợp lệ. Chỉ chấp nhận PNG, JPG, WebP, MP4, MOV.`,
    };
  }

  const determinedType: EvidenceMediaType =
    isVideoMime || [".mp4", ".mov", ".webm"].includes(extension) ? "video" : "image";

  if (determinedType === "image" && file.size > EVIDENCE_LIMITS.MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Ảnh "${file.name}" dung lượng ${sizeMb}MB vượt quá giới hạn 15MB.`,
    };
  }

  if (determinedType === "video" && file.size > EVIDENCE_LIMITS.MAX_VIDEO_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Video "${file.name}" dung lượng ${sizeMb}MB vượt quá giới hạn 50MB.`,
    };
  }

  try {
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes.length < 4) {
      return { valid: false, error: `Tệp "${file.name}" bị hỏng hoặc rỗng.` };
    }

    if (determinedType === "image") {
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
      const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const isWebp =
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes.length >= 12 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50;

      if (!isPng && !isJpg && !isWebp) {
        return {
          valid: false,
          error: `Tệp "${file.name}" không khớp chữ ký nhị phân ảnh hợp lệ.`,
        };
      }
    } else {
      let isIsoBmff = false;
      if (bytes.length >= 8) {
        const brand = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
        if (["ftyp", "moov", "mdat", "wide"].includes(brand)) {
          isIsoBmff = true;
        }
      }
      const isEbml = bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;

      if (!isIsoBmff && !isEbml && !isAllowedExt) {
        return {
          valid: false,
          error: `Tệp "${file.name}" không khớp định dạng video được hỗ trợ.`,
        };
      }
    }
  } catch {
    return { valid: false, error: `Không thể kiểm tra cấu trúc nhị phân tệp "${file.name}".` };
  }

  return { valid: true, type: determinedType };
}

