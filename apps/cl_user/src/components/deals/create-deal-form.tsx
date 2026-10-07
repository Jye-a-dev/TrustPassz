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
      <div className="space-y-4 rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="deal-title" className="text-sm font-semibold text-slate-200">
            Tiêu đề giao dịch <span className="text-cyan-400">*</span>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMagicFill}
            disabled={isAiLoading || isSubmitting}
            className="h-8 px-2.5 text-xs font-medium border-cyan-500/50 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-900/40 hover:text-cyan-200 transition-all flex items-center gap-1.5 shadow-sm shadow-cyan-950 cursor-pointer"
          >
            {isAiLoading ? (
              <Loader2 className="size-3.5 animate-spin text-cyan-400" />
            ) : (
              <Sparkles className="size-3.5 text-cyan-400" />
            )}
            AI Gợi Ý Giá &amp; Thời Gian Tự Động
          </Button>
        </div>

        <Input
          id="deal-title"
          placeholder={
            assetType === "PHYSICAL_ITEM"
              ? "Ví dụ: Áo khoác dọn tủ, Bàn phím cơ Keychron, Tai nghe không dây..."
              : assetType === "DOCUMENT"
              ? "Ví dụ: Tài liệu học tập PDF, Ebook tài chính, File mẫu thiết kế..."
              : "Ví dụ: Mã nguồn ứng dụng, Bản quyền phần mềm, Tài khoản..."
          }
          value={title}
          disabled={isSubmitting}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 min-h-11"
          required
        />

        <div className="space-y-1.5">
          <label htmlFor="deal-desc" className="text-xs font-medium text-slate-300">
            Mô tả chi tiết và phạm vi bàn giao
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
            className="w-full rounded-md border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-y"
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
      <Button
        type="submit"
        disabled={isSubmitting || isRedirecting}
        aria-busy={isSubmitting || isRedirecting}
        className={`w-full min-h-12 text-base font-bold bg-linear-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-cyan-950/50 transition-all ${
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
            Đang khóa an toàn &amp; Tạo Giao Dịch...
          </>
        ) : (
          <>
            <ShieldCheck className="size-5 mr-2" />
            Xác Nhận &amp; Tạo Giao Dịch Mới
          </>
        )}
      </Button>
    </form>
  );
}
