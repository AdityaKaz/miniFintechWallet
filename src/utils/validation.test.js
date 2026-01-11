import { describe, it, expect } from "vitest";
import { validateTransferAmount } from "./validation";

describe("Validation Utilities", () => {
  describe("validateTransferAmount", () => {
    it("should reject negative amounts", () => {
      const result = validateTransferAmount(-100);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("greater than 0");
    });

    it("should reject zero amount", () => {
      const result = validateTransferAmount(0);
      expect(result.isValid).toBe(false);
    });

    it("should reject amounts over limit (10000)", () => {
      const result = validateTransferAmount(15000);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("exceeds maximum");
    });

    it("should accept valid amount (5000)", () => {
      const result = validateTransferAmount(5000);
      expect(result.isValid).toBe(true);
    });

    it("should accept amount at limit (10000)", () => {
      const result = validateTransferAmount(10000);
      expect(result.isValid).toBe(true);
    });

    it("should reject NaN", () => {
      const result = validateTransferAmount(NaN);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain("required");
    });

    it("should reject undefined", () => {
      const result = validateTransferAmount(undefined);
      expect(result.isValid).toBe(false);
    });
  });
});
