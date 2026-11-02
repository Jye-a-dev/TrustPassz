/**
 * Modern Cyber-Escrow Audio Chime Synthesizer via Web Audio API.
 * Provides zero-asset, procedural audio cues for escrow confirmation and payout settlement.
 * Safely handles browser autoplay policies with try/catch fallbacks.
 */

export function playSuccessChime(): void {
  try {
    if (typeof window === "undefined") return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const playNote = (
      freq: number,
      startOffset: number,
      duration: number,
      gainLevel: number
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + startOffset);

      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(gainLevel, now + startOffset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration);
    };

    // Futuristic escrow chime progression: C5 -> E5 -> G5 -> C6
    playNote(523.25, 0.0, 0.22, 0.16);
    playNote(659.25, 0.09, 0.22, 0.16);
    playNote(783.99, 0.18, 0.25, 0.18);
    playNote(1046.5, 0.28, 0.48, 0.2);
  } catch {
    // Silently continue if audio context is blocked by browser policies
  }
}

