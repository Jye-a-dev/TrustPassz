"use client";

import * as React from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";

export function PreReleaseBanner() {
  const [visible, setVisible] = React.useState(true);
  const isPreRelease =
    process.env.NEXT_PUBLIC_ENVIRONMENT === "pre-release" ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === "testnet" ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === "staging" ||
    process.env.NODE_ENV !== "production";

  if (!isPreRelease || !visible) return null;

  return (
    <div
      role="banner"
      className="relative z-50 flex min-h-11 w-full items-center justify-between border-b border-amber-500/30 bg-slate-950/95 px-4 py-1.5 text-xs backdrop-blur-md transition-colors"
    >
      <div className="mx-auto flex flex-wrap items-center justify-center gap-2 text-slate-300">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 font-bold tracking-wide text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
          <AlertTriangle className="size-3.5 animate-pulse text-amber-400" />
          [PRE-RELEASE TESTNET]
        </span>
        <span className="text-slate-400">
          Chế độ Sandbox: Smart Contract Base Sepolia (84532) & Solana Devnet. Tuyệt đối không dùng tiền thật.
        </span>
        <a
          href="https://faucet.quicknode.com/base/sepolia"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1 font-semibold text-cyan-400 underline decoration-cyan-400/40 underline-offset-4 hover:text-cyan-300"
        >
          Faucet Gas Testnet
          <ExternalLink className="size-3" />
        </a>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Đóng banner testnet"
        className="inline-flex size-11 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
      >
        ✕
      </button>
    </div>
  );
}

