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
        return <Badge className="bg-amber-950/60 text-amber-400 border-amber-800 text-[10px]">ĐỔI VAI TRÒ</Badge>;
      case "FREEZE_USER":
        return <Badge className="bg-rose-950/60 text-rose-400 border-rose-800 text-[10px]">ĐÓNG BĂNG VÍ</Badge>;
      case "UNFREEZE_USER":
        return <Badge className="bg-emerald-950/60 text-emerald-400 border-emerald-800 text-[10px]">MỞ KHÓA VÍ</Badge>;
      case "DISPUTE_OVERRIDE":
        return <Badge className="bg-cyan-950/60 text-cyan-400 border-cyan-800 text-[10px]">OVERRIDE TRANH CHẤP</Badge>;
      default:
        return <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">{action}</Badge>;
    }
  };

  return (
    <Card className="border-slate-800 bg-[#0F172A] p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4 mb-4 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
            <History className="size-5" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-semibold text-white">
              4. Nhật Ký Thao Tác & Can Thiệp Cá Nhân (Audit Trail)
            </h3>
            <p className="text-xs text-slate-400">
              15 hành vi quản trị gần nhất do tài khoản này thực thi trên hệ thống.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs(true)}
          disabled={isLoading}
          className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white min-h-[44px] text-xs gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          <span>Làm Mới</span>
        </Button>
      </div>

      <div className="rounded-lg border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/90">
            <TableRow className="border-slate-800">
              <TableHead className="text-xs font-mono text-slate-400">Thời Điểm</TableHead>
              <TableHead className="text-xs font-mono text-slate-400">Hành Động</TableHead>
              <TableHead className="text-xs font-mono text-slate-400">Đối Tượng</TableHead>
              <TableHead className="text-xs font-mono text-slate-400">Lý Do Kiểm Toán</TableHead>
              <TableHead className="text-xs font-mono text-slate-400 text-right">IP Truy Cập</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-400 text-xs font-mono">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="size-5 animate-spin text-cyan-400" />
                    <span>Đang tải nhật ký kiểm toán cá nhân...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-slate-400 text-xs font-mono">
                  Chưa ghi nhận hành động quản trị can thiệp nào từ tài khoản này.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="border-slate-800/60 hover:bg-slate-900/40">
                  <TableCell className="text-xs font-mono text-slate-300 py-3">
                    {new Date(log.createdAt).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell>{getActionBadge(log.actionType)}</TableCell>
                  <TableCell className="text-xs font-mono text-cyan-400">
                    {log.targetEntityId.slice(0, 10)}...
                  </TableCell>
                  <TableCell className="text-xs text-slate-300 max-w-xs truncate">
                    {log.auditReason}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-400 text-right">
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

