"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingDown,
  WifiOff,
  UserCheck,
  CheckCircle,
} from "lucide-react";
import {
  useBargainSync,
  type BargainSliderBroadcastPayload,
} from "@/hooks/useBargainSync";
import { QuickBidPresets } from "./quick-bid-presets";

export type { BargainSliderBroadcastPayload };

export interface BargainSliderProps {
  dealId: string;
  basePrice: number;
  floorPrice?: number;
  initialOffer?: number;
  currentUserId: string;
  isBuyer?: boolean;
  disabled?: boolean;
  onOfferSubmit?: (offeredPrice: number) => void;
  onPriceChange?: (price: number) => void;
}

export function BargainSlider({
  dealId,
  basePrice,
  floorPrice,
  initialOffer,
  currentUserId,
  isBuyer = true,
  disabled = false,
  onOfferSubmit,
  onPriceChange,
}: BargainSliderProps) {
  // Normalize boundaries
  const defaultFloor = Math.round(basePrice * 0.7);
  const minPrice = Math.max(0, floorPrice ?? defaultFloor);
  const maxPrice = Math.max(minPrice, basePrice);
  const defaultPrice =
    initialOffer && initialOffer >= minPrice && initialOffer <= maxPrice
      ? initialOffer
      : Math.round((minPrice + maxPrice) / 2);

  const {
    visualPrice,
    peerOffer,
    isConnected,
    isCoolingDown,
    setPrice,
    adoptPeerOffer,
  } = useBargainSync({
    dealId,
    initialPrice: defaultPrice,
    currentUserId,
    minPrice,
    maxPrice,
    debounceMs: 350,
    cooldownMs: 200,
    onDebouncedChange: onPriceChange,
  });

  // Touch gesture disambiguation: isolates horizontal drag without blocking vertical scrolling
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLInputElement>) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLInputElement>) => {
    if (!touchStartRef.current || e.touches.length === 0) return;

    const deltaX = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);

    if (deltaX > deltaY) {
      e.stopPropagation();
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setPrice(Number(e.target.value));
  };

  const discountPercent =
    basePrice > 0 ? Math.round(((basePrice - visualPrice) / basePrice) * 100) : 0;

  const trackPercentage =
    maxPrice > minPrice
      ? ((visualPrice - minPrice) / (maxPrice - minPrice)) * 100
      : 50;

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
              Kéo thanh hoặc chọn đề xuất nhanh mức giá mong muốn
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
            Mức giá thương lượng
          </span>
          <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono tracking-tight">
            {visualPrice.toLocaleString("vi-VN")}{" "}
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

      {/* Touch-Friendly Slider Container with touch-pan-x and non-blocking vertical scroll */}
      <div className="space-y-2 py-1">
        <div
          className="relative flex items-center select-none touch-pan-x"
          style={{ touchAction: "pan-y" }}
        >
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={1000}
            value={visualPrice}
            onChange={handleSliderChange}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            disabled={disabled}
            aria-label="Thanh thương lượng giá"
            className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed accent-cyan-400 touch-pan-x [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/50 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-cyan-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900"
            style={{
              touchAction: "pan-y",
              background: `linear-gradient(to right, rgb(6 182 212) 0%, rgb(16 185 129) ${trackPercentage}%, rgb(15 23 42) ${trackPercentage}%, rgb(15 23 42) 100%)`,
            }}
          />
        </div>

        {/* Boundary Marks */}
        <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 px-0.5">
          <span>
            Giá sàn chấp nhận:{" "}
            <strong className="text-slate-300">
              {minPrice.toLocaleString("vi-VN")} ₫
            </strong>
          </span>
          <span>
            Giá ban đầu:{" "}
            <strong className="text-slate-300">
              {maxPrice.toLocaleString("vi-VN")} ₫
            </strong>
          </span>
        </div>
      </div>

      {/* Quick-bid Presets Section */}
      <QuickBidPresets
        basePrice={maxPrice}
        floorPrice={minPrice}
        currentPrice={visualPrice}
        onSelectPreset={setPrice}
        disabled={disabled}
        isCoolingDown={isCoolingDown}
      />

      {/* Action CTA */}
      {onOfferSubmit && (
        <Button
          type="button"
          onClick={() => onOfferSubmit(visualPrice)}
          disabled={disabled || isCoolingDown}
          className="w-full min-h-[44px] text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-950 transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation active:scale-[0.99]"
        >
          <CheckCircle className="w-4 h-4" />
          Xác nhận đề xuất {visualPrice.toLocaleString("vi-VN")} ₫
        </Button>
      )}
    </div>
  );
}
