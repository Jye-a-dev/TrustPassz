"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";
import { CheckoutQrCard } from "@/components/checkout/checkout-qr-card";
import { CheckoutPaymentDetails } from "@/components/checkout/checkout-payment-details";
import { CheckoutSandboxBar } from "@/components/checkout/checkout-sandbox-bar";
import { CheckoutSellerWarning } from "@/components/checkout/checkout-seller-warning";
import { TransferSuccessModal } from "@/components/deals/transfer-success-modal";
import { useDealRealtimeModal } from "@/hooks/use-deal-realtime-modal";
import { secureClipboard } from "@/lib/secure-clipboard";
import type { DealData, BankConfig } from "@/components/checkout/checkout.types";

interface PaymentLinkResponse {
  qrCode?: string;
  qrDataUrl?: string;
  accountNo?: string;
  accountNumber?: string;
  accountName?: string;
  amount?: number;
  orderCode?: number | string;
  description?: string;
  bin?: string;
  bankName?: string;
  deepLink?: string;
  checkoutUrl?: string;
}

export default function DealCheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const dealId = params?.id || "";

  const [deal, setDeal] = React.useState<DealData | null>(null);
  const [, setLoading] = React.useState(true);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = React.useState<PaymentLinkResponse | null>(null);

  const isSeller = Boolean(user?.id && deal?.seller?.id && user.id === deal.seller.id);

  // Realtime hook trigger for zero-reload payment confirmation modal
  const {
    isOpen: isModalOpen,
    setIsOpen: setIsModalOpen,
    modalData,
    triggerDepositSuccess,
  } = useDealRealtimeModal({
    dealId,
    initialDeal: deal
      ? {
          id: deal.id,
          amount: deal.price ?? deal.amount,
          currency: deal.currency,
          state: deal.state,
          title: deal.title,
        }
      : null,
    onDealStateChange: (newState) => {
      setDeal((prev) => (prev ? { ...prev, state: newState as DealData["state"] } : prev));
      toast.success(
        "Thanh toán VietQR thành công! Tiền đã được giữ an toàn trong Két bảo chứng.",
        { duration: 4500 }
      );
    },
  });

  // Bank Account Info derived dynamically from PayOS / API metadata
  const bankConfig = React.useMemo<BankConfig>(() => {
    const rawDealPrice = deal?.price ?? deal?.amount;
    const dealPrice =
      rawDealPrice !== undefined && rawDealPrice !== null && !isNaN(Number(rawDealPrice))
        ? Number(rawDealPrice)
        : 0;

    const amount =
      paymentInfo?.amount !== undefined && paymentInfo.amount > 0
        ? paymentInfo.amount
        : dealPrice;

    const orderCode =
      paymentInfo?.orderCode || deal?.orderCode || (dealId ? dealId.slice(0, 8).toUpperCase() : "");
    const memo = paymentInfo?.description || `TPZ ${orderCode}`;
    const accountNo = paymentInfo?.accountNumber || paymentInfo?.accountNo || "";
    const accountName = paymentInfo?.accountName || "TRUSTPASSZ ESCROW";
    const bankName = paymentInfo?.bankName || "MBBank";
    const bin = paymentInfo?.bin || "970422";

    const vietQrUrl =
      paymentInfo?.qrDataUrl ||
      (paymentInfo?.qrCode?.startsWith("http") || paymentInfo?.qrCode?.startsWith("data:")
        ? paymentInfo.qrCode
        : `https://img.vietqr.io/image/${bin}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
            memo
          )}&accountName=${encodeURIComponent(accountName)}`);

    const deepLink =
      paymentInfo?.deepLink ||
      (paymentInfo?.qrCode?.startsWith("vietqr://")
        ? paymentInfo.qrCode
        : `vietqr://pay?acc=${accountNo}&bin=${bin}&amount=${amount}&memo=${encodeURIComponent(memo)}`);

    return {
      bin,
      bankName,
      accountNo,
      accountName,
      amount,
      memo,
      vietQrUrl,
      deepLink,
    };
  }, [dealId, deal?.price, deal?.amount, deal?.orderCode, paymentInfo]);

  // Fetch deal details and generate VietQR payment link
  const initPaymentData = React.useCallback(async () => {
    if (!dealId) {
      toast.error("Mã giao dịch không hợp lệ.");
      router.replace("/user/deals");
      return;
    }

    try {
      const dealRes = await apiClient<{ data?: DealData } | DealData>(`/api/v1/deals/${dealId}`);
      const dealData: DealData =
        "data" in dealRes && dealRes.data ? (dealRes.data as DealData) : (dealRes as DealData);
      setDeal(dealData);

      if (user?.id && dealData.seller?.id && user.id === dealData.seller.id) {
        toast.error("Bạn không thể tự mua hoặc thanh toán sản phẩm của chính mình.");
        setLoading(false);
        return;
      }

      if (dealData.state === "DEPOSITED" || dealData.state === "IN_INSPECTION") {
        triggerDepositSuccess({
          amount: dealData.price ?? dealData.amount,
          dealTitle: dealData.title,
          currency: dealData.currency,
        });
        return;
      }

      try {
        const payRes = await apiClient<PaymentLinkResponse>(
          `/api/v1/payments/create-link/${dealId}`,
          {
            method: "POST",
            body: JSON.stringify({
              dealId,
              description: `TPZ ${dealData.id.slice(0, 8).toUpperCase()}`.slice(0, 25),
            }),
          }
        );
        if (payRes) {
          setPaymentInfo(payRes);
        }
      } catch {
        // Fallback: Proceed with client-side derived VietQR values
      }
    } catch {
      toast.error("Không thể tải thông tin giao dịch hoặc Kèo không tồn tại.");
    } finally {
      setLoading(false);
    }
  }, [dealId, router, triggerDepositSuccess, user]);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void initPaymentData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [initPaymentData]);

  const copyToClipboard = async (text: string, fieldName: string, label: string) => {
    await secureClipboard.copy(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${label}! (Tự động xóa sau 30s)`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulateWebhook = async () => {
    if (!dealId) return;
    toast.info("Đang kích hoạt mô phỏng nạp tiền vào két...");
    try {
      await apiClient(`/api/v1/payments/simulate-success/${dealId}`, {
        method: "POST",
      });
      toast.success("Mô phỏng thanh toán thành công trên hệ thống!");
    } catch {
      // Standalone sandbox fallback
    }
    triggerDepositSuccess({
      amount: bankConfig.amount,
      dealTitle: deal?.title,
      currency: deal?.currency || "VND",
      txHash: paymentInfo?.orderCode ? `PAYOS-${paymentInfo.orderCode}` : undefined,
    });
  };

  if (!dealId) return null;

  if (isSeller) {
    return <CheckoutSellerWarning dealId={dealId} deal={deal} />;
  }

  return (
    <div className="relative max-w-4xl mx-auto space-y-6">
      {/* Transfer Success Custom Modal */}
      <TransferSuccessModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        dealId={dealId}
        dealTitle={modalData?.dealTitle || deal?.title}
        amount={modalData?.amount ?? bankConfig.amount}
        currency={modalData?.currency || deal?.currency || "VND"}
        txHash={modalData?.txHash}
        chainType={modalData?.chainType || "VIETQR"}
        timestamp={modalData?.timestamp}
        type="DEPOSIT"
        primaryActionText="Vào két Digital Vault"
        onPrimaryAction={() => router.push(`/user/deals/${dealId}/vault`)}
        secondaryActionText="Xem lịch sử giao dịch"
        onSecondaryAction={() => router.push("/user/deals")}
      />

      <div className="flex items-center justify-between">
        <Link
          href={`/deals/${dealId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors py-2"
        >
          <ArrowLeft className="size-4" />
          <span>Quay lại chi tiết giao dịch</span>
        </Link>

        <Badge
          variant="outline"
          className="bg-amber-950/40 border-amber-500/40 text-amber-300 text-xs px-2.5 py-1"
        >
          <Clock className="size-3 mr-1 animate-pulse" />
          Chờ Thanh Toán Giữ Tiền An Toàn
        </Badge>
      </div>

      <div className="rounded-2xl border border-slate-800 shadow-2xl bg-linear-to-b from-slate-900/90 to-[#0F172A] p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-semibold text-cyan-300">
            <QrCode className="size-3.5" />
            <span>Quét Mã VietQR Chuyển Khoản Nhanh</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quét Mã VietQR Để Giữ Tiền An Toàn
          </h1>

          <p className="text-xs sm:text-sm text-slate-400">
            Tiền chuyển sẽ được giữ an toàn trong két bảo vệ. Tiền chỉ chuyển cho người bán sau khi bạn kiểm tra đúng hàng và xác nhận.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <CheckoutQrCard
            vietQrUrl={bankConfig.vietQrUrl}
            isSuccessGlow={isModalOpen}
          />

          <CheckoutPaymentDetails
            bankConfig={bankConfig}
            copiedField={copiedField}
            onCopy={copyToClipboard}
          />
        </div>

        <CheckoutSandboxBar
          memo={bankConfig.memo}
          onSimulateWebhook={handleSimulateWebhook}
        />
      </div>
    </div>
  );
}
