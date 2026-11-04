'use client';

import * as React from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Contrast,
  Move,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { ZoomTransformState } from '@/types/dispute-workbench';

interface EvidenceZoomCanvasProps {
  src: string;
  alt?: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const INITIAL_TRANSFORM: ZoomTransformState = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  brightness: 100,
  contrast: 100,
};

export function EvidenceZoomCanvas({
  src,
  alt = 'Chứng cứ tranh chấp',
  title = 'Soi Chi Tiết Bằng Chứng Kỹ Thuật Số',
  isOpen,
  onClose,
  className,
}: EvidenceZoomCanvasProps) {
  const [transform, setTransform] = React.useState<ZoomTransformState>(INITIAL_TRANSFORM);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Reset when src changes
  React.useEffect(() => {
    setTransform(INITIAL_TRANSFORM);
  }, [src]);

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  const handleZoom = (delta: number) => {
    setTransform((prev) => {
      const nextScale = Math.min(5, Math.max(1, Number((prev.scale + delta).toFixed(2))));
      // If resetting to 1, also center offset
      if (nextScale === 1) {
        return { ...prev, scale: 1, offsetX: 0, offsetY: 0 };
      }
      return { ...prev, scale: nextScale };
    });
  };

  const handleSetScale = (targetScale: number) => {
    setTransform((prev) => ({
      ...prev,
      scale: targetScale,
      offsetX: targetScale === 1 ? 0 : prev.offsetX,
      offsetY: targetScale === 1 ? 0 : prev.offsetY,
    }));
  };

  const handleReset = () => {
    setTransform(INITIAL_TRANSFORM);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    handleZoom(delta);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (transform.scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.offsetX, y: e.clientY - transform.offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform((prev) => ({
      ...prev,
      offsetX: e.clientX - dragStart.x,
      offsetY: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile pan/drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && transform.scale > 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - transform.offsetX, y: touch.clientY - transform.offsetY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setTransform((prev) => ({
      ...prev,
      offsetX: touch.clientX - dragStart.x,
      offsetY: touch.clientY - dragStart.y,
    }));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in-0 duration-200 select-none',
        isFullscreen && 'p-0',
        className
      )}
    >
      <div
        className={cn(
          'relative flex flex-col w-full max-w-5xl h-[88vh] rounded-2xl border border-slate-800 bg-[#0B0F17] shadow-2xl overflow-hidden',
          isFullscreen && 'h-screen max-w-none rounded-none border-none'
        )}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#0F172A] px-4 py-3">
          <div className="flex items-center space-x-2">
            <Move className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-semibold text-white font-mono truncate max-w-[280px] sm:max-w-md">
              {title}
            </h3>
            <span className="rounded bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
              {transform.scale.toFixed(1)}x
            </span>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20"
              title="Đóng inspector (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas Viewing Area */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={cn(
            'relative flex-1 w-full overflow-hidden bg-[#070A0F] flex items-center justify-center',
            transform.scale > 1
              ? isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : 'cursor-default'
          )}
        >
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Target Scaled Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            style={{
              transform: `translate3d(${transform.offsetX}px, ${transform.offsetY}px, 0) scale(${transform.scale})`,
              filter: `brightness(${transform.brightness}%) contrast(${transform.contrast}%)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.12s ease-out',
              willChange: 'transform, filter',
            }}
            className="max-h-full max-w-full object-contain pointer-events-none select-none"
          />

          {/* Float Instruction Pill */}
          {transform.scale > 1 && (
            <div className="pointer-events-none absolute bottom-3 left-4 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-[10px] font-mono text-slate-400 backdrop-blur-sm">
              Giữ chuột trái để kéo rê (Pan) • Con lăn để thu/phóng
            </div>
          )}
        </div>

        {/* Bottom Inspector Control Toolbar */}
        <div className="border-t border-slate-800 bg-[#0F172A] p-3 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono text-slate-400 min-w-[42px]">Zoom:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleZoom(-0.25)}
                disabled={transform.scale <= 1}
                className="h-9 w-9 p-0 border-slate-800 bg-[#0B0F17] text-slate-200"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              <div className="flex items-center space-x-1">
                {[1, 2, 3, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSetScale(s)}
                    className={cn(
                      'min-h-[36px] min-w-[36px] rounded border px-2 py-1 text-[11px] font-mono transition-all',
                      transform.scale === s
                        ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 font-bold'
                        : 'border-slate-800 bg-[#0B0F17] text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleZoom(0.25)}
                disabled={transform.scale >= 5}
                className="h-9 w-9 p-0 border-slate-800 bg-[#0B0F17] text-slate-200"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Brightness & Contrast Adjustments */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Sun className="h-3 w-3 text-amber-400" />
                    Độ sáng
                  </span>
                  <span>{transform.brightness}%</span>
                </div>
                <Slider
                  min={50}
                  max={150}
                  step={5}
                  value={transform.brightness}
                  onChange={(val) => setTransform((prev) => ({ ...prev, brightness: val }))}
                  className="h-1.5"
                />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Contrast className="h-3 w-3 text-cyan-400" />
                    Tương phản
                  </span>
                  <span>{transform.contrast}%</span>
                </div>
                <Slider
                  min={50}
                  max={200}
                  step={5}
                  value={transform.contrast}
                  onChange={(val) => setTransform((prev) => ({ ...prev, contrast: val }))}
                  className="h-1.5"
                />
              </div>
            </div>

            {/* Reset Action */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="min-h-[44px] border-slate-800 bg-[#0B0F17] hover:bg-slate-800 text-slate-300 text-xs gap-1.5 px-4 font-mono"
              >
                <RotateCcw className="h-3.5 w-3.5 text-cyan-400" />
                <span>Reset View</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

