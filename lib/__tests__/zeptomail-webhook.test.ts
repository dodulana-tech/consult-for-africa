import { describe, it, expect } from "vitest";
import { parseEvents, reasonFromEvent } from "../zeptomailWebhook";

/** The shape ZeptoMail actually posts, per the dashboard's data preview. */
function zeptoPayload(eventName: string, address: string) {
  return {
    event_name: [eventName],
    event_message: [
      {
        email_info: {
          to: [{ email_address: { address, name: "Test" } }],
          cc: [{ email_address: { address: "cc@zylker.com", name: "TestCC" } }],
          bcc: [],
          subject: "webhook test email",
          client_reference: "customer-unique-id",
        },
        is_smtp_trigger: false,
        bounce_address: "bounce@consultforafrica.com",
      },
    ],
  };
}

describe("parseEvents", () => {
  it("reads the real ZeptoMail envelope", () => {
    expect(parseEvents(zeptoPayload("hardbounce", "Dead@Example.com"))).toEqual([
      { email: "dead@example.com", eventName: "hardbounce" },
    ]);
  });

  it("ignores cc and bcc, which a bounce does not implicate", () => {
    const parsed = parseEvents(zeptoPayload("hardbounce", "to@example.com"));
    expect(parsed.map((e) => e.email)).toEqual(["to@example.com"]);
  });

  it("fans out multiple messages under one event_name", () => {
    const payload = {
      event_name: ["softbounce"],
      event_message: [
        { email_info: { to: [{ email_address: { address: "a@example.com" } }] } },
        { email_info: { to: [{ email_address: { address: "b@example.com" } }] } },
      ],
    };
    expect(parseEvents(payload).map((e) => e.email)).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("still accepts a flat hand-rolled payload", () => {
    expect(
      parseEvents({ event_name: "hard_bounce", email_address: "x@example.com" }),
    ).toEqual([{ email: "x@example.com", eventName: "hard_bounce" }]);
  });

  it("returns nothing for a shape it cannot read, rather than guessing", () => {
    expect(parseEvents({ event_name: ["hardbounce"] })).toEqual([]);
    expect(parseEvents({ nonsense: true })).toEqual([]);
    expect(parseEvents(null)).toEqual([]);
  });
});

describe("reasonFromEvent", () => {
  it("suppresses hard bounces", () => {
    expect(reasonFromEvent("hardbounce")).toBe("BOUNCED");
    expect(reasonFromEvent("hard bounce")).toBe("BOUNCED");
  });

  it("does not suppress soft bounces", () => {
    expect(reasonFromEvent("softbounce")).toBeNull();
    expect(reasonFromEvent("soft bounce")).toBeNull();
  });

  it("treats a feedback loop as a complaint", () => {
    expect(reasonFromEvent("feedback loop")).toBe("COMPLAINT");
  });

  it("ignores engagement and delivery events", () => {
    expect(reasonFromEvent("delivered")).toBeNull();
    expect(reasonFromEvent("email opens")).toBeNull();
    expect(reasonFromEvent("email clicks")).toBeNull();
  });
});
