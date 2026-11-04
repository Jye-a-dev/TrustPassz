"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase-client";

export interface BargainSliderBroadcastPayload {
  dealId: string;
  offeredPrice: number;
  buyerId: string;
  senderId?: string;
  timestamp?: number;
}

export interface UseBargainSyncOptions {
  dealId: string;
  initialPrice: number;
  currentUserId: string;
  minPrice: number;
  maxPrice: number;
  debounceMs?: number;
  cooldownMs?: number;
  onDebouncedChange?: (price: number) => void;
}

export interface UseBargainSyncReturn {
  visualPrice: number;
  debouncedPrice: number;
  peerOffer: number | null;
  isConnected: boolean;
  isSyncing: boolean;
  isCoolingDown: boolean;
  setPrice: (nextPrice: number) => void;
  adoptPeerOffer: () => void;
}

/**
 * Custom hook managing Bargain Slider state, optimistic visual updates (0ms),
 * network debounce (350ms), rapid-click cooldown throttling (200ms),
 * and Supabase Realtime channel subscription lifecycle.
 */
export function useBargainSync({
  dealId,
  initialPrice,
  currentUserId,
  minPrice,
  maxPrice,
  debounceMs = 350,
  cooldownMs = 200,
  onDebouncedChange,
}: UseBargainSyncOptions): UseBargainSyncReturn {
  const [visualPrice, setVisualPrice] = React.useState<number>(initialPrice);
  const [debouncedPrice, setDebouncedPrice] = React.useState<number>(initialPrice);
  const [peerOffer, setPeerOffer] = React.useState<number | null>(null);
  const [isConnected, setIsConnected] = React.useState<boolean>(false);
  const [isSyncing, setIsSyncing] = React.useState<boolean>(false);
  const [isCoolingDown, setIsCoolingDown] = React.useState<boolean>(false);

  // References for synchronization, timers, and broadcast deduplication
  const channelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBroadcastPriceRef = React.useRef<number>(initialPrice);
  const isConnectedRef = React.useRef<boolean>(false);
  const onDebouncedChangeRef = React.useRef(onDebouncedChange);

  // Keep callback refs synchronized
  React.useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  React.useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  // Sync internal price if initialPrice changes externally
  React.useEffect(() => {
    const clamped = Math.max(minPrice, Math.min(maxPrice, initialPrice));
    const rounded = Math.round(clamped / 1000) * 1000;
    setVisualPrice(rounded);
    setDebouncedPrice(rounded);
    lastBroadcastPriceRef.current = rounded;
  }, [initialPrice, minPrice, maxPrice]);

  // Supabase Realtime channel subscription lifecycle
  React.useEffect(() => {
    if (!dealId) return;

    const channelName = `deal-room:${dealId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: false,
          ack: false,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on("broadcast", { event: "bargain:slider_update" }, (message) => {
        const payload = message.payload as BargainSliderBroadcastPayload;
        if (payload && payload.dealId === dealId) {
          if (payload.buyerId !== currentUserId && payload.senderId !== currentUserId) {
            setPeerOffer(payload.offeredPrice);
          }
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setIsConnected(false);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, [dealId, currentUserId]);

  // Dispatch price update with 0ms optimistic UI and debounced broadcast
  const setPrice = React.useCallback(
    (nextPrice: number) => {
      const clamped = Math.max(minPrice, Math.min(maxPrice, nextPrice));
      const rounded = Math.round(clamped / 1000) * 1000;

      // 1. Optimistic UI update (0ms latency)
      setVisualPrice(rounded);

      // 2. Rapid-click tactile cooldown (200ms)
      setIsCoolingDown(true);
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      cooldownTimerRef.current = setTimeout(() => {
        setIsCoolingDown(false);
      }, cooldownMs);

      // 3. Network debounce (350ms)
      setIsSyncing(true);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        setIsSyncing(false);
        setDebouncedPrice(rounded);

        // Deduplicate identical network broadcast
        if (lastBroadcastPriceRef.current === rounded) {
          return;
        }

        if (channelRef.current && isConnectedRef.current) {
          const payload: BargainSliderBroadcastPayload = {
            dealId,
            offeredPrice: rounded,
            buyerId: currentUserId,
            senderId: currentUserId,
            timestamp: Date.now(),
          };

          channelRef.current.send({
            type: "broadcast",
            event: "bargain:slider_update",
            payload,
          });
          lastBroadcastPriceRef.current = rounded;
        }

        onDebouncedChangeRef.current?.(rounded);
      }, debounceMs);
    },
    [minPrice, maxPrice, cooldownMs, debounceMs, dealId, currentUserId]
  );

  const adoptPeerOffer = React.useCallback(() => {
    if (peerOffer !== null) {
      setPrice(peerOffer);
    }
  }, [peerOffer, setPrice]);

  return {
    visualPrice,
    debouncedPrice,
    peerOffer,
    isConnected,
    isSyncing,
    isCoolingDown,
    setPrice,
    adoptPeerOffer,
  };
}

