import { describe, it, expect } from "vitest";
import { surnameFor, headingFor } from "../cadreSalutation";

describe("surnameFor", () => {
  it("takes the last token when the import left a middle name behind", () => {
    // firstName "Dr Patric", lastName "Temi Adegun"
    expect(surnameFor("Temi Adegun")).toBe("Adegun");
    expect(surnameFor("Itopa Zubairu")).toBe("Zubairu");
  });

  it("fixes casing without flattening deliberate capitals", () => {
    expect(surnameFor("Isah umar")).toBe("Umar");
    expect(surnameFor("ADEGUN")).toBe("Adegun");
    expect(surnameFor("McPherson")).toBe("McPherson");
    expect(surnameFor("Oyefia-Emakpo")).toBe("Oyefia-Emakpo");
    expect(surnameFor("OYEFIA-EMAKPO")).toBe("Oyefia-Emakpo");
  });

  it("declines initials rather than greeting someone as a letter", () => {
    expect(surnameFor("C")).toBeNull();
    expect(surnameFor("I. C")).toBeNull();
    expect(surnameFor("M.A")).toBeNull();
  });

  it("declines empty and missing values", () => {
    expect(surnameFor("")).toBeNull();
    expect(surnameFor("   ")).toBeNull();
    expect(surnameFor(null)).toBeNull();
    expect(surnameFor(undefined)).toBeNull();
  });
});

describe("headingFor", () => {
  const rest = "your record is still held";

  it("addresses doctors and dentists as Dr", () => {
    expect(headingFor({ lastName: "Temi Adegun", cadre: "MEDICINE" }, rest)).toBe(
      "Dr Adegun, your record is still held",
    );
    expect(headingFor({ lastName: "Gomna", cadre: "DENTISTRY" }, rest)).toBe(
      "Dr Gomna, your record is still held",
    );
  });

  it("does not call a nurse or pharmacist Dr", () => {
    expect(headingFor({ lastName: "Innocent", cadre: "NURSING" }, rest)).toBe(
      "Your record is still held",
    );
    expect(headingFor({ lastName: "Bello", cadre: "PHARMACY" }, rest)).toBe(
      "Your record is still held",
    );
  });

  it("drops the name rather than printing an empty title", () => {
    expect(headingFor({ lastName: "", cadre: "MEDICINE" }, rest)).toBe(
      "Your record is still held",
    );
    expect(headingFor({ lastName: "C", cadre: "MEDICINE" }, rest)).toBe(
      "Your record is still held",
    );
  });
});
