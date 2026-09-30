import { encryptSecret } from "@/lib/crypto";
import { apiClient } from "@/lib/api-client";
import {
  type AssetCategory,
  type BackendAssetType,
  type DealRuleSuggestion,
  type VaultAuditData,
  mapAssetCategoryToBackend,
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
      assetType: BackendAssetType;
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
    const backendCategory = mapAssetCategoryToBackend(params.assetType);

    try {
      return await apiClient<DealRuleSuggestion>("/api/v1/suggest-deal", {
        method: "POST",
        body: JSON.stringify({
          title: params.title.trim(),
          description: params.description.trim() || params.title.trim(),
          asset_type: backendCategory,
          initial_price: params.amount,
        }),
        timeoutMs: 12000,
      });
    } catch {
      // Tailored fallback recommendations by asset category
      let recommendedRules: string[];
      let suggestedHours: 6 | 12 | 24 | 48 = 24;

      if (params.assetType === "PHYSICAL_ITEM") {
        suggestedHours = 48;
        recommendedRules = [
          "Bên mua và bên bán cam kết đồng kiểm ngoại quan cùng nhân viên bưu tá khi nhận kiện hàng.",
          "Số IMEI/Serial và tình trạng ngoại quan được đối chiếu trực tiếp với thông tin đã niêm phong trong Kho lưu trữ.",
          "Tiền được giữ an toàn 100% trong Két bảo vệ và chỉ chuyển cho người bán khi hết thời gian kiểm tra không có khiếu nại.",
        ];
      } else if (params.assetType === "DOCUMENT") {
        suggestedHours = 12;
        recommendedRules = [
          "Bên bán cam kết tài liệu/giáo trình chính chủ tự biên soạn hoặc tài nguyên bản quyền mở (Creative Commons).",
          "Bên mua nhận link tải tài liệu qua Kho lưu trữ bảo mật.",
          "Thời gian kiểm tra hàng đảm bảo đủ để bên mua xác nhận chất lượng của tài liệu.",
        ];
      } else {
        suggestedHours = 24;
        recommendedRules = [
          "Bên mua có toàn quyền kiểm tra sản phẩm số trong thời gian kiểm tra hàng.",
          "Bên bán cam kết tài sản số không chứa mã độc, backdoor hoặc vi phạm bản quyền bên thứ ba.",
          "Toàn bộ thông tin bàn giao được khóa bảo mật và tự động hoàn tất giao dịch khi hết thời gian kiểm tra.",
        ];
      }

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
        suggested_inspection_hours: suggestedHours,
        risk_level: params.assetType === "PHYSICAL_ITEM" ? "MEDIUM" : "LOW",
        recommended_rules: recommendedRules,
        reasoning: "Gợi ý mặc định theo tiêu chuẩn giao dịch an toàn của TrustPassz.",
      };
    }
  }

  /**
   * Executes client-side AES-256-GCM Zero-Knowledge encryption and compiles Deal DTO.
   * Maps UI extended categories to backend-compatible enum types to preserve zero-breaking changes.
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
        assetType: mapAssetCategoryToBackend(input.assetType),
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
