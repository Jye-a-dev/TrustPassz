"use client";

export const runtime = "edge";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  QrCode,
  AlertCircle,
  Loader2,
  KeyRound,
  Edit3,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { BargainSlider } from "@/components/deals/bargain-slider";
import { DealHeaderOverview } from "@/components/deals/deal-header-overview";
import { DealVaultStatusCard } from "@/components/deals/deal-vault-status-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

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
  amount: string | number;
  currency: string;
  state: DealState;
  inspectionDuration: number;
  depositedAt?: string | null;
  seller?: {
    id: string;
    displayName: string;
    walletAddress?: string | null;
  };
  buyer?: {
    id: string;
    displayName: string;
    walletAddress?: string | null;
  };
  digitalAsset?: {
    assetType?: string;
    encryptedContent?: string;
    encryptionIv?: string;
    authTag?: string;
    contentHash?: string;
    fileSizeBytes?: number | string;
    maxAccessLimit?: number;
    accessCount?: number;
  } | null;
}

const STATE_CONFIG: Record<
  DealState,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  PENDING: {
    label: "Chờ thanh toán",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-500/40",
    desc: "Đang chờ người mua chuyển tiền vào két giữ tiền an toàn qua VietQR.",
  },
  DEPOSITED: {
    label: "Tiền đã được giữ an toàn",
    bg: "bg-cyan-950/40",
    text: "text-cyan-400",
    border: "border-cyan-500/40",
    desc: "Tiền đã vào két an toàn. Thông tin bàn giao sẵn sàng mở để kiểm tra.",
  },
  IN_INSPECTION: {
    label: "Đang trong thời gian kiểm tra hàng",
    bg: "bg-blue-950/40",
    text: "text-blue-400",
    border: "border-blue-500/40",
    desc: "Người mua đang kiểm tra hàng. Hết thời gian kiểm tra sẽ tự động hoàn tất và chuyển tiền.",
  },
  SETTLED: {
    label: "Giao dịch hoàn tất - Đã nhận tiền",
    bg: "bg-emerald-950/40",
    text: "text-emerald-400",
    border: "border-emerald-500/40",
    desc: "Giao dịch thành công, tiền đã chuyển cho người bán.",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    bg: "bg-slate-800",
    text: "text-slate-300",
    border: "border-slate-700",
    desc: "Khoản tiền giữ an toàn đã được hoàn trả lại cho người mua.",
  },
  DISPUTED: {
    label: "Đang khiếu nại & xử lý",
    bg: "bg-rose-950/40",
    text: "text-rose-400",
    border: "border-rose-500/40",
    desc: "Trợ lý phân xử tự động đang xem xét bằng chứng và nhật ký bàn giao.",
  },
};

