"use client";

import * as React from "react";
import { motion } from "motion/react";

interface Sparkle {
  id: number;
  top: string;
  left: string;
  size: number;
  color: string;
  delay: number;
  duration: number;
  hasGlow?: boolean;
}

// Deterministic distributed sparkles to prevent SSR hydration mismatch
const BACKGROUND_SPARKLES: Sparkle[] = [
  { id: 1, top: "6%", left: "12%", size: 14, color: "text-cyan-400/80 dark:text-cyan-300/80", delay: 0.3, duration: 4.2, hasGlow: true },
  { id: 2, top: "10%", left: "82%", size: 18, color: "text-emerald-400/80 dark:text-emerald-300/80", delay: 1.1, duration: 5.0, hasGlow: true },
  { id: 3, top: "15%", left: "34%", size: 10, color: "text-cyan-300/60 dark:text-cyan-400/60", delay: 2.4, duration: 3.8 },
  { id: 4, top: "22%", left: "91%", size: 12, color: "text-teal-300/70 dark:text-teal-400/70", delay: 0.8, duration: 4.6 },
  { id: 5, top: "28%", left: "6%", size: 16, color: "text-emerald-400/70 dark:text-emerald-300/70", delay: 1.8, duration: 4.4, hasGlow: true },
  { id: 6, top: "35%", left: "48%", size: 14, color: "text-cyan-400/60 dark:text-cyan-300/60", delay: 2.9, duration: 5.2 },
  { id: 7, top: "42%", left: "88%", size: 16, color: "text-teal-400/80 dark:text-teal-300/80", delay: 0.5, duration: 4.8, hasGlow: true },
  { id: 8, top: "49%", left: "18%", size: 12, color: "text-cyan-300/70 dark:text-cyan-400/70", delay: 3.2, duration: 4.1 },
  { id: 9, top: "54%", left: "76%", size: 14, color: "text-emerald-300/80 dark:text-emerald-400/80", delay: 1.5, duration: 4.7 },
  { id: 10, top: "61%", left: "28%", size: 18, color: "text-cyan-400/80 dark:text-cyan-300/80", delay: 2.1, duration: 5.4, hasGlow: true },
  { id: 11, top: "68%", left: "94%", size: 10, color: "text-teal-300/60 dark:text-teal-400/60", delay: 0.9, duration: 3.9 },
  { id: 12, top: "73%", left: "10%", size: 15, color: "text-emerald-400/70 dark:text-emerald-300/70", delay: 3.6, duration: 4.5, hasGlow: true },
  { id: 13, top: "80%", left: "62%", size: 16, color: "text-cyan-400/70 dark:text-cyan-300/70", delay: 1.2, duration: 5.1, hasGlow: true },
  { id: 14, top: "87%", left: "38%", size: 12, color: "text-teal-400/70 dark:text-teal-300/70", delay: 2.7, duration: 4.3 },
  { id: 15, top: "93%", left: "84%", size: 15, color: "text-emerald-400/80 dark:text-emerald-300/80", delay: 0.2, duration: 4.9, hasGlow: true },
  { id: 16, top: "18%", left: "64%", size: 11, color: "text-cyan-300/60 dark:text-cyan-200/60", delay: 1.9, duration: 3.7 },
  { id: 17, top: "39%", left: "22%", size: 13, color: "text-emerald-300/70 dark:text-emerald-400/70", delay: 2.3, duration: 4.6 },
  { id: 18, top: "64%", left: "80%", size: 11, color: "text-cyan-400/60 dark:text-cyan-300/60", delay: 3.4, duration: 3.9 },
  { id: 19, top: "77%", left: "44%", size: 13, color: "text-teal-300/70 dark:text-teal-400/70", delay: 0.7, duration: 4.4 },
  { id: 20, top: "84%", left: "15%", size: 10, color: "text-cyan-300/60 dark:text-cyan-400/60", delay: 2.0, duration: 3.8 },
];

export function LandingBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Subtle Tech Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[32px_32px] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Floating Ambient Aura Orb 1 - Cyan Top Left */}
      <motion.div
        animate={{
          x: [0, 45, -35, 0],
          y: [0, -35, 25, 0],
          scale: [1, 1.08, 0.94, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-24 left-[15%] w-120 h-120 rounded-full bg-linear-to-br from-cyan-500/15 via-teal-500/10 to-transparent blur-[120px]"
      />

      {/* Floating Ambient Aura Orb 2 - Emerald Top Right */}
      <motion.div
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.92, 1.06, 1],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[12%] right-[10%] w-130 h-130 rounded-full bg-linear-to-bl from-emerald-500/15 via-teal-500/10 to-transparent blur-[130px]"
      />

      {/* Floating Ambient Aura Orb 3 - Cyan Mid Page */}
      <motion.div
        animate={{
          x: [0, 35, -25, 0],
          y: [0, -30, 35, 0],
          scale: [0.95, 1.05, 0.98, 0.95],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[48%] left-[5%] w-105 h-105 rounded-full bg-linear-to-tr from-cyan-500/10 via-emerald-500/8 to-transparent blur-[125px]"
      />

      {/* Floating Micro Particle Badge 1 - Left Drift */}
      <motion.div
        animate={{
          y: [0, -18, 0],
          rotate: [0, 6, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="hidden lg:flex absolute top-36 left-[8%] items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-cyan-500/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md text-[10px] font-mono text-cyan-600 dark:text-cyan-400 shadow-sm"
      >
        <span className="size-1.5 rounded-full bg-cyan-400 animate-ping" />
        <span>Escrow_Lock::Active</span>
      </motion.div>

      {/* Floating Micro Particle Badge 2 - Right Drift */}
      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [0, -8, 0],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="hidden lg:flex absolute top-72 right-[7%] items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-emerald-500/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md text-[10px] font-mono text-emerald-600 dark:text-emerald-400 shadow-sm"
      >
        <span className="size-1.5 rounded-full bg-emerald-400" />
        <span>VietQR::24h_Verified</span>
      </motion.div>

      {/* Ambient Twinkling Random Sparkles */}
      {BACKGROUND_SPARKLES.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            scale: [0, 1.15, 0.45, 1, 0],
            opacity: [0, 0.9, 0.25, 0.85, 0],
            rotate: [0, 45, 90, 135, 180],
          }}
          transition={{
            duration: sparkle.duration,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            top: sparkle.top,
            left: sparkle.left,
            width: sparkle.size,
            height: sparkle.size,
          }}
          className={`absolute pointer-events-none select-none ${sparkle.color} ${
            sparkle.hasGlow ? "drop-shadow-[0_0_6px_currentColor]" : ""
          }`}
        >
          {/* 4-Point Star Sparkle Geometry */}
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-full h-full"
            aria-hidden="true"
          >
            <path d="M12 0L14.4 9.6L24 12L14.4 14.4L12 24L9.6 14.4L0 12L9.6 9.6L12 0Z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
