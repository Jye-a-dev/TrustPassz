import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
  experimental: {
    optimizePackageImports: [
      "@solana/web3.js",
      "@solana/wallet-adapter-react",
      "@solana/wallet-adapter-wallets",
      "motion",
    ],
  },
  async rewrites() {
    const backendUrl = (
      process.env.NEXT_PUBLIC_API_URL || "https://trustpassz-server.onrender.com"
    ).replace(/\/$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/user",
        permanent: false,
      },
      {
        source: "/dashboard/:path*",
        destination: "/user/:path*",
        permanent: false,
      },
      {
        source: "/deals/create",
        destination: "/user/deals/create",
        permanent: false,
      },
      {
        source: "/orders",
        destination: "/user/orders",
        permanent: false,
      },
      {
        source: "/orders/:path*",
        destination: "/user/orders/:path*",
        permanent: false,
      },
      {
        source: "/settings",
        destination: "/user/settings",
        permanent: false,
      },
      {
        source: "/settings/:path*",
        destination: "/user/settings/:path*",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
