export interface SampleDigitalAssetData {
  title: string;
  description: string;
  plainSecret: string;
  fileName: string;
  fileSizeBytes: number;
  amountVnd: number;
  inspectionDurationSec: number;
}

export const SAMPLE_SOURCE_CODE_ASSET: SampleDigitalAssetData = {
  title: 'Fullstack Escrow Marketplace Source Code (Production)',
  description:
    'Exclusive repository access, deployment guides, and master license key for TrustPassz v2.0.',
  plainSecret: JSON.stringify({
    gitRepo: 'https://github.com/trustpassz-org/private-core-escrow.git',
    deployKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGe59... trustpassz-deploy',
    masterLicense: 'TPZ-2026-X99-PRO-UNLIMITED',
    envSecrets: {
      DATABASE_URL: 'postgresql://dbadmin:p@ssw0rd@db.trustpassz.internal:5432/escrow',
      SIGNING_SALT: 'e89c104d4850fa1b7f94c0385cb6',
    },
  }),
  fileName: 'trustpassz-core-v2.0.0.zip',
  fileSizeBytes: 15420310,
  amountVnd: 2500000,
  inspectionDurationSec: 43200, // 12 hours
};

/**
 * 1x1 Transparent PNG header expanded or standard 512x512 JPEG mock keyframe buffers
 * with file sizes strictly under 200KB (< 204,800 bytes).
 */
export interface MockKeyframeEvidence {
  index: number;
  percentage: number;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  base64Data: string;
  buffer: Buffer;
}

// Minimal valid PNG data URI representing a 512x512 canvas frame
const MINIMAL_PNG_512X512_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAAAAAD6WOGKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAlQTFRF////AAD/AAAAWw1q9gAAAEBJREFUeNrtwTEBAAAAwqD1T20ND6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBgIAAGf1N7mAAAAAElFTkSuQmCC';

export function createMockKeyframes(): MockKeyframeEvidence[] {
  const checkpoints = [
    { index: 1, percentage: 20, name: 'keyframe_01_unbox_seal.png' },
    { index: 2, percentage: 50, name: 'keyframe_02_defect_display.png' },
    { index: 3, percentage: 80, name: 'keyframe_03_error_logs.png' },
  ];

  return checkpoints.map((cp) => {
    const buffer = Buffer.from(MINIMAL_PNG_512X512_BASE64, 'base64');
    return {
      index: cp.index,
      percentage: cp.percentage,
      fileName: cp.name,
      mimeType: 'image/png',
      fileSizeBytes: buffer.length,
      base64Data: MINIMAL_PNG_512X512_BASE64,
      buffer,
    };
  });
}

export const SAMPLE_DISPUTE_CLAIM = {
  reason:
    'Sản phẩm mã nguồn bị thiếu module thanh toán và mã bản quyền báo lỗi không hợp lệ (TPZ-2026-X99-PRO-UNLIMITED hết hạn). Yêu cầu hoàn lại 100% tiền ký quỹ vào ví.',
  logText:
    '[ERROR] 2026-10-03 01:15:22 - AuthEnclave: Invalid license checksum: TPZ-2026-X99-PRO-UNLIMITED expired on 2025-12-31.\n[FATAL] Missing required dependency packages/core-contracts.',
  evidenceUrls: [
    'https://eixscrzogbnjrwfbcqst.supabase.co/storage/v1/object/public/dispute-evidences/keyframe_01_unbox_seal.png',
    'https://eixscrzogbnjrwfbcqst.supabase.co/storage/v1/object/public/dispute-evidences/keyframe_02_defect_display.png',
    'https://eixscrzogbnjrwfbcqst.supabase.co/storage/v1/object/public/dispute-evidences/keyframe_03_error_logs.png',
  ],
};
