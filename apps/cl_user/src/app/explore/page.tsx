import * as React from "react";
import Link from "next/link";
import {
  Shield,
  Search,
  Filter,
  ArrowRight,
  PlusCircle,
  Lock,
  Clock,
  Sparkles,
  QrCode,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Khám Phá Giao Dịch Ký Quỹ Số | TrustPassz",
  description: "Duyệt các giao dịch ký quỹ công khai, đàm phán giá bảo đảm an toàn qua Smart Contract Base Sepolia.",
};

const EXPLORE_DEALS = [
  {
    id: "demo",
    title: "Mã Nguồn TrustPassz Escrow Gateway + Base Sepolia Contract",
    category: "Mã Nguồn & Source Code",
    price: 1500000,
    inspectionHours: 24,
    status: "IN_INSPECTION",
    statusLabel: "Đang Kiểm Thử",
    statusColor: "border-blue-500/40 bg-blue-950/40 text-blue-300",
    seller: "DevMaster_VN",
    vaultStatus: "AES-256 Khóa Két",
  },
  {
    id: "deal-002",
    title: "Tài Khoản OpenAI ChatGPT Plus Hạn Dùng 6 Tháng (Chính Chủ)",
    category: "Tài Khoản & Quyền Truy Cập",
    price: 750000,
    inspectionHours: 12,
    status: "DEPOSITED",
    statusLabel: "Đã Ký Quỹ",
    statusColor: "border-cyan-500/40 bg-cyan-950/40 text-cyan-300",
    seller: "AI_Merchant_99",
    vaultStatus: "AES-256 Khóa Két",
  },
  {
    id: "deal-003",
    title: "Bản Quyền Phần Mềm Thiết Kế Figma Organization 1 Năm",
    category: "License Key & Bản Quyền",
    price: 3200000,
    inspectionHours: 48,
    status: "PENDING",
    statusLabel: "Chờ Ký Quỹ",
    statusColor: "border-amber-500/40 bg-amber-950/40 text-amber-300",
    seller: "DesignStudio_HN",
    vaultStatus: "AES-256 Khóa Két",
  },
  {
    id: "deal-004",
    title: "Bộ Dataset Huấn Luyện AI E-Commerce 50,000 Hội Thoại Tiếng Việt",
    category: "Tài Liệu & Dataset Số",
    price: 2500000,
    inspectionHours: 24,
    status: "SETTLED",
    statusLabel: "Đã Hoàn Tất",
    statusColor: "border-emerald-500/40 bg-emerald-950/40 text-emerald-300",
    seller: "DataEngineer_Saigon",
    vaultStatus: "Đã Giải Mã",
  },
];

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 overflow-x-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="border-emerald-500/40 text-emerald-300 bg-emerald-950/20 text-xs px-2.5 py-1"
            >
              Thị Trường Ký Quỹ Phi Tập Trung
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Khám Phá Giao Dịch Ký Quỹ Mới Nhất
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Giao dịch an toàn với Digital Vault AES-256-GCM và thanh toán VietQR khóa tiền tự động.
            </p>
          </div>

          <Button
            asChild
            className="self-start md:self-auto min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold hover:brightness-110 shadow-lg"
          >
            <Link href="/deals/create" className="flex items-center gap-2">
              <PlusCircle className="size-4" />
              <span>Tạo Giao Dịch Của Bạn</span>
            </Link>
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm giao dịch theo tên sản phẩm, mã nguồn, tài khoản..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[42px] rounded-xl border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white gap-2"
            >
              <Filter className="size-4 text-cyan-400" />
              <span>Bộ lọc</span>
            </Button>
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {EXPLORE_DEALS.map((deal) => (
            <Card
              key={deal.id}
              className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700/80 transition-all rounded-2xl flex flex-col justify-between"
            >
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className={`text-[11px] font-semibold ${deal.statusColor}`}>
                    {deal.statusLabel}
                  </Badge>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Lock className="size-3 text-cyan-400" />
                    {deal.vaultStatus}
                  </span>
                </div>

                <CardTitle className="text-base sm:text-lg font-bold text-white hover:text-cyan-300 transition-colors">
                  <Link href={`/deals/${deal.id}`}>
                    {deal.title}
                  </Link>
                </CardTitle>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Tag className="size-3 text-slate-500" />
                    {deal.category}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3 text-slate-500" />
                    Kiểm thử: {deal.inspectionHours}h
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-2 border-t border-slate-800/60 mt-auto flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Giá ký quỹ</div>
                  <div className="text-lg font-extrabold text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text">
                    {deal.price.toLocaleString("vi-VN")} ₫
                  </div>
                </div>

                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 min-h-[38px] px-3.5 gap-1.5"
                >
                  <Link href={`/deals/${deal.id}`}>
                    <span>Vào Giao Dịch</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
