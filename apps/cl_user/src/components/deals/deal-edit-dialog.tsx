"use client";

import * as React from "react";
import { Edit3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { type DealDetail } from "./deal-room.types";

interface DealEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: DealDetail;
  onDealUpdated: (updatedDeal: DealDetail) => void;
}

export function DealEditDialog({
  open,
  onOpenChange,
  deal,
  onDealUpdated,
}: DealEditDialogProps) {
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
  }, [deal, open]);

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
      const res = await apiClient<DealDetail | { data: DealDetail }>(
        `/api/v1/deals/${deal.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: editTitle.trim(),
            amount: editAmount,
            inspectionDuration: editDuration,
            description: editDescription.trim(),
          }),
        }
      );
      const data = (res && "data" in res && res.data ? res.data : res) as DealDetail;
      onDealUpdated(data);
      onOpenChange(false);
      toast.success("Cập nhật thông tin Kèo thành công!");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Không thể cập nhật thông tin Kèo."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-200 bg-white text-slate-900 max-w-md rounded-2xl shadow-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="size-5 text-rose-500" />
            Chỉnh Sửa Thông Tin Giao Dịch
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSaveDeal} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Tiêu đề giao dịch
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-white border-slate-300 text-slate-900 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-100 min-h-[44px] rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Giá bán (VNĐ)
              </label>
              <Input
                type="number"
                min={1000}
                step={10000}
                value={editAmount}
                onChange={(e) =>
                  setEditAmount(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="bg-white border-slate-300 text-slate-900 text-sm font-mono focus:border-rose-500 focus:ring-2 focus:ring-rose-100 min-h-[44px] rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Thời gian kiểm tra
              </label>
              <select
                value={editDuration}
                onChange={(e) => setEditDuration(Number(e.target.value))}
                className="w-full h-11 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              >
                <option value={21600}>6 Giờ (Nhanh)</option>
                <option value={43200}>12 Giờ (Tiêu chuẩn)</option>
                <option value={86400}>24 Giờ (Khuyên dùng)</option>
                <option value={172800}>48 Giờ (Hàng vật lý)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Mô tả chi tiết
            </label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 resize-y"
              placeholder="Mô tả phạm vi bàn giao..."
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium min-h-[44px] rounded-xl px-4"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs border border-rose-600 shadow-sm min-h-[44px] rounded-xl px-5"
            >
              {isSaving ? "Đang lưu..." : "Lưu Thay Đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

