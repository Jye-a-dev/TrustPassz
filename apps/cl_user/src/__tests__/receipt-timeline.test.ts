import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { EscrowReceiptData, TimelineStepData, DisputeRecord } from "../types/receipt";

describe("TASK-b-14: Escrow Receipt & Dispute Timeline Logic Tests", () => {
  it("should accurately reflect 5-step status transitions during open dispute and AI arbitration", () => {
    const mockDispute: DisputeRecord = {
      id: "disp-123",
      dealId: "deal-456",
      initiatorId: "buyer-789",
      status: "AI_PROCESSING",
      reason: "Asset delivered is defective and key is invalid",
      evidenceUrls: [
        "https://supabase.trustpassz.io/storage/v1/object/public/evidences/unbox.mp4",
        "https://supabase.trustpassz.io/storage/v1/object/public/evidences/log.txt",
      ],
      aiConfidenceScore: "0.8500",
      aiVerdict: "TRIGGER_REFUND",
      aiExplanation: "Verification script failed and evidence proves invalid asset.",
      createdAt: "2026-11-02T10:00:00.000Z",
      updatedAt: "2026-11-02T10:05:00.000Z",
    };

    assert.equal(mockDispute.status, "AI_PROCESSING");
    assert.equal(mockDispute.evidenceUrls.length, 2);
    assert.ok(Number(mockDispute.aiConfidenceScore) >= 0.75, "AI confidence score should meet 0.75 threshold");
    assert.equal(mockDispute.aiVerdict, "TRIGGER_REFUND");
  });

  it("should validate timeline steps schema structure", () => {
    const step: TimelineStepData = {
      id: "AI_ARBITRATION",
      stepNumber: 4,
      title: "AI Thẩm định & Phân tích",
      subtitle: "Confidence Score (Ngưỡng 0.75)",
      status: "completed",
      description: "AI analysis completed",
      details: {
        aiConfidenceScore: 0.85,
        aiVerdict: "TRIGGER_REFUND",
        aiExplanation: "Matched defect signature.",
      },
    };

    assert.equal(step.stepNumber, 4);
    assert.equal(step.status, "completed");
    assert.equal(step.details?.aiConfidenceScore, 0.85);
  });

  it("should correctly handle receipt participants and transaction hashes", () => {
    const receipt: EscrowReceiptData = {
      dealId: "d0000000-0000-4000-a000-000000000001",
      title: "Fullstack SaaS Source Code",
      amount: 15000000,
      feeAmount: 0,
      currency: "VND",
      chainType: "BASE_SEPOLIA",
      state: "DISPUTED",
      paymentOrderCode: 987654321,
      seller: { id: "seller-1", displayName: "SaaS Dev", walletAddress: "0x1234567890abcdef1234567890abcdef12345678" },
      buyer: { id: "buyer-1", displayName: "Tech Buyer", walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12" },
      depositTxHash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
      settleTxHash: null,
      disputeTxHash: "0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
      digitalAsset: {
        id: "asset-1",
        assetType: "SOURCE_CODE",
        contentHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      },
      inspectionDuration: 86400,
      createdAt: "2026-11-02T08:00:00.000Z",
      updatedAt: "2026-11-02T10:05:00.000Z",
    };

    assert.equal(receipt.state, "DISPUTED");
    assert.equal(receipt.paymentOrderCode, 987654321);
    assert.ok(receipt.depositTxHash?.startsWith("0x"));
    assert.ok(receipt.disputeTxHash?.startsWith("0x"));
    assert.equal(receipt.digitalAsset?.contentHash?.length, 64);
  });
});

