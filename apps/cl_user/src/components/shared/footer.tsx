"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Lock, ExternalLink, HelpCircle, FileText } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/user")) {
    return null;
  }

  return (
    <footer className="border-t border-subtle bg-surface text-secondary transition-colors">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Cột 1: Thông tin sàn */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-pink-tint border border-brand-pink/30 flex items-center justify-center text-brand-pink shadow-sm">
                <ShieldCheck className="size-4.5 text-brand-pink" />
              </div>
              <span className="font-bold text-lg text-primary tracking-tight">TrustPassz</span>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              Sàn Thương Mại Điện Tử &amp; Két Giữ Tiền An Toàn Số 1. Triệt tiêu 100% rủi ro lừa đảo cọc, quỵt hàng online.
            </p>
            <div className="pt-1 text-[11px] font-mono text-muted">
              © 2026 TrustPassz. Bảo chứng tự động.
            </div>
          </div>

          {/* Cột 2: Hướng dẫn an toàn Escrow */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-primary font-mono">
              Quy Trình Giữ Tiền An Toàn
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/deals/demo" className="hover:text-brand-pink transition-colors flex items-center gap-1.5">
                  <Lock className="size-3 text-brand-pink" />
                  <span>Cơ chế nạp tiền VietQR</span>
                </Link>
              </li>
              <li>
                <Link href="/deals/demo" className="hover:text-brand-pink transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="size-3 text-emerald-600" />
                  <span>Quyền đồng kiểm 6h - 24h</span>
                </Link>
              </li>
              <li>
                <Link href="/deals/demo" className="hover:text-brand-pink transition-colors flex items-center gap-1.5">
                  <HelpCircle className="size-3 text-amber-500" />
                  <span>Trọng tài phân xử sự cố</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Liên kết chính sách */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-primary font-mono">
              Chính Sách &amp; Hỗ Trợ
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/deals/demo" className="hover:text-brand-pink transition-colors flex items-center gap-1.5">
                  <FileText className="size-3 text-muted" />
                  <span>Quy chế bảo vệ người mua</span>
                </Link>
              </li>
              <li>
                <Link href="/deals/demo" className="hover:text-brand-pink transition-colors flex items-center gap-1.5">
                  <FileText className="size-3 text-muted" />
                  <span>Chính sách bảo vệ người bán</span>
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-brand-pink transition-colors flex items-center gap-1.5">
                  <FileText className="size-3 text-muted" />
                  <span>Danh mục sản phẩm số</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Smart Contract Base Sepolia Hash */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-primary font-mono">
              Smart Contract Bảo Chứng
            </h4>
            <div className="p-3 rounded-xl bg-input-bg border border-subtle text-xs space-y-1.5">
              <div className="text-[11px] text-muted font-mono">Base Sepolia L2 (84532)</div>
              <Link
                href={`https://sepolia.basescan.org/address/${process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || "0x88a82fe4f3be44bb493fa6e7efd68313e7c2ec15"}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-brand-pink hover:text-brand-pink-hover font-bold flex items-center gap-1 text-[11px] break-all"
              >
                <span>
                  {(process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || "0x88a82fe4f3be44bb493fa6e7efd68313e7c2ec15").slice(0, 10)}...{(process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS || "0x88a82fe4f3be44bb493fa6e7efd68313e7c2ec15").slice(-4)}
                </span>
                <ExternalLink className="size-3 shrink-0" />
              </Link>
              <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Hợp đồng số đối soát 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
