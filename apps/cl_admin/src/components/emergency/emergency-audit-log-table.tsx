"use client";

import * as React from "react";
import { Activity, ChevronLeft, ChevronRight, Clock, Eye, FileText, RefreshCw } from "lucide-react";
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
import { DispatchAuditLog, DispatchLogsResponse } from "@/types/emergency-alert";
import { EmergencyLogDetailModal } from "./emergency-log-detail-modal";

interface EmergencyAuditLogTableProps {
  refreshTrigger?: number;
}

export function EmergencyAuditLogTable({ refreshTrigger }: EmergencyAuditLogTableProps) {
  const [logs, setLogs] = React.useState<DispatchAuditLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [typeFilter] = React.useState<string>("");

  // Error inspection dialog
  const [selectedLog, setSelectedLog] = React.useState<DispatchAuditLog | null>(null);

  const fetchLogs = React.useCallback(async () => {
    try {
      const params: Record<string, string | number> = {
        page,
        limit,
      };
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }
      if (typeFilter.trim()) {
        params.alertType = typeFilter.trim();
      }

      const res = await apiClient<DispatchLogsResponse>(
        "/api/v1/admin/emergency-alert/logs",
        { params }
      );

      if (res && res.data) {
        setLogs(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể tải nhật ký gửi cảnh báo";
      toast.error("Lỗi tải Audit Log", { description: msg });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, limit, statusFilter, typeFilter]);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchLogs();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchLogs, refreshTrigger]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLogs();
  };

  const parseRecipients = (recipients: unknown): string[] => {
    if (Array.isArray(recipients)) {
      return recipients.map((r) => String(r));
    }
    if (typeof recipients === "string") {
      try {
        const parsed = JSON.parse(recipients);
        if (Array.isArray(parsed)) return parsed.map((r) => String(r));
        return [recipients];
      } catch {
        return [recipients];
      }
    }
    return [];
  };

  const getStatusBadge = (status: string) => {
    if (status === "SENT") {
      return (
        <Badge variant="emerald" dot pulse>
          SENT
        </Badge>
      );
    }
    return (
      <Badge variant="rose" dot>
        FAILED
      </Badge>
    );
  };

  const getLatencyBadge = (latencyMs: number) => {
    if (latencyMs < 1000) {
      return (
        <span className="font-mono text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
          {latencyMs}ms
        </span>
      );
    }
    if (latencyMs <= 2000) {
      return (
        <span className="font-mono text-xs text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
          {latencyMs}ms
        </span>
      );
    }
    return (
      <span className="font-mono text-xs text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded">
        {latencyMs}ms
      </span>
    );
  };

  const getAlertTypeBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case "TEST":
        return <Badge variant="cyan">TEST</Badge>;
      case "CRITICAL":
        return <Badge variant="destructive">CRITICAL</Badge>;
      case "RELAYER_GAS":
        return <Badge variant="amber">RELAYER GAS</Badge>;
      case "ONCHAIN_REVERT":
        return <Badge variant="rose">ONCHAIN REVERT</Badge>;
      case "DB_FAILOVER":
        return <Badge variant="amber">DB FAILOVER</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "short",
        timeStyle: "medium",
      }).format(d);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter and control bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Activity className="size-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Nhật ký Dispatch Mail Cảnh báo (Audit Log)
            </h3>
            <p className="text-[11px] text-slate-400">
              Lịch sử toàn bộ các lần phát tín hiệu khẩn cấp, benchmark độ trễ và mã lỗi
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex items-center rounded-lg bg-slate-100 border border-slate-200 p-1">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              ALL
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("SENT");
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                statusFilter === "SENT"
                  ? "bg-white text-emerald-700 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              SENT
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("FAILED");
                setPage(1);
              }}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                statusFilter === "FAILED"
                  ? "bg-white text-rose-700 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              FAILED
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8.5 px-3 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs shadow-2xs font-medium"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-slate-900" : "text-slate-500"}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow className="border-b border-slate-200 hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider py-2.5 px-4">
                Thời gian (VN)
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-slate-400">
                Loại sự cố (Type)
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-slate-400">
                Danh sách người nhận
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-slate-400">
                Trạng thái
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-slate-400">
                Độ trễ (SLA &lt; 2s)
              </TableHead>
              <TableHead className="font-mono text-xs uppercase text-slate-400 text-right pr-4">
                Chi tiết
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <TableRow key={idx} className="border-b border-slate-800/60">
                  <TableCell><Skeleton className="h-4 w-28 bg-slate-800" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 bg-slate-800" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40 bg-slate-800" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 bg-slate-800" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 bg-slate-800" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto bg-slate-800" /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-slate-500">
                  <FileText className="size-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm font-mono">Chưa có nhật ký phát thông báo nào.</p>
                  <p className="text-xs text-slate-600 mt-1">Bấm &quot;Test Send Emergency Alert&quot; để khởi tạo bài kiểm tra.</p>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((item) => {
                const recipientList = parseRecipients(item.recipients);
                return (
                  <TableRow
                    key={item.id}
                    className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors"
                  >
                    <TableCell className="py-3 font-mono text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3 text-slate-500" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </TableCell>

                    <TableCell>{getAlertTypeBadge(item.alertType)}</TableCell>

                    <TableCell className="text-xs font-mono text-slate-300">
                      <div className="flex items-center gap-1 flex-wrap max-w-70">
                        {recipientList.slice(0, 2).map((r, i) => (
                          <span
                            key={i}
                            className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[11px] text-slate-300"
                          >
                            {r}
                          </span>
                        ))}
                        {recipientList.length > 2 && (
                          <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/50 px-1 py-0.5 rounded">
                            +{recipientList.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>{getStatusBadge(item.status)}</TableCell>

                    <TableCell>{getLatencyBadge(item.latencyMs)}</TableCell>

                    <TableCell className="text-right pr-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(item)}
                        className="min-h-11 min-w-11 p-2 text-cyan-400 hover:bg-cyan-950/40 hover:text-cyan-300"
                        title="Xem chi tiết bản ghi"
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 text-xs font-mono text-slate-400">
        <div>
          Tổng số bản ghi: <span className="text-slate-200 font-bold">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>
            Trang {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="min-h-11 min-w-11 p-2 border-slate-700 bg-slate-800/40 disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="min-h-11 min-w-11 p-2 border-slate-700 bg-slate-800/40 disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Log Detail Modal */}
      <EmergencyLogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        renderStatusBadge={getStatusBadge}
        renderLatencyBadge={getLatencyBadge}
        parseRecipients={parseRecipients}
      />
    </div>
  );
}
