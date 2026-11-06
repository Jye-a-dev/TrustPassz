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
import { DispatchAuditLog } from "@/types/emergency-alert";

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
      <DialogContent className="sm:max-w-137.5 bg-cyber-card border-cyber-border text-slate-100 p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-100 font-mono flex items-center gap-2">
            <FileText className="size-4 text-cyan-400" />
            Chi tiết Dispatch Alert #{log?.id.slice(0, 8)}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Toàn văn thông số kỹ thuật sự cố được lưu trữ trong bảng audit_logs
          </DialogDescription>
        </DialogHeader>

        {log && (
          <div className="space-y-3 my-2 text-xs font-mono">
            <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Alert Type:</span>
                <span className="text-cyan-400 font-bold">{log.alertType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Trạng thái:</span>
                <span>{renderStatusBadge(log.status)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Độ trễ dispatch:</span>
                <span>{renderLatencyBadge(log.latencyMs)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Triggered By:</span>
                <span className="text-slate-200">{log.triggeredBy}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Tiêu đề (Subject):</span>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-200">
                {log.subject}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Danh sách người nhận:</span>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 max-h-24 overflow-y-auto">
                {parseRecipients(log.recipients).join(", ")}
              </div>
            </div>

            {log.errorMessage && (
              <div>
                <span className="text-rose-400 block mb-1 font-bold">Lỗi / Stack trace ghi nhận:</span>
                <div className="p-2.5 rounded bg-rose-950/30 border border-rose-800/50 text-rose-300 whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {log.errorMessage}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t border-slate-800 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="min-h-11 min-w-11 border-slate-700 text-slate-300 hover:text-white"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

