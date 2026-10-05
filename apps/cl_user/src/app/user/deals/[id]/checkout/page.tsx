"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, QrCode, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
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
  const dealId = params?.id || "d0000000-0000-4000-a000-000000000001";

  const [deal, setDeal] = React.useState<DealData | null>(null);
  const [, setLoading] = React.useState(true);
  const [isSuccessGlow, setIsSuccessGlow] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = React.useState<PaymentLinkResponse | null>(null);

  const isSeller = Boolean(user?.id && deal?.seller?.id && user.id === deal.seller.id);

  // Bank Account Info (Standard PayOS VietQR Merchant Setup)
  const bankConfig = React.useMemo(() => {
    const queryAmount =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("amount")
        : null;
    const parsedQueryAmount =
      queryAmount && !isNaN(Number(queryAmount)) ? Number(queryAmount) : 0;

    // Dynamic price resolution from Deal API: prioritize deal.price then deal.amount, fallback to URL param
    const rawDealPrice = deal?.price ?? deal?.amount;
    const dealPrice =
      rawDealPrice !== undefined && rawDealPrice !== null && !isNaN(Number(rawDealPrice))
        ? Number(rawDealPrice)
        : parsedQueryAmount;

    const amount =
      paymentInfo?.amount !== undefined && paymentInfo.amount > 0
        ? paymentInfo.amount
        : dealPrice > 0
        ? dealPrice
        : parsedQueryAmount;

    const orderCode = paymentInfo?.orderCode || deal?.orderCode || dealId.slice(0, 8).toUpperCase();
    const memo = paymentInfo?.description || `TPZ ${orderCode}`;
    const accountNo = paymentInfo?.accountNumber || paymentInfo?.accountNo || "998877";
    const accountName = paymentInfo?.accountName || "TRUSTPASSZ ESCROW";
    const bankName = paymentInfo?.bankName || "MBBank (Ngân hàng TMCP Quân Đội)";
    const bin = paymentInfo?.bin || "970422";

    // Ensure vietQrUrl produces a valid image URL for <Image> component
    const vietQrUrl =
      paymentInfo?.qrDataUrl ||
      (paymentInfo?.qrCode?.startsWith("http") || paymentInfo?.qrCode?.startsWith("data:")
        ? paymentInfo.qrCode
        : `https://img.vietqr.io/image/${bin}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
            memo
          )}&accountName=${encodeURIComponent(accountName)}`);

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
        (paymentInfo?.qrCode?.startsWith("vietqr://")
          ? paymentInfo.qrCode
          : `vietqr://pay?acc=${accountNo}&bin=${bin}&amount=${amount}&memo=${encodeURIComponent(
              memo
            )}`),
    };
  }, [dealId, deal?.price, deal?.amount, deal?.orderCode, paymentInfo]);

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
        amount?: number | string;
        price?: number | string;
        currency?: string;
        state?: DealData["state"];
        inspectionDuration?: number;
      }>(`/api/v1/deals/${dealId}`);

      const dealData: DealData = (dealRes.data || dealRes) as DealData;
      setDeal(dealData);

      if (user?.id && dealData.seller?.id && user.id === dealData.seller.id) {
        toast.error("Bạn không thể tự mua hoặc thanh toán sản phẩm của chính mình.");
        setLoading(false);
        return;
      }

      if (
        dealData.state === "DEPOSITED" ||
        dealData.state === "IN_INSPECTION"
      ) {
        handlePaymentSuccess();
        return;
      }

      // Call payments/create-link with deal description
      try {
        const payRes = await apiClient<PaymentLinkResponse>(
          `/api/v1/payments/create-link/${dealId}`,
          {
            method: "POST",
            body: JSON.stringify({
              dealId,
              description: `TPZ ${dealData.id ? dealData.id.slice(0, 8).toUpperCase() : dealId.slice(0, 8).toUpperCase()}`.slice(0, 25),
            }),
          }
        );
        if (payRes) {
          setPaymentInfo(payRes);
        }
      } catch {
        // Fallback: Continue with client-side VietQR computation using deal.price
      }
    } catch {
      toast.error("Không thể tải thông tin giao dịch hoặc Kèo không tồn tại.");
    } finally {
      setLoading(false);
    }
  }, [dealId, handlePaymentSuccess, user]);

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

  if (isSeller) {
    return (
      <div className="relative max-w-xl mx-auto py-12 px-4 space-y-6">
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
            className="bg-rose-950/40 border-rose-500/40 text-rose-300 text-xs px-2.5 py-1"
          >
            Quyền Người Bán
          </Badge>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-slate-900/90 p-8 text-center space-y-6 shadow-2xl">
          <div className="size-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
            <ShieldAlert className="size-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Không Thể Tự Mua Sản Phẩm
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Bạn đang đăng nhập với tư cách Người bán của Kèo này. Để đảm bảo tính minh bạch và an toàn của hệ thống bảo chứng, bạn không thể tự đặt cọc hoặc thanh toán đơn hàng do chính mình tạo.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">Tiêu đề Kèo:</span>
              <span className="font-semibold text-slate-200">{deal?.title || "Kèo Escrow"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Giá niêm yết:</span>
              <span className="font-mono font-bold text-cyan-400">
                {Number(deal?.price ?? deal?.amount ?? 0).toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              asChild
              className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs min-h-10 px-5 cursor-pointer"
            >
              <Link href={`/deals/${dealId}`}>
                Quay Lại Quản Lý Kèo
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs min-h-10 px-5 cursor-pointer"
            >
              <Link href="/user/deals">
                Danh Sách Giao Dịch
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
