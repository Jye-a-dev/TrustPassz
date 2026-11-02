"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase-client";
import { apiClient } from "@/lib/api-client";
import { playSuccessChime } from "@/lib/sound";
import type { TransferModalType } from "@/components/deals/transfer-success-modal";

export interface DealRealtimeInfo {
  id: string;
  amount?: number | string;
  price?: number | string;
  currency?: string;
  state?: string;
  title?: string;
  depositTxHash?: string | null;
  settleTxHash?: string | null;
  chainType?: string;
  orderCode?: number | string;
}

export interface ModalStateData {
  type: TransferModalType;
  title?: string;
  description?: string;
  amount: number | string;
  currency: string;
  dealId: string;
  dealTitle?: string;
  txHash?: string | null;
  chainType?: string;
  timestamp: string;
}

export interface UseDealRealtimeModalOptions {
  dealId: string;
  initialDeal?: DealRealtimeInfo | null;
  onDealStateChange?: (
    newState: string,
    updatedDeal?: Record<string, unknown>
  ) => void;
  playAudio?: boolean;
  enablePollingFallback?: boolean;
}

export function useDealRealtimeModal({
  dealId,
  initialDeal,
  onDealStateChange,
  playAudio = true,
  enablePollingFallback = true,
}: UseDealRealtimeModalOptions) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [modalData, setModalData] = React.useState<ModalStateData | null>(null);

  // References to keep callbacks and states fresh without triggering subscription re-runs
  const dealRef = React.useRef(initialDeal);
  const onStateChangeRef = React.useRef(onDealStateChange);

  React.useEffect(() => {
    dealRef.current = initialDeal;
  }, [initialDeal]);

  React.useEffect(() => {
    onStateChangeRef.current = onDealStateChange;
  }, [onDealStateChange]);

  const hasTriggeredRef = React.useRef<{ deposit: boolean; settle: boolean }>({
    deposit: initialDeal?.state === "DEPOSITED" || initialDeal?.state === "IN_INSPECTION",
    settle: initialDeal?.state === "SETTLED",
  });

  const triggerModal = React.useCallback(
    (type: TransferModalType, extra?: Partial<ModalStateData>) => {
      const current = dealRef.current;
      const rawAmount = extra?.amount ?? current?.price ?? current?.amount ?? 0;
      const amount = typeof rawAmount === "string" ? parseFloat(rawAmount) || 0 : rawAmount;
      const currency = extra?.currency ?? current?.currency ?? "VND";
      const txHash =
        extra?.txHash !== undefined
          ? extra.txHash
          : type === "SETTLEMENT" || type === "PAYOUT"
          ? current?.settleTxHash
          : current?.depositTxHash;
      const chainType = extra?.chainType ?? current?.chainType;

      const data: ModalStateData = {
        type,
        title: extra?.title,
        description: extra?.description,
        amount,
        currency,
        dealId,
        dealTitle: extra?.dealTitle ?? current?.title,
        txHash: txHash || null,
        chainType,
        timestamp: extra?.timestamp || new Date().toISOString(),
      };

      setModalData(data);
      setIsOpen(true);

      if (playAudio) {
        playSuccessChime();
      }
    },
    [dealId, playAudio]
  );

  const triggerDepositSuccess = React.useCallback(
    (extra?: Partial<ModalStateData>) => {
      if (hasTriggeredRef.current.deposit) return;
      hasTriggeredRef.current.deposit = true;

      triggerModal("DEPOSIT", {
        title: "Thanh toán Ký quỹ thành công",
        description: "Tiền đã được giữ an toàn trong Két bảo chứng TrustPassz.",
        ...extra,
      });

      if (onStateChangeRef.current) {
        onStateChangeRef.current("DEPOSITED", {
          state: "DEPOSITED",
          depositTxHash: extra?.txHash,
        });
      }
    },
    [triggerModal]
  );

  const triggerSettlementSuccess = React.useCallback(
    (extra?: Partial<ModalStateData>) => {
      if (hasTriggeredRef.current.settle) return;
      hasTriggeredRef.current.settle = true;

      triggerModal("SETTLEMENT", {
        title: "Giải ngân thành công",
        description: "Khoản thanh toán đã được giải ngân an toàn đến người thụ hưởng.",
        ...extra,
      });

      if (onStateChangeRef.current) {
        onStateChangeRef.current("SETTLED", {
          state: "SETTLED",
          settleTxHash: extra?.txHash,
        });
      }
    },
    [triggerModal]
  );

  const closeModal = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  // Supabase Realtime Channel & Polling Fallback
  React.useEffect(() => {
    if (!dealId) return;

    const channelName = `deal-room:${dealId}`;
    const channel = supabase.channel(channelName);

    // 1. Listen for PAYMENT_RECEIVED & DEPOSIT_CONFIRMED broadcast
    channel
      .on(
        "broadcast" as never,
        { event: "PAYMENT_RECEIVED" } as never,
        (eventPayload: { payload?: { state?: string; txHash?: string } }) => {
          const state = eventPayload?.payload?.state;
          if (state === "DEPOSITED" || state === "IN_INSPECTION") {
            triggerDepositSuccess({ txHash: eventPayload.payload?.txHash });
          }
        }
      )
      .on(
        "broadcast" as never,
        { event: "DEPOSIT_CONFIRMED" } as never,
        (eventPayload: { payload?: { state?: string; txHash?: string } }) => {
          triggerDepositSuccess({ txHash: eventPayload?.payload?.txHash });
        }
      )
      .on(
        "broadcast" as never,
        { event: "SETTLEMENT_SUCCESS" } as never,
        (eventPayload: { payload?: { state?: string; txHash?: string } }) => {
          triggerSettlementSuccess({ txHash: eventPayload?.payload?.txHash });
        }
      )
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "deals",
          filter: `id=eq.${dealId}`,
        },
        (changePayload: {
          new?: { state?: string; depositTxHash?: string; settleTxHash?: string };
        }) => {
          const newState = changePayload?.new?.state;
          if (newState === "DEPOSITED" || newState === "IN_INSPECTION") {
            triggerDepositSuccess({ txHash: changePayload.new?.depositTxHash });
          } else if (newState === "SETTLED") {
            triggerSettlementSuccess({ txHash: changePayload.new?.settleTxHash });
          }
        }
      )
      .subscribe();

    // 2. Resilient Polling Fallback
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    if (enablePollingFallback) {
      pollInterval = setInterval(async () => {
        if (hasTriggeredRef.current.deposit && hasTriggeredRef.current.settle) {
          if (pollInterval) clearInterval(pollInterval);
          return;
        }

        try {
          const res = await apiClient<{
            state?: string;
            depositTxHash?: string;
            settleTxHash?: string;
          }>(`/api/v1/deals/${dealId}`);

          if (res?.state === "DEPOSITED" || res?.state === "IN_INSPECTION") {
            if (!hasTriggeredRef.current.deposit) {
              triggerDepositSuccess({ txHash: res.depositTxHash });
            }
          } else if (res?.state === "SETTLED") {
            if (!hasTriggeredRef.current.settle) {
              triggerSettlementSuccess({ txHash: res.settleTxHash });
            }
          }
        } catch {
          // Suppress polling network errors
        }
      }, 3500);
    }

    return () => {
      supabase.removeChannel(channel);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [
    dealId,
    enablePollingFallback,
    triggerDepositSuccess,
    triggerSettlementSuccess,
  ]);

  return {
    isOpen,
    setIsOpen,
    modalData,
    triggerModal,
    triggerDepositSuccess,
    triggerSettlementSuccess,
    closeModal,
  };
}
