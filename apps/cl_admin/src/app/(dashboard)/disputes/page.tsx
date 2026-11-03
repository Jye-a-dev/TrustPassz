"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldAlert, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CyberDataTable, type ColumnDef } from "@/components/ui/cyber-data-table";
import type { DisputeLog } from "@/types";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

const STATUS_FILTERS = ["ALL", "ADMIN_ESCALATED", "OPENED"] as const;

export default function DisputesPage() {
  const [disputes, setDisputes] = React.useState<DisputeLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(0);
  const pageSize = 15;

  React.useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    apiClient<{ data: DisputeLog[]; meta: unknown }>("/api/v1/disputes", {
      params: {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 50,
      },
    })
      .then((res) => {
        if (!ignore) {
          setDisputes(res.data || []);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Lỗi truy vấn danh sách tranh chấp";
          toast.error(msg);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [statusFilter]);

  const filteredDisputes = React.useMemo(() => {
    return disputes.filter((d) => {
      const matchesSearch =
        d.reason.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        (d.deal?.title || "").toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [disputes, search]);

  const columns: ColumnDef<DisputeLog>[] = [
    {
      key: "deal",
      header: "Kèo Bị Khiếu Nại",
      className: "w-72",
      cell: (dispute) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-200 line-clamp-1">
            {dispute.deal?.title || "Escrow Deal"}
          </p>
          <p className="font-mono text-[10px] text-slate-500">ID: {dispute.id}</p>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Lý do khiếu nại",
      className: "max-w-[260px]",
      cell: (dispute) => (
        <p className="text-xs text-slate-300 line-clamp-2">{dispute.reason}</p>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: (dispute) => (
        <Badge
          variant={dispute.status === "ADMIN_ESCALATED" ? "amber" : "cyan"}
          dot
          pulse={dispute.status === "ADMIN_ESCALATED"}
          className="font-mono text-[10px]"
        >
          {dispute.status}
        </Badge>
      ),
    },
    {
      key: "confidence",
      header: "Chỉ số AI Confidence",
      cell: (dispute) => {
        const conf = dispute.aiConfidenceScore ?? 0.5;
        const isUnderThreshold = conf < 0.75;
        return (
          <div className="flex items-center space-x-1.5">
            <span
              className={`font-mono font-bold text-xs ${
                isUnderThreshold ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {(conf * 100).toFixed(0)}%
            </span>
            <Badge
              variant={isUnderThreshold ? "amber" : "emerald"}
              className="text-[10px] py-0 px-1.5 font-mono"
            >
              {isUnderThreshold ? "Cần Admin thẩm định" : "AI Tin cậy"}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "verdict",
      header: "Đề xuất AI",
      cell: (dispute) => {
        const verdictVariant =
          dispute.aiVerdict === "APPROVE_PAYOUT"
            ? "emerald"
            : dispute.aiVerdict === "TRIGGER_REFUND"
            ? "rose"
            : "amber";
        return (
          <Badge variant={verdictVariant} className="font-mono text-[10px]">
            {dispute.aiVerdict || "ESCALATE"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: <span className="block text-right">Phân xử</span>,
      className: "text-right",
      cell: (dispute) => (
        <Link href={`/disputes/${dispute.dealId}`}>
          <Button
            size="sm"
            className="h-9 px-3 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium gap-1"
          >
            <span>Thẩm định</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <ShieldAlert className="size-6 text-amber-400" />
            Dispute Queue: Hàng Đợi Tranh Chấp
          </h2>
          <p className="text-xs text-slate-400">
            Tổng hợp khiếu nại mở và các vụ việc AI chuyển giao cần Trọng tài viên thẩm định.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="amber" className="text-xs font-mono">
            {filteredDisputes.length} Vụ việc đang chờ
          </Badge>
        </div>
      </div>

      {/* State Filter Tabs */}
      <Tabs
        value={statusFilter}
        onValueChange={(val) => {
          setStatusFilter(val);
          setPage(0);
        }}
      >
        <TabsList>
          {STATUS_FILTERS.map((st) => (
            <TabsTrigger key={st} value={st}>
              {st}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Disputes Queue Table */}
      <CyberDataTable
        data={filteredDisputes}
        columns={columns}
        isLoading={isLoading}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm theo nội dung khiếu nại, mã Deal hoặc Dispute ID..."
        emptyMessage="Không có vụ việc tranh chấp nào trong hàng đợi."
        pagination={{
          pageIndex: page,
          pageSize,
          totalCount: filteredDisputes.length,
          onPageChange: setPage,
        }}
        renderMobileCard={(dispute) => (
          <div className="rounded-xl border border-slate-800 bg-[#0B0F17] p-3.5 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <p className="font-medium text-slate-200 text-xs line-clamp-1">
                  {dispute.deal?.title || "Escrow Deal"}
                </p>
                <p className="font-mono text-[10px] text-slate-500">ID: {dispute.id.slice(0, 8)}...</p>
              </div>
              <Badge
                variant={dispute.status === "ADMIN_ESCALATED" ? "amber" : "cyan"}
                dot
                className="text-[10px]"
              >
                {dispute.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-300 line-clamp-2">{dispute.reason}</p>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
              <span className="font-mono text-[11px] text-slate-400">
                AI Conf: <strong className="text-emerald-400">{((dispute.aiConfidenceScore ?? 0.5) * 100).toFixed(0)}%</strong>
              </span>
              <Link href={`/disputes/${dispute.dealId}`}>
                <Button size="sm" className="h-9 px-3 text-xs bg-cyan-600 hover:bg-cyan-500 text-white gap-1">
                  <span>Thẩm định</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      />
    </div>
  );
}
