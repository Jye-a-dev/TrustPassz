import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatCurrencyAmount,
  formatTruncatedHash,
  getBlockExplorer,
} from "../components/deals/transfer-success-modal.tsx";
import { playSuccessChime } from "../lib/sound.ts";

describe("TransferSuccessModal Helper & Formatter Tests", () => {
  describe("formatCurrencyAmount", () => {
    it("should format VND currency accurately with Vietnamese locale symbol", () => {
      const formatted = formatCurrencyAmount(1500000, "VND");
      assert.ok(formatted.includes("1.500.000") || formatted.includes("1,500,000"));
      assert.ok(formatted.includes("₫"));
    });

    it("should default to VND when no currency is specified", () => {
      const formatted = formatCurrencyAmount(2000000);
      assert.ok(formatted.includes("2.000.000") || formatted.includes("2,000,000"));
      assert.ok(formatted.includes("₫"));
    });

    it("should handle string amounts safely", () => {
      const formatted = formatCurrencyAmount("500000", "VND");
      assert.ok(formatted.includes("500.000") || formatted.includes("500,000"));
      assert.ok(formatted.includes("₫"));
    });

    it("should format Solana (SOL) amounts correctly", () => {
      const formatted = formatCurrencyAmount(1.25, "SOL");
      assert.equal(formatted, "1.25 SOL");
    });

    it("should format Ethereum (ETH) amounts correctly", () => {
      const formatted = formatCurrencyAmount(0.05, "ETH");
      assert.equal(formatted, "0.05 ETH");
    });
  });

  describe("formatTruncatedHash", () => {
    it("should return empty string for falsy input", () => {
      assert.equal(formatTruncatedHash(""), "");
    });

    it("should return unchanged string if length <= 16 characters", () => {
      assert.equal(formatTruncatedHash("0x12345678"), "0x12345678");
    });

    it("should truncate 0x EVM transaction hash keeping 8 prefix and 6 suffix characters", () => {
      const txHash = "0x88a82fe4f3be44bb493fa6e7efd68313e7c2ec15";
      const truncated = formatTruncatedHash(txHash);
      assert.equal(truncated, "0x88a82f...c2ec15");
      assert.ok(truncated.length < txHash.length);
    });

    it("should truncate Solana base58 signatures properly", () => {
      const sig =
        "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9dTeVo39MracVuPxWyGh449Hin4TqMqS65PWwBJoeM6yks";
      const truncated = formatTruncatedHash(sig);
      assert.equal(truncated, "5eykt4Us...eM6yks");
    });
  });

  describe("getBlockExplorer", () => {
    it("should return fallback object when txHash is null or undefined", () => {
      const res = getBlockExplorer(null);
      assert.equal(res.url, null);
      assert.equal(res.label, "Hệ thống nội bộ");
    });

    it("should return Base Sepolia explorer for EVM 0x hashes", () => {
      const txHash = "0x88a82fe4f3be44bb493fa6e7efd68313e7c2ec15";
      const res = getBlockExplorer(txHash);
      assert.equal(res.url, `https://sepolia.basescan.org/tx/${txHash}`);
      assert.equal(res.label, "Basescan Sepolia");
    });

    it("should return Solscan Devnet explorer for Solana base58 signatures", () => {
      const sig =
        "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9dTeVo39MracVuPxWyGh449Hin4TqMqS65PWwBJoeM6yks";
      const res = getBlockExplorer(sig, "SOLANA_DEVNET");
      assert.equal(res.url, `https://solscan.io/tx/${sig}?cluster=devnet`);
      assert.equal(res.label, "Solscan Devnet");
    });

    it("should return internal PayOS label for simulated or bank order codes", () => {
      const res = getBlockExplorer("SIM_1720000000", "VIETQR");
      assert.equal(res.url, null);
      assert.equal(res.label, "Mã giao dịch PayOS");
    });
  });

  describe("playSuccessChime", () => {
    it("should execute safely in Node.js / non-browser environment without throwing", () => {
      assert.doesNotThrow(() => {
        playSuccessChime();
      });
    });
  });
});

