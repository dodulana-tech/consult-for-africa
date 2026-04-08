import { describe, it, expect } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Tests for invoice math calculations.
 *
 * These mirror the Decimal-based computations in app/api/invoices/route.ts:
 *   subtotal = sum(quantity * unitPrice) for each line item
 *   tax      = subtotal * (taxPercent / 100)
 *   wht      = subtotal * (whtRatePct / 100)
 *   total    = subtotal + tax - wht - discount
 */

interface LineItem {
  quantity: number;
  unitPrice: number;
}

function computeInvoice(
  lineItems: LineItem[],
  taxPercent = 0,
  whtRatePct = 0,
  discountAmount = 0
) {
  const subtotal = lineItems.reduce(
    (sum, item) => sum.add(new Decimal(item.quantity).mul(new Decimal(item.unitPrice))),
    new Decimal(0)
  );

  const taxRate =
    typeof taxPercent === "number" && taxPercent >= 0
      ? new Decimal(taxPercent).div(100)
      : new Decimal(0);
  const tax = subtotal.mul(taxRate);

  const whtRate =
    typeof whtRatePct === "number" && whtRatePct >= 0
      ? new Decimal(whtRatePct).div(100)
      : new Decimal(0);
  const whtAmount = subtotal.mul(whtRate);

  const discount =
    typeof discountAmount === "number" && discountAmount >= 0
      ? new Decimal(discountAmount)
      : new Decimal(0);

  const total = subtotal.add(tax).sub(whtAmount).sub(discount);

  return { subtotal, tax, whtAmount, discount, total };
}

