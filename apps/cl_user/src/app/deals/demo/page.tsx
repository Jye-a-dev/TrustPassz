"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  Unlock,
  Coins,
  QrCode,
  FileCode,
  AlertCircle,
  Copy,
  ExternalLink,
  Check,
  Sparkles,
  RefreshCw,
  Scale,
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

export default function DemoDealRoomPage() {
  const [dealState, setDealState] = React.useState<DealState>("PENDING");
  const [currentPrice, setCurrentPrice] = React.useState<number>(1500000);
  const [isVaultDecrypted, setIsVaultDecrypted] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Đã sao chép liên kết Deal Room Demo!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimulateDeposit = () => {
    setDealState("DEPOSITED");
    toast.success("Xác nhận tiền ký quỹ!", {
      description: "Hệ thống ghi nhận VietQR 1,500,000 VND đã vào két an toàn.",
    });
  };

  const handleStartInspection = () => {
    setDealState("IN_INSPECTION");
    setIsVaultDecrypted(true);
    toast.success("Digital Vault đã mở khóa!", {
      description: "Bộ đếm thời gian kiểm thử 24h bắt đầu chạy.",
    });
  };

  const handleSettleDeal = () => {
    setDealState("SETTLED");
    toast.success("Giao dịch hoàn tất thành công!", {
      description: "Tiền đã được giải phóng cho Seller. Hợp đồng ký quỹ thanh lý.",
    });
  };

  const handleTriggerDispute = () => {
    setDealState("DISPUTED");
    toast.error("Đã kích hoạt tranh chấp!", {
      description: "Hệ thống AI Arbitrator đang phân tích log kiểm thử và bằng chứng.",
    });
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            <Link href="/explore">
              <ArrowLeft className="size-4 mr-1" />
              <span>Quay lại Khám phá</span>
            </Link>
          </Button>
          <Badge
            variant="outline"
            className="border-cyan-500/40 bg-cyan-950/30 text-cyan-400 text-xs px-2.5 py-0.5"
          >
            <Sparkles className="size-3 mr-1" />
            Bàn Đàm Phán Ký Quỹ Demo
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white text-xs"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-400 mr-1" />
            ) : (
              <Copy className="size-3.5 mr-1" />
            )}
            <span>Chia sẻ Kèo</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDealState("PENDING");
              setIsVaultDecrypted(false);
              toast.info("Đã đặt lại trạng thái demo về Ban Đầu");
            }}
            className="border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white text-xs"
          >
            <RefreshCw className="size-3.5 mr-1" />
            <span>Reset Demo</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Deal Information & Bargain Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Deal Details & Vault */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-slate-800 bg-slate-950/80 shadow-xl">
            <CardHeader className="space-y-3 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={
                    dealState === "SETTLED"
                      ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-400"
                      : dealState === "DISPUTED"
                      ? "border-rose-500/50 bg-rose-950/30 text-rose-400"
                      : dealState === "IN_INSPECTION"
                      ? "border-blue-500/50 bg-blue-950/30 text-blue-400"
                      : dealState === "DEPOSITED"
                      ? "border-cyan-500/50 bg-cyan-950/30 text-cyan-400"
                      : "border-amber-500/50 bg-amber-950/30 text-amber-400"
                  }
                >
                  Trạng thái: {dealState}
                </Badge>
                <span className="text-xs text-slate-500 font-mono">
                  Mã kèo: DEAL-DEMO-888999
                </span>
              </div>

              <CardTitle className="text-xl sm:text-2xl font-bold text-white">
                Mã Nguồn TrustPassz Escrow Gateway + Base Sepolia Contract
              </CardTitle>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Kèo chuyển nhượng bộ module ký quỹ đa kênh: tích hợp VietQR PayOS
                tự động, Smart Contract Escrow Solady, và Digital Vault mã hóa
                AES-256-GCM bảo vệ an toàn 100% người mua & người bán.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Escrow Progress Bar */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">
                    Quy Trình Ký Quỹ & Bảo Vệ Tài Sản
                  </span>
                  <span className="text-cyan-400 font-medium">4 Bước Khép Kín</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs">
                  <div
                    className={`p-2 rounded-lg border ${
                      dealState !== "PENDING"
                        ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300"
                        : "border-amber-500/50 bg-amber-950/30 text-amber-300"
                    }`}
                  >
                    1. Khóa Tiền
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      dealState === "IN_INSPECTION" || dealState === "SETTLED"
                        ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300"
                        : dealState === "DEPOSITED"
                        ? "border-cyan-500/50 bg-cyan-950/30 text-cyan-300"
                        : "border-slate-800 bg-slate-900 text-slate-500"
                    }`}
                  >
                    2. Mở Két Vault
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      dealState === "SETTLED"
                        ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300"
                        : dealState === "IN_INSPECTION"
                        ? "border-blue-500/50 bg-blue-950/30 text-blue-300"
                        : "border-slate-800 bg-slate-900 text-slate-500"
                    }`}
                  >
                    3. Kiểm Thử 24h
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      dealState === "SETTLED"
                        ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300"
                        : "border-slate-800 bg-slate-900 text-slate-500"
                    }`}
                  >
                    4. Tất Toán
                  </div>
                </div>
              </div>

              {/* Digital Vault Section */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                      {isVaultDecrypted ? (
                        <Unlock className="size-4" />
                      ) : (
                        <Lock className="size-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        Digital Vault (Két Mã Hóa AES-256-GCM)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isVaultDecrypted
                          ? "Tài sản số đã giải mã thành công cho phiên kiểm thử"
                          : "Tài sản số đang khóa an toàn. Cần nạp ký quỹ để mở két."}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-slate-700 bg-slate-800 text-slate-300 text-[10px]"
                  >
                    Mã nguồn Git & License
                  </Badge>
                </div>

                {isVaultDecrypted ? (
                  <div className="rounded-lg bg-slate-950 border border-emerald-500/40 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-emerald-400">
                      <span className="font-mono font-bold">
                        SECURE_VAULT_CONTENT:
                      </span>
                      <span>Checksum: SHA-256 verified</span>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/80 p-3 rounded overflow-x-auto">
{`// TrustPassz AES-256-GCM Decrypted Asset Credentials
VAULT_PAYLOAD = {
  repositoryUrl: "git@github.com:trustpassz-org/escrow-contracts-v2.git",
  deployerKeyHash: "0x89ab...77ef",
  licenseKey: "TPSZ-PRO-2026-X991-VAULT-AUTHENTIC",
  inspectionDeadline: "24 hours remaining"
};`}
                    </pre>
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-6 text-center space-y-2">
                    <Lock className="size-8 text-slate-600 mx-auto" />
                    <div className="text-xs font-semibold text-slate-400">
                      Nội dung được bảo vệ trong két số TrustPassz
                    </div>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Chỉ người mua đã nạp đủ số tiền ký quỹ mới có thể mở két và
                      bắt đầu giai đoạn kiểm thử.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons for Demonstration */}
              <div className="flex flex-wrap gap-3 pt-2">
                {dealState === "PENDING" && (
                  <Button
                    onClick={handleSimulateDeposit}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-10 px-4"
                  >
                    <QrCode className="size-4 mr-1.5" />
                    Mô phỏng Nạp Tiền VietQR (Ký Quỹ)
                  </Button>
                )}

                {dealState === "DEPOSITED" && (
                  <Button
                    onClick={handleStartInspection}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs h-10 px-4"
                  >
                    <Unlock className="size-4 mr-1.5" />
                    Mở Khóa Digital Vault (Bắt Đầu Kiểm Thử)
                  </Button>
                )}

                {dealState === "IN_INSPECTION" && (
                  <>
                    <Button
                      onClick={handleSettleDeal}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-10 px-4"
                    >
                      <Check className="size-4 mr-1.5" />
                      Nghiệm Thu Đạt & Giải Phóng Quỹ Cho Seller
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleTriggerDispute}
                      className="border-rose-500/50 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40 text-xs h-10 px-4"
                    >
                      <Scale className="size-4 mr-1.5" />
                      Yêu Cầu Phân Xử Tranh Chấp (AI)
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Realtime Bargain Slider */}
        <div className="lg:col-span-4 space-y-6">
          <BargainSlider
            dealId="deal-demo-001"
            basePrice={currentPrice}
            floorPrice={1200000}
            currentUserId="buyer-demo-001"
            isBuyer={true}
            onOfferSubmit={(price) => {
              setCurrentPrice(price);
              toast.success("Đã gửi đề xuất giá mới!", {
                description: `Giá đàm phán: ${price.toLocaleString("vi-VN")} VND`,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
