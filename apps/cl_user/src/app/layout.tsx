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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Next.js Production Enterprise Template",
    template: "%s | Next.js Template",
  },
  description:
    "Next.js 15+ App Router, React 19, TypeScript Strict, Tailwind CSS v4, Radix UI, TanStack Query, Nuqs, và Server Actions.",
  keywords: ["Next.js 15", "React 19", "Tailwind CSS v4", "TypeScript", "App Router", "Shadcn UI", "TanStack Query", "Nuqs"],
  authors: [{ name: "Next.js Architect" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://github.com/Jye-a-dev/template_next_client",
    title: "Next.js Production Enterprise Template",
    description: "Template Next.js App Router tối ưu hiệu năng Web Vitals (LCP, CLS, INP) và UI/UX cao cấp.",
    siteName: "Next.js Template",
  },
  twitter: {
    card: "summary_large_image",
    title: "Next.js Production Enterprise Template",
    description: "Template Next.js App Router tối ưu hiệu năng Web Vitals (LCP, CLS, INP) và UI/UX cao cấp.",
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
    <html lang="vi" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

