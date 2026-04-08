import { describe, it, expect } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { serialise } from "../serialization";

describe("serialise", () => {
  it("converts Date to ISO string", () => {
    const d = new Date("2025-01-15T10:30:00.000Z");
    expect(serialise(d)).toBe("2025-01-15T10:30:00.000Z");
  });

  it("converts Decimal to number", () => {
    const dec = new Decimal("12345.67");
    expect(serialise(dec)).toBe(12345.67);
  });

  it("returns null as-is", () => {
    expect(serialise(null)).toBeNull();
  });

  it("returns undefined as-is", () => {
    expect(serialise(undefined)).toBeUndefined();
  });

  it("returns primitive strings unchanged", () => {
    expect(serialise("hello")).toBe("hello");
  });

  it("returns primitive numbers unchanged", () => {
    expect(serialise(42)).toBe(42);
  });

  it("returns booleans unchanged", () => {
    expect(serialise(true)).toBe(true);
  });

  it("handles arrays of mixed types", () => {
    const input = [
      new Date("2025-06-01T00:00:00.000Z"),
      new Decimal("100.50"),
      "text",
      null,
      42,
    ];
    expect(serialise(input)).toEqual([
      "2025-06-01T00:00:00.000Z",
      100.5,
      "text",
      null,
      42,
    ]);
  });

  it("handles nested objects", () => {
    const input = {
      name: "Invoice #1",
      total: new Decimal("5000.00"),
      issuedDate: new Date("2025-03-01T00:00:00.000Z"),
      lineItems: [
        {
          description: "Consulting",
          amount: new Decimal("2500.00"),
          createdAt: new Date("2025-02-28T12:00:00.000Z"),
        },
        {
          description: "Travel",
          amount: new Decimal("2500.00"),
          createdAt: new Date("2025-02-28T14:00:00.000Z"),
        },
      ],
      notes: null,
    };

    const result = serialise(input);
    expect(result).toEqual({
      name: "Invoice #1",
      total: 5000,
      issuedDate: "2025-03-01T00:00:00.000Z",
      lineItems: [
        {
          description: "Consulting",
          amount: 2500,
          createdAt: "2025-02-28T12:00:00.000Z",
        },
        {
          description: "Travel",
          amount: 2500,
          createdAt: "2025-02-28T14:00:00.000Z",
        },
      ],
      notes: null,
    });
  });

  it("handles empty arrays", () => {
    expect(serialise([])).toEqual([]);
  });

  it("handles empty objects", () => {
    expect(serialise({})).toEqual({});
  });

  it("handles deeply nested structures", () => {
    const input = { a: { b: { c: { d: new Decimal("99.99") } } } };
    expect(serialise(input)).toEqual({ a: { b: { c: { d: 99.99 } } } });
  });
});
