import React, { useState, useEffect } from 'react';

interface BargainSliderProps {
  minPrice: number;
  maxPrice: number;
  currentPrice: number;
  onPriceChange: (newPrice: number) => void;
  disabled?: boolean;
}

export const BargainSlider: React.FC<BargainSliderProps> = ({
  minPrice,
  maxPrice,
  currentPrice,
  onPriceChange,
  disabled = false,
}) => {
  const [value, setValue] = useState(currentPrice);

  useEffect(() => {
    setValue(currentPrice);
  }, [currentPrice]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (value !== currentPrice) {
        onPriceChange(value);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [value, currentPrice, onPriceChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(Number(e.target.value));
  };

  const percent = Math.min(
    100,
    Math.max(0, ((value - minPrice) / (maxPrice - minPrice || 1)) * 100)
  );

  return (
    <div className="w-full p-4 bg-[#0F172A] rounded-2xl border border-[#1E293B] shadow-inner space-y-3">
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>Sàn: {minPrice.toLocaleString('vi-VN')} đ</span>
        <span className="text-cyan-400 font-mono">Đề xuất giá mới</span>
        <span>Trần: {maxPrice.toLocaleString('vi-VN')} đ</span>
      </div>

      <div className="text-center py-1">
        <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
          {value.toLocaleString('vi-VN')}{' '}
          <span className="text-xs text-slate-400 font-sans font-normal">VND</span>
        </span>
      </div>

      <div className="relative w-full py-2">
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={50000}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#10B981] touch-pan-x disabled:opacity-50"
          style={{
            background: `linear-gradient(to right, #10B981 0%, #06B6D4 ${percent}%, #1E293B ${percent}%, #1E293B 100%)`,
          }}
        />
      </div>

      <div className="flex justify-between items-center text-[11px] text-slate-500">
        <span>Trượt để đàm phán</span>
        <span className="font-mono text-cyan-500">Tự lưu sau 300ms</span>
      </div>
    </div>
  );
};

