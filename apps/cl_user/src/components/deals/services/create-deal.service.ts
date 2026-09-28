import { encryptSecret } from "@/lib/crypto";
import { apiClient } from "@/lib/api-client";
import type {
  AssetCategory,
  DealRuleSuggestion,
  VaultAuditData,
} from "../create-deal.types";

export interface EncryptDealInput {
  title: string;
  description?: string;
  amount: number;
  rawSecret: string;
  passphrase?: string;
  assetType: AssetCategory;
  inspectionDuration: number;
  buyerId?: string;
}

export interface PreparedDealPayload {
  dealDto: {
    sellerId: string;
    buyerId?: string;
    title: string;
    description?: string;
    amount: number;
    currency: string;
    inspectionDuration: number;
    digitalAsset: {
      assetType: AssetCategory;
      encryptedContent: string;
      encryptionIv: string;
      authTag: string;
      contentHash: string;
      fileSizeBytes: number;
      maxAccessLimit: number;
    };
  };
  vaultAudit: VaultAuditData;
}

export class CreateDealService {
  private static readonly DEFAULT_SELLER_ID =
    "11111111-1111-4111-a111-111111111111";

  /**
   * Requests rule and price suggestions from the AI backend with graceful fallback.
   */
  public static async requestAiSuggestion(params: {
    title: string;
    description: string;
    assetType: AssetCategory;
    amount?: number;
  }): Promise<DealRuleSuggestion> {
    try {
      return await apiClient<DealRuleSuggestion>("/api/v1/suggest-deal", {
        method: "POST",
        body: JSON.stringify({
          title: params.title.trim(),
          description: params.description.trim() || params.title.trim(),
          asset_type: params.assetType,
          initial_price: params.amount,
        }),
        timeoutMs: 12000,
      });
    } catch {
      // Graceful fallback heuristics when AI backend is unavailable or rate-limited
      return {
        category: params.assetType,
        suggested_min_price:
          typeof params.amount === "number" && params.amount > 0
            ? params.amount * 0.85
            : 500000,
        suggested_max_price:
          typeof params.amount === "number" && params.amount > 0
            ? params.amount * 1.15
            : 1500000,
        suggested_inspection_hours: 24,
        risk_level: "LOW",
        recommended_rules: [
          "Bên mua có toàn quyền kiểm thử tính toàn vẹn của mã nguồn trong thời gian kiểm định.",
          "Bên bán cam kết tài sản số không chứa mã độc, backdoor hoặc vi phạm bản quyền bên thứ ba.",
          "Toàn bộ tài sản được mã hóa AES-256-GCM và tự động giải phóng ký quỹ khi hết hạn không tranh chấp.",
        ],
        reasoning: "Gợi ý mặc định theo tiêu chuẩn ký quỹ an toàn TrustPassz.",
      };
    }
  }

  /**
   * Executes client-side AES-256-GCM Zero-Knowledge encryption and compiles Deal DTO.
   */
  public static async encryptAndPreparePayload(
    input: EncryptDealInput,
  ): Promise<PreparedDealPayload> {
    const vaultPayload = await encryptSecret(
      input.rawSecret.trim(),
      input.passphrase?.trim() || undefined,
    );

    const vaultAudit: VaultAuditData = {
      contentHash: vaultPayload.contentHash,
      authTag: vaultPayload.authTag,
      encryptionIv: vaultPayload.encryptionIv,
      generatedKey: vaultPayload.exportedKeyHex,
    };

    const dealDto = {
      sellerId: this.DEFAULT_SELLER_ID,
      buyerId: input.buyerId?.trim() || undefined,
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      amount: Number(input.amount),
      currency: "VND",
      inspectionDuration: Number(input.inspectionDuration),
      digitalAsset: {
        assetType: input.assetType,
        encryptedContent: vaultPayload.encryptedContent,
        encryptionIv: vaultPayload.encryptionIv,
        authTag: vaultPayload.authTag,
        contentHash: vaultPayload.contentHash,
        fileSizeBytes: new TextEncoder().encode(input.rawSecret).length,
        maxAccessLimit: 1,
      },
    };

    return { dealDto, vaultAudit };
  }

  /**
   * Posts prepared deal DTO to the backend API.
   */
  public static async submitDeal(
    dealDto: PreparedDealPayload["dealDto"],
  ): Promise<{ id: string; state: string }> {
    return apiClient<{ id: string; state: string }>("/api/v1/deals", {
      method: "POST",
      body: JSON.stringify(dealDto),
    });
  }

  /**
   * Formats rule recommendations into markdown description text.
   */
  public static formatRuleBlock(selectedRules: string[]): string {
    if (selectedRules.length === 0) return "";
    return `\n\n### Điều khoản cam kết giao dịch:\n${selectedRules
      .map((r, i) => `${i + 1}. ${r}`)
      .join("\n")}`;
  }
}
