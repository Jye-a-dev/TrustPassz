'use client';

import * as React from 'react';
import { Sliders, Eye, RefreshCw, Sparkles, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface PreprocessingConfig {
  contrast: number; // 0.5 - 2.0
  brightness: number; // -100 - 100
  letterboxSize: number; // 512 default
  enableDenoising: boolean;
}

export function ContrastSliderPanel() {
  const [config, setConfig] = React.useState<PreprocessingConfig>({
    contrast: 1.15,
    brightness: 10,
    letterboxSize: 512,
    enableDenoising: true,
  });

  const [isSaved, setIsSaved] = React.useState(false);

  const handleReset = () => {
    setConfig({
      contrast: 1.0,
      brightness: 0,
      letterboxSize: 512,
      enableDenoising: true,
    });
    toast.info('Đã hoàn nguyên cấu hình tiền xử lý tensor về mặc định.');
  };

  const handleSave = () => {
    setIsSaved(true);
    toast.success('Đã lưu tham số tiền xử lý sVLM thành công.');
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <Card className="border-slate-800 bg-[#0F172A] shadow-md">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-white">
                Tiền Xử Lý Hình Ảnh & Tensor sVLM (Preprocessing)
              </CardTitle>
              <p className="text-[11px] text-slate-400">
                Tối ưu hóa độ tương phản và chuẩn hóa khung hình trước khi feed vào Qwen2-VL
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-white h-8"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Mặc định
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        {/* Interactive Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Contrast Slider */}
            <Slider
              label="Độ Tương Phản (Contrast Factor)"
              min={0.5}
              max={2.0}
              step={0.05}
              value={config.contrast}
              onChange={(val) => setConfig((c) => ({ ...c, contrast: val }))}
              unit="x"
            />

            {/* Brightness Slider */}
            <Slider
              label="Độ Sáng (Brightness Offset)"
              min={-100}
              max={100}
              step={5}
              value={config.brightness}
              onChange={(val) => setConfig((c) => ({ ...c, brightness: val }))}
              unit=""
            />

            {/* Letterbox resolution */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-medium text-slate-300">
                <span>Letterbox Resize (RGB Square):</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {config.letterboxSize}x{config.letterboxSize} px
                </span>
              </div>
              <div className="flex gap-2">
                {[384, 512, 640].map((size) => (
                  <button
                    key={size}
                    onClick={() => setConfig((c) => ({ ...c, letterboxSize: size }))}
                    className={`flex-1 rounded-md py-1.5 text-xs font-mono border transition-colors ${
                      config.letterboxSize === size
                        ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 font-semibold'
                        : 'border-slate-800 bg-[#080C14] text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-[#080C14] p-4 text-xs">
            <span className="text-slate-400 mb-2 flex items-center gap-1.5 text-[11px]">
              <Eye className="h-3.5 w-3.5 text-cyan-400" />
              Mô phỏng Tensor sau khi Filter (512x512 RGB)
            </span>
            <div
              style={{
                filter: `contrast(${config.contrast}) brightness(${1 + config.brightness / 100})`,
              }}
              className="h-32 w-32 rounded-lg bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-800/40 flex flex-col items-center justify-center text-center p-2 transition-all shadow-inner"
            >
              <span className="font-mono text-[10px] text-cyan-400 font-bold">Unbox Image</span>
              <span className="font-mono text-[9px] text-slate-400 mt-1">
                C:{config.contrast}x | B:{config.brightness}
              </span>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 text-center">
              Giúp OCR & Vision Model phát hiện rõ stack trace và terminal error logs.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <Button
            size="sm"
            onClick={handleSave}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-9 gap-1.5"
          >
            {isSaved ? <Check className="h-4 w-4 text-emerald-300" /> : <Sparkles className="h-4 w-4" />}
            <span>{isSaved ? 'Đã lưu cấu hình' : 'Áp dụng vào Pipeline FastAPI'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