export default function DealRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const dealId = (params?.id as string) || "";

  const [deal, setDeal] = React.useState<DealDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    if (!dealId) return;

    async function fetchDeal() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient<DealDetail | { data: DealDetail }>(`/api/v1/deals/${dealId}`);
        if (!isMounted) return;
        const data = (res && "data" in res && res.data ? res.data : res) as DealDetail;
        setDeal(data);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Không thể tải thông tin giao dịch.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchDeal();

    return () => {
      isMounted = false;
    };
  }, [dealId]);

  const currentUserId = user?.id || "";
  const isBuyer = Boolean(currentUserId && currentUserId === deal?.buyer?.id);
  const isSeller = Boolean(currentUserId && currentUserId === deal?.seller?.id);

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState("");
  const [editAmount, setEditAmount] = React.useState<number | "">("");
  const [editDuration, setEditDuration] = React.useState<number>(43200);
  const [editDescription, setEditDescription] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (deal) {
      setEditTitle(deal.title || "");
      setEditAmount(Number(deal.amount) || 0);
      setEditDuration(deal.inspectionDuration || 43200);
      setEditDescription(deal.description || "");
    }
  }, [deal, isEditDialogOpen]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết Kèo để gửi cho Người mua!");
    }
  };

  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;
    if (!editTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề giao dịch.");
      return;
    }
    if (typeof editAmount !== "number" || editAmount <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ (> 0 VNĐ).");
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiClient<DealDetail | { data: DealDetail }>(`/api/v1/deals/${deal.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editTitle.trim(),
          amount: editAmount,
          inspectionDuration: editDuration,
          description: editDescription.trim(),
        }),
      });
      const data = (res && "data" in res && res.data ? res.data : res) as DealDetail;
      setDeal((prev) => (prev ? { ...prev, ...data } : data));
      setIsEditDialogOpen(false);
      toast.success("Cập nhật thông tin Kèo thành công!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật thông tin Kèo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOfferSubmit = async (newOffer: number) => {
    if (!deal) return;
    if (isSeller) {
      toast.error("Bạn không thể tự mua hoặc thương lượng sản phẩm của chính mình.");
      return;
    }
    toast.info("Đang cập nhật giá thỏa thuận và chuyển tiếp...");
    try {
      await apiClient(`/api/v1/deals/${deal.id}`, {
        method: "PATCH",
        body: JSON.stringify({ amount: newOffer }),
      });
    } catch {
      // Graceful fallback if offline or guest mode
    }
    toast.success(
      `Đã ghi nhận đề xuất trả giá ${newOffer.toLocaleString("vi-VN")} ₫. Chuyển sang thanh toán VietQR.`
    );
    router.push(`/user/deals/${deal.id}/checkout?amount=${newOffer}`);
  };

  const handleProceedToPayment = () => {
    if (!deal) return;
    if (isSeller) {
      toast.error("Bạn không thể tự mua hoặc thanh toán sản phẩm của chính mình.");
      return;
    }
    toast.info("Đang chuyển tiếp sang Cổng thanh toán VietQR PayOS...");
    router.push(`/user/deals/${deal.id}/checkout`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs font-mono">Đang đồng bộ dữ liệu giao dịch bảo vệ tự động...</p>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-slate-900/80 p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Không tìm thấy giao dịch</h2>
          <p className="text-xs text-slate-400">
            {error || `Mã giao dịch ${dealId} không tồn tại hoặc bạn không có quyền truy cập.`}
          </p>
          <Button asChild variant="outline" className="border-slate-700 text-xs">
            <Link href="/user/deals">Quay lại danh sách giao dịch</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stateCfg = STATE_CONFIG[deal.state] || STATE_CONFIG.PENDING;
  const amountNum = Number(deal.amount || 0);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 overflow-x-hidden">
      {/* Background radial gradient */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 blur-[140px] pointer-events-none" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Navigation & Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/user/deals"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Link>

          <div className="flex items-center gap-2">
            {isSeller && (
              <Badge className="bg-cyan-950/80 border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                Sản phẩm của bạn (Người bán)
              </Badge>
            )}
            <Badge
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border ${stateCfg.bg} ${stateCfg.text} ${stateCfg.border}`}
            >
              {stateCfg.label}
            </Badge>
          </div>
        </div>

        {/* Deal Header Overview */}
        <DealHeaderOverview deal={deal} />

        {/* Realtime Bargain Negotiation Slider (For Buyer) OR Seller Management Panel (For Seller) */}
        {deal.state === "PENDING" && (
          isSeller ? (
            <section className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      Khu Vực Quản Lý Của Người Bán
                      <Badge className="bg-cyan-950/60 border-cyan-500/30 text-cyan-300 text-[10px]">
                        Chủ Sở Hữu
                      </Badge>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Kèo đang mở niêm yết, chờ người mua đặt cọc qua két bảo chứng VietQR.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditDialogOpen(true)}
                    className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs h-9 gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="size-3.5 text-cyan-400" />
                    <span>Chỉnh Sửa Kèo</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCopyLink}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs h-9 gap-1.5 cursor-pointer shadow-md"
                  >
                    <Share2 className="size-3.5" />
                    <span>Chia Sẻ Link</span>
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex items-start gap-3">
                <AlertCircle className="size-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-amber-300">
                    Chính sách chống tự mua hàng (Anti-Self-Purchase)
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    Bạn là người bán của sản phẩm này. Giao diện thanh toán đặt cọc đã được chuyển sang chế độ quản lý Kèo để đảm bảo tính minh bạch. Hãy gửi liên kết này cho người mua của bạn.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Giá niêm yết hiện tại</span>
                  <span className="font-mono font-bold text-sm text-cyan-400">
                    {amountNum.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Thời gian kiểm tra</span>
                  <span className="font-mono font-bold text-sm text-slate-200">
                    {Math.round((deal.inspectionDuration || 43200) / 3600)} Giờ
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Người mua chỉ định</span>
                  <span className="font-semibold text-xs text-slate-200 truncate block">
                    {deal.buyer?.displayName || "Đang mở công khai (Bất kỳ ai)"}
                  </span>
                </div>
              </div>
            </section>
          ) : (
            <section className="space-y-2">
              <BargainSlider
                dealId={deal.id}
                basePrice={amountNum}
                floorPrice={Math.round(amountNum * 0.7)}
                currentUserId={currentUserId}
                isBuyer={isBuyer}
                onOfferSubmit={handleOfferSubmit}
              />
            </section>
          )
        )}

        {/* Digital Vault Locked Status Card */}
        <DealVaultStatusCard
          dealState={deal.state}
          digitalAsset={deal.digitalAsset}
        />

        {/* Primary Call to Action */}
        <div className="pt-2">
          {deal.state === "PENDING" ? (
            isSeller ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={() => setIsEditDialogOpen(true)}
                    className="min-h-12 text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    Chỉnh Sửa Thông Tin Kèo
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCopyLink}
                    className="min-h-12 text-sm font-bold bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/40 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Sao Chép Link Mời Người Mua
                  </Button>
                </div>
                <p className="text-center text-[11px] text-slate-400">
                  🛡️ Bạn là người bán của sản phẩm này. Form thanh toán đặt cọc đã được vô hiệu hóa để bảo vệ tính toàn vẹn của hợp đồng bảo chứng.
                </p>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="w-full min-h-13 text-base font-extrabold bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <QrCode className="w-5 h-5" />
                  Xác Nhận &amp; Mở Thanh Toán VietQR
                </Button>
                <p className="text-center text-[11px] text-slate-400 mt-2">
                  Tiền được giữ an toàn 100%. Tiền chỉ chuyển cho người bán khi bạn kiểm tra hàng hài lòng.
                </p>
              </>
            )
          ) : deal.state === "IN_INSPECTION" || deal.state === "DEPOSITED" ? (
            <Button
              asChild
              className="w-full min-h-13 text-base font-extrabold bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Link href={`/user/deals/${deal.id}/vault`}>
                <KeyRound className="w-5 h-5" />
                {isSeller ? "Quản Lý Kho Bàn Giao & Nghiệm Thu" : "Truy Cập Kho Lưu Trữ Nhận Hàng"}
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              className="w-full min-h-12 text-sm border-slate-700 bg-slate-900 text-slate-200"
            >
              <Link href={`/user/deals/${deal.id}/vault`}>
                Xem Nhật Ký Bàn Giao
              </Link>
            </Button>
          )}
        </div>

        {/* Seller Deal Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="size-5 text-cyan-400" />
                Chỉnh Sửa Thông Tin Kèo
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveDeal} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tiêu đề giao dịch</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Giá bán (VNĐ)</label>
                  <Input
                    type="number"
                    min={1000}
                    step={10000}
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="bg-slate-950 border-slate-800 text-slate-100 text-sm font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Thời gian kiểm tra</label>
                  <select
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                    className="w-full h-9 rounded-md border border-slate-800 bg-slate-950 px-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value={21600}>6 Giờ (Nhanh)</option>
                    <option value={43200}>12 Giờ (Tiêu chuẩn)</option>
                    <option value={86400}>24 Giờ (Khuyên dùng)</option>
                    <option value={172800}>48 Giờ (Hàng vật lý)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-y"
                  placeholder="Mô tả phạm vi bàn giao..."
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-slate-700 text-slate-300 text-xs"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="bg-linear-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs"
                >
                  {isSaving ? "Đang lưu..." : "Lưu Thay Đổi"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
