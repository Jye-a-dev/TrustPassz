"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DispatchAuditLog } from "@/types/emergency-alert";

interface EmergencyLogDetailModalProps {
  log: DispatchAuditLog | null;
  onClose: () => void;
  renderStatusBadge: (status: string) => React.ReactNode;
  renderLatencyBadge: (latencyMs: number) => React.ReactNode;
  parseRecipients: (recipients: unknown) => string[];
}

export function EmergencyLogDetailModal({
  log,
  onClose,
  renderStatusBadge,
  renderLatencyBadge,
  parseRecipients,
}: EmergencyLogDetailModalProps) {
  return (
    <Dialog open={Boolean(log)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-xl p-6 text-xs">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="size-4 text-slate-700" />
            <DialogTitle className="text-sm font-bold text-slate-900 font-mono">
              Chi Tiết Dispatch Alert #{log?.id.slice(0, 8)}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 pt-1">
            Toàn văn thông số kỹ thuật sự cố được lưu trữ trong bảng audit_logs
          </DialogDescription>
        </DialogHeader>

        {log && (
          <div className="space-y-3 my-2 text-xs font-mono">
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans font-medium">Alert Type:</span>
                <span className="text-indigo-600 font-bold">{log.alertType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans font-medium">Trạng thái:</span>
                <div className="mt-0.5">{renderStatusBadge(log.status)}</div>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans font-medium">Độ trễ dispatch:</span>
                <div className="mt-0.5">{renderLatencyBadge(log.latencyMs)}</div>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans font-medium">Triggered By:</span>
                <span className="text-slate-800 font-medium">{log.triggeredBy}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-600 font-sans font-medium block mb-1">Tiêu đề (Subject):</span>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-[11px]">
                {log.subject}
              </div>
            </div>

            <div>
              <span className="text-slate-600 font-sans font-medium block mb-1">Danh sách người nhận:</span>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 max-h-24 overflow-y-auto text-[11px]">
                {parseRecipients(log.recipients).join(", ")}
              </div>
            </div>

            {log.errorMessage && (
              <div>
                <span className="text-rose-700 font-sans font-bold block mb-1">Lỗi / Stack trace ghi nhận:</span>
                <pre className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] whitespace-pre-wrap max-h-36 overflow-y-auto font-mono">
                  {log.errorMessage}
                </pre>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
