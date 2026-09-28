"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
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

  // Core Deal form states
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [assetType, setAssetType] = React.useState<AssetCategory>("SOURCE_CODE");
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
  const [vaultAudit, setVaultAudit] = React.useState<VaultAuditData | null>(null);

  // Trigger AI Suggestion via Magic Fill
  const handleMagicFill = async () => {
    if (!title.trim() || title.trim().length < 3) {
      toast.error("Vui lòng nhập tiêu đề ít nhất 3 ký tự để AI gợi ý.");
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
    toast.success("Đã bổ sung điều khoản vào mô tả hợp đồng!");
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề giao dịch.");
      return;
    }
    if (typeof amount !== "number" || amount <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ (> 0 VNĐ).");
      return;
    }
    if (!rawSecret.trim()) {
      toast.error("Vui lòng nhập nội dung nhạy cảm của tài sản số vào Vault.");
      return;
    }

    setIsSubmitting(true);

    try {
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
        });

      setVaultAudit(audit);

      const result = await CreateDealService.submitDeal(dealDto);
      toast.success("Tạo giao dịch ký quỹ số thành công! Tài sản đã được mã hóa an toàn.");
      router.push(`/deals/${result.id || "new-deal"}`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(`Lỗi tạo giao dịch: ${err.message}`);
      } else {
        toast.error("Đã xảy ra lỗi khi tạo giao dịch hoặc mã hóa dữ liệu.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Asset Classification Selection */}
      <AssetTypeSelector
        value={assetType}
        onChange={setAssetType}
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
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            )}
            AI Gợi ý điều khoản
          </Button>
        </div>

        <Input
          id="deal-title"
          placeholder="Ví dụ: Bàn giao Fullstack Escrow Marketplace + Smart Contract"
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
            placeholder="Liệt kê chi tiết tính năng, checklist kiểm thử, hướng dẫn chạy thử..."
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
        disabled={isSubmitting}
      />

      {/* 4. Digital Vault: Zero-Knowledge AES-256-GCM Section */}
      <DigitalVaultSection
        rawSecret={rawSecret}
        onRawSecretChange={setRawSecret}
        passphrase={passphrase}
        onPassphraseChange={setPassphrase}
        vaultAudit={vaultAudit}
        disabled={isSubmitting}
      />

      {/* 5. Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-12 text-base font-bold bg-linear-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Đang mã hóa Vault & Tạo Giao Dịch...
          </>
        ) : (
          <>
            <ShieldCheck className="w-5 h-5 mr-2" />
            Khởi Tạo Giao Dịch Ký Quỹ Số
          </>
        )}
      </Button>
    </form>
  );
}
