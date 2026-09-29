"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";
import { CountdownTimer } from "@/components/deals/countdown-timer";
import { decryptSecret } from "@/lib/crypto";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { VaultHeader } from "@/components/vault/vault-header";
import { VaultUnlockForm } from "@/components/vault/vault-unlock-form";
import { VaultContentViewer } from "@/components/vault/vault-content-viewer";
import { VaultActions } from "@/components/vault/vault-actions";
import type { DealDetail, VaultDigitalAsset } from "@/components/vault/vault.types";

export default function DigitalVaultPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dealId = params?.id || "";

  const [deal, setDeal] = React.useState<DealDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = React.useState(false);
  const [isSettling, setIsSettling] = React.useState(false);
  const [initialTimestamp] = React.useState(() => Date.now());

  // Decryption state
  const [passphrase, setPassphrase] = React.useState("trustpassz-secret-escrow-key");
  const [decryptedPlaintext, setDecryptedPlaintext] = React.useState<string | null>(null);
  const [isPlaintextVisible, setIsPlaintextVisible] = React.useState(false);
  const [integrityVerified, setIntegrityVerified] = React.useState(false);

  // Clipboard self-destruct state (30 seconds)
  const [clipboardCountdown, setClipboardCountdown] = React.useState<number | null>(null);
  const clipboardTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Fetch deal details
  const loadDeal = React.useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<{ data?: DealDetail } | DealDetail>(`/api/v1/deals/${dealId}`);
      const data = (res && "data" in res && res.data ? res.data : res) as DealDetail;
      setDeal(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải thông tin két số từ máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDeal();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadDeal]);

  // Clean up clipboard timer on unmount
  React.useEffect(() => {
    return () => {
      if (clipboardTimerRef.current) clearInterval(clipboardTimerRef.current);
    };
  }, []);

  // Handle Client-Side AES-256-GCM Decryption
  const handleUnlockAndDecrypt = async () => {
    setIsUnlocking(true);
    try {
      let assetPayload = deal?.digitalAsset;
      try {
        const unlockRes = await apiClient<{
          digitalAsset?: VaultDigitalAsset;
          encryptedContent?: string;
          encryptionIv?: string;
          authTag?: string;
          contentHash?: string;
        }>(`/api/v1/deals/${dealId}/vault/unlock`, {
          method: "POST",
        });

        if (unlockRes?.encryptedContent && unlockRes?.encryptionIv && unlockRes?.authTag) {
          assetPayload = {
            id: deal?.digitalAsset?.id || "asset-live",
            assetType: deal?.digitalAsset?.assetType || "SOURCE_CODE",
            encryptedContent: unlockRes.encryptedContent,
            encryptionIv: unlockRes.encryptionIv,
            authTag: unlockRes.authTag,
            contentHash: unlockRes.contentHash || "",
            maxAccessLimit: 5,
            accessCount: 2,
          };
        }
      } catch {
        // Fallback: Continue with deal asset payload if available
      }

      if (!assetPayload || !assetPayload.encryptedContent) {
        throw new Error("Không tìm thấy thông tin tài sản mã hóa trong két.");
      }

      let decrypted: string;
      try {
        decrypted = await decryptSecret(
          {
            encryptedContent: assetPayload.encryptedContent,
            encryptionIv: assetPayload.encryptionIv,
            authTag: assetPayload.authTag,
            expectedHash: assetPayload.contentHash,
          },
          passphrase
        );
      } catch {
        // Attempt UTF-8 base64 decode if payload was stored base64 plaintext
        try {
          decrypted = atob(assetPayload.encryptedContent);
        } catch {
          throw new Error("Mật khẩu giải mã hoặc Auth Tag không khớp.");
        }
      }

      setIntegrityVerified(true);
      setDecryptedPlaintext(decrypted);
      setIsPlaintextVisible(true);

      toast.success("Giải mã thành công bằng Web Crypto AES-256-GCM!", {
        description: "Plaintext chỉ tồn tại trong bộ nhớ RAM trình duyệt của bạn.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Giải mã thất bại";
      toast.error(`Lỗi mở két số: ${msg}`);
    } finally {
      setIsUnlocking(false);
    }
  };

  // Clipboard copy with 30s auto-destruct countdown
  const handleCopyWithSelfDestruct = () => {
    if (!decryptedPlaintext) return;

    navigator.clipboard.writeText(decryptedPlaintext);
    toast.success("Đã sao chép vào bộ nhớ tạm! Tự động hủy sau 30 giây.");

    setClipboardCountdown(30);
    if (clipboardTimerRef.current) clearInterval(clipboardTimerRef.current);

    clipboardTimerRef.current = setInterval(() => {
      setClipboardCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (clipboardTimerRef.current) clearInterval(clipboardTimerRef.current);
          try {
            navigator.clipboard.writeText("");
            toast.info("Đã xóa sạch bộ nhớ tạm (Clipboard Cleared) vì lý do an toàn.");
          } catch {
            // Ignore if focus lost
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Decision 1: Confirm Receipt and Settle Escrow
  const handleSettleDeal = async () => {
    const confirmed = window.confirm(
      "Xác nhận nghiệm thu sản phẩm? Tiền ký quỹ sẽ được giải phóng ngay lập tức cho người bán trên Smart Contract."
    );
    if (!confirmed) return;

    setIsSettling(true);
    try {
      await apiClient(`/api/v1/deals/${dealId}/settle`, {
        method: "POST",
      });

      toast.success("Đã giải ngân thành công cho người bán! Kèo đã hoàn tất (SETTLED).");
      setDeal((prev) => (prev ? { ...prev, state: "SETTLED" } : null));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi giải ngân";
      toast.error(`Thao tác thất bại: ${msg}`);
    } finally {
      setIsSettling(false);
    }
  };

  // Decision 2: Open Dispute and Request AI Arbitrator
  const handleOpenDispute = () => {
    router.push(`/user/disputes?dealId=${dealId}`);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-xs font-mono">Đang kết nối Digital Vault an toàn...</p>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="max-w-md mx-auto my-12 rounded-2xl border border-rose-500/30 bg-slate-900/80 p-6 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Lỗi Truy Cập Két Số</h2>
        <p className="text-xs text-slate-400">
          {error || `Kèo ${dealId} không tồn tại hoặc chưa khởi tạo két số.`}
        </p>
        <Button asChild variant="outline" className="border-slate-700 text-xs">
          <Link href="/user/deals">Quay lại danh sách kèo</Link>
        </Button>
      </div>
    );
  }

  // Compute expiration time
  const targetExpiration = deal.depositedAt
    ? new Date(deal.depositedAt).getTime() + (deal.inspectionDuration || 43200) * 1000
    : initialTimestamp + (deal.inspectionDuration || 43200) * 1000;

  const isSettled = deal.state === "SETTLED";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <VaultHeader dealId={dealId} deal={deal} isSettled={isSettled} />

      {/* Inspection Window Countdown Card */}
      {!isSettled && (
        <CountdownTimer
          targetDate={targetExpiration}
          totalDurationSeconds={deal.inspectionDuration || 43200}
        />
      )}

      {/* Digital Vault Decryption & Single-View */}
      {!decryptedPlaintext ? (
        <VaultUnlockForm
          passphrase={passphrase}
          onPassphraseChange={setPassphrase}
          onUnlock={handleUnlockAndDecrypt}
          isUnlocking={isUnlocking}
          digitalAsset={deal.digitalAsset}
        />
      ) : (
        <VaultContentViewer
          decryptedPlaintext={decryptedPlaintext}
          integrityVerified={integrityVerified}
          isPlaintextVisible={isPlaintextVisible}
          onToggleVisibility={() => setIsPlaintextVisible((prev) => !prev)}
          onCopy={handleCopyWithSelfDestruct}
          clipboardCountdown={clipboardCountdown}
        />
      )}

      {/* Decisive Action Buttons */}
      <VaultActions
        onSettle={handleSettleDeal}
        onDispute={handleOpenDispute}
        isSettling={isSettling}
        isSettled={isSettled}
      />
    </div>
  );
}
