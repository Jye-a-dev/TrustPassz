"use client";

import * as React from "react";
import {
  Mail,
  Plus,
  Trash2,
  Power,
  PowerOff,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { EmergencyEmailItem } from "@/types/emergency-alert";
import { TwoFactorConfirmModal } from "./two-factor-confirm-modal";
import { AddEmergencyEmailDialog } from "./add-emergency-email-dialog";

interface EmergencyEmailTableProps {
  onListChanged?: () => void;
}

export function EmergencyEmailTable({ onListChanged }: EmergencyEmailTableProps) {
  const [emails, setEmails] = React.useState<EmergencyEmailItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Add Dialog state
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState("");

  // 2FA action state
  const [pendingAction, setPendingAction] = React.useState<{
    type: "ADD" | "DELETE" | "TOGGLE";
    targetId?: string;
    targetEmail?: string;
    nextActive?: boolean;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const fetchEmails = React.useCallback(async () => {
    try {
      const res = await apiClient<{ success: boolean; data: EmergencyEmailItem[] }>(
        "/api/v1/admin/emergency-alert/emails"
      );
      if (res && res.data) {
        setEmails(res.data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể tải danh sách email";
      toast.error("Lỗi khi tải danh sách email cứu hộ", { description: msg });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchEmails();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Đã sao chép email vào bộ nhớ tạm");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddSubmit = (email: string, label: string) => {
    setNewLabel(label);
    setPendingAction({
      type: "ADD",
      targetEmail: email,
    });
  };

  const handleOpenDelete = (item: EmergencyEmailItem) => {
    setPendingAction({
      type: "DELETE",
      targetId: item.id,
      targetEmail: item.email,
    });
  };

  const handleOpenToggle = (item: EmergencyEmailItem) => {
    setPendingAction({
      type: "TOGGLE",
      targetId: item.id,
      targetEmail: item.email,
      nextActive: !item.isActive,
    });
  };

  const handleConfirm2Fa = async (pin: string) => {
    if (!pendingAction) return;
    setIsActionLoading(true);

    try {
      if (pendingAction.type === "ADD") {
        await apiClient("/api/v1/admin/emergency-alert/emails", {
          method: "POST",
          body: JSON.stringify({
            email: pendingAction.targetEmail,
            label: newLabel.trim(),
            pin2FA: pin,
          }),
        });
        toast.success(`Đã thêm ${pendingAction.targetEmail} vào danh sách nhận cảnh báo`);
      } else if (pendingAction.type === "DELETE" && pendingAction.targetId) {
        await apiClient(`/api/v1/admin/emergency-alert/emails/${pendingAction.targetId}`, {
          method: "DELETE",
          body: JSON.stringify({ pin2FA: pin }),
        });
        toast.success(`Đã xóa ${pendingAction.targetEmail} khỏi danh sách cứu hộ`);
      } else if (pendingAction.type === "TOGGLE" && pendingAction.targetId) {
        await apiClient(`/api/v1/admin/emergency-alert/emails/${pendingAction.targetId}`, {
          method: "PATCH",
          body: JSON.stringify({
            isActive: pendingAction.nextActive,
            pin2FA: pin,
          }),
        });
        toast.success(
          `Đã ${pendingAction.nextActive ? "kích hoạt" : "vô hiệu hóa"} nhận thông báo cho ${pendingAction.targetEmail}`
        );
      }

      setPendingAction(null);
      await fetchEmails();
      if (onListChanged) onListChanged();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      toast.error("Lỗi xác thực", { description: msg });
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0F172A] p-4 rounded-xl border border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
            <Mail className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 font-mono tracking-wide">
              Danh sách Email Cứu hộ Khẩn cấp
            </h3>
            <p className="text-xs text-slate-400">
              Các quản trị viên nhận email Cyber-Alert tức thì khi xảy ra lỗi nghiêm trọng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="min-h-[44px] min-w-[44px] border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`size-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Làm mới
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="min-h-[44px] min-w-[44px] bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold font-mono tracking-tight cursor-pointer"
          >
            <Plus className="size-4 mr-1.5" />
            Thêm Email Nhận Tin
          </Button>
        </div>
      </div>

      {/* Emails Table */}
      <div className="rounded-xl border border-[#1E293B] bg-[#0F172A] overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-900/80 border-b border-[#1E293B]">
            <TableRow className="border-b border-slate-800 hover:bg-transparent">
              <TableHead className="font-mono text-xs uppercase text-slate-400 py-3.5">
                Email Đích
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-slate-400">
                Vai trò / Nhãn
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-slate-400">
                Trạng thái
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-slate-400 hidden md:table-cell">
                Người thêm
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-slate-400 text-right pr-4">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <TableRow key={idx} className="border-b border-slate-800/60">
                  <TableCell><Skeleton className="h-4 w-44 bg-slate-800" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28 bg-slate-800" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 bg-slate-800" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24 bg-slate-800" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto bg-slate-800" /></TableCell>
                </TableRow>
              ))
            ) : emails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                  <AlertCircle className="size-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-mono">Chưa có email nào trong danh sách cứu hộ.</p>
                  <p className="text-xs text-slate-600 mt-1">Bấm "Thêm Email Nhận Tin" để thiết lập.</p>
                </TableCell>
              </TableRow>
            ) : (
              emails.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors"
                >
                  <TableCell className="py-3 font-mono text-xs text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-100">{item.email}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.email, item.id)}
                        className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                        title="Sao chép email"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-slate-300 font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-300">
                      {item.label}
                    </span>
                  </TableCell>

                  <TableCell>
                    {item.isActive ? (
                      <Badge variant="emerald" dot pulse>
                        ACTIVE
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        DISABLED
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-slate-400 font-mono hidden md:table-cell">
                    {item.addedBy || "SUPER_ADMIN"}
                  </TableCell>

                  <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenToggle(item)}
                        title={item.isActive ? "Tạm ngưng nhận tin" : "Bật nhận tin"}
                        className={`min-h-[44px] min-w-[44px] p-2 ${
                          item.isActive
                            ? "text-amber-400 hover:bg-amber-950/40 hover:text-amber-300"
                            : "text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300"
                        }`}
                      >
                        {item.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDelete(item)}
                        title="Xóa khỏi danh sách"
                        className="min-h-[44px] min-w-[44px] p-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Email Dialog */}
      <AddEmergencyEmailDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleAddSubmit}
      />

      {/* 2FA Confirmation Modal */}
      <TwoFactorConfirmModal
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        isLoading={isActionLoading}
        title={
          pendingAction?.type === "DELETE"
            ? "Xác nhận xóa Email Cứu hộ"
            : pendingAction?.type === "TOGGLE"
            ? "Xác nhận đổi trạng thái nhận tin"
            : "Xác nhận thêm Email Cứu hộ"
        }
        description={
          pendingAction?.type === "DELETE"
            ? `Bạn chuẩn bị xóa email "${pendingAction.targetEmail}" khỏi kênh cảnh báo khẩn cấp. Vui lòng nhập mã PIN 2FA.`
            : pendingAction?.type === "TOGGLE"
            ? `Bạn chuẩn bị ${pendingAction.nextActive ? "kích hoạt lại" : "tạm ngưng"} thông báo cho "${pendingAction.targetEmail}". Vui lòng nhập mã PIN 2FA.`
            : `Nhập mã PIN 2FA để lưu email "${pendingAction?.targetEmail}" vào cơ sở dữ liệu.`
        }
        confirmLabel={
          pendingAction?.type === "DELETE"
            ? "Xác nhận Xóa Email"
            : pendingAction?.type === "TOGGLE"
            ? "Xác nhận Thay đổi"
            : "Xác nhận Thêm Email"
        }
        onConfirm={handleConfirm2Fa}
      />
    </div>
  );
}
