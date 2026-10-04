import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";
import { Providers } from "@/components/shared/providers";
import "@/styles/globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";

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
    default: "TrustPassz - Nền Tảng Giao Dịch An Toàn Cho Sản Phẩm Số & Đồ Mua Bán Online",
    template: "%s | TrustPassz",
  },
  description:
    "Tiền được giữ an toàn qua VietQR. Khách có thời gian kiểm tra hàng từ 6h - 24h trước khi chuyển tiền cho người bán. Không lo bị quỵt tiền hay gửi hàng sai.",
  keywords: [
    "TrustPassz",
    "Giao Dịch An Toàn",
    "Giữ Tiền An Toàn",
    "Sản Phẩm Số",
    "VietQR",
    "Kho Bảo Mật",
    "Bảo Vệ Người Mua",
    "Bảo Vệ Người Bán",
  ],
  authors: [{ name: "TrustPassz Architecture Team" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://trustpassz.vercel.app",
    title: "TrustPassz - Nền Tảng Giao Dịch An Toàn Cho Sản Phẩm Số & Đồ Mua Bán Online",
    description:
      "Tiền được giữ an toàn qua VietQR. Khách có thời gian kiểm tra hàng từ 6h - 24h trước khi chuyển tiền cho người bán. Không lo bị quỵt tiền hay gửi hàng sai.",
    siteName: "TrustPassz",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrustPassz - Nền Tảng Giao Dịch An Toàn Cho Sản Phẩm Số & Đồ Mua Bán Online",
    description:
      "Tiền được giữ an toàn qua VietQR. Khách có thời gian kiểm tra hàng từ 6h - 24h trước khi chuyển tiền cho người bán. Không lo bị quỵt tiền hay gửi hàng sai.",
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
