import { describe, it, expect, vi, beforeEach } from "vitest";

// Capture what would be sent rather than sending it. The transport itself is
// already covered elsewhere; what matters here is the wording a family reads.
const sent: { to: string | string[]; subject: string; html: string }[] = [];

vi.mock("../email", () => ({
  notifyInternal: async (to: string | string[], subject: string, html: string) => {
    sent.push({ to, subject, html });
  },
}));

const { emailIleWaitlistConfirmation, emailIleWaitlistInternal } = await import("../ileEmail");
const { generateReferralCode, ILE_CONSENT_TEXT } = await import("../ile");

beforeEach(() => {
  sent.length = 0;
});

const base = {
  to: "amaka@example.com",
  fullName: "Amaka Obi",
  foundingFamily: true,
  interest: "BOTH" as const,
  urgency: "NOW" as const,
  referralCode: "AB3XY9",
  shareUrl: "https://ile.example.com/ile?ref=AB3XY9",
};

describe("the confirmation a family receives", () => {
  it("greets them by first name, not by their full name", async () => {
    await emailIleWaitlistConfirmation(base);
    expect(sent[0].html).toContain("Dear Amaka,");
    expect(sent[0].html).not.toContain("Dear Amaka Obi,");
  });

  it("says plainly that the home is not open yet", async () => {
    await emailIleWaitlistConfirmation(base);
    const html = sent[0].html;
    expect(html).toContain("It is not open yet");
    expect(html).toContain("registered and inspected");
  });

  it("promises a call when the need is urgent, and does not when it is not", async () => {
    await emailIleWaitlistConfirmation(base);
    expect(sent[0].html).toContain("within two working days");

    sent.length = 0;
    await emailIleWaitlistConfirmation({ ...base, urgency: "PLANNING_AHEAD" });
    expect(sent[0].html).not.toContain("within two working days");
  });

  it("tells a founding family that they are one, and stays quiet otherwise", async () => {
    await emailIleWaitlistConfirmation(base);
    expect(sent[0].html).toContain("You are a founding family");

    sent.length = 0;
    await emailIleWaitlistConfirmation({ ...base, foundingFamily: false });
    expect(sent[0].html).not.toContain("You are a founding family");
  });

  it("carries the referral link and the code", async () => {
    await emailIleWaitlistConfirmation(base);
    expect(sent[0].html).toContain(base.shareUrl);
    expect(sent[0].html).toContain("AB3XY9");
  });

  it("escapes a name that contains markup", async () => {
    await emailIleWaitlistConfirmation({ ...base, fullName: "<script>alert(1)</script>" });
    expect(sent[0].html).not.toContain("<script>alert(1)</script>");
    expect(sent[0].html).toContain("&lt;script&gt;");
  });

  it("never uses an em dash, which is a house rule", async () => {
    await emailIleWaitlistConfirmation(base);
    expect(sent[0].html).not.toContain("—");
  });
});

describe("the internal notification", () => {
  const internal = {
    to: "hello@consultforafrica.com",
    fullName: "Amaka Obi",
    email: "amaka@example.com",
    phone: "+44 7700 900000",
    relationship: "PARENT" as const,
    basedOutsideNigeria: true,
    basedCountry: "United Kingdom",
    careCity: "Lekki",
    interest: "RESIDENTIAL" as const,
    careNeeds: ["SKILLED_NURSING" as const],
    urgency: "NOW" as const,
    notes: "Mum had a stroke.",
    foundingFamily: true,
    referredByCode: null,
    position: 7,
  };

  it("puts the segment and the urgency in the subject, so a phone shows the signal", async () => {
    await emailIleWaitlistInternal(internal);
    expect(sent[0].subject).toBe("ilé waiting list: Amaka Obi, diaspora [urgent]");
  });

  it("marks a local family as local and drops the urgent flag when it is not", async () => {
    await emailIleWaitlistInternal({
      ...internal,
      basedOutsideNigeria: false,
      urgency: "PLANNING_AHEAD",
    });
    expect(sent[0].subject).toBe("ilé waiting list: Amaka Obi, local");
  });

  it("escapes free text written by the enquirer", async () => {
    await emailIleWaitlistInternal({ ...internal, notes: "<img src=x onerror=alert(1)>" });
    expect(sent[0].html).not.toContain("<img src=x");
    expect(sent[0].html).toContain("&lt;img src=x");
  });
});

describe("referral codes", () => {
  it("avoids characters that are misread when read aloud or retyped", () => {
    for (let i = 0; i < 400; i++) {
      expect(generateReferralCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
    }
  });
});

describe("the consent wording", () => {
  it("says what the details are for and that they can be deleted", () => {
    expect(ILE_CONSENT_TEXT).toContain("contact me about care");
    expect(ILE_CONSENT_TEXT).toContain("delete my details at any time");
  });
});
