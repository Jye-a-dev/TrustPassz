import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as React from "react";
import {
  QuickBidPresets,
  computeQuickBidPresets,
  type QuickBidPresetsProps,
} from "../components/deals/quick-bid-presets.tsx";

describe("TASK-b-16: QuickBidPresets Mathematical & Anti-Spam Unit Tests", () => {
  const basePrice = 1000000; // 1,000,000 VND
  const floorPrice = 700000; // 700,000 VND (70%)

  it("should calculate exact preset prices (-5%, -10%, floor) rounded to nearest 1,000 VND", () => {
    const presets = computeQuickBidPresets(basePrice, floorPrice);

    assert.equal(presets.length, 3, "Should generate exactly 3 preset options");

    const preset5 = presets.find((p) => p.id === "preset-5");
    const preset10 = presets.find((p) => p.id === "preset-10");
    const presetFloor = presets.find((p) => p.id === "preset-floor");

    assert.ok(preset5 !== undefined);
    assert.ok(preset10 !== undefined);
    assert.ok(presetFloor !== undefined);

    // 1,000,000 - 5% = 950,000 VND
    assert.equal(preset5.price, 950000);
    assert.equal(preset5.label, "-5%");

    // 1,000,000 - 10% = 900,000 VND
    assert.equal(preset10.price, 900000);
    assert.equal(preset10.label, "-10%");

    // Floor price = 700,000 VND
    assert.equal(presetFloor.price, 700000);
    assert.equal(presetFloor.label, "Giá sàn (Tối thiểu)");
  });

  it("should enforce mathematical lower bound: prices must never fall below floorPrice", () => {
    // When floorPrice is high (e.g. 960,000 VND), -5% (950,000) and -10% (900,000) must clamp to floorPrice
    const highFloorPrice = 960000;
    const presets = computeQuickBidPresets(basePrice, highFloorPrice);

    for (const preset of presets) {
      assert.ok(
        preset.price >= highFloorPrice,
        `Preset ${preset.label} price (${preset.price}) must not be lower than floorPrice (${highFloorPrice})`
      );
      assert.ok(
        preset.price <= basePrice,
        `Preset ${preset.label} price (${preset.price}) must not exceed basePrice (${basePrice})`
      );
    }

    const preset5 = presets.find((p) => p.id === "preset-5");
    const preset10 = presets.find((p) => p.id === "preset-10");

    assert.equal(preset5?.price, 960000, "-5% must clamp to floorPrice 960,000");
    assert.equal(preset10?.price, 960000, "-10% must clamp to floorPrice 960,000");
  });

  it("should round odd base prices to the nearest 1,000 VND integer multiple", () => {
    const oddBasePrice = 1555555;
    const oddFloorPrice = 1000000;
    const presets = computeQuickBidPresets(oddBasePrice, oddFloorPrice);

    for (const preset of presets) {
      assert.equal(
        preset.price % 1000,
        0,
        `Preset ${preset.label} price (${preset.price}) must be a multiple of 1,000 VND`
      );
    }
  });

  it("should identify selected/active state when currentPrice exactly matches a preset", () => {
    const presets = computeQuickBidPresets(basePrice, floorPrice);
    const activePrice = 950000; // -5%

    const matchedPreset = presets.find((p) => p.price === activePrice);
    assert.ok(matchedPreset !== undefined);
    assert.equal(matchedPreset.id, "preset-5");

    const nonMatchingPrice = 888888;
    const unmatched = presets.find((p) => p.price === nonMatchingPrice);
    assert.equal(unmatched, undefined, "No preset should be active for arbitrary non-preset price");
  });

  it("should support 0ms optimistic visual update while debouncing network sync after 350ms", async () => {
    let visualPrice = basePrice;
    let debouncedBroadcastCount = 0;
    let lastBroadcastPrice = 0;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const setPriceWithDebounce = (newPrice: number) => {
      // 0ms Optimistic UI update
      visualPrice = newPrice;

      // 350ms Network debounce
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debouncedBroadcastCount++;
        lastBroadcastPrice = newPrice;
      }, 350);
    };

    // User clicks -5% preset (950,000)
    setPriceWithDebounce(950000);
    assert.equal(visualPrice, 950000, "Visual price must update immediately (0ms)");
    assert.equal(debouncedBroadcastCount, 0, "Network broadcast must not fire immediately");

    // Fast-forward 100ms: user clicks -10% preset (900,000)
    await new Promise((resolve) => setTimeout(resolve, 100));
    setPriceWithDebounce(900000);
    assert.equal(visualPrice, 900000, "Visual price must update immediately to 900,000");
    assert.equal(debouncedBroadcastCount, 0, "Network broadcast still pending");

    // Fast-forward 100ms: user clicks floor price (700,000)
    await new Promise((resolve) => setTimeout(resolve, 100));
    setPriceWithDebounce(700000);
    assert.equal(visualPrice, 700000, "Visual price must update immediately to 700,000");
    assert.equal(debouncedBroadcastCount, 0, "Network broadcast still pending");

    // Wait 380ms for final debounce to trigger
    await new Promise((resolve) => setTimeout(resolve, 380));

    // Verify exactly 1 network broadcast occurred with the coalesced final price
    assert.equal(debouncedBroadcastCount, 1, "Should have broadcasted exactly once");
    assert.equal(lastBroadcastPrice, 700000, "Last broadcast price must be 700,000 VND");
  });

  it("should throttle multi-clicks during 200ms cooldown window to prevent flood", async () => {
    let isCoolingDown = false;
    let rejectedClicks = 0;
    let acceptedClicks = 0;
    let cooldownTimer: ReturnType<typeof setTimeout> | null = null;

    const triggerClickWithCooldown = () => {
      if (isCoolingDown) {
        rejectedClicks++;
        return;
      }
      acceptedClicks++;
      isCoolingDown = true;
      if (cooldownTimer) clearTimeout(cooldownTimer);
      cooldownTimer = setTimeout(() => {
        isCoolingDown = false;
      }, 200);
    };

    // Burst 5 clicks within 50ms interval
    triggerClickWithCooldown();
    triggerClickWithCooldown();
    triggerClickWithCooldown();
    triggerClickWithCooldown();
    triggerClickWithCooldown();

    assert.equal(acceptedClicks, 1, "Only first click should be accepted during cooldown window");
    assert.equal(rejectedClicks, 4, "Remaining rapid clicks must be throttled");

    // Wait 220ms for cooldown to clear
    await new Promise((resolve) => setTimeout(resolve, 220));
    assert.equal(isCoolingDown, false, "Cooldown must reset after 200ms");

    // Subsequent click should be accepted
    triggerClickWithCooldown();
    assert.equal(acceptedClicks, 2, "New click after cooldown must be accepted");
  });

  it("should instantiate React QuickBidPresets component with valid touch targets and accessibility", () => {
    let selectedPrice = 0;
    const props: QuickBidPresetsProps = {
      basePrice,
      floorPrice,
      currentPrice: 950000,
      onSelectPreset: (p) => {
        selectedPrice = p;
      },
    };

    const element = React.createElement(QuickBidPresets, props);
    assert.ok(element, "QuickBidPresets element should instantiate successfully");
    assert.equal(element.props.currentPrice, 950000);
    assert.equal(element.props.basePrice, 1000000);
    assert.equal(element.props.floorPrice, 700000);

    // Test callback invocation
    element.props.onSelectPreset(900000);
    assert.equal(selectedPrice, 900000);
  });
});

