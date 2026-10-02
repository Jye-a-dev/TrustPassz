import React, { useState } from 'react';

interface GreetingScreenProps {
  onContinue: () => void;
}

const PILLARS = [
  {
    title: 'VietQR-to-Escrow',
    subtitle: 'Napas 247 Khóa Tiền Tự Động',
    desc: 'Thanh toán App-to-App qua chuẩn VietQR động. Tiền được đóng băng an toàn trong hợp đồng thông minh hoặc tài khoản ký quỹ.',
    icon: '⚡',
    badge: 'Napas 247 Instant',
    gradient: 'from-emerald-500/20 to-cyan-500/10',
    border: 'border-emerald-500/30',
  },
  {
    title: 'Digital Vault AES-256-GCM',
    subtitle: 'Két Số Mã Hóa Đầu Cuối',
    desc: 'Bàn giao License Key, source code hoặc dữ liệu số bảo mật tuyệt đối. Người mua chỉ giải mã sau khi escrow xác nhận đã khóa tiền.',
    icon: '🔐',
    badge: 'Zero-Knowledge Vault',
    gradient: 'from-cyan-500/20 to-blue-500/10',
    border: 'border-cyan-500/30',
  },
  {
    title: 'AI Arbitrator',
    subtitle: 'Trọng Tài AI Phân Giải Tranh Chấp',
    desc: 'Phân tích video/ảnh lỗi client-side với trích xuất keyframes tự động. Đưa ra phán quyết hoàn tiền hoặc thanh toán chỉ trong vài giây.',
    icon: '🤖',
    badge: 'Vision AI Pipeline',
    gradient: 'from-purple-500/20 to-pink-500/10',
    border: 'border-purple-500/30',
  },
];

export const GreetingScreen: React.FC<GreetingScreenProps> = ({ onContinue }) => {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    if (activeStep < PILLARS.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      onContinue();
    }
  };

  const item = PILLARS[activeStep];

  return (
    <div className="flex flex-col h-full bg-[#080C14] text-slate-100 justify-between p-6 select-none">
      <div className="pt-6 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-sm shadow-md shadow-cyan-500/30">
            TP
          </div>
          <span className="font-bold text-lg tracking-wider text-white">TrustPassz</span>
        </div>
        <p className="text-xs text-slate-400 font-mono">Bảo Vệ Giao Dịch Tài Sản Số</p>
      </div>

      <div className="my-auto py-6">
        <div
          key={activeStep}
          className={`p-6 rounded-3xl bg-gradient-to-b ${item.gradient} border ${item.border} backdrop-blur-sm space-y-4 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-right-4`}
        >
          <div className="flex items-center justify-between">
            <span className="text-4xl p-3 bg-[#080C14]/60 rounded-2xl border border-slate-800">
              {item.icon}
            </span>
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-cyan-400">
              {item.badge}
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">{item.title}</h2>
            <p className="text-xs text-emerald-400 font-medium">{item.subtitle}</p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {PILLARS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                activeStep === idx ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 pb-4">
        <button
          onClick={handleNext}
          className="w-full h-14 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 active:scale-95 text-slate-950 font-bold rounded-2xl shadow-xl shadow-cyan-500/20 text-sm transition-transform flex items-center justify-center gap-2"
        >
          {activeStep === PILLARS.length - 1 ? 'Khám Phá Sàn Escrow Ngay' : 'Tiếp Tục →'}
        </button>

        {activeStep < PILLARS.length - 1 && (
          <button
            onClick={onContinue}
            className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 text-center"
          >
            Bỏ qua giới thiệu
          </button>
        )}
      </div>
    </div>
  );
};

