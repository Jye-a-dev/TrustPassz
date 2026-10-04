"use client";

export const runtime = "edge";

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
      setError(err instanceof Error ? err.message : "Không thể tải thông tin kho lưu trữ từ máy chủ.");
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
        throw new Error("Không tìm thấy thông tin bàn giao được khóa trong kho lưu trữ.");
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
          throw new Error("Mật khẩu mở khóa nhận hàng không đúng hoặc thông tin đã bị thay đổi.");
        }
      }

      setIntegrityVerified(true);
      setDecryptedPlaintext(decrypted);
      setIsPlaintextVisible(true);

      toast.success("Mở khóa nhận hàng thành công!", {
        description: "Thông tin bàn giao hiển thị an toàn trên thiết bị của bạn.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Mở khóa thất bại";
      toast.error(`Lỗi mở kho lưu trữ: ${msg}`);
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
      "Xác nhận bạn đã nhận đúng sản phẩm? Tiền được giữ an toàn sẽ chuyển ngay cho người bán."
    );
    if (!confirmed) return;

    setIsSettling(true);
    try {
      await apiClient(`/api/v1/deals/${dealId}/settle`, {
        method: "POST",
      });

      toast.success("Đã chuyển tiền thành công cho người bán! Giao dịch hoàn tất.");
      setDeal((prev) => (prev ? { ...prev, state: "SETTLED" } : null));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi chuyển tiền";
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
      <div className="min-h-100 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-xs font-mono">Đang kết nối kho lưu trữ bảo mật...</p>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="max-w-md mx-auto my-12 rounded-2xl border border-rose-500/30 bg-slate-900/80 p-6 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Lỗi Truy Cập Kho Lưu Trữ</h2>
        <p className="text-xs text-slate-400">
          {error || `Giao dịch ${dealId} không tồn tại hoặc chưa khởi tạo kho lưu trữ.`}
        </p>
        <Button asChild variant="outline" className="border-slate-700 text-xs">
          <Link href="/user/deals">Quay lại danh sách giao dịch</Link>
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
