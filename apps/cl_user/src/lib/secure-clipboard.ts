/**
 * Secure Clipboard Service with automated memory sanitization and 30-second clipboard wipe.
 * Prevents credential harvesting and memory leaks of sensitive banking & vault data.
 */

export class SecureClipboardService {
  private static instance: SecureClipboardService;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastCopiedText: string | null = null;
  private readonly CLEAR_TIMEOUT_MS = 30_000; // 30 seconds

  public static getInstance(): SecureClipboardService {
    if (!SecureClipboardService.instance) {
      SecureClipboardService.instance = new SecureClipboardService();
    }
    return SecureClipboardService.instance;
  }

  private getClipboard(): Clipboard | null {
    if (typeof navigator !== "undefined" && navigator?.clipboard) {
      return navigator.clipboard;
    }
    if (typeof window !== "undefined" && window?.navigator?.clipboard) {
      return window.navigator.clipboard;
    }
    return null;
  }

  /**
   * Safely writes text to clipboard and schedules an automatic wipe after 30 seconds.
   * If the clipboard content has already been overwritten by the user, the scheduled wipe is aborted.
   */
  public async copy(text: string): Promise<boolean> {
    const clipboard = this.getClipboard();
    if (!clipboard) {
      return false;
    }

    try {
      await clipboard.writeText(text);
      this.lastCopiedText = text;

      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }

      this.timer = setTimeout(async () => {
        await this.clearIfMatching();
      }, this.CLEAR_TIMEOUT_MS);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clears clipboard only if the content still matches the sensitive text originally written.
   */
  public async clearIfMatching(): Promise<void> {
    const clipboard = this.getClipboard();
    if (!clipboard || !this.lastCopiedText) {
      return;
    }

    try {
      let shouldWipe = true;
      try {
        const currentText = await clipboard.readText();
        shouldWipe = currentText === this.lastCopiedText;
      } catch {
        // In environments where readText permission is restricted, proceed with cautious overwrite
        shouldWipe = true;
      }

      if (shouldWipe) {
        await clipboard.writeText("");
      }
    } catch {
      // Suppress clipboard write rejection on backgrounded tabs
    } finally {
      this.lastCopiedText = null;
      this.timer = null;
    }
  }

  /**
   * Force clears any pending timer and wipes clipboard immediately.
   */
  public async forceClear(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.lastCopiedText = null;

    const clipboard = this.getClipboard();
    if (clipboard) {
      try {
        await clipboard.writeText("");
      } catch {
        // Ignored
      }
    }
  }
}

export const secureClipboard = SecureClipboardService.getInstance();

