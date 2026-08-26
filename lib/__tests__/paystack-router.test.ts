import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * The router decides where a Paystack event goes. One account serves several
 * products, some outside this codebase, so getting this wrong means a customer
 * pays and the product that owes them something never hears about it.
 *
 * The local handlers are mocked out: what is under test is the routing
 * decision and the forwarding, not what the handlers do with the database.
 */

const handled: string[] = [];

vi.mock("@/lib/paystack/handlers", () => ({
  handleTrackPurchase: async () => {
    handled.push("track");
  },
  handleInvoicePayment: async () => {
    handled.push("invoice");
  },
  handleCadreSubscription: async () => {
    handled.push("cadre");
  },
}));

const TARGETS = {
  mezo: "https://mezo.example/api/paystack/webhook",
  cureva: "https://cureva.example/api/paystack/webhook",
};

let fetchCalls: Array<{ url: string; body: string; signature: string | undefined }> = [];
let fetchResponder: (url: string) => { ok: boolean; status: number } = () => ({ ok: true, status: 200 });

async function importRouter() {
  // targets.ts caches on the env value, and both modules read env at call
  // time, so a fresh module registry per test keeps them honest.
  vi.resetModules();
  return await import("@/lib/paystack/router");
}

function evt(event: string, metadata?: Record<string, unknown>, extra?: Record<string, unknown>) {
  return {
    event,
    data: { id: 1, reference: "ref_123", amount: 500000, metadata, ...extra },
  };
}

beforeEach(() => {
  handled.length = 0;
  fetchCalls = [];
  fetchResponder = () => ({ ok: true, status: 200 });
  process.env.PAYSTACK_FORWARD_TARGETS = JSON.stringify(TARGETS);

  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const headers = init.headers as Record<string, string>;
    fetchCalls.push({
      url: String(url),
      body: String(init.body),
      signature: headers?.["x-paystack-signature"],
    });
    const r = fetchResponder(String(url));
    return { ok: r.ok, status: r.status } as Response;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.PAYSTACK_FORWARD_TARGETS;
});

describe("paystack router", () => {
  it("sends an event addressed to an external product only to that product", async () => {
    const { routeEvent } = await importRouter();
    const event = evt("charge.success", { product: "mezo", orderId: "abc" });

    const out = await routeEvent(event, JSON.stringify(event), "sig1");

    expect(out.status).toBe("FORWARDED");
    expect(out.product).toBe("mezo");
    expect(fetchCalls.map((c) => c.url)).toEqual([TARGETS.mezo]);
    expect(handled).toEqual([]);
  });

  it("forwards the raw body and original signature untouched", async () => {
    const { routeEvent } = await importRouter();
    const event = evt("charge.success", { product: "cureva" });
    const raw = JSON.stringify(event);

    await routeEvent(event, raw, "sig-abc");

    expect(fetchCalls[0].body).toBe(raw);
    expect(fetchCalls[0].signature).toBe("sig-abc");
  });

  it("keeps an event with a local marker at home", async () => {
    const { routeEvent } = await importRouter();
    const event = evt("charge.success", { invoiceId: "inv_1" });

    const out = await routeEvent(event, JSON.stringify(event), "sig2");

    expect(out.status).toBe("HANDLED");
    expect(out.handledInternally).toBe(true);
    expect(handled).toEqual(["invoice"]);
    expect(fetchCalls).toEqual([]);
  });

  it("routes a track purchase and a cadre subscription to their own handlers", async () => {
    const { routeEvent } = await importRouter();

    await routeEvent(
      evt("charge.success", { trackPurchaseId: "tp_1" }),
      "{}",
      "sig3"
    );
    expect(handled).toEqual(["track"]);

    handled.length = 0;
    await routeEvent(
      evt("charge.success", { type: "cadre_subscription", professional_id: "p1" }),
      "{}",
      "sig4"
    );
    expect(handled).toEqual(["cadre"]);
  });

  it("offers an event with no owner to everyone, since subscription events carry no metadata", async () => {
    const { routeEvent } = await importRouter();
    const event = evt("subscription.disable", undefined, {
      customer: { customer_code: "CUS_1" },
    });

    const out = await routeEvent(event, JSON.stringify(event), "sig5");

    expect(out.status).toBe("FORWARDED");
    expect(out.product).toBeNull();
    expect(handled).toEqual(["cadre"]);
    expect(fetchCalls.map((c) => c.url).sort()).toEqual([TARGETS.cureva, TARGETS.mezo].sort());
  });

  it("reports FAILED when the only destination rejects, so the caller can ask for a retry", async () => {
    const { routeEvent } = await importRouter();
    fetchResponder = () => ({ ok: false, status: 503 });
    const event = evt("charge.success", { product: "mezo" });

    const out = await routeEvent(event, JSON.stringify(event), "sig6");

    expect(out.status).toBe("FAILED");
    expect(out.forwardResults[0].ok).toBe(false);
  });

  it("reports PARTIAL when one of several destinations rejects", async () => {
    const { routeEvent } = await importRouter();
    fetchResponder = (url) => (url === TARGETS.mezo ? { ok: false, status: 500 } : { ok: true, status: 200 });

    const out = await routeEvent(evt("transfer.success"), "{}", "sig7");

    expect(out.status).toBe("PARTIAL");
    expect(out.error).toContain("mezo");
  });

  it("marks an event UNROUTED rather than dropping it when nothing is configured", async () => {
    delete process.env.PAYSTACK_FORWARD_TARGETS;
    const { routeEvent } = await importRouter();

    const out = await routeEvent(evt("transfer.success"), "{}", "sig8");

    expect(out.status).toBe("UNROUTED");
    expect(out.forwardResults).toEqual([]);
  });

  it("falls through to local handling when metadata.product names nothing configured", async () => {
    const { routeEvent } = await importRouter();
    const event = evt("charge.success", { product: "not_a_real_product", invoiceId: "inv_2" });

    const out = await routeEvent(event, JSON.stringify(event), "sig9");

    expect(out.status).toBe("HANDLED");
    expect(handled).toEqual(["invoice"]);
  });

  it("ignores a target whose url is not https, so a typo cannot leak events over plain http", async () => {
    process.env.PAYSTACK_FORWARD_TARGETS = JSON.stringify({ mezo: "http://insecure.example/hook" });
    const { routeEvent } = await importRouter();

    const out = await routeEvent(evt("charge.success", { product: "mezo" }), "{}", "sig10");

    expect(fetchCalls).toEqual([]);
    expect(out.status).toBe("UNROUTED");
  });

  it("survives a malformed PAYSTACK_FORWARD_TARGETS instead of taking the webhook down", async () => {
    process.env.PAYSTACK_FORWARD_TARGETS = "{not json";
    const { routeEvent } = await importRouter();

    const out = await routeEvent(evt("charge.success", { invoiceId: "inv_3" }), "{}", "sig11");

    expect(out.status).toBe("HANDLED");
    expect(handled).toEqual(["invoice"]);
  });
});
