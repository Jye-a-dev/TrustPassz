import Link from "next/link";
import { ShieldCheck, Lock, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 text-slate-400">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6 py-8 px-4 sm:px-8 max-w-7xl text-xs">
        {/* Brand & Contract Attribution */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <p className="text-slate-300 font-medium">
              © 2026 TrustPassz. Bảo chứng Escrow qua Smart Contract Base Sepolia (
              <span className="font-mono text-cyan-400">0x165B...f783</span>).
            </p>
            <p className="text-[11px] text-slate-400">
              Két Giao Dịch Ký Quỹ Tự Hành Cho Sản Phẩm Số &amp; Social Commerce.
            </p>
          </div>
        </div>

        {/* Legal & Tech Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium">
          <Link
            href="/deals/demo"
            className="hover:text-cyan-300 transition-colors"
          >
            Điều khoản Ký quỹ
          </Link>
          <span className="text-slate-700">•</span>
          <Link
            href="/deals/create"
            className="hover:text-emerald-300 transition-colors"
          >
            Bảo mật Digital Vault
          </Link>
          <span className="text-slate-700">•</span>
          <Link
            href="/dashboard"
            className="hover:text-cyan-300 transition-colors"
          >
            Tài liệu API/Webhook
          </Link>
        </div>
      </div>
    </footer>
  );
}
