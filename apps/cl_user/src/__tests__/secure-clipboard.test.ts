import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SecureClipboardService } from "../lib/secure-clipboard.ts";

describe("SecureClipboardService Security Unit Tests", () => {
  it("should write text to clipboard and schedule auto-clear within 30 seconds", async () => {
    let clipboardStore = "";

    const mockClipboard = {
      writeText: async (text: string) => {
        clipboardStore = text;
      },
      readText: async () => {
        return clipboardStore;
      },
    };

    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: mockClipboard,
      configurable: true,
      writable: true,
    });

    const service = new SecureClipboardService();
    const sensitiveData = "0987654321 - MBBank";

    const success = await service.copy(sensitiveData);
    assert.equal(success, true, "copy should succeed");
    assert.equal(clipboardStore, sensitiveData, "Clipboard store must contain copied data immediately");

    // Force clear invocation to simulate timer trigger
    await service.clearIfMatching();
    assert.equal(clipboardStore, "", "Clipboard must be wiped clean after expiration");
  });

  it("should not clear clipboard if user subsequently copied different content", async () => {
    let clipboardStore = "";

    const mockClipboard = {
      writeText: async (text: string) => {
        clipboardStore = text;
      },
      readText: async () => {
        return clipboardStore;
      },
    };

    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: mockClipboard,
      configurable: true,
      writable: true,
    });

    const service = new SecureClipboardService();
    await service.copy("ORIGINAL_SECRET_STK_123");

    // Simulate user copying another regular string in another app/tab
    clipboardStore = "USER_NEW_RECIPE_TEXT";

    // When timer expires for original secret
    await service.clearIfMatching();

    // Clipboard must NOT be cleared because user is actively using new text
    assert.equal(
      clipboardStore,
      "USER_NEW_RECIPE_TEXT",
      "Clipboard must preserve subsequent user data"
    );
  });
});

