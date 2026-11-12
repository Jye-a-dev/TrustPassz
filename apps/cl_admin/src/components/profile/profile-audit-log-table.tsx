"use client";

import * as React from "react";
import { History, Shield, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminAuthStore } from "@/lib/admin-auth-store";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface AuditLogItem {
  id: string;
  actionType: string;
  targetEntityId: string;
  auditReason: string;
  txHash?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export function ProfileAuditLogTable() {
  const { user } = useAdminAuthStore();
  const [logs, setLogs] = React.useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchLogs = React.useCallback(async (showToast = false) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { limit: "15" };
      if (user?.id) params.adminId = user.id;

      const res = await apiClient<{ data: AuditLogItem[] }>(
        "/api/v1/admin/audit-logs",
        { params }
      );
      setLogs(res.data || []);
      if (showToast) toast.success("Đã làm mới nhật ký kiểm toán cá nhân");
    } catch {
      // Fallback empty logs if server route temporarily offline
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case "ROLE_CHANGE":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">ĐỔI VAI TRÒ</span>;
      case "FREEZE_USER":
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">ĐÓNG BĂNG VÍ</span>;
      case "UNFREEZE_USER":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">MỞ KHÓA VÍ</span>;
      case "DISPUTE_OVERRIDE":
        return <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">OVERRIDE TRANH CHẤP</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] px-2 py-0.5 rounded-full">{action}</span>;
    }
  };

  return (
    <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <History className="size-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              4. Nhật Ký Thao Tác &amp; Can Thiệp Cá Nhân (Audit Trail)
            </h3>
            <p className="text-[11px] text-slate-400">
              15 hành vi quản trị gần nhất do tài khoản này thực thi trên hệ thống.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs(true)}
          disabled={isLoading}
          className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 h-8 text-xs gap-1.5 shadow-2xs font-medium self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-slate-900" : "text-slate-500"}`} />
          <span>Làm Mới</span>
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow className="border-slate-200 hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-2.5 px-4">Thời Điểm</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-2.5 px-4">Hành Động</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-2.5 px-4">Đối Tượng</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-2.5 px-4">Lý Do Kiểm Toán</TableHead>
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-2.5 px-4 text-right">IP Truy Cập</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 text-xs font-mono">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400 text-xs font-mono">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="size-5 animate-spin text-slate-700" />
                    <span>Đang tải nhật ký kiểm toán cá nhân...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-slate-500 text-xs font-mono">
                  Chưa ghi nhận hành động quản trị can thiệp nào từ tài khoản này.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <TableCell className="text-xs font-mono text-slate-600 py-3 px-4">
                    {new Date(log.createdAt).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell className="py-3 px-4">{getActionBadge(log.actionType)}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-900 font-semibold py-3 px-4">
                    {log.targetEntityId.slice(0, 10)}...
                  </TableCell>
                  <TableCell className="text-xs font-sans text-slate-600 max-w-xs truncate py-3 px-4">
                    {log.auditReason}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-400 text-right py-3 px-4">
                    {log.ipAddress || "127.0.0.1"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

