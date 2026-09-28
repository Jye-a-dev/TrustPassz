"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Clock,
  Coins,
  QrCode,
  FileCode,
  AlertCircle,
  Copy,
  ExternalLink,
  Check,
  Calendar,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { BargainSlider } from "@/components/deals/bargain-slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export type DealState =
  | "PENDING"
  | "DEPOSITED"
  | "IN_INSPECTION"
  | "SETTLED"
  | "REFUNDED"
  | "DISPUTED";

interface DealDetail {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  state: DealState;
  inspectionDuration: number;
  seller: {
    id: string;
    displayName: string;
    walletAddress?: string;
  };
  buyer?: {
    id: string;
    displayName: string;
    walletAddress?: string;
  };
  digitalAsset?: {
    assetType: string;
    encryptedContent: string;
    encryptionIv: string;
    authTag: string;
    contentHash: string;
    fileSizeBytes?: number;
    maxAccessLimit: number;
    accessCount: number;
  };
}

const STATE_CONFIG: Record<
  DealState,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  PENDING: {
    label: "Chờ Ký Quỹ (Pending)",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-500/40",
    desc: "Đang chờ người mua nạp tiền ký quỹ vào smart contract / escrow.",
  },
  DEPOSITED: {
    label: "Đã Ký Quỹ (Deposited)",
    bg: "bg-cyan-950/40",
    text: "text-cyan-400",
    border: "border-cyan-500/40",
    desc: "Tiền đã vào két ký quỹ. Vault tài sản số sẵn sàng giải mã kiểm thử.",
  },
  IN_INSPECTION: {
    label: "Đang Kiểm Thử (In Inspection)",
    bg: "bg-blue-950/40",
    text: "text-blue-400",
    border: "border-blue-500/40",
    desc: "Người mua đang kiểm thử sản phẩm. Hết hạn kiểm thử sẽ tự động thanh toán.",
  },
  SETTLED: {
    label: "Đã Hoàn Tất (Settled)",
    bg: "bg-emerald-950/40",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
    desc: "Giao dịch thành công, tiền đã giải phóng cho người bán.",
  },
  REFUNDED: {
    label: "Đã Hoàn Tiền (Refunded)",
    bg: "bg-slate-800",
    text: "text-slate-300",
    border: "border-slate-700",
    desc: "Khoản ký quỹ đã được hoàn trả lại cho người mua.",
  },
  DISPUTED: {
    label: "Đang Tranh Chấp (Disputed)",
    bg: "bg-rose-950/40",
    text: "text-rose-400",
    border: "border-rose-500/40",
    desc: "Trọng tài đang xem xét bằng chứng và nhật ký audit của Vault.",
  },
};

