import { describe, it, expect } from "vitest";
import { ELEVATED_ROLES, EM_AND_ABOVE, ALL_STAFF_ROLES } from "../constants";

describe("ELEVATED_ROLES", () => {
  it("contains DIRECTOR, PARTNER, and ADMIN", () => {
    expect(ELEVATED_ROLES).toContain("DIRECTOR");
    expect(ELEVATED_ROLES).toContain("PARTNER");
    expect(ELEVATED_ROLES).toContain("ADMIN");
  });

  it("does not contain CONSULTANT or ENGAGEMENT_MANAGER", () => {
    expect(ELEVATED_ROLES).not.toContain("CONSULTANT");
    expect(ELEVATED_ROLES).not.toContain("ENGAGEMENT_MANAGER");
  });

  it("has exactly 3 roles", () => {
    expect(ELEVATED_ROLES).toHaveLength(3);
  });
});

describe("EM_AND_ABOVE", () => {
  it("includes ENGAGEMENT_MANAGER plus all elevated roles", () => {
    expect(EM_AND_ABOVE).toContain("ENGAGEMENT_MANAGER");
    expect(EM_AND_ABOVE).toContain("DIRECTOR");
    expect(EM_AND_ABOVE).toContain("PARTNER");
    expect(EM_AND_ABOVE).toContain("ADMIN");
  });

  it("does not contain CONSULTANT", () => {
    expect(EM_AND_ABOVE).not.toContain("CONSULTANT");
  });

  it("has exactly 4 roles", () => {
    expect(EM_AND_ABOVE).toHaveLength(4);
  });
});

describe("ALL_STAFF_ROLES", () => {
  it("includes CONSULTANT", () => {
    expect(ALL_STAFF_ROLES).toContain("CONSULTANT");
  });

  it("includes every role from EM_AND_ABOVE", () => {
    for (const role of EM_AND_ABOVE) {
      expect(ALL_STAFF_ROLES).toContain(role);
    }
  });

  it("includes every role from ELEVATED_ROLES", () => {
    for (const role of ELEVATED_ROLES) {
      expect(ALL_STAFF_ROLES).toContain(role);
    }
  });

  it("has exactly 5 roles", () => {
    expect(ALL_STAFF_ROLES).toHaveLength(5);
  });
});
