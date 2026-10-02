import React, { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetTimestamp?: string | number | null;
  durationSeconds?: number;
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetTimestamp,
  durationSeconds = 86400,
  onExpire,
}) => {
  const [remainingSec, setRemainingSec] = useState<number>(() => {
    if (targetTimestamp) {
      const target = typeof targetTimestamp === 'number'
        ? targetTimestamp
        : new Date(targetTimestamp).getTime();
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
      return diff;
    }
    return durationSeconds;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onExpire]);

  const hours = Math.floor(remainingSec / 3600);
  const minutes = Math.floor((remainingSec % 3600) / 60);
  const seconds = remainingSec % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#080C14] border border-[#1E293B] rounded-xl font-mono text-xs">
      <span className="text-amber-400 font-semibold">⏳ Hạn kiểm tra:</span>
      <span className="text-white font-bold tracking-wider">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
};

