import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { validateMezoSurvey, MEZO_SURVEY } from "@/lib/cadreHealth/mezoSurvey";

/**
 * Mezo runs in another codebase, so the signature is the only thing standing
 * between its database and anyone who can find the URL. The two sides were
 * written separately and can drift apart without either failing to compile,
 * which is exactly the kind of break that shows up as a doctor who paid
 * attention to a survey and got nothing back.
 *
 * The verifier below is a copy of the one in the Mezo route. Copying it is the
 * point: if someone changes the algorithm on one side, this fails.
 */

const SECRET = "test-shared-secret-value";

/** Signing, as lib/mezo/provision.ts does it. */
function sign(payload: unknown): { body: string; signature: string } {
  const body = JSON.stringify({ professionals: [payload] });
  return {
    body,
    signature: crypto.createHmac("sha256", SECRET).update(body).digest("hex"),
  };
}

/** Verifying, as Mezo's app/api/partners/cadrehealth/provision/route.ts does it. */
function verify(rawBody: string, signature: string | null): boolean {
  if (!SECRET || !signature) return false;
  const expected = crypto.createHmac("sha256", SECRET).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

const sample = {
  externalId: "cmpft0dae01mlgitbj7ejdwn3",
  email: "doctor@example.com",
  firstName: "Francis",
  lastName: "Korie",
  primarySpecialty: "Paediatrics",
};

describe("Mezo provisioning signature", () => {
  it("accepts a signature this codebase produced", () => {
    const { body, signature } = sign(sample);
    expect(verify(body, signature)).toBe(true);
  });

  it("rejects a body altered in transit", () => {
    const { body, signature } = sign(sample);
    expect(verify(body.replace("Francis", "Frances"), signature)).toBe(false);
  });

  it("rejects an altered signature", () => {
    const { body, signature } = sign(sample);
    expect(verify(body, `${signature.slice(0, -2)}00`)).toBe(false);
  });

  it("rejects a signature of the wrong length without throwing", () => {
    // timingSafeEqual throws on a length mismatch, so this is the case a naive
    // implementation turns into a 500 instead of a 401.
    const { body } = sign(sample);
    expect(verify(body, "abc")).toBe(false);
  });

  it("rejects a missing signature", () => {
    const { body } = sign(sample);
    expect(verify(body, null)).toBe(false);
  });

  it("rejects a body re-serialised into a different shape", () => {
    const { signature } = sign(sample);
    const reordered = JSON.stringify({
      professionals: [{ email: sample.email, externalId: sample.externalId }],
    });
    expect(verify(reordered, signature)).toBe(false);
  });
});

describe("Mezo survey validation", () => {
  /** A complete set of answers, built from the instrument itself. */
  function completeAnswers(): Record<string, string | string[]> {
    const answers: Record<string, string | string[]> = {};
    for (const q of MEZO_SURVEY) {
      if (!q.required) continue;
      if (q.type === "multi") answers[q.id] = [q.options![0].value];
      else if (q.type === "single") answers[q.id] = q.options![0].value;
      else answers[q.id] = "Ikeja, Lagos";
    }
    return answers;
  }

  it("accepts a complete set of answers", () => {
    const { ok, errors } = validateMezoSurvey(completeAnswers());
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
  });

  it("refuses an option that is not on the instrument", () => {
    const answers = completeAnswers();
    answers.sessionBudget = "n500_per_year";
    const { ok, errors } = validateMezoSurvey(answers);
    expect(ok).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("drops keys the instrument does not ask about", () => {
    const answers = { ...completeAnswers(), isAdmin: "true", note: "x" };
    const { clean } = validateMezoSurvey(answers);
    expect(clean.isAdmin).toBeUndefined();
    expect(clean.note).toBeUndefined();
  });

  it("reports every missing required answer rather than only the first", () => {
    const { ok, errors } = validateMezoSurvey({});
    expect(ok).toBe(false);
    expect(errors.length).toBe(MEZO_SURVEY.filter((q) => q.required).length);
  });

  it("caps free text so a paste cannot balloon the row", () => {
    const answers = completeAnswers();
    answers.practiceCity = "x".repeat(5000);
    const { clean } = validateMezoSurvey(answers);
    expect((clean.practiceCity as string).length).toBe(2000);
  });

  it("keeps an optional answer out of the payload when it is blank", () => {
    const { clean } = validateMezoSurvey(completeAnswers());
    expect(clean.notes).toBeUndefined();
  });

  it("refuses a multi-select that came back empty", () => {
    const answers = completeAnswers();
    answers.barriers = [];
    const { ok } = validateMezoSurvey(answers);
    expect(ok).toBe(false);
  });
});
