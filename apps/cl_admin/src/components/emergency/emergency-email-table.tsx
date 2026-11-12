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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Mail className="size-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Danh sách Email Cứu hộ Khẩn cấp
            </h3>
            <p className="text-[11px] text-slate-400">
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
            className="h-8.5 px-3 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs shadow-2xs font-medium"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-slate-900" : "text-slate-500"}`} />
            Làm mới
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="h-8.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-2xs cursor-pointer"
          >
            <Plus className="size-3.5 mr-1.5" />
            Thêm Email Nhận Tin
          </Button>
        </div>
      </div>

      {/* Emails Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow className="border-b border-slate-200 hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-2.5 px-4">
                Email Đích
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-2.5 px-4">
                Vai trò / Nhãn
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-2.5 px-4">
                Trạng thái
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-2.5 px-4 hidden md:table-cell">
                Người thêm
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-2.5 px-4 text-right pr-4">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <TableRow key={idx} className="border-b border-slate-100">
                  <TableCell className="px-4"><Skeleton className="h-4 w-44 bg-slate-100" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-4 w-28 bg-slate-100" /></TableCell>
                  <TableCell className="px-4"><Skeleton className="h-4 w-20 bg-slate-100" /></TableCell>
                  <TableCell className="hidden md:table-cell px-4"><Skeleton className="h-4 w-24 bg-slate-100" /></TableCell>
                  <TableCell className="text-right px-4"><Skeleton className="h-8 w-20 ml-auto bg-slate-100" /></TableCell>
                </TableRow>
              ))
            ) : emails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-slate-500">
                  <AlertCircle className="size-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-xs font-mono font-semibold text-slate-700">Chưa có email nào trong danh sách cứu hộ.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Bấm &quot;Thêm Email Nhận Tin&quot; để thiết lập.</p>
                </TableCell>
              </TableRow>
            ) : (
              emails.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                >
                  <TableCell className="py-3 px-4 font-mono text-xs text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{item.email}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.email, item.id)}
                        className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
                        title="Sao chép email"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-slate-600 font-mono px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px]">
                      {item.label}
                    </span>
                  </TableCell>

                  <TableCell className="px-4">
                    {item.isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-medium font-mono">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                        <span className="size-1.5 rounded-full bg-slate-400" />
                        Disabled
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-slate-500 font-mono hidden md:table-cell px-4">
                    {item.addedBy || "SUPER_ADMIN"}
                  </TableCell>

                  <TableCell className="text-right pr-4 py-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenToggle(item)}
                        title={item.isActive ? "Tạm ngưng nhận tin" : "Bật nhận tin"}
                        className={`h-8 w-8 p-0 ${
                          item.isActive
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {item.isActive ? <PowerOff className="size-3.5" /> : <Power className="size-3.5" />}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDelete(item)}
                        title="Xóa khỏi danh sách"
                        className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="size-3.5" />
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
