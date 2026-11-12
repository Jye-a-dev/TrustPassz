/**
 * Web Audio API Synthetic Chime Engine with Browser Autoplay Policy Unlock.
 * Unlocks AudioContext on the user's first interaction (pointerdown, keydown, touchstart)
 * and synthesizes a crisp dual-tone Fintech chime without external audio assets.
 */

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const UNLOCK_EVENTS: ReadonlyArray<keyof WindowEventMap> = [
  "pointerdown",
  "keydown",
  "touchstart",
];

let sharedAudioContext: AudioContext | null = null;
let listenersAttached = false;
let isAudioUnlocked = false;

function resolveAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const win = window as WindowWithWebkitAudio;
  return window.AudioContext || win.webkitAudioContext || null;
}

export function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    if (sharedAudioContext && sharedAudioContext.state !== "closed") {
      return sharedAudioContext;
    }
    const AudioCtx = resolveAudioContextConstructor();
    if (!AudioCtx) return null;
    sharedAudioContext = new AudioCtx();
    if (sharedAudioContext.state === "running") {
      isAudioUnlocked = true;
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

export function getAudioContextState(): AudioContextState | "unavailable" {
  try {
    if (!sharedAudioContext) {
      return resolveAudioContextConstructor() ? "suspended" : "unavailable";
    }
    return sharedAudioContext.state;
  } catch {
    return "unavailable";
  }
}

export async function unlockAudioContext(): Promise<boolean> {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    isAudioUnlocked = ctx.state === "running";
    return isAudioUnlocked;
  } catch {
    return false;
  }
}

function detachUnlockListeners(handler: () => void): void {
  if (typeof window === "undefined" || !listenersAttached) return;
  for (const evt of UNLOCK_EVENTS) {
    window.removeEventListener(evt, handler, { capture: true });
  }
  listenersAttached = false;
}

/**
 * Registers a one-time global gesture listener to transition AudioContext
 * from 'suspended' to 'running', complying with Chrome/Safari/Edge autoplay policies.
 */
export function initAudioUnlock(): () => void {
  if (typeof window === "undefined" || isAudioUnlocked) {
    return () => {};
  }

  const handleFirstGesture = () => {
    void unlockAudioContext().then((unlocked) => {
      if (unlocked) {
        detachUnlockListeners(handleFirstGesture);
      }
    });
  };

  if (!listenersAttached) {
    for (const evt of UNLOCK_EVENTS) {
      window.addEventListener(evt, handleFirstGesture, {
        passive: true,
        capture: true,
      });
    }
    listenersAttached = true;
  }

  return () => {
    detachUnlockListeners(handleFirstGesture);
  };
}

function scheduleChimeTone(
  ctx: AudioContext,
  frequencyHz: number,
  startOffsetSec: number,
  durationSec: number,
  peakGain: number
): void {
  const startTime = ctx.currentTime + startOffsetSec;
  const stopTime = startTime + durationSec;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequencyHz, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.018);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.onended = () => {
    try {
      oscillator.disconnect();
      gainNode.disconnect();
    } catch {
      // Ignore cleanup failures on already-disposed nodes
    }
  };

  oscillator.start(startTime);
  oscillator.stop(stopTime);
}

/**
 * Synthesizes an elegant dual-tone Fintech notification chime:
 * - Tone 1: 587.33 Hz (D5) for 0.15s
 * - Tone 2: 1174.66 Hz (D6) for 0.30s with smooth exponential decay
 */
export function playNotificationChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playNotes = () => {
      try {
        scheduleChimeTone(ctx, 587.33, 0.0, 0.15, 0.16);
        scheduleChimeTone(ctx, 1174.66, 0.11, 0.3, 0.18);
      } catch {
        // Safely ignore oscillator scheduling errors
      }
    };

    if (ctx.state === "suspended") {
      void ctx
        .resume()
        .then(() => {
          isAudioUnlocked = ctx.state === "running";
          if (isAudioUnlocked) {
            playNotes();
          }
        })
        .catch(() => {
          // Browser blocked playback before user gesture; fail silently
        });
      return;
    }

    if (ctx.state === "running") {
      isAudioUnlocked = true;
      playNotes();
    }
  } catch {
    // Never throw unhandled errors that could disrupt UI
  }
}

export function resetAudioChimeForTest(): void {
  sharedAudioContext = null;
  listenersAttached = false;
  isAudioUnlocked = false;
}
