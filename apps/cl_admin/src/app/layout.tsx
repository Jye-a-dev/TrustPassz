import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/shared/providers";
import "@/styles/globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";

export const viewport: Viewport = {
  themeColor: "#080C14",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "TrustPassz Admin Portal | Escrow & AI Arbitrator",
    template: "%s | TrustPassz Admin",
  },
  description:
    "Cổng điều hành & quản trị ký quỹ tự động TrustPassz trên Base Sepolia và AI sVLM Arbitrator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#080C14] font-sans text-slate-100 antialiased overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