describe("Invoice math (Decimal-based)", () => {
  describe("subtotal calculation", () => {
    it("computes subtotal for a single line item", () => {
      const result = computeInvoice([{ quantity: 10, unitPrice: 5000 }]);
      expect(result.subtotal.toNumber()).toBe(50000);
    });

    it("computes subtotal for multiple line items", () => {
      const result = computeInvoice([
        { quantity: 2, unitPrice: 150000 },
        { quantity: 5, unitPrice: 30000 },
        { quantity: 1, unitPrice: 75000 },
      ]);
      // 300000 + 150000 + 75000 = 525000
      expect(result.subtotal.toNumber()).toBe(525000);
    });

    it("handles fractional quantities", () => {
      const result = computeInvoice([{ quantity: 1.5, unitPrice: 10000 }]);
      expect(result.subtotal.toNumber()).toBe(15000);
    });

    it("handles zero quantity", () => {
      const result = computeInvoice([{ quantity: 0, unitPrice: 10000 }]);
      expect(result.subtotal.toNumber()).toBe(0);
    });

    it("handles zero unit price", () => {
      const result = computeInvoice([{ quantity: 5, unitPrice: 0 }]);
      expect(result.subtotal.toNumber()).toBe(0);
    });
  });

  describe("tax calculation", () => {
    it("calculates 7.5% VAT correctly", () => {
      const result = computeInvoice(
        [{ quantity: 1, unitPrice: 1000000 }],
        7.5
      );
      expect(result.tax.toNumber()).toBe(75000);
    });

    it("handles zero tax", () => {
      const result = computeInvoice(
        [{ quantity: 1, unitPrice: 1000000 }],
        0
      );
      expect(result.tax.toNumber()).toBe(0);
    });

    it("handles 5% tax", () => {
      const result = computeInvoice(
        [{ quantity: 2, unitPrice: 500000 }],
        5
      );
      // subtotal 1000000, tax 50000
      expect(result.tax.toNumber()).toBe(50000);
    });
  });

  describe("WHT deduction", () => {
    it("calculates 5% WHT correctly", () => {
      const result = computeInvoice(
        [{ quantity: 1, unitPrice: 1000000 }],
        0,
        5
      );
      expect(result.whtAmount.toNumber()).toBe(50000);
    });

    it("calculates 10% WHT correctly", () => {
      const result = computeInvoice(
        [{ quantity: 1, unitPrice: 1000000 }],
        0,
        10
      );
      expect(result.whtAmount.toNumber()).toBe(100000);
    });

    it("handles zero WHT", () => {
      const result = computeInvoice(
        [{ quantity: 1, unitPrice: 1000000 }],
        0,
        0
      );
      expect(result.whtAmount.toNumber()).toBe(0);
    });
  });

  describe("total = subtotal + tax - wht - discount", () => {
    it("calculates total with all components", () => {
      // subtotal: 1,000,000
      // tax (7.5%): 75,000
      // WHT (5%): 50,000
      // discount: 25,000
      // total: 1,000,000 + 75,000 - 50,000 - 25,000 = 1,000,000
      const result = computeInvoice(
        [{ quantity: 1, unitPrice: 1000000 }],
        7.5,
        5,
        25000
      );
      expect(result.total.toNumber()).toBe(1000000);
    });

    it("calculates total with tax only (no WHT, no discount)", () => {
      const result = computeInvoice(
        [{ quantity: 1, unitPrice: 500000 }],
        7.5,
        0,
        0
      );
      // 500000 + 37500 = 537500
      expect(result.total.toNumber()).toBe(537500);
    });

    it("calculates total with WHT only (no tax, no discount)", () => {
      const result = computeInvoice(
        [{ quantity: 1, unitPrice: 500000 }],
        0,
        5,
        0
      );
      // 500000 - 25000 = 475000
      expect(result.total.toNumber()).toBe(475000);
    });

    it("calculates total with discount only", () => {
      const result = computeInvoice(
        [{ quantity: 1, unitPrice: 500000 }],
        0,
        0,
        50000
      );
      // 500000 - 50000 = 450000
      expect(result.total.toNumber()).toBe(450000);
    });

    it("total can go negative if deductions exceed subtotal+tax", () => {
      const result = computeInvoice(
        [{ quantity: 1, unitPrice: 100 }],
        0,
        0,
        500
      );
      // 100 - 500 = -400
      expect(result.total.toNumber()).toBe(-400);
    });
  });

  describe("edge cases", () => {
    it("handles empty line items (subtotal zero)", () => {
      const result = computeInvoice([], 7.5, 5, 0);
      expect(result.subtotal.toNumber()).toBe(0);
      expect(result.tax.toNumber()).toBe(0);
      expect(result.whtAmount.toNumber()).toBe(0);
      expect(result.total.toNumber()).toBe(0);
    });

    it("handles very large amounts without precision loss", () => {
      // 10 billion naira
      const result = computeInvoice(
        [{ quantity: 1, unitPrice: 10000000000 }],
        7.5,
        5,
        0
      );
      expect(result.subtotal.toNumber()).toBe(10000000000);
      expect(result.tax.toNumber()).toBe(750000000);
      expect(result.whtAmount.toNumber()).toBe(500000000);
      expect(result.total.toNumber()).toBe(10250000000);
    });

    it("handles many decimal places without floating-point errors", () => {
      // Classic floating-point trap: 0.1 + 0.2 !== 0.3 in IEEE 754
      const result = computeInvoice([
        { quantity: 0.1, unitPrice: 0.2 },
      ]);
      // Decimal library should give us exact 0.02
      expect(result.subtotal.toString()).toBe("0.02");
    });

    it("handles a realistic Nigerian consulting invoice", () => {
      // 3 consultants x N250,000/day x 20 days
      // plus travel N1,500,000
      // 7.5% VAT, 5% WHT, no discount
      const result = computeInvoice(
        [
          { quantity: 60, unitPrice: 250000 },  // 15,000,000
          { quantity: 1, unitPrice: 1500000 },   // 1,500,000
        ],
        7.5,
        5,
        0
      );
      // subtotal: 16,500,000
      // tax: 1,237,500
      // WHT: 825,000
      // total: 16,912,500
      expect(result.subtotal.toNumber()).toBe(16500000);
      expect(result.tax.toNumber()).toBe(1237500);
      expect(result.whtAmount.toNumber()).toBe(825000);
      expect(result.total.toNumber()).toBe(16912500);
    });
  });
});
