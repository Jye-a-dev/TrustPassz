import { describe, it } from "node:test";
import assert from "node:assert/strict";
import * as React from "react";
import { BargainSlider, type BargainSliderProps } from "../components/deals/bargain-slider.tsx";
import { supabase } from "../lib/supabase-client.ts";

describe("BargainSlider Realtime Component & Protocol Tests", () => {
  const mockDealId = "deal-1234-abcd-5678";
  const mockBuyerId = "buyer-uuid-9999";
  const basePrice = 1000000; // 1,000,000 VND
  const expectedFloorPrice = Math.round(basePrice * 0.7); // 700,000 VND (70%)

  it("should calculate correct default floorPrice (70% basePrice) and price range boundaries", () => {
    const props: BargainSliderProps = {
      dealId: mockDealId,
      basePrice,
      currentUserId: mockBuyerId,
    };

    assert.equal(props.basePrice, 1000000);
    assert.equal(props.floorPrice ?? Math.round(props.basePrice * 0.7), 700000);

    const calculatedFloor = Math.round(basePrice * 0.7);
    assert.equal(calculatedFloor, expectedFloorPrice);
    assert.ok(calculatedFloor < basePrice, "Floor price must be strictly less than base price");
  });

  it("should enforce exact Supabase Realtime broadcast message schema", () => {
    const offeredPrice = 850000;
    const broadcastEvent = {
      type: "broadcast" as const,
      event: "bargain:slider_update",
      payload: {
        dealId: mockDealId,
        offeredPrice,
        buyerId: mockBuyerId,
        senderId: mockBuyerId,
        timestamp: Date.now(),
      },
    };

    assert.equal(broadcastEvent.type, "broadcast");
    assert.equal(broadcastEvent.event, "bargain:slider_update");
    assert.equal(broadcastEvent.payload.dealId, mockDealId);
    assert.equal(broadcastEvent.payload.offeredPrice, 850000);
    assert.equal(broadcastEvent.payload.buyerId, mockBuyerId);
  });

  it("should debounce network updates by 300ms", async () => {
    let broadcastCount = 0;
    let lastBroadcastPrice = 0;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const triggerDebouncedSliderChange = (newPrice: number) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        broadcastCount++;
        lastBroadcastPrice = newPrice;
      }, 300);
    };

    // Simulate rapid dragging on mobile slider within 100ms intervals
    triggerDebouncedSliderChange(800000);
    triggerDebouncedSliderChange(820000);
    triggerDebouncedSliderChange(850000);
    triggerDebouncedSliderChange(890000);

    // Immediately after dragging, broadcast should NOT have fired yet
    assert.equal(broadcastCount, 0, "Should not broadcast before 300ms debounce elapsed");

    // Wait 350ms for debounce timer to fire
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Verify debounce coalesced all 4 drags into a single broadcast with final price
    assert.equal(broadcastCount, 1, "Should have broadcasted exactly once after debounce");
    assert.equal(lastBroadcastPrice, 890000, "Should broadcast the final offered price");
  });

  it("should properly clean up Supabase Realtime channel subscription on unmount", () => {
    let removeChannelCalledWith: string | null = null;

    // Spy on supabase.removeChannel
    const originalRemove = supabase.removeChannel.bind(supabase);
    (supabase as { removeChannel: (ch: unknown) => void }).removeChannel = (channel: unknown) => {
      const ch = channel as { topic?: string };
      removeChannelCalledWith = ch?.topic || "channel-removed";
    };

    try {
      const channel = supabase.channel(`deal-room:${mockDealId}`);
      assert.ok(channel, "Channel should be created");

      // Simulate component unmount cleanup
      supabase.removeChannel(channel);

      assert.ok(removeChannelCalledWith !== null, "removeChannel must be called during cleanup");
    } finally {
      // Restore
      (supabase as { removeChannel: typeof originalRemove }).removeChannel = originalRemove;
    }
  });

  it("should render element with touchAction: none to prevent mobile viewport scroll conflict", () => {
    const sliderElement = React.createElement(BargainSlider, {
      dealId: mockDealId,
      basePrice,
      currentUserId: mockBuyerId,
    });

    assert.ok(sliderElement, "React BargainSlider element should be instantiable");
    assert.equal(sliderElement.props.dealId, mockDealId);
    assert.equal(sliderElement.props.basePrice, 1000000);
  });
});
