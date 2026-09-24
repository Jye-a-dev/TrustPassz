import Link from "next/link";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Flame,
  ArrowRight,
  Database,
  Layers,
  Palette,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CORE_PILLARS = [
  {
    icon: Flame,
    title: "Next.js 15+ & React 19",
    description:
      "Kiến trúc App Router hiện đại, khai thác tối đa React Server Components (RSC) cho First Contentful Paint (FCP) và Largest Contentful Paint (LCP) tối ưu.",
  },
  {
    icon: Palette,
    title: "Tailwind CSS v4 & Radix UI",
    description:
      "Tối ưu zero runtime overhead, hệ màu CSS Variables HSL thích ứng Dark/Light mode không giật layout (zero CLS).",
  },
  {
    icon: SlidersHorizontal,
    title: "URL as State với Nuqs",
    description:
      "Quản lý search params an toàn kiểu dữ liệu, liên kết chặt chẽ giữa URL, Server Components và Client State.",
  },
  {
    icon: Database,
    title: "TanStack Query v5",
    description:
      "Xử lý caching, dynamic polling, và optimistic UI updates mượt mà với cấu hình SSR hydration chuẩn mực.",
  },
  {
    icon: ShieldCheck,
    title: "Server Actions & Zod",
    description:
      "Xác thực dữ liệu 2 đầu (end-to-end type safety) với Zod v4, React Hook Form và useActionState không cần boilerplate API rườm rà.",
  },
  {
    icon: Zap,
    title: "Tối ưu Core Web Vitals",
    description:
      "Interaction to Next Paint (INP) < 50ms, font tự lưu trữ qua next/font, streaming Suspense không chặn luồng hiển thị chính.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-radial from-primary/10 via-transparent to-transparent py-20 md:py-32">
        <div className="container mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
            <Badge variant="secondary" className="px-3 py-1 text-xs gap-1.5 rounded-full border">
              <Sparkles className="size-3.5 text-primary" />
              <span>Enterprise Ready Template • Next.js 15+</span>
            </Badge>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-balance">
              Kiến trúc Client Hiện Đại, Chuẩn SEO &amp; Hiệu Năng Đỉnh Cao
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl text-balance">
              Template tiêu chuẩn công nghiệp kết hợp Next.js App Router, Tailwind CSS v4, Radix UI, TanStack Query, Nuqs và Server Actions. Thiết kế sẵn sàng mở rộng quy mô.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Button size="lg" asChild className="gap-2 shadow-md">
                <Link href="/dashboard">
                  Trải nghiệm Dashboard <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link
                  href="https://github.com/Jye-a-dev/template_next_client"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub Source
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Grid */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Tiêu chuẩn Kỹ thuật Hàng đầu</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Được kiến tạo theo các nguyên lý Clean Architecture và Domain-Driven Design (DDD) để dự án phát triển bền vững.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CORE_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Card key={pillar.title} className="transition-all hover:border-primary/50 hover:shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <CardTitle className="text-lg">{pillar.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm leading-relaxed">
                      {pillar.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live Showcase Banner */}
      <section className="py-16 border-t">
        <div className="container mx-auto max-w-7xl px-4 sm:px-8">
          <div className="rounded-2xl border bg-card p-8 md:p-12 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Layers className="size-4" />
                <span>Thực hành Thực tế</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Khám phá Mô-đun Domain Features trực tiếp
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Trải nghiệm sự phối hợp giữa Nuqs (lọc URL), TanStack Query (caching), Server Actions (tạo dữ liệu với useActionState) và Radix Dialog/Sheet có tính trợ năng (A11y) đầy đủ.
              </p>
            </div>
            <Button size="lg" asChild className="shrink-0 gap-2">
              <Link href="/dashboard">
                Vào Dashboard ngay <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

