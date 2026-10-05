"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import dynamic from "next/dynamic";
import { getQueryClient } from "@/lib/query-client";
import { GoogleOAuthProvider } from "@react-oauth/google";

const SolanaProvider = dynamic(
  () => import("@/providers/solana-provider").then((mod) => mod.SolanaProvider),
  { ssr: false }
);

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();
  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "831991823901-trustpassz-dev.apps.googleusercontent.com";

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <GoogleOAuthProvider clientId={googleClientId}>
            <SolanaProvider>
              {children}
              <Toaster richColors position="bottom-right" closeButton />
            </SolanaProvider>
          </GoogleOAuthProvider>
        </NuqsAdapter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
