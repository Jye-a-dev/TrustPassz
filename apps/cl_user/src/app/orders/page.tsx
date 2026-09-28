"use client";

import * as React from "react";
import Link from "next/link";
import {
  PackageCheck,
  ShieldCheck,
  Clock,
  ArrowRight,
  Filter,
  Search,
  ExternalLink,
  Coins,
  CheckCircle2,
  AlertTriangle,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface OrderItem {
  id: string;
  orderNumber: string;
  dealId: string;
  productTitle: string;
  category: string;
  amount: number;
  currency: string;
  status:
    | "PENDING_PAYMENT"
    | "PAID_ESCROW"
    | "IN_INSPECTION"
    | "COMPLETED"
    | "DISPUTED";
  createdAt: string;
  role: "BUYER" | "SELLER";
  counterparty: string;
}

const MOCK_ORDERS: OrderItem[] = [
  {
    id: "ord-001",
    orderNumber: "ORD-2026-0928-01",
    dealId: "demo",
    productTitle: "Mã Nguồn TrustPassz Escrow Gateway + Base Sepolia Contract",
    category: "SOURCE_CODE",
    amount: 1500000,
    currency: "VND",
    status: "IN_INSPECTION",
    createdAt: "2026-09-28 14:30",
    role: "BUYER",
    counterparty: "DevMaster_VN",
  },
  {
    id: "ord-002",
    orderNumber: "ORD-2026-0927-44",
    dealId: "deal-bot-arbitrage",
    productTitle: "Solana MEV Arbitrage Bot Python Scripts (Jupiter & Raydium)",
    category: "SOURCE_CODE",
    amount: 4500000,
    currency: "VND",
    status: "COMPLETED",
    createdAt: "2026-09-27 10:15",
    role: "BUYER",
    counterparty: "SolanaQuant_Lab",
  },
  {
    id: "ord-003",
    orderNumber: "ORD-2026-0926-12",
    dealId: "deal-license-saas",
    productTitle: "Key Bản Quyền Phần Mềm Quản Lý Bán Hàng 1 Năm",
    category: "LICENSE_KEY",
    amount: 850000,
    currency: "VND",
    status: "PAID_ESCROW",
    createdAt: "2026-09-26 19:40",
    role: "SELLER",
    counterparty: "ShopChuan_Store",
  },
  {
    id: "ord-004",
    orderNumber: "ORD-2026-0925-89",
    dealId: "deal-design-3d",
    productTitle: "Bộ Asset 3D Game Nhân Vật Cyberpunk Maya & Blender",
    category: "DESIGN_ASSET",
    amount: 2200000,
    currency: "VND",
    status: "PENDING_PAYMENT",
    createdAt: "2026-09-25 09:20",
    role: "BUYER",
    counterparty: "VFX_Studio_SG",
  },
];

const STATUS_MAP = {
  PENDING_PAYMENT: {
    label: "Chờ thanh toán",
    badge: "border-amber-500/40 bg-amber-950/30 text-amber-400",
  },
  PAID_ESCROW: {
    label: "Đã ký quỹ",
    badge: "border-cyan-500/40 bg-cyan-950/30 text-cyan-400",
  },
  IN_INSPECTION: {
    label: "Đang kiểm thử",
    badge: "border-blue-500/40 bg-blue-950/30 text-blue-400",
  },
  COMPLETED: {
    label: "Hoàn tất",
    badge: "border-emerald-500/40 bg-emerald-950/30 text-emerald-400",
  },
  DISPUTED: {
    label: "Tranh chấp",
    badge: "border-rose-500/40 bg-rose-950/30 text-rose-400",
  },
};

export default function OrdersPage() {
  const [filter, setFilter] = React.useState<string>("ALL");
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  const filteredOrders = MOCK_ORDERS.filter((order) => {
    const matchesFilter = filter === "ALL" || order.status === filter;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.counterparty.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Lịch Sử Đơn Hàng & Ký Quỹ
            </h1>
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-950/20 text-emerald-400 text-xs"
            >
              Két An Toàn
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Theo dõi dòng tiền ký quỹ, trạng thái mở két kiểm thử và lịch sử tất toán.
          </p>
        </div>

        <Button
          asChild
          className="bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs h-10 px-4"
        >
          <Link href="/deals/create">
            <span>Tạo Kèo Ký Quỹ Mới</span>
            <ArrowRight className="size-3.5 ml-1.5" />
          </Link>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <Input
            placeholder="Tìm theo mã đơn, tiêu đề hoặc đối tác..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-800 text-slate-200 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "IN_INSPECTION", label: "Đang kiểm thử" },
            { id: "PAID_ESCROW", label: "Đã ký quỹ" },
            { id: "COMPLETED", label: "Hoàn tất" },
            { id: "PENDING_PAYMENT", label: "Chờ thanh toán" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                filter === tab.id
                  ? "bg-slate-800 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="border-slate-800 bg-slate-950/60 p-12 text-center">
            <PackageCheck className="size-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">
              Không tìm thấy đơn hàng ký quỹ nào
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc trạng thái.
            </p>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = STATUS_MAP[order.status];
            return (
              <Card
                key={order.id}
                className="border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-all shadow-md"
              >
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">
                        {order.orderNumber}
                      </span>
                      <Badge variant="outline" className={statusConfig.badge}>
                        {statusConfig.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-slate-800 bg-slate-900 text-slate-400 text-[10px]"
                      >
                        {order.role === "BUYER" ? "Bên Mua (Buyer)" : "Bên Bán (Seller)"}
                      </Badge>
                    </div>

                    <div className="text-sm font-bold text-white hover:text-cyan-300 transition-colors">
                      {order.productTitle}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span>Đối tác: <strong className="text-slate-300">{order.counterparty}</strong></span>
                      <span>Thời gian: {order.createdAt}</span>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">
                        {order.amount.toLocaleString("vi-VN")} {order.currency}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Bảo đảm bởi Smart Escrow
                      </div>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-slate-700 bg-slate-900 text-slate-200 hover:text-white hover:border-cyan-500/50 text-xs h-9 px-3"
                    >
                      <Link href={`/deals/${order.dealId}`}>
                        <span>Vào Deal Room</span>
                        <ExternalLink className="size-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
