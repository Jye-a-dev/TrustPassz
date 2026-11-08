"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  Unlock,
  QrCode,
  Copy,
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
      toast.success("Đã sao chép liên kết Phòng thương lượng mẫu!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimulateDeposit = () => {
    setDealState("DEPOSITED");
    toast.success("Tiền đã vào két an toàn!", {
      description: "Hệ thống ghi nhận VietQR 1,500,000 VND đã được giữ bảo chứng an toàn.",
    });
  };

  const handleStartInspection = () => {
    setDealState("IN_INSPECTION");
    setIsVaultDecrypted(true);
    toast.success("Kho lưu trữ đã mở khóa!", {
      description: "Thời gian kiểm tra hàng 24h bắt đầu tính.",
    });
  };

  const handleSettleDeal = () => {
    setDealState("SETTLED");
    toast.success("Giao dịch hoàn tất thành công!", {
      description: "Tiền đã chuyển cho người bán. Giao dịch hoàn tất thành công.",
    });
  };

  const handleTriggerDispute = () => {
    setDealState("DISPUTED");
    toast.error("Đã gửi yêu cầu khiếu nại!", {
      description: "Trợ lý phân xử tự động đang phân tích bằng chứng giao dịch.",
    });
  };

  return (
    <div className="min-h-screen bg-canvas text-primary py-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-8 space-y-6">
        {/* Top Breadcrumb & Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-rose-600 min-h-[44px]"
            >
              <Link href="/explore">
                <ArrowLeft className="size-4 mr-1" />
                <span>Quay lại Khám phá</span>
              </Link>
            </Button>
            <Badge
              variant="outline"
              className="border-rose-200 bg-rose-50 text-rose-700 text-xs px-2.5 py-1 font-semibold"
            >
              <Sparkles className="size-3 mr-1 text-rose-500" />
              Phòng Thương Lượng Giao Dịch Mẫu
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs min-h-[44px] rounded-xl shadow-sm"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-600 mr-1" />
              ) : (
                <Copy className="size-3.5 mr-1" />
              )}
              <span>Chia sẻ Giao Dịch</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDealState("PENDING");
                setIsVaultDecrypted(false);
                toast.info("Đã đặt lại trạng thái demo về Ban Đầu");
              }}
              className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs min-h-[44px] rounded-xl shadow-sm"
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
            <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
              <CardHeader className="space-y-3 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={
                      dealState === "SETTLED"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-bold"
                        : dealState === "DISPUTED"
                        ? "border-rose-200 bg-rose-50 text-rose-700 font-bold"
                        : dealState === "IN_INSPECTION"
                        ? "border-amber-200 bg-amber-50 text-amber-700 font-bold"
                        : dealState === "DEPOSITED"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 font-bold"
                        : "border-slate-300 bg-slate-50 text-slate-700 font-bold"
                    }
                  >
                    Trạng thái: {dealState}
                  </Badge>
                  <span className="text-xs text-slate-500 font-mono">
                    Mã giao dịch: DEAL-DEMO-888999
                  </span>
                </div>

                <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">
                  Bộ Mã Nguồn Nền Tảng Giao Dịch An Toàn TrustPassz
                </CardTitle>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Giao dịch chuyển nhượng trọn bộ giải pháp: thanh toán VietQR
                  tự động, hệ thống giữ tiền an toàn, và kho lưu trữ bảo mật bảo vệ
                  100% người mua &amp; người bán.
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Escrow Progress Bar */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">
                      Quy Trình Giữ Tiền &amp; Bàn Giao An Toàn
                    </span>
                    <span className="text-rose-600 font-semibold">4 Bước Khép Kín</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] sm:text-xs">
                    <div
                      className={`p-2 rounded-lg border font-medium ${
                        dealState !== "PENDING"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      1. Giữ Tiền An Toàn
                    </div>
                    <div
                      className={`p-2 rounded-lg border font-medium ${
                        dealState === "IN_INSPECTION" || dealState === "SETTLED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : dealState === "DEPOSITED"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      2. Mở Kho Lưu Trữ
                    </div>
                    <div
                      className={`p-2 rounded-lg border font-medium ${
                        dealState === "SETTLED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : dealState === "IN_INSPECTION"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      3. Kiểm Tra 24h
                    </div>
                    <div
                      className={`p-2 rounded-lg border font-medium ${
                        dealState === "SETTLED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      4. Chuyển Tiền Cho Người Bán
                    </div>
                  </div>
                </div>

              {/* Digital Vault Section */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                      {isVaultDecrypted ? (
                        <Unlock className="size-4" />
                      ) : (
                        <Lock className="size-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Kho Lưu Trữ Bảo Mật
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {isVaultDecrypted
                          ? "Thông tin bàn giao đã mở khóa để bạn kiểm tra"
                          : "Thông tin đang khóa an toàn. Cần thanh toán vào két để nhận hàng."}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-slate-300 bg-white text-slate-700 text-[10px]"
                  >
                    Mã nguồn Git &amp; License
                  </Badge>
                </div>

                {isVaultDecrypted ? (
                  <div className="rounded-xl bg-white border border-emerald-200 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                      <span className="font-mono">
                        SECURE_VAULT_CONTENT:
                      </span>
                      <span>Checksum: SHA-256 verified</span>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-x-auto">
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
                  <div className="rounded-xl bg-white border border-slate-200 p-6 text-center space-y-2">
                    <Lock className="size-8 text-slate-400 mx-auto" />
                    <div className="text-xs font-semibold text-slate-700">
                      Thông tin bàn giao được khóa kín an toàn
                    </div>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Chỉ người mua đã thanh toán tiền vào két an toàn mới có thể xem thông tin và kiểm tra hàng.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons for Demonstration */}
              <div className="flex flex-wrap gap-3 pt-2">
                {dealState === "PENDING" && (
                  <Button
                    onClick={handleSimulateDeposit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs min-h-[44px] px-5 rounded-xl border border-emerald-700 shadow-sm cursor-pointer"
                  >
                    <QrCode className="size-4 mr-1.5" />
                    Mô phỏng Quét Mã VietQR (Giữ Tiền An Toàn)
                  </Button>
                )}

                {dealState === "DEPOSITED" && (
                  <Button
                    onClick={handleStartInspection}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs min-h-[44px] px-5 rounded-xl border border-rose-600 shadow-sm cursor-pointer"
                  >
                    <Unlock className="size-4 mr-1.5" />
                    Mở Khóa Nhận Hàng (Bắt Đầu Kiểm Tra)
                  </Button>
                )}

                {dealState === "IN_INSPECTION" && (
                  <>
                    <Button
                      onClick={handleSettleDeal}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs min-h-[44px] px-5 rounded-xl border border-emerald-700 shadow-sm cursor-pointer"
                    >
                      <Check className="size-4 mr-1.5" />
                      Hàng Đúng Mô Tả - Chuyển Tiền Cho Người Bán
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleTriggerDispute}
                      className="border-rose-200 bg-white text-rose-600 hover:bg-rose-50 text-xs min-h-[44px] px-5 rounded-xl shadow-sm cursor-pointer"
                    >
                      <Scale className="size-4 mr-1.5" />
                      Báo Lỗi &amp; Khiếu Nại (Trợ Lý Phân Xử)
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
                description: `Giá đề xuất: ${price.toLocaleString("vi-VN")} VND`,
              });
            }}
          />
        </div>
      </div>
    </div>
    </div>
  );
}
