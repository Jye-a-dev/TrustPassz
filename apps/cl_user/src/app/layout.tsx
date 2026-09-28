import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Providers } from "@/components/shared/providers";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B0F17" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F17" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "TrustPassz - Két Giao Dịch Ký Quỹ Thông Minh Cho Sản Phẩm Số",
    template: "%s | TrustPassz",
  },
  description:
    "Giao thức ký quỹ tự hành cho sản phẩm số & social commerce trên Base Sepolia. Khóa tiền qua VietQR, mở két Digital Vault AES-256-GCM, bảo đảm giao dịch 100%.",
  keywords: [
    "TrustPassz",
    "Escrow",
    "Ký Quỹ",
    "Sản Phẩm Số",
    "VietQR",
    "Digital Vault",
    "Base Sepolia",
    "Smart Contract",
    "Web Crypto",
  ],
  authors: [{ name: "TrustPassz Architecture Team" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://trustpassz.vercel.app",
    title: "TrustPassz - Két Giao Dịch Ký Quỹ Thông Minh Cho Sản Phẩm Số",
    description:
      "Khóa tiền an toàn qua VietQR tự động. Mở két Digital Vault kiểm thử 6h - 24h. Trọng tài AI phân xử tranh chấp công tâm.",
    siteName: "TrustPassz",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrustPassz - Két Giao Dịch Ký Quỹ Thông Minh Cho Sản Phẩm Số",
    description:
      "Khóa tiền an toàn qua VietQR tự động. Mở két Digital Vault kiểm thử 6h - 24h. Trọng tài AI phân xử tranh chấp công tâm.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={inter.variable}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen bg-[#0B0F17] font-sans text-slate-100 antialiased flex flex-col overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
        <Providers>
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
