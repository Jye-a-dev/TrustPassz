"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, QrCode, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase-client";
import { apiClient } from "@/lib/api-client";
import { CheckoutQrCard } from "@/components/checkout/checkout-qr-card";
import { CheckoutPaymentDetails } from "@/components/checkout/checkout-payment-details";
import { CheckoutSandboxBar } from "@/components/checkout/checkout-sandbox-bar";
import { CheckoutSellerWarning } from "@/components/checkout/checkout-seller-warning";
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
  const dealId = params?.id;

  const [deal, setDeal] = React.useState<DealData | null>(null);
  const [, setLoading] = React.useState(true);
  const [isSuccessGlow, setIsSuccessGlow] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = React.useState<PaymentLinkResponse | null>(null);

  const isSeller = Boolean(user?.id && deal?.seller?.id && user.id === deal.seller.id);

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

    const orderCode = paymentInfo?.orderCode || deal?.orderCode || (dealId ? dealId.slice(0, 8).toUpperCase() : "");
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

  // Audio chime feedback upon successful escrow receipt
  const playSuccessChime = React.useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };

      playTone(523.25, 0, 0.2); // C5
      playTone(659.25, 0.12, 0.2); // E5
      playTone(783.99, 0.24, 0.25); // G5
      playTone(1046.5, 0.36, 0.5); // C6
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  const handlePaymentSuccess = React.useCallback(() => {
    if (!dealId) return;
    setIsSuccessGlow(true);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
    playSuccessChime();
    toast.success(
      "Thanh toán VietQR thành công! Tiền đã được giữ an toàn trong Két bảo chứng.",
      { duration: 4000 }
    );

    setTimeout(() => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
      router.replace(`/user/deals/${dealId}/vault`);
    }, 1500);
  }, [dealId, playSuccessChime, router]);

  // Fetch deal details and generate VietQR payment link
  const initPaymentData = React.useCallback(async () => {
    if (!dealId) {
      toast.error("Mã giao dịch không hợp lệ.");
      router.replace("/user/deals");
      return;
    }

    try {
      const dealRes = await apiClient<{ data?: DealData } | DealData>(`/api/v1/deals/${dealId}`);
      const dealData: DealData = ("data" in dealRes && dealRes.data ? dealRes.data : dealRes) as DealData;
      setDeal(dealData);

      if (user?.id && dealData.seller?.id && user.id === dealData.seller.id) {
        toast.error("Bạn không thể tự mua hoặc thanh toán sản phẩm của chính mình.");
        setLoading(false);
        return;
      }

      if (dealData.state === "DEPOSITED" || dealData.state === "IN_INSPECTION") {
        handlePaymentSuccess();
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
  }, [dealId, handlePaymentSuccess, router, user]);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void initPaymentData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [initPaymentData]);

  // Realtime Supabase Subscription & Fallback Polling
  React.useEffect(() => {
    if (!dealId) return;

    const channelName = `deal-room:${dealId}`;
    const channel = supabase.channel(channelName);

    channel
      .on("broadcast" as never, { event: "PAYMENT_RECEIVED" } as never, (payload: { payload?: { state: string } }) => {
        if (payload.payload?.state === "DEPOSITED" || payload.payload?.state === "IN_INSPECTION") {
          handlePaymentSuccess();
        }
      })
      .on("broadcast" as never, { event: "DEPOSIT_CONFIRMED" } as never, () => {
        handlePaymentSuccess();
      })
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "deals",
          filter: `id=eq.${dealId}`,
        },
        (payload: { new: { state: string } }) => {
          if (payload.new?.state === "DEPOSITED" || payload.new?.state === "IN_INSPECTION") {
            handlePaymentSuccess();
          }
        }
      )
      .subscribe();

    const pollInterval = setInterval(async () => {
      try {
        const res = await apiClient<DealData>(`/api/v1/deals/${dealId}`);
        if (res?.state === "DEPOSITED" || res?.state === "IN_INSPECTION") {
          handlePaymentSuccess();
        }
      } catch {
        // Polling silent error suppression
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [dealId, handlePaymentSuccess]);

  const copyToClipboard = (text: string, fieldName: string, label: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${label}!`);
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
    handlePaymentSuccess();
  };

  if (!dealId) return null;

  if (isSeller) {
    return <CheckoutSellerWarning dealId={dealId} deal={deal} />;
  }

  return (
    <div className="relative max-w-4xl mx-auto space-y-6">
      {isSuccessGlow && (
        <div className="fixed inset-0 z-50 bg-[#0B0F17]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="size-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center animate-bounce shadow-[0_0_60px_rgba(16,185,129,0.7)]">
            <CheckCircle2 className="size-14 text-emerald-400" />
          </div>
          <h2 className="mt-6 text-3xl font-black text-white tracking-tight">
            GIỮ TIỀN AN TOÀN THÀNH CÔNG!
          </h2>
          <p className="mt-2 text-sm text-emerald-300 font-semibold max-w-md">
            Hệ thống đã xác nhận tiền vào Két giữ an toàn. Đang chuyển hướng vào Kho lưu trữ nhận hàng...
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Mở kho nhận hàng tự động...</span>
          </div>
        </div>
      )}

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

      <div
        className={`rounded-2xl border transition-all duration-700 bg-linear-to-b from-slate-900/90 to-[#0F172A] p-6 sm:p-8 space-y-6 ${
          isSuccessGlow
            ? "border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400"
            : "border-slate-800 shadow-2xl"
        }`}
      >
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
            isSuccessGlow={isSuccessGlow}
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
