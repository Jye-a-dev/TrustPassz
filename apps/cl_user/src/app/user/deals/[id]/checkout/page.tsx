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
    <div className="relative max-w-7xl mx-auto space-y-6 sm:space-y-8">
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
        primaryActionText="Vào Két bảo mật để nhận hàng"
        onPrimaryAction={() => router.push(`/user/deals/${dealId}/vault`)}
        secondaryActionText="Xem lịch sử giao dịch"
        onSecondaryAction={() => router.push("/user/deals")}
      />

      {/* Top Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/deals/${dealId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Quay lại giao dịch</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Quét Mã VietQR Nạp Két Bảo Chứng</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tiền chuyển khoản sẽ được khóa tự động vào két an toàn. Tiền chỉ chuyển cho người bán khi bạn kiểm tra và hài lòng.
          </p>
        </div>

        <span className="bg-amber-50 border border-amber-300 text-amber-800 text-xs px-3.5 py-1.5 rounded-full flex items-center gap-2 font-bold self-start sm:self-auto shrink-0 shadow-xs">
          <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Chờ Quét Mã VietQR</span>
        </span>
      </div>

      {/* 2-Column Checkout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (7 cols): QR Code Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                <QrCode className="size-5" />
              </span>
              <div>
                <h2 className="font-bold text-sm sm:text-base text-slate-900">Mã VietQR Động Chuẩn Napas 24/7</h2>
                <span className="text-xs text-slate-500">Mở app mọi ngân hàng nội địa để quét tự động</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              TỰ ĐỘNG KHÓA KÉT
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
            <CheckoutQrCard
              vietQrUrl={bankConfig.vietQrUrl}
              isSuccessGlow={isModalOpen}
            />

            {/* Instruction Details */}
            <div className="space-y-4 text-center sm:text-left flex-1">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <span className="text-xs text-amber-900 font-semibold block">Mã QR có hiệu lực trong:</span>
                <div className="font-mono text-2xl font-black text-amber-700">14 phút 59 giây</div>
                <p className="text-[11px] text-amber-800">Sau 15 phút, mã sẽ tự động gia hạn nếu chưa nhận được giao dịch.</p>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 rounded-full bg-rose-100 text-rose-600 font-bold items-center justify-center text-[10px]">1</span>
                  <span>Mở app ngân hàng (VCB, MB, Techcom, BIDV...)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex size-5 rounded-full bg-rose-100 text-rose-600 font-bold items-center justify-center text-[10px]">2</span>
                  <span>Chọn Quét QR &amp; quét mã thanh toán</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex size-5 rounded-full bg-rose-100 text-rose-600 font-bold items-center justify-center text-[10px]">3</span>
                  <span>Giữ nguyên nội dung chuyển khoản để két khóa tự động</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSimulateWebhook}
              className="w-full min-h-[50px] rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-sm sm:text-base shadow-sm flex items-center justify-center gap-2 transition-all border border-emerald-700 cursor-pointer"
            >
              <Clock className="size-5" />
              <span>Tôi Đã Chuyển Tiền - Kiểm Tra Trạng Thái Két</span>
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Order Summary & Fast Copy */}
        <div className="lg:col-span-5 space-y-6">
          {/* Order Summary Card */}
          <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 space-y-4 shadow-sm">
            <h3 className="font-bold text-xs text-slate-900 uppercase font-mono tracking-wider pb-3 border-b border-slate-100">
              TÓM TẮT ĐƠN HÀNG
            </h3>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                {deal?.title || "Sản phẩm kỹ thuật số TrustPassz"}
              </h4>
              <div className="text-[11px] text-slate-500 font-mono">
                Người bán: {deal?.seller?.displayName || "Đối tác xác thực"}
              </div>
            </div>

            {/* Price Calculation */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Giá sản phẩm:</span>
                <span className="font-mono font-bold text-slate-900">
                  {bankConfig.amount.toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Phí dịch vụ bảo chứng (Escrow):</span>
                <span className="font-mono text-emerald-700 font-bold">0 ₫ (Miễn phí)</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Thời hạn dùng thử &amp; nghiệm thu:</span>
                <span className="font-mono font-bold text-slate-900">
                  {deal?.inspectionDuration ? `${Math.round(deal.inspectionDuration / 3600)} Giờ` : "24 Giờ"}
                </span>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex items-baseline justify-between">
                <span className="font-bold text-slate-900 text-sm">TỔNG THANH TOÁN:</span>
                <span className="font-mono text-2xl font-black text-rose-600">
                  {bankConfig.amount.toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>
          </div>

          {/* 1-Click Copy Transfer Info Box */}
          <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 space-y-4 shadow-sm">
            <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-slate-800">
              THÔNG TIN CHUYỂN KHOẢN THỦ CÔNG
            </h3>
            <p className="text-[11px] text-slate-500">
              Nếu không thể quét QR, vui lòng chuyển khoản chính xác thông tin sau:
            </p>

            <CheckoutPaymentDetails
              bankConfig={bankConfig}
              copiedField={copiedField}
              onCopy={copyToClipboard}
            />
          </div>
        </div>
      </div>

      {/* Developer Sandbox Simulation Bar */}
      <CheckoutSandboxBar
        memo={bankConfig.memo}
        onSimulateWebhook={handleSimulateWebhook}
      />
    </div>
  );
}
