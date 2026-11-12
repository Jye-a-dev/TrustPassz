"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  type AssetCategory,
  type DealRuleSuggestion,
  type VaultAuditData,
  ASSET_TYPE_OPTIONS,
  INSPECTION_HOURS_MAP,
} from "./create-deal.types";
import { CreateDealService } from "./services/create-deal.service";
import { AssetTypeSelector } from "./asset-type-selector";
import { AiSuggestionPanel } from "./ai-suggestion-panel";
import { EscrowTermsSection } from "./escrow-terms-section";
import { DigitalVaultSection } from "./digital-vault-section";
import { DealImageGalleryUploader } from "./deal-image-gallery-uploader";

// Re-export types for backward compatibility across cl_user
export type { AssetCategory, DealRuleSuggestion, VaultAuditData };
export { ASSET_TYPE_OPTIONS, INSPECTION_HOURS_MAP };

export function CreateDealForm() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Core Deal form states
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [assetType, setAssetType] = React.useState<AssetCategory>("DOCUMENT");
  const [amount, setAmount] = React.useState<number | "">("");
  const [inspectionDuration, setInspectionDuration] = React.useState<number>(86400);
  const [rawSecret, setRawSecret] = React.useState("");
  const [passphrase, setPassphrase] = React.useState("");
  const [buyerId, setBuyerId] = React.useState("");
  const [mediaGallery, setMediaGallery] = React.useState<string[]>([]);
  const [coverIndex, setCoverIndex] = React.useState<number>(0);

  // AI Magic Fill states
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [aiSuggestion, setAiSuggestion] = React.useState<DealRuleSuggestion | null>(null);
  const [selectedRules, setSelectedRules] = React.useState<string[]>([]);

  // Submission & Encryption states
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isSubmittingRef = React.useRef(false);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const isRedirectingRef = React.useRef(false);
  const [formIdempotencyKey] = React.useState<string>(() => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  });
  const formIdempotencyKeyRef = React.useRef(formIdempotencyKey);
  const [vaultAudit, setVaultAudit] = React.useState<VaultAuditData | null>(null);

  // Dynamic UX adjustments when asset type switches
  const handleAssetTypeChange = (newType: AssetCategory) => {
    setAssetType(newType);

    // Auto-suggest appropriate inspection window for physical shipping & unboxing
    if (newType === "PHYSICAL_ITEM" && inspectionDuration < 86400) {
      setInspectionDuration(86400); // 24h
      toast.info("Đã điều chỉnh thời gian kiểm tra hàng sang 24 Giờ phù hợp với vận chuyển hàng thực tế.");
    }
  };

  // Trigger AI Suggestion via Magic Fill
  const handleMagicFill = async () => {
    if (!title.trim() || title.trim().length < 3) {
      toast.error("Vui lòng nhập tên sản phẩm/giao dịch ít nhất 3 ký tự để AI gợi ý.");
      return;
    }

    setIsAiLoading(true);
    setAiSuggestion(null);

    try {
      const response = await CreateDealService.requestAiSuggestion({
        title,
        description,
        assetType,
        amount: typeof amount === "number" ? amount : undefined,
      });

      setAiSuggestion(response);

      if (response.suggested_min_price) {
        setAmount(response.suggested_min_price);
      }
      if (
        response.suggested_inspection_hours &&
        INSPECTION_HOURS_MAP[response.suggested_inspection_hours]
      ) {
        setInspectionDuration(
          INSPECTION_HOURS_MAP[response.suggested_inspection_hours],
        );
      }
      if (
        response.category &&
        ASSET_TYPE_OPTIONS.some((o) => o.value === response.category)
      ) {
        setAssetType(response.category);
      }
      if (response.recommended_rules?.length) {
        setSelectedRules([...response.recommended_rules]);
      }

      toast.success("AI đã tối ưu hóa điều khoản và khoảng giá gợi ý!");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Rule selection helpers
  const toggleRule = (rule: string) => {
    setSelectedRules((prev) =>
      prev.includes(rule) ? prev.filter((r) => r !== rule) : [...prev, rule],
    );
  };

  const applySelectedRulesToDescription = () => {
    if (selectedRules.length === 0) return;
    const ruleBlock = CreateDealService.formatRuleBlock(selectedRules);
    setDescription((prev) => prev.trim() + ruleBlock);
    toast.success("Đã bổ sung điều khoản vào mô tả giao dịch!");
  };

  // Form submission handler with synchronous re-entrancy guard & idempotency
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Immediate synchronous lock preventing multi-click race conditions and post-success re-entry
    if (isSubmittingRef.current || isSubmitting || isRedirectingRef.current || isRedirecting) {
      return;
    }

    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề giao dịch.");
      return;
    }
    if (typeof amount !== "number" || amount <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ (> 0 VNĐ).");
      return;
    }
    if (!rawSecret.trim()) {
      if (assetType === "PHYSICAL_ITEM") {
        toast.error("Vui lòng nhập mô tả ngoại quan hoặc số Serial/IMEI vào Kho lưu trữ bảo mật.");
      } else {
        toast.error("Vui lòng nhập thông tin bàn giao bí mật vào Kho lưu trữ bảo mật.");
      }
      return;
    }

    if (buyerId.trim()) {
      const trimmedBuyerId = buyerId.trim();
      if (
        (user?.id && trimmedBuyerId === user.id) ||
        (user?.email && trimmedBuyerId.toLowerCase() === user.email.toLowerCase())
      ) {
        toast.error("Bạn không thể tự mua sản phẩm của chính mình. Vui lòng nhập ID người mua khác hoặc để trống.");
        return;
      }
    }

    // Synchronously lock state before microtask yield during crypto & network operations
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const idempotencyKey = formIdempotencyKeyRef.current;

      const { dealDto, vaultAudit: audit } =
        await CreateDealService.encryptAndPreparePayload({
          title,
          description,
          amount,
          rawSecret,
          passphrase,
          assetType,
          inspectionDuration,
          buyerId,
          sellerId: user?.id,
          idempotencyKey,
          mediaGallery,
        });

      setVaultAudit(audit);

      const result = await CreateDealService.submitDeal(dealDto, idempotencyKey);
      
      // Permanently lock form during navigation redirect to prevent re-activation
      isRedirectingRef.current = true;
      setIsRedirecting(true);

      toast.success(
        assetType === "PHYSICAL_ITEM"
          ? "Tạo giao dịch thành công! Tình trạng hàng đã được lưu trữ bảo mật."
          : "Tạo giao dịch thành công! Thông tin bàn giao đã được khóa an toàn.",
      );
      router.push(`/deals/${result.id || "new-deal"}`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`Lỗi tạo giao dịch: ${err.message}`);
      } else {
        toast.error("Đã xảy ra lỗi khi tạo giao dịch hoặc mã hóa dữ liệu.");
      }
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    } finally {
      // Only unlock if navigation redirect is NOT active
      if (!isRedirectingRef.current) {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Asset Classification Selection (6 Modern Cards) */}
      <AssetTypeSelector
        value={assetType}
        onChange={handleAssetTypeChange}
        disabled={isSubmitting}
      />

      {/* 2. Title & Description with Magic Fill Trigger */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="deal-title" className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              2. TÊN SẢN PHẨM / TIÊU ĐỀ GIAO DỊCH <span className="text-rose-600">*</span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMagicFill}
              disabled={isAiLoading || isSubmitting}
              className="h-8 px-3 text-xs font-bold border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all flex items-center gap-1.5 shadow-2xs rounded-lg cursor-pointer"
            >
              {isAiLoading ? (
                <Loader2 className="size-3.5 animate-spin text-rose-500" />
              ) : (
                <Sparkles className="size-3.5 text-rose-500" />
              )}
              AI Gợi Ý Tiêu Đề &amp; Thời Gian
            </Button>
          </div>

          <Input
            id="deal-title"
            placeholder={
              assetType === "PHYSICAL_ITEM"
                ? "Ví dụ: Áo khoác dọn tủ, Bàn phím cơ Keychron, Tai nghe không dây..."
                : assetType === "DOCUMENT"
                ? "Ví dụ: Tài liệu học tập PDF, Ebook tài chính, File mẫu thiết kế..."
                : "Ví dụ: Fullstack Next.js SaaS Boilerplate (Supabase, Clean Arch)..."
            }
            value={title}
            disabled={isSubmitting}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 min-h-[44px] shadow-2xs"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="deal-desc" className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
            MÔ TẢ CHI TIẾT &amp; CAM KẾT BẢO HÀNH
          </label>
          <textarea
            id="deal-desc"
            rows={4}
            disabled={isSubmitting}
            placeholder={
              assetType === "PHYSICAL_ITEM"
                ? "Mô tả nguồn gốc mua, thời hạn bảo hành còn lại, phụ kiện đi kèm, đơn vị vận chuyển dự kiến..."
                : "Liệt kê chi tiết tính năng, checklist kiểm thử, hướng dẫn chạy thử..."
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-500 resize-y shadow-2xs leading-relaxed"
          />
        </div>

        {/* AI Suggestion Panel */}
        {aiSuggestion && (
          <AiSuggestionPanel
            suggestion={aiSuggestion}
            selectedRules={selectedRules}
            onToggleRule={toggleRule}
            onApplyRules={applySelectedRulesToDescription}
          />
        )}

        {/* Media Gallery Uploader */}
        <DealImageGalleryUploader
          mediaGallery={mediaGallery}
          coverIndex={coverIndex}
          onChange={(images, cover) => {
            setMediaGallery(images);
            setCoverIndex(cover);
          }}
          disabled={isSubmitting || isRedirecting}
        />
      </div>

      {/* 3. Escrow Terms: Amount, Duration & Buyer */}
      <EscrowTermsSection
        amount={amount}
        onAmountChange={setAmount}
        inspectionDuration={inspectionDuration}
        onInspectionDurationChange={setInspectionDuration}
        buyerId={buyerId}
        onBuyerIdChange={setBuyerId}
        isPhysical={assetType === "PHYSICAL_ITEM"}
        disabled={isSubmitting || isRedirecting}
      />

      {/* 4. Digital Vault: Zero-Knowledge AES-256-GCM Section */}
      <DigitalVaultSection
        assetType={assetType}
        rawSecret={rawSecret}
        onRawSecretChange={setRawSecret}
        passphrase={passphrase}
        onPassphraseChange={setPassphrase}
        vaultAudit={vaultAudit}
        disabled={isSubmitting || isRedirecting}
      />

      {/* 5. Submit Button with anti-double-click & redirect protection */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || isRedirecting}
          aria-busy={isSubmitting || isRedirecting}
          className={`w-full min-h-[50px] text-sm sm:text-base font-black bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-sm border border-rose-600 transition-all flex items-center justify-center gap-2 active:translate-y-0.5 ${
            isSubmitting || isRedirecting
              ? "cursor-not-allowed opacity-70 pointer-events-none"
              : "cursor-pointer"
          }`}
        >
          {isRedirecting ? (
            <>
              <Loader2 className="size-5 animate-spin mr-2" />
              Đang chuyển hướng tới giao dịch...
            </>
          ) : isSubmitting ? (
            <>
              <Loader2 className="size-5 animate-spin mr-2" />
              Đang mã hóa &amp; Lưu két bảo mật...
            </>
          ) : (
            <>
              <ShieldCheck className="size-5 mr-1" />
              Khóa Vào Két &amp; Khởi Tạo Giao Dịch An Toàn
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
