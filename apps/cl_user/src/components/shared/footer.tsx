"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/user")) {
    return null;
  }

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/90 text-slate-600 dark:text-slate-400 transition-colors">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl text-xs">
        {/* Brand & Contract Attribution */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <p className="text-slate-800 dark:text-slate-300 font-medium">
              © 2026 TrustPassz (Bảo chứng hợp đồng:{" "}
              <span className="font-mono text-cyan-600 dark:text-cyan-400">0x165B...f783</span>).
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Nền Tảng Giao Dịch An Toàn Cho Sản Phẩm Số &amp; Đồ Mua Bán Online.
            </p>
          </div>
        </div>

        {/* Legal & Tech Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium">
          <Link
            href="/deals/demo"
            className="hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
          >
            Điều khoản Giữ tiền an toàn
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link
            href="/user/deals/create"
            className="hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
          >
            Bảo mật Kho lưu trữ
          </Link>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <Link
            href="/user"
            className="hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
          >
            Tài liệu API/Webhook
          </Link>
        </div>
      </div>
    </footer>
  );
}
