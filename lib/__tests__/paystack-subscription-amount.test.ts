import { describe, it, expect } from "vitest";
import { subscriptionAmountNGN, PRO_PRICE_NGN } from "@/lib/paystack/handlers";

/**
 * What a subscriber actually paid, as recorded against their subscription.
 *
 * This used to be the list price, hardcoded, regardless of what Paystack said
 * had been charged. The figure feeds revenue reconciliation, so a constant that
 * quietly disagrees with the settlement is worse than a rounded truth.
 */
describe("subscriptionAmountNGN", () => {
  it("records what was charged, not the list price", () => {
    // The first PRO subscriber: NGN 1,522.85 by bank transfer, against a
    // list price of 1,500. The gap is what made this worth fixing.
    expect(subscriptionAmountNGN(152285)).toBe(1523);
  });

  it("converts kobo to whole Naira", () => {
    expect(subscriptionAmountNGN(150000)).toBe(1500);
    expect(subscriptionAmountNGN(500000)).toBe(5000);
  });

  it("rounds to the nearest Naira, since the column cannot hold kobo", () => {
    expect(subscriptionAmountNGN(150049)).toBe(1500);
    expect(subscriptionAmountNGN(150050)).toBe(1501);
  });

  it("falls back to the list price when an event carries no amount", () => {
    // subscription.disable and friends are not charges and carry no amount.
    expect(subscriptionAmountNGN(undefined)).toBe(PRO_PRICE_NGN);
    expect(subscriptionAmountNGN(null)).toBe(PRO_PRICE_NGN);
    expect(subscriptionAmountNGN(0)).toBe(PRO_PRICE_NGN);
  });

  it("refuses a nonsensical amount rather than writing it to the ledger", () => {
    expect(subscriptionAmountNGN(-5000)).toBe(PRO_PRICE_NGN);
    expect(subscriptionAmountNGN(Number.NaN)).toBe(PRO_PRICE_NGN);
    expect(subscriptionAmountNGN(Number.POSITIVE_INFINITY)).toBe(PRO_PRICE_NGN);
    expect(subscriptionAmountNGN("152285")).toBe(PRO_PRICE_NGN);
  });
});
