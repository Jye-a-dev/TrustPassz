"use client";

export const runtime = "edge";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, QrCode, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase-client";
import { apiClient } from "@/lib/api-client";
import { CheckoutQrCard } from "@/components/checkout/checkout-qr-card";
import { CheckoutPaymentDetails } from "@/components/checkout/checkout-payment-details";
import { CheckoutSandboxBar } from "@/components/checkout/checkout-sandbox-bar";
import type { DealData } from "@/components/checkout/checkout.types";

interface PaymentLinkResponse {
  qrCode?: string;
  qrDataUrl?: string;
  accountNo?: string;
  accountName?: string;
  amount?: number;
  orderCode?: number | string;
  bin?: string;
  bankName?: string;
  deepLink?: string;
}

export default function DealCheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dealId = params?.id || "d0000000-0000-4000-a000-000000000001";

  const [deal, setDeal] = React.useState<DealData | null>(null);
  const [, setLoading] = React.useState(true);
  const [isSuccessGlow, setIsSuccessGlow] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = React.useState<PaymentLinkResponse | null>(null);

  // Bank Account Info (Standard PayOS VietQR Merchant Setup)
  const bankConfig = React.useMemo(() => {
    const orderCode = paymentInfo?.orderCode || dealId.slice(0, 8).toUpperCase();
    const memo = `TPZ ${orderCode}`;
    const amount = paymentInfo?.amount || deal?.amount || 500000;
    const accountNo = paymentInfo?.accountNo || "998877";
    const accountName = paymentInfo?.accountName || "TRUSTPASSZ ESCROW";
    const bankName = paymentInfo?.bankName || "MBBank (Ngân hàng TMCP Quân Đội)";
    const bin = paymentInfo?.bin || "970422";
    const vietQrUrl =
      paymentInfo?.qrDataUrl ||
      paymentInfo?.qrCode ||
      `https://img.vietqr.io/image/${bin}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
        memo
      )}&accountName=${encodeURIComponent(accountName)}`;

    return {
      bin,
      bankName,
      accountNo,
      accountName,
      amount,
      memo,
      vietQrUrl,
      deepLink:
        paymentInfo?.deepLink ||
        `vietqr://pay?acc=${accountNo}&bin=${bin}&amount=${amount}&memo=${encodeURIComponent(
          memo
        )}`,
    };
  }, [dealId, deal?.amount, paymentInfo]);

  // Audio effect using Web Audio API for zero-dependency sound chime
  const playSuccessChime = React.useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + start + dur
        );
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
      // Audio autoplay may be disabled by browser policy
    }
  }, []);

  // Handle successful deposit transition
  const handlePaymentSuccess = React.useCallback(() => {
    setIsSuccessGlow(true);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
    playSuccessChime();
    toast.success(
      "Thanh toán VietQR thành công! Tiền đã được giữ an toàn trong Két bảo chứng.",
      { duration: 4000 }
    );

    // Auto navigate without page refresh
    setTimeout(() => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
      router.replace(`/user/deals/${dealId}/vault`);
    }, 1500);
  }, [dealId, playSuccessChime, router]);

  // 1. Call API POST /api/v1/payments/create-link/:dealId & GET deal details
  const initPaymentData = React.useCallback(async () => {
    try {
      // Fetch deal details
      const dealRes = await apiClient<{
        data?: DealData;
        id?: string;
        title?: string;
        amount?: number;
        currency?: string;
        state?: DealData["state"];
        inspectionDuration?: number;
      }>(`/api/v1/deals/${dealId}`);

      const dealData: DealData = (dealRes.data || dealRes) as DealData;
      setDeal(dealData);

      if (
        dealData.state === "DEPOSITED" ||
        dealData.state === "IN_INSPECTION"
      ) {
        handlePaymentSuccess();
        return;
      }

      // Call payments/create-link
      try {
        const payRes = await apiClient<PaymentLinkResponse>(
          `/api/v1/payments/create-link/${dealId}`,
          { method: "POST" }
        );
        if (payRes) {
          setPaymentInfo(payRes);
        }
      } catch {
        // Fallback: Continue with default VietQR computation
      }
    } catch {
      setDeal({
        id: dealId,
        title: "Bộ mã nguồn ứng dụng thương mại điện tử an toàn (Next.js 15 + Bảo vệ tự động)",
        amount: 500000,
        currency: "VND",
        state: "PENDING",
        inspectionDuration: 43200,
        seller: {
          id: "11111111-1111-4111-a111-111111111111",
          displayName: "Trusted Dev Corp",
        },
      });
    } finally {
      setLoading(false);
    }
  }, [dealId, handlePaymentSuccess]);

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

  // 2. Realtime Supabase Subscription to deal-room:${dealId} & Fallback Polling
  React.useEffect(() => {
    if (!dealId) return;

    const channelName = `deal-room:${dealId}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        "broadcast" as never,
        { event: "PAYMENT_RECEIVED" } as never,
        (payload: { payload?: { state: string } }) => {
          if (
            payload.payload?.state === "DEPOSITED" ||
            payload.payload?.state === "IN_INSPECTION"
          ) {
            handlePaymentSuccess();
          }
        }
      )
      .on(
        "broadcast" as never,
        { event: "DEPOSIT_CONFIRMED" } as never,
        () => {
          handlePaymentSuccess();
        }
      )
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "deals",
          filter: `id=eq.${dealId}`,
        },
        (payload: { new: { state: string } }) => {
          if (
            payload.new?.state === "DEPOSITED" ||
            payload.new?.state === "IN_INSPECTION"
          ) {
            handlePaymentSuccess();
          }
        }
      )
      .subscribe();

    const pollInterval = setInterval(async () => {
      try {
        const res = await apiClient<DealData>(`/api/v1/deals/${dealId}`);
        if (
          res?.state === "DEPOSITED" ||
          res?.state === "IN_INSPECTION"
        ) {
          handlePaymentSuccess();
        }
      } catch {
        // Polling silent catch
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [dealId, handlePaymentSuccess]);

  const copyToClipboard = (text: string, fieldName: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${label}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulateWebhook = () => {
    toast.info("Đang mô phỏng xác nhận tiền vào két an toàn...");
    handlePaymentSuccess();
  };

  return (
    <div className="relative max-w-4xl mx-auto space-y-6">
      {/* Emerald Pulse Fullscreen Celebration Layer on Realtime Confirmation */}
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

      {/* Top Back link */}
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

      {/* Main Checkout Card */}
      <div
        className={`rounded-2xl border transition-all duration-700 bg-linear-to-b from-slate-900/90 to-[#0F172A] p-6 sm:p-8 space-y-6 ${
          isSuccessGlow
            ? "border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400"
            : "border-slate-800 shadow-2xl"
        }`}
      >
        {/* Header Title */}
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

        {/* Content Split: QR Code on Left, Payment Details on Right */}
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

        {/* Security Notice & Dev Sandbox Simulation */}
        <CheckoutSandboxBar
          memo={bankConfig.memo}
          onSimulateWebhook={handleSimulateWebhook}
        />
      </div>
    </div>
  );
}
