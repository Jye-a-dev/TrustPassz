"use client";

import Link from "next/link";
import {
  ShieldCheck,
  QrCode,
  Lock,
  Bot,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/auth-store";
import { useMounted } from "@/hooks/use-mounted";

const CORE_PILLARS = [
  {
    icon: QrCode,
    badge: "Thanh Toán Tiện Lợi",
    badgeColor: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
    title: "Thanh toán VietQR tiện lợi",
    description:
      "Quét mã ngân hàng quen thuộc, tiền được khóa an toàn ở trung gian.",
    details: [
      "Quét mã QR bằng ứng dụng ngân hàng bất kỳ",
      "Tiền được giữ an toàn ngay lập tức",
      "Không lo bị quỵt tiền hay lừa đảo chuyển khoản",
    ],
  },
  {
    icon: Lock,
    badge: "Bảo Vệ Người Mua",
    badgeColor: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40",
    title: "Thời gian thử & kiểm tra",
    description:
      "Người mua có từ 6 đến 24 tiếng kiểm tra sản phẩm trước khi tiền về tay người bán.",
    details: [
      "Tài liệu/mật khẩu được khóa kín, chỉ gửi đúng người mua",
      "Có từ 6h đến 24h dùng thử và kiểm tra kỹ lưỡng",
      "Hài lòng mới xác nhận chuyển tiền cho người bán",
    ],
  },
  {
    icon: Bot,
    badge: "Hỗ Trợ Công Minh",
    badgeColor: "text-amber-400 border-amber-500/30 bg-amber-950/40",
    title: "Hỗ trợ giải quyết tranh chấp",
    description:
      "AI tự động kiểm tra bằng chứng nếu sản phẩm bị lỗi để hoàn tiền công minh.",
    details: [
      "Trợ lý phân xử tự động kiểm tra hình ảnh/bằng chứng khi có lỗi",
      "Gợi ý hoàn tiền hoặc xử lý tranh chấp minh bạch",
      "Không lo bị gửi hàng sai hay hàng kém chất lượng",
    ],
  },
];

const STAT_BADGES = [
  {
    value: "0%",
    label: "Rủi ro bùng hàng",
    subtext: "Tiền được giữ an toàn ở két trung gian",
  },
  {
    value: "6h - 24h",
    label: "Thời gian kiểm tra hàng",
    subtext: "Kiểm tra kỹ trước khi chuyển tiền",
  },
  {
    value: "100%",
    label: "Bảo vệ tự động",
    subtext: "Không lo quỵt tiền hay gửi hàng sai",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Tạo Giao Dịch & Khóa Thông Tin",
    desc: "Người bán đăng thông tin bàn giao (link file, mã kích hoạt hoặc tài khoản). Hệ thống khóa kín bảo mật, chỉ gửi đúng người mua.",
  },
  {
    step: "02",
    title: "Người Mua Quét VietQR",
    desc: "Người mua quét mã ngân hàng quen thuộc. Tiền được giữ an toàn ở két trung gian, người bán chưa rút được ngay.",
  },
  {
    step: "03",
    title: "Kiểm Tra Hàng & Bàn Giao Tiền",
    desc: "Người mua nhận thông tin bàn giao và có từ 6h - 24h kiểm tra. Hài lòng thì xác nhận nhận hàng để chuyển tiền cho người bán.",
  },
];

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const mounted = useMounted();

  // Dynamic Auth-Aware routing to eliminate hardcoded private routes for guests
  const isAuthed = Boolean(mounted && isAuthenticated && user);
  const createDealHref = isAuthed
    ? "/user/deals/create"
    : "/login?callbackUrl=/user/deals/create";

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F17] text-slate-100 overflow-x-hidden">
      {/* Background Ambience Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-linear-to-b from-cyan-500/10 via-emerald-500/5 to-transparent blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80 py-16 sm:py-24 md:py-32">
        <div className="container mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
            {/* Top Highlight Badge */}
            <Badge
              variant="outline"
              className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold gap-2 rounded-full border-cyan-500/40 bg-cyan-950/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            >
              <span>🛡️ Hệ Thống Bảo Vệ Giao Dịch Trực Tuyến Tự Động</span>
            </Badge>

            {/* Main Headline H1 */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white text-balance leading-tight sm:leading-none">
              Nền Tảng Giao Dịch An Toàn Cho{" "}
              <span className="bg-linear-to-r from-emerald-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                Sản Phẩm Số &amp; Đồ Mua Bán Online
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-lg text-slate-300 leading-relaxed max-w-2xl text-balance">
              Tiền được giữ an toàn qua VietQR. Khách có thời gian kiểm tra hàng từ 6h - 24h trước khi chuyển tiền cho người bán. Không lo bị quỵt tiền hay gửi hàng sai.
            </p>

            {/* Auth-Aware Primary & Public Secondary CTAs (min-height >= 48px) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto">
              {/* Primary Auth-Aware CTA */}
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto min-h-12 px-7 rounded-xl bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-bold hover:brightness-110 shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all duration-200 border-0 cursor-pointer"
              >
                <Link href={createDealHref} className="flex items-center justify-center gap-2">
                  <ShieldCheck className="size-5" />
                  <span>Tạo Giao Dịch Ngay</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              {/* Public Demo Secondary CTA */}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto min-h-12 px-6 rounded-xl border-zinc-700 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-600 text-slate-200 hover:text-white transition-all duration-200 font-semibold cursor-pointer"
              >
                <Link href="/deals/demo" className="flex items-center justify-center gap-2">
                  <span>Xem Giao Dịch Mẫu</span>
                  <Sparkles className="size-4 text-cyan-400" />
                </Link>
              </Button>
            </div>

            {/* Live Stat Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-8 w-full max-w-3xl">
              {STAT_BADGES.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-800/90 bg-slate-900/60 backdrop-blur-sm shadow-sm"
                >
                  <span className="text-2xl sm:text-3xl font-black text-transparent bg-linear-to-r from-emerald-400 to-cyan-400 bg-clip-text">
                    {stat.value}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5">
                    {stat.label}
                  </span>
                  <span className="text-[11px] text-slate-400 text-center">
                    {stat.subtext}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid: 3 Pillars */}
      <section id="pillars" className="py-20 sm:py-24 relative border-b border-slate-800/80">
        <div className="container mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <Badge
              variant="outline"
              className="px-3 py-1 text-xs font-semibold border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
            >
              Cơ Chế Bảo Vệ 3 Lớp
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              An Tâm Tuyệt Đối Cho Mọi Giao Dịch Trực Tuyến
            </h2>
            <p className="text-slate-400 text-sm sm:base">
              Loại bỏ hoàn toàn rủi ro chuyển tiền không nhận được hàng hoặc gửi hàng không nhận được tiền.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CORE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Card
                  key={pillar.title}
                  className="border-slate-800 bg-slate-900/60 backdrop-blur-sm hover:border-slate-700 hover:bg-slate-900/90 transition-all duration-200 rounded-2xl flex flex-col justify-between"
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-linear-to-br from-slate-800 to-slate-900 border border-slate-700/80 text-cyan-400 shadow-md">
                        <Icon className="size-6" />
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${pillar.badgeColor}`}>
                        {pillar.badge}
                      </span>
                    </div>

                    <CardTitle className="text-lg sm:text-xl font-bold text-white">
                      {pillar.title}
                    </CardTitle>

                    <CardDescription className="text-xs sm:text-sm leading-relaxed text-slate-300">
                      {pillar.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 border-t border-slate-800/80 mt-2">
                    <ul className="space-y-2 pt-4">
                      {pillar.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2 text-xs text-slate-400">
                          <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Workflow */}
      <section id="how-it-works" className="py-20 sm:py-24 bg-slate-950/70 border-b border-slate-800/80">
        <div className="container mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Quy Trình Giữ Tiền &amp; Bàn Giao Trong 3 Bước
            </h2>
            <p className="text-slate-400 text-sm">
              Đơn giản như mua sắm online, tiền và hàng được bảo vệ an toàn 100%.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {WORKFLOW_STEPS.map((step) => (
              <div
                key={step.step}
                className="relative p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3"
              >
                <div className="text-3xl font-black text-cyan-500/30">
                  {step.step}
                </div>
                <h3 className="text-base font-bold text-white">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Conversion Box */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-8">
          <div className="rounded-2xl border border-slate-800 bg-linear-to-r from-slate-900 via-slate-900/90 to-slate-950 p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs sm:text-sm">
                <Zap className="size-4" />
                <span>Bắt Đầu Giao Dịch Không Lo Rủi Ro</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Bảo Vệ Thu Nhập &amp; An Toàn Mua Bán Ngay Hôm Nay
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Tạo giao dịch mua bán tài liệu số, đồ dùng online hoặc sản phẩm cá nhân. Cài đặt thời gian kiểm tra và để TrustPassz tự động bảo vệ tiền và hàng cho bạn.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto min-h-12 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold hover:brightness-110 shadow-lg cursor-pointer"
              >
                <Link href={createDealHref} className="flex items-center justify-center gap-2">
                  <span>Tạo Giao Dịch Ngay</span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto min-h-12 rounded-xl border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white cursor-pointer"
              >
                <Link href="/deals/demo">
                  Xem Giao Dịch Mẫu
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
