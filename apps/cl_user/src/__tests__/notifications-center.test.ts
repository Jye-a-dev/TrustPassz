import test from "node:test";
import assert from "node:assert/strict";
import {
  getAudioContextState,
  initAudioUnlock,
  playNotificationChime,
  resetAudioChimeForTest,
  unlockAudioContext,
} from "../lib/audio-chime.ts";
import {
  type AppNotification,
  resolveNotificationTargetUrl,
  useNotificationStore,
} from "../stores/notification.store.ts";
import {
  computeReconnectDelayMs,
  parseIncomingNotification,
} from "../hooks/use-realtime-notifications.ts";
import {
  formatRelativeTimeVi,
  getNotificationVisualMeta,
} from "../components/layout/notification-center.tsx";

test("TASK-c-9 Web Audio Chime, Store, Reconnect & Navigation Suite", async (t) => {
  await t.test("1. audio-chime fails gracefully in SSR/Node and unlocks + synthesizes tones in browser", async () => {
    resetAudioChimeForTest();
    // Safe execution without window
    playNotificationChime();
    assert.equal(getAudioContextState(), "unavailable");

    const scheduledFrequencies: number[] = [];
    const rampTargets: Array<{ value: number; time: number }> = [];
    const listeners = new Map<string, Set<() => void>>();

    class MockAudioContext {
      state: AudioContextState = "suspended";
      currentTime = 1.0;
      destination = {};

      async resume() {
        this.state = "running";
      }

      createOscillator() {
        return {
          type: "sine",
          frequency: {
            setValueAtTime: (freq: number) => {
              scheduledFrequencies.push(freq);
            },
          },
          connect: () => {},
          disconnect: () => {},
          start: () => {},
          stop: () => {},
          onended: null as null | (() => void),
        };
      }

      createGain() {
        return {
          gain: {
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: (value: number, time: number) => {
              rampTargets.push({ value, time });
            },
          },
          connect: () => {},
          disconnect: () => {},
        };
      }
    }

    const originalWindow = (globalThis as Record<string, unknown>).window;
    (globalThis as Record<string, unknown>).window = {
      AudioContext: MockAudioContext,
      addEventListener: (evt: string, cb: () => void) => {
        if (!listeners.has(evt)) listeners.set(evt, new Set());
        listeners.get(evt)!.add(cb);
      },
      removeEventListener: (evt: string, cb: () => void) => {
        listeners.get(evt)?.delete(cb);
      },
    };

    try {
      const detach = initAudioUnlock();
      assert.ok(listeners.has("pointerdown"));
      assert.ok(listeners.has("keydown"));
      assert.ok(listeners.has("touchstart"));

      const unlocked = await unlockAudioContext();
      assert.equal(unlocked, true);
      assert.equal(getAudioContextState(), "running");

      playNotificationChime();
      assert.deepEqual(scheduledFrequencies, [587.33, 1174.66]);
      assert.ok(rampTargets.length >= 4);

      detach();
    } finally {
      resetAudioChimeForTest();
      if (originalWindow === undefined) {
        delete (globalThis as Record<string, unknown>).window;
      } else {
        (globalThis as Record<string, unknown>).window = originalWindow;
      }
    }
  });

  await t.test("2. Exponential Backoff formula t = min(baseDelay * 2^attempt + jitter, 30000ms)", () => {
    assert.equal(computeReconnectDelayMs(0, 1000, 30000, () => 0), 1000);
    assert.equal(computeReconnectDelayMs(1, 1000, 30000, () => 0), 2000);
    assert.equal(computeReconnectDelayMs(2, 1000, 30000, () => 0), 4000);
    assert.equal(computeReconnectDelayMs(3, 1000, 30000, () => 0), 8000);
    assert.equal(computeReconnectDelayMs(4, 1000, 30000, () => 0), 16000);
    assert.equal(computeReconnectDelayMs(5, 1000, 30000, () => 0), 30000);
    assert.equal(computeReconnectDelayMs(10, 1000, 30000, () => 1), 30000);
    const withJitter = computeReconnectDelayMs(0, 1000, 30000, () => 0.5);
    assert.equal(withJitter, 1250);
  });

  await t.test("3. Zustand notification store deduplicates, increments unreadCount, and resolves Zero-Reload routes", () => {
    useNotificationStore.getState().reset();

    const depositItem: AppNotification = {
      id: "notif-1",
      userId: "user-1",
      type: "DEPOSITED",
      title: "Tiền cọc VietQR đã được khóa",
      message: "Deal ABC đã nhận 2.000.000 ₫",
      data: { dealId: "deal-100" },
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const vaultItem: AppNotification = {
      id: "notif-2",
      userId: "user-1",
      type: "VAULT_UNLOCKED",
      title: "Mở két Digital Vault",
      message: "Bắt đầu đếm ngược đồng kiểm",
      data: { dealId: "deal-100", vaultId: "vlt-1" },
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const orderItem: AppNotification = {
      id: "notif-3",
      userId: "user-1",
      type: "ORDER_UPDATED",
      title: "Đơn hàng cập nhật",
      message: "Đơn hàng mới",
      data: { orderId: "ord-1" },
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    assert.equal(useNotificationStore.getState().addRealtimeNotification(depositItem), true);
    assert.equal(useNotificationStore.getState().addRealtimeNotification(depositItem), false);
    assert.equal(useNotificationStore.getState().addRealtimeNotification(vaultItem), true);
    assert.equal(useNotificationStore.getState().unreadCount, 2);

    assert.equal(resolveNotificationTargetUrl(depositItem), "/user/deals/deal-100");
    assert.equal(resolveNotificationTargetUrl(vaultItem), "/user/deals/deal-100/vault");
    assert.equal(resolveNotificationTargetUrl(orderItem), "/user/orders");

    const parsed = parseIncomingNotification({ payload: depositItem }, "user-1");
    assert.equal(parsed?.id, "notif-1");
    assert.equal(parseIncomingNotification({ invalid: true }, "user-1"), null);

    useNotificationStore.getState().reset();
  });

  await t.test("4. Semantic color mapping and Vietnamese relative timestamp formatting", () => {
    assert.ok(getNotificationVisualMeta("DEPOSITED").borderLeftClass.includes("emerald"));
    assert.ok(getNotificationVisualMeta("SETTLED").borderLeftClass.includes("emerald"));
    assert.ok(getNotificationVisualMeta("OFFER_UPDATED").borderLeftClass.includes("cyan"));
    assert.ok(getNotificationVisualMeta("NEW_DEAL").borderLeftClass.includes("cyan"));
    assert.ok(getNotificationVisualMeta("VAULT_UNLOCKED").borderLeftClass.includes("amber"));
    assert.ok(getNotificationVisualMeta("DISPUTE_RAISED").borderLeftClass.includes("rose"));

    const now = Date.parse("2026-11-11T12:00:00.000Z");
    assert.equal(formatRelativeTimeVi("2026-11-11T11:59:45.000Z", now), "vừa xong");
    assert.equal(formatRelativeTimeVi("2026-11-11T11:55:00.000Z", now), "5 phút trước");
    assert.equal(formatRelativeTimeVi("2026-11-11T10:00:00.000Z", now), "2 giờ trước");
  });
});
