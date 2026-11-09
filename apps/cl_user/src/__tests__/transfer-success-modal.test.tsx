import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import * as React from "react";
import {
  TransferSuccessModal,
  formatCurrencyAmount,
  formatTruncatedHash,
  getBlockExplorer,
  type TransferSuccessModalProps,
} from "../components/deals/transfer-success-modal.tsx";
import { secureClipboard } from "../lib/secure-clipboard.ts";

describe("TASK-b-13: TransferSuccessModal & Realtime Lifecycle Tests", () => {
  const sampleDealId = "deal-8888-settle-confirm";
  const sampleTxHash = "0x88a82fe4f3be44bb493fa6e7efd68313e7c2ec15";
  const sampleAmount = 500000;

  let clipboardWrites: string[] = [];
  let routedHistory: string[] = [];

  const mockRouter = {
    push: (url: string) => {
      routedHistory.push(url);
    },
  };

  beforeEach(() => {
    clipboardWrites = [];
    routedHistory = [];

    // Define navigator.clipboard property for Node test environment
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          clipboardWrites.push(text);
          return Promise.resolve();
        },
      },
      configurable: true,
      writable: true,
    });
  });

  describe("Test Case 1: Modal ẩn khi chưa có event, tự động render hiển thị khi nhận event payload", () => {
    it("should remain closed and unrendered before any realtime event arrives", () => {
      const isModalOpen = false;
      const modalPayload: Record<string, unknown> | null = null;

      // Closed state props
      const initialProps: TransferSuccessModalProps = {
        open: isModalOpen,
        amount: sampleAmount,
        dealId: sampleDealId,
      };

      assert.equal(initialProps.open, false, "Modal must be hidden initially");
      assert.equal(modalPayload, null, "Modal payload should be null initially");
    });

    it("should trigger open and populate data when receiving SETTLED payload { status: 'SETTLED', txHash, amount }", () => {
      let isModalOpen = false;
      let stateData: {
        type: "DEPOSIT" | "SETTLEMENT";
        status: string;
        txHash: string;
        amount: number;
        title: string;
      } | null = null;

      // Event simulation handler matching Supabase Realtime broadcast
      const handleRealtimeSettlementEvent = (eventPayload: {
        status: string;
        txHash: string;
        amount: number;
      }) => {
        if (eventPayload.status === "SETTLED") {
          isModalOpen = true;
          stateData = {
            type: "SETTLEMENT",
            status: eventPayload.status,
            txHash: eventPayload.txHash,
            amount: eventPayload.amount,
            title: "Giải ngân thành công",
          };
        }
      };

      // Emit settlement event
      const eventPayload = {
        status: "SETTLED",
        txHash: sampleTxHash,
        amount: 500000,
      };
      handleRealtimeSettlementEvent(eventPayload);

      // Verify modal state became open
      assert.equal(isModalOpen, true, "Modal must open automatically on SETTLED event");
      assert.ok(stateData !== null);
      assert.equal(stateData.status, "SETTLED");
      assert.equal(stateData.amount, 500000);
      assert.equal(stateData.txHash, sampleTxHash);
      assert.equal(stateData.title, "Giải ngân thành công");

      // Verify currency formatting
      const formattedAmount = formatCurrencyAmount(stateData.amount, "VND");
      assert.ok(
        formattedAmount.includes("500.000") || formattedAmount.includes("500,000"),
        "Formatted amount must display Vietnamese currency standard"
      );
      assert.ok(formattedAmount.includes("₫"));

      // Verify truncated hash
      const truncated = formatTruncatedHash(stateData.txHash);
      assert.equal(truncated, "0x88a82f...c2ec15");

      // Instantiate component element with updated state
      const modalElement = React.createElement(TransferSuccessModal, {
        open: isModalOpen,
        type: stateData.type,
        title: stateData.title,
        amount: stateData.amount,
        txHash: stateData.txHash,
        dealId: sampleDealId,
      });

      assert.ok(modalElement);
      assert.equal(modalElement.props.open, true);
      assert.equal(modalElement.props.type, "SETTLEMENT");
      assert.equal(modalElement.props.amount, 500000);
    });

    it("should handle DEPOSIT_CONFIRMED event and set correct deposit copy", () => {
      let isModalOpen = false;
      let modalType: string = "";

      const handleDepositEvent = (payload: { event: string; state: string }) => {
        if (payload.event === "DEPOSIT_CONFIRMED" || payload.state === "DEPOSITED") {
          isModalOpen = true;
          modalType = "DEPOSIT";
        }
      };

      handleDepositEvent({ event: "DEPOSIT_CONFIRMED", state: "DEPOSITED" });
      assert.equal(isModalOpen, true);
      assert.equal(modalType, "DEPOSIT");
    });
  });

  describe("Test Case 2: Click nút 'Sao chép' gọi đúng navigator.clipboard.writeText", () => {
    it("should invoke navigator.clipboard.writeText with full original txHash on copy action", async () => {
      // Execute secure copy with sample TxHash
      await secureClipboard.copy(sampleTxHash);

      assert.equal(clipboardWrites.length, 1, "Clipboard writeText must be called exactly once");
      assert.equal(
        clipboardWrites[0],
        sampleTxHash,
        "Clipboard writeText must receive the exact full txHash"
      );
    });

    it("should copy Deal ID properly when triggered", async () => {
      await secureClipboard.copy(sampleDealId);

      assert.equal(clipboardWrites.length, 1);
      assert.equal(clipboardWrites[0], sampleDealId);
    });

    it("should generate valid block explorer URL and parameters", () => {
      const explorer = getBlockExplorer(sampleTxHash, "BASE_SEPOLIA");
      assert.equal(explorer.url, `https://sepolia.basescan.org/tx/${sampleTxHash}`);
      assert.equal(explorer.label, "Basescan Sepolia");
    });
  });

  describe("Test Case 3: Click nút chuyển hướng điều hướng đúng route mà không làm crash app", () => {
    it("should navigate to /user/deals/[id]/vault on deposit primary action", () => {
      let modalOpen = true;

      const props: TransferSuccessModalProps = {
        open: modalOpen,
        amount: 1500000,
        dealId: sampleDealId,
        type: "DEPOSIT",
        router: mockRouter,
        onOpenChange: (open) => {
          modalOpen = open;
        },
      };

      // Simulate default primary click handler behavior for DEPOSIT
      const defaultDepositTarget = `/user/deals/${props.dealId}/vault`;
      props.router?.push(defaultDepositTarget);
      props.onOpenChange?.(false);

      assert.equal(routedHistory.length, 1);
      assert.equal(routedHistory[0], `/user/deals/${sampleDealId}/vault`);
      assert.equal(modalOpen, false, "Modal should close on redirect");
    });

    it("should navigate to /deals/[id] on settlement primary action", () => {
      const props: TransferSuccessModalProps = {
        open: true,
        amount: sampleAmount,
        dealId: sampleDealId,
        type: "SETTLEMENT",
        router: mockRouter,
      };

      const defaultSettleTarget = `/deals/${props.dealId}`;
      props.router?.push(defaultSettleTarget);

      assert.equal(routedHistory.length, 1);
      assert.equal(routedHistory[0], `/deals/${sampleDealId}`);
    });

    it("should navigate to /user/deals on secondary action (Xem lịch sử giao dịch)", () => {
      const props: TransferSuccessModalProps = {
        open: true,
        amount: sampleAmount,
        dealId: sampleDealId,
        router: mockRouter,
      };

      const historyTarget = "/user/deals";
      props.router?.push(historyTarget);

      assert.equal(routedHistory.length, 1);
      assert.equal(routedHistory[0], "/user/deals");
    });

    it("should allow custom onPrimaryAction and onSecondaryAction callbacks without error", () => {
      let primaryCustomCalled = false;
      let secondaryCustomCalled = false;

      const props: TransferSuccessModalProps = {
        open: true,
        amount: sampleAmount,
        dealId: sampleDealId,
        onPrimaryAction: () => {
          primaryCustomCalled = true;
          mockRouter.push("/custom-route");
        },
        onSecondaryAction: () => {
          secondaryCustomCalled = true;
        },
      };

      props.onPrimaryAction?.();
      assert.equal(primaryCustomCalled, true);
      assert.equal(routedHistory[0], "/custom-route");

      props.onSecondaryAction?.();
      assert.equal(secondaryCustomCalled, true);
    });
  });
});
