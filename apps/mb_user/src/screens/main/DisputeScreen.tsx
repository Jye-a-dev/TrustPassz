import React, { useState, useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { extractKeyframes, type ExtractedFrame } from '../../services/keyframe-extractor';
import { apiClient } from '../../services/apiClient';
import { useAuthStore } from '../../stores/useAuthStore';

interface DisputeScreenProps {
  dealId?: string;
  onBack: () => void;
}

export const DisputeScreen: React.FC<DisputeScreenProps> = ({ dealId = '', onBack }) => {
  const { user } = useAuthStore();
  const [activeDealId, setActiveDealId] = useState(dealId);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedFrames, setExtractedFrames] = useState<ExtractedFrame[]>([]);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleCapturePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        width: 512,
        height: 512,
      });

      if (image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const singleFrame: ExtractedFrame = {
          blob,
          previewUrl: image.webPath,
          timestampSec: 0,
        };
        setExtractedFrames((prev) => [...prev.slice(0, 2), singleFrame]);
      }
    } catch (e) {
      console.warn('[Camera] Photo capture canceled or failed:', e);
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusFeedback('Đang trích xuất 3 khung hình keyframe (20%, 50%, 80%)...');

    try {
      const frames = await extractKeyframes(file);
      setExtractedFrames(frames);
      setStatusFeedback(`✓ Đã trích xuất thành công ${frames.length} keyframes chuẩn 512x512`);
    } catch (err) {
      console.error('[Keyframe] Extraction error:', err);
      setStatusFeedback(`❌ Lỗi trích xuất video: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitDispute = async () => {
    if (!activeDealId.trim()) {
      alert('Vui lòng nhập Deal ID cần khiếu nại');
      return;
    }
    if (!reason.trim()) {
      alert('Vui lòng mô tả chi tiết lý do khiếu nại');
      return;
    }
    if (extractedFrames.length === 0) {
      alert('Vui lòng đính kèm ít nhất 1 ảnh chụp hoặc 1 video bằng chứng');
      return;
    }

    setIsSubmitting(true);
    setStatusFeedback('Đang đóng gói dữ liệu và kích hoạt AI Arbitrator Pipeline...');

    try {
      const formData = new FormData();
      formData.append('dealId', activeDealId);
      formData.append('initiatorId', user?.id || '22222222-2222-4222-a222-222222222222');
      formData.append('reason', reason);

      extractedFrames.forEach((frame, idx) => {
        formData.append('files', frame.blob, `keyframe_${idx + 1}_${frame.timestampSec}s.jpg`);
      });

      // Gửi trực tiếp tới endpoint /api/v1/disputes
      await apiClient('/api/v1/disputes', {
        method: 'POST',
        body: formData,
      });

      setStatusFeedback('🎉 Khiếu nại đã gửi thành công! AI Arbitrator đang phân tích chứng cứ.');
      setTimeout(() => {
        onBack();
      }, 2500);
    } catch (err) {
      console.error('[Dispute] Submission failed:', err);
      setStatusFeedback(`❌ Lỗi gửi khiếu nại: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080C14] text-slate-100 p-4 space-y-4 overflow-y-auto pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs text-slate-300 active:scale-95 transition"
        >
          ← Quay lại
        </button>
        <span className="font-mono text-xs text-rose-400">AI ARBITRATOR CENTER</span>
      </div>

      <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-1">
        <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
          <span>⚖️</span> Mở Khiếu Nại & Giám Định AI
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Tải lên video bằng chứng để trích xuất 3 keyframe gửi mô hình Vision AI thẩm định tính hợp lệ của tài sản số.
        </p>
      </div>

      <div className="space-y-3 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4">
        <div>
          <label className="text-xs text-slate-400 font-mono">MÃ DEAL KÝ QUỸ (UUID):</label>
          <input
            type="text"
            value={activeDealId}
            onChange={(e) => setActiveDealId(e.target.value)}
            placeholder="Ví dụ: d0000000-0000-4000-a000-000000000001"
            className="w-full mt-1 px-3 py-2 bg-[#080C14] border border-[#1E293B] rounded-xl text-xs text-cyan-300 font-mono focus:outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 font-mono">MÔ TẢ LỖI SẢN PHẨM:</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="License key không kích hoạt được, video hướng dẫn bị sai lệch..."
            rows={3}
            className="w-full mt-1 p-3 bg-[#080C14] border border-[#1E293B] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500 resize-none"
          />
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-xs text-slate-400 font-mono">BẰNG CHỨNG (ẢNH HOẶC VIDEO):</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCapturePhoto}
              className="h-12 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-cyan-400 font-semibold active:scale-95 transition flex items-center justify-center gap-2"
            >
              <span>📸</span> Chụp Ảnh Thật
            </button>

            <button
              onClick={() => videoInputRef.current?.click()}
              className="h-12 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-emerald-400 font-semibold active:scale-95 transition flex items-center justify-center gap-2"
            >
              <span>🎥</span> Tải Clip Video
            </button>
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              className="hidden"
              onChange={handleVideoFileChange}
            />
          </div>
        </div>

        {statusFeedback && (
          <p className="text-xs font-mono text-center text-amber-300 py-1">{statusFeedback}</p>
        )}

        {extractedFrames.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#1E293B]">
            <p className="text-xs font-mono text-cyan-400">
              3 Keyframes Trích Xuất Sắc Nét (512x512):
            </p>
            <div className="grid grid-cols-3 gap-2">
              {extractedFrames.map((frame, idx) => (
                <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-square">
                  <img
                    src={frame.previewUrl}
                    alt={`Keyframe ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-cyan-300">
                    {frame.timestampSec}s
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSubmitDispute}
          disabled={isProcessing || isSubmitting || extractedFrames.length === 0}
          className="w-full h-14 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold rounded-2xl active:scale-95 transition disabled:opacity-50 text-xs uppercase tracking-wider font-mono shadow-xl shadow-rose-600/20"
        >
          {isSubmitting ? 'Đang gửi AI Pipeline...' : 'Gửi AI Trọng Tài Thẩm Định'}
        </button>
      </div>
    </div>
  );
};

