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
    <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 space-y-5 shadow-sm">
      {/* Realtime Connection Status Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {isBuyer ? "Trả Giá Nhanh (Bargain)" : "Đề Xuất Giá Từ Người Mua"}
            </h4>
            <span className="text-[11px] text-slate-500">
              Kéo thanh hoặc chọn đề xuất nhanh mức giá mong muốn
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Realtime
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              <WifiOff className="w-3 h-3" />
              Ngoại tuyến
            </span>
          )}
        </div>
      </div>

      {/* Counter & Discount Display */}
      <div className="grid grid-cols-2 gap-3 items-center rounded-xl bg-slate-50 p-4 border border-slate-200/80">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block mb-0.5">
            MỨC GIÁ BẠN ĐỀ XUẤT
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-600 font-mono tracking-tight tabular-nums">
            {visualPrice.toLocaleString("vi-VN")}{" "}
            <span className="text-xs font-bold text-rose-400">₫</span>
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono block mb-0.5">
            MỨC TIẾT KIỆM
          </span>
          <Badge
            className={`text-xs font-mono font-bold ${
              discountPercent > 0
                ? "bg-rose-100 text-rose-700 border-rose-300"
                : "bg-slate-200 text-slate-700 border-slate-300"
            }`}
          >
            {discountPercent > 0 ? `Tiết kiệm -${discountPercent}%` : "Giá niêm yết (0%)"}
          </Badge>
        </div>
      </div>

      {/* Peer Offer Indicator (When remote user changes slider) */}
      {peerOffer !== null && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-rose-900">
            <UserCheck className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Đối tác đề xuất:{" "}
              <strong className="text-rose-700 font-mono font-bold">
                {peerOffer.toLocaleString("vi-VN")} ₫
              </strong>
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={adoptPeerOffer}
            className="h-7 px-2.5 text-[11px] text-rose-600 bg-white border border-rose-300 hover:bg-rose-100 font-semibold rounded-lg shadow-2xs"
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
            className="w-full h-3.5 bg-slate-100 rounded-full appearance-none cursor-pointer focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed accent-rose-500 touch-pan-x border border-slate-200 p-0.5 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-rose-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-rose-600"
            style={{
              touchAction: "pan-y",
              background: `linear-gradient(to right, rgb(244 63 94) 0%, rgb(225 29 72) ${trackPercentage}%, rgb(241 245 249) ${trackPercentage}%, rgb(241 245 249) 100%)`,
            }}
          />
        </div>

        {/* Boundary Marks */}
        <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 px-0.5">
          <span>
            Sàn (-30%):{" "}
            <strong className="text-slate-800">
              {minPrice.toLocaleString("vi-VN")} ₫
            </strong>
          </span>
          <span>
            Gốc:{" "}
            <strong className="text-slate-800">
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
          className="w-full min-h-11 text-xs sm:text-sm font-bold bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 hover:border-rose-400 shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation active:scale-[0.99]"
        >
          <CheckCircle className="w-4 h-4 text-rose-500" />
          Gửi Đề Xuất Mặc Cả ({visualPrice.toLocaleString("vi-VN")} ₫)
        </Button>
      )}
    </div>
  );
}