export default function DealRoomPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = (params?.id as string) || "deal-default";

  // Mock deal data initialized with backend schemas
  const [deal, setDeal] = React.useState<DealDetail>({
    id: dealId,
    title: "Mã Nguồn TrustPassz Escrow Gateway + Base Sepolia Contract",
    description:
      "Full stack NestJS + Next.js App Router + Smart Contract Solady AES-256 Vault. Kiểm thử hoàn tất giải phóng tiền.",
    amount: 1500000,
    currency: "VND",
    state: "PENDING",
    inspectionDuration: 86400,
    seller: {
      id: "11111111-1111-4111-a111-111111111111",
      displayName: "DevMaster_VN",
      walletAddress: "0x71C...b92F",
    },
    buyer: {
      id: "22222222-2222-4222-a222-222222222222",
      displayName: "CryptoInvestor_09",
      walletAddress: "0x3A2...9cD1",
    },
    digitalAsset: {
      assetType: "SOURCE_CODE",
      encryptedContent: "a2ZqOTI4amZzZGtqZmxzamRmbGtzZGpmbGtzZGpma3NkamZsc2tqZGY=",
      encryptionIv: "e4d29e7c3b9f4a1200000000",
      authTag: "9f8e7d6c5b4a32100000000000000000",
      contentHash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
      fileSizeBytes: 2048,
      maxAccessLimit: 1,
      accessCount: 0,
    },
  });

  const [copiedHash, setCopiedHash] = React.useState(false);
  const currentUserId = "22222222-2222-4222-a222-222222222222"; // Active session user (Buyer)
  const isBuyer = currentUserId === deal.buyer?.id;

  const copyHash = () => {
    if (deal.digitalAsset?.contentHash) {
      navigator.clipboard.writeText(deal.digitalAsset.contentHash);
      setCopiedHash(true);
      toast.success("Đã sao chép SHA-256 hash vào clipboard!");
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleOfferSubmit = (newOffer: number) => {
    toast.success(
      `Đã ghi nhận đề xuất trả giá ${newOffer.toLocaleString("vi-VN")} ₫. Chuyển sang thanh toán QR.`
    );
  };

  const handleProceedToPayment = () => {
    toast.info("Đang chuyển tiếp sang Cổng thanh toán QR (TASK-10)...");
    router.push(`/payments/qr?dealId=${deal.id}&amount=${deal.amount}`);
  };

  const stateCfg = STATE_CONFIG[deal.state];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 overflow-x-hidden">
      {/* Background radial gradient */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 blur-[140px] pointer-events-none" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Navigation & Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Link>

          <Badge
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${stateCfg.bg} ${stateCfg.text} ${stateCfg.border}`}
          >
            {stateCfg.label}
          </Badge>
        </div>

        {/* Deal Header Overview */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                Deal ID: {deal.id}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {deal.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {deal.description}
              </p>
            </div>

            <div className="sm:text-right shrink-0 bg-slate-950/70 p-3 sm:p-4 rounded-xl border border-slate-800/80">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
                Giá gốc niêm yết
              </span>
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
                {deal.amount.toLocaleString("vi-VN")}{" "}
                <span className="text-xs font-normal text-slate-400">{deal.currency}</span>
              </span>
            </div>
          </div>

          {/* Key Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/70 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Kiểm thử</span>
                <span className="font-semibold text-slate-200">
                  {Math.round(deal.inspectionDuration / 3600)} Giờ
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
              <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Tài sản</span>
                <span className="font-semibold text-slate-200">
                  {deal.digitalAsset?.assetType || "SOURCE_CODE"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
              <User className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Người bán</span>
                <span className="font-semibold text-slate-200 truncate block max-w-25">
                  {deal.seller.displayName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Bảo mật</span>
                <span className="font-semibold text-emerald-400">Zero-Knowledge</span>
              </div>
            </div>
          </div>
        </div>

        {/* Realtime Bargain Negotiation Slider */}
        <section className="space-y-2">
          <BargainSlider
            dealId={deal.id}
            basePrice={deal.amount}
            floorPrice={Math.round(deal.amount * 0.7)}
            currentUserId={currentUserId}
            isBuyer={isBuyer}
            onOfferSubmit={handleOfferSubmit}
          />
        </section>

        {/* Digital Vault Locked Status Card */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  Trạng Thái Digital Vault
                  <Badge variant="outline" className="text-[10px] border-cyan-500/40 text-cyan-300">
                    AES-256-GCM
                  </Badge>
                </h4>
                <p className="text-xs text-slate-400">
                  Tài sản đã được niêm phong an toàn và lưu trữ dưới dạng ciphertext.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-md">
              Két Khóa (LOCKED)
            </span>
          </div>

          {deal.digitalAsset && (
            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
                <div className="truncate flex-1">
                  <span className="text-slate-400">Plaintext SHA-256: </span>
                  <span className="text-cyan-300">{deal.digitalAsset.contentHash}</span>
                </div>
                <button
                  type="button"
                  onClick={copyHash}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Sao chép Content Hash"
                >
                  {copiedHash ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60 truncate">
                  <span className="text-slate-500">IV (Hex): </span>
                  <span className="text-slate-300">{deal.digitalAsset.encryptionIv}</span>
                </div>
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60 truncate">
                  <span className="text-slate-500">Auth Tag (Hex): </span>
                  <span className="text-slate-300">{deal.digitalAsset.authTag}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Primary Call to Action: Proceed to Payment QR (TASK-10 Handoff) */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={handleProceedToPayment}
            className="w-full min-h-13 text-base font-extrabold bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <QrCode className="w-5 h-5" />
            Xác Nhận & Mở Thanh Toán QR (VietQR / Crypto Escrow)
          </Button>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            Khoản tiền được ký quỹ bảo đảm 100%. Tiền chỉ giải phóng khi bạn hoàn tất kiểm thử hợp lệ.
          </p>
        </div>
      </main>
    </div>
  );
}
