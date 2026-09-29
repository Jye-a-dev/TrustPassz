import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Inspection Window Countdown Calculation Tests", () => {
  it("should correctly compute hours, minutes and seconds from remaining duration", () => {
    const totalSeconds = 43200; // 12 hours
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    assert.equal(hours, 12);
    assert.equal(minutes, 0);
    assert.equal(seconds, 0);
  });

  it("should trigger warning state when remaining time is less than 2 hours", () => {
    const totalSeconds = 7100; // ~1h 58m
    const isWarning = totalSeconds < 7200;
    const isCritical = totalSeconds < 1800;

    assert.equal(isWarning, true);
    assert.equal(isCritical, false);
  });

  it("should trigger critical state when remaining time is less than 30 minutes", () => {
    const totalSeconds = 1750; // ~29m
    const isCritical = totalSeconds < 1800;

    assert.equal(isCritical, true);
  });

  it("should mark expired when target time is reached or passed", () => {
    const targetTimestamp = Date.now() - 5000; // 5 seconds ago
    const diffMs = targetTimestamp - Date.now();
    const isExpired = diffMs <= 0;

    assert.equal(isExpired, true);
  });
});
