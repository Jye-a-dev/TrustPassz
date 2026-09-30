"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  unit?: string;
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  unit = "",
  className,
  disabled,
  ...props
}: SliderProps) {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {label && (
        <div className="flex justify-between items-center text-xs">
          <span className="font-medium text-slate-300">{label}</span>
          <span className="font-mono text-cyan-400 font-semibold">
            {value}
            {unit}
          </span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={cn(
          "w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
