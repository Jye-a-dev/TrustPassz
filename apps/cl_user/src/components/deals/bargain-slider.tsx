"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingDown,
  Wifi,
  WifiOff,
  UserCheck,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export interface BargainSliderProps {
  dealId: string;
  basePrice: number;
  floorPrice?: number;
  initialOffer?: number;
  currentUserId: string;
  isBuyer?: boolean;
  disabled?: boolean;
  onOfferSubmit?: (offeredPrice: number) => void;
}

export interface BargainSliderBroadcastPayload {
  dealId: string;
  offeredPrice: number;
  buyerId: string;
  senderId?: string;
  timestamp?: number;
}

export function BargainSlider({
  dealId,
  basePrice,
  floorPrice = Math.round(basePrice * 0.7),
  initialOffer,
  currentUserId,
  isBuyer = true,
  disabled = false,
  onOfferSubmit,
}: BargainSliderProps) {
  // Normalize boundaries
  const minPrice = Math.max(0, floorPrice);
  const maxPrice = Math.max(minPrice, basePrice);
  const defaultPrice = initialOffer && initialOffer >= minPrice && initialOffer <= maxPrice
    ? initialOffer
    : Math.round((minPrice + maxPrice) / 2);

  const [localPrice, setLocalPrice] = React.useState<number>(defaultPrice);
  const [peerOffer, setPeerOffer] = React.useState<number | null>(null);
  const [isConnected, setIsConnected] = React.useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = React.useState<Date | null>(null);

  // References for debounce and channel tracking
  const channelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Establish Supabase Realtime channel for deal room
  React.useEffect(() => {
    if (!dealId) return;

    const channelName = `deal-room:${dealId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: false, // Don't loopback own events
          ack: false,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on("broadcast", { event: "bargain:slider_update" }, (message) => {
        const payload = message.payload as BargainSliderBroadcastPayload;
        if (payload && payload.dealId === dealId) {
          // If the broadcast was sent by the other party
          if (payload.buyerId !== currentUserId && payload.senderId !== currentUserId) {
            setPeerOffer(payload.offeredPrice);
            setLastSyncedAt(new Date());
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

    // Cleanup: Mandatory removal of Realtime channel subscription
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [dealId, currentUserId]);

  // 2. Broadcast price update with 300ms debounce
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = Number(e.target.value);
    setLocalPrice(newPrice);

    if (disabled) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (channelRef.current && isConnected) {
        channelRef.current.send({
          type: "broadcast",
          event: "bargain:slider_update",
          payload: {
            dealId,
            offeredPrice: newPrice,
            buyerId: currentUserId,
            senderId: currentUserId,
            timestamp: Date.now(),
          },
        });
      }
    }, 300);
  };

  const discountPercent =
    basePrice > 0 ? Math.round(((basePrice - localPrice) / basePrice) * 100) : 0;

  const handleApplyOffer = () => {
    if (onOfferSubmit) {
      onOfferSubmit(localPrice);
    }
  };

  const adoptPeerOffer = () => {
    if (peerOffer !== null) {
      setLocalPrice(peerOffer);
    }
  };

  // Calculate track filling percentage for gradient styling
  const trackPercentage =
    maxPrice > minPrice ? ((localPrice - minPrice) / (maxPrice - minPrice)) * 100 : 50;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Realtime Connection Status Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-cyan-400" />
          <div>
            <h4 className="text-sm font-bold text-slate-100">
              {isBuyer ? "Thanh Thương Lượng Giá" : "Đề Xuất Giá Từ Người Mua"}
            </h4>
            <span className="text-[11px] text-slate-400">
              Kéo thanh này để đề xuất mức giá bạn mong muốn
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Realtime
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              <WifiOff className="w-3 h-3" />
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Counter & Discount Display */}
      <div className="grid grid-cols-2 gap-3 items-center rounded-lg bg-slate-950/80 p-3.5 border border-slate-800/60">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
            Mức giá đang đề xuất
          </span>
          <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono tracking-tight">
            {localPrice.toLocaleString("vi-VN")}{" "}
            <span className="text-xs font-normal text-slate-400">₫</span>
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
            Mức chênh lệch
          </span>
          <Badge
            className={`text-xs font-mono font-bold ${
              discountPercent > 0
                ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                : "bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            {discountPercent > 0 ? `-${discountPercent}%` : "Giá gốc (0%)"}
          </Badge>
        </div>
      </div>

      {/* Peer Offer Indicator (When remote user changes slider) */}
      {peerOffer !== null && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/40 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-cyan-300">
            <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Đối tác đề xuất:{" "}
              <strong className="text-white font-mono">
                {peerOffer.toLocaleString("vi-VN")} ₫
              </strong>
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={adoptPeerOffer}
            className="h-7 px-2 text-[11px] text-cyan-400 hover:text-cyan-200 hover:bg-cyan-900/50"
          >
            Chấp nhận giá này
          </Button>
        </div>
      )}

      {/* Touch-Friendly Slider Container */}
      <div className="space-y-2 py-2">
        <div className="relative flex items-center select-none" style={{ touchAction: "none" }}>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={10000}
            value={localPrice}
            onChange={handleSliderChange}
            disabled={disabled}
            aria-label="Thanh thương lượng giá"
            className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed accent-cyan-400 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/50 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cyan-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900"
            style={{
              touchAction: "none",
              background: `linear-gradient(to right, rgb(6 182 212) 0%, rgb(16 185 129) ${trackPercentage}%, rgb(15 23 42) ${trackPercentage}%, rgb(15 23 42) 100%)`,
            }}
          />
        </div>

        {/* Boundary Marks */}
        <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 px-0.5">
          <span>
            Giá thấp nhất (-30%):{" "}
            <strong className="text-slate-300">{minPrice.toLocaleString("vi-VN")} ₫</strong>
          </span>
          <span>
            Giá ban đầu:{" "}
            <strong className="text-slate-300">{maxPrice.toLocaleString("vi-VN")} ₫</strong>
          </span>
        </div>
      </div>

      {/* Action CTA */}
      {onOfferSubmit && (
        <Button
          type="button"
          onClick={handleApplyOffer}
          disabled={disabled}
          className="w-full min-h-11 text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-950 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle className="w-4 h-4" />
          Xác nhận đề xuất {localPrice.toLocaleString("vi-VN")} ₫
        </Button>
      )}
    </div>
  );
}
