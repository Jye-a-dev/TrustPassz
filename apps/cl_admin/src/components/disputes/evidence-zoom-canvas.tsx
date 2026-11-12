'use client';

import * as React from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Contrast,
  X,
  Maximize2,
  Minimize2,
  Eye,
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
  title = 'Soi Bằng Chứng Kỹ Thuật Số',
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
        'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-200 select-none overflow-y-auto',
        isFullscreen && 'p-0',
        className
      )}
    >
      <div
        className={cn(
          'relative flex flex-col w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-slate-900',
          isFullscreen && 'h-screen max-w-none rounded-none border-none'
        )}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3">
          <div className="flex items-center space-x-2.5">
            <Eye className="h-4 w-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900 truncate max-w-[280px] sm:max-w-md">
              {title}
            </h3>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-mono font-medium text-slate-700">
              {transform.scale.toFixed(1)}x
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick scale buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {[1, 2, 3, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSetScale(s)}
                  className={cn(
                    'h-8 px-2.5 rounded-lg border text-xs font-mono font-medium transition-all',
                    Math.round(transform.scale) === s
                      ? 'border-slate-900 bg-slate-900 text-white font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-9 w-9 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
              title="Đóng (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas Viewing Area (Dark viewport for terminal/code evidence readability) */}
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
            'relative flex-1 w-full overflow-hidden bg-slate-950 flex items-center justify-center',
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
                'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
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
            <div className="pointer-events-none absolute bottom-3 left-4 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1 text-[11px] font-mono text-slate-400 backdrop-blur-sm">
              Giữ chuột trái để kéo rê (Pan) • Con lăn để thu/phóng
            </div>
          )}
        </div>

        {/* Bottom Inspector Control Toolbar */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-600 min-w-[42px]">Zoom:</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleZoom(-0.25)}
                disabled={transform.scale <= 1}
                className="h-9 w-9 p-0 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleZoom(0.25)}
                disabled={transform.scale >= 5}
                className="h-9 w-9 p-0 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Brightness & Contrast Adjustments */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    Độ sáng
                  </span>
                  <span className="font-mono">{transform.brightness}%</span>
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
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    <Contrast className="h-3.5 w-3.5 text-cyan-600" />
                    Tương phản
                  </span>
                  <span className="font-mono">{transform.contrast}%</span>
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
                className="h-10 px-4 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-600" />
                <span>Reset View</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
