import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  contactName: z.string().trim().min(1, "Contact name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  productDescription: z.string().trim().min(1, "Product description is required"),
  targetMarket: z.string().trim().optional().default(""),
  currentPricing: z.string().trim().optional().default(""),
  commissionBudget: z.string().trim().optional().default(""),
  territories: z.array(z.string()).optional().default([]),
  preferredTier: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
});

const resend = new Resend(process.env.RESEND_API_KEY ?? "noop");

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const d = parsed.data;

  // Build inbound message with all form fields
  const inboundMessage = [
    `Product/Service: ${d.productDescription}`,
    d.targetMarket ? `Target Market: ${d.targetMarket}` : null,
    d.currentPricing ? `Current Pricing: ${d.currentPricing}` : null,
    d.commissionBudget ? `Commission Budget: ${d.commissionBudget}` : null,
    d.territories.length ? `Territories: ${d.territories.join(", ")}` : null,
    d.preferredTier ? `Preferred Tier: ${d.preferredTier}` : null,
    d.notes ? `Notes: ${d.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // Save as Lead
  try {
    await prisma.lead.create({
      data: {
        source: "AGENT_CHANNEL",
        status: "NEW",
        organizationName: d.companyName,
        contactName: d.contactName,
        contactEmail: d.email.toLowerCase(),
        contactPhone: d.phone,
        inboundMessage,
        inboundProjectType: "AGENT_CHANNEL",
      },
    });
  } catch (err) {
    console.error("[agent-channel] lead creation failed", err);
  }

  // Send email notification
  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;color:#6B7280;font-size:13px;vertical-align:top;width:140px">${label}</td><td style="padding:8px 0;font-size:14px">${value}</td></tr>`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#0F2744">New Agent Channel Request</h2>
      <table style="width:100%;border-collapse:collapse">
        ${row("Company", esc(d.companyName))}
        ${row("Contact", esc(d.contactName))}
        ${row("Email", `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>`)}
        ${row("Phone", esc(d.phone))}
        ${row("Product/Service", esc(d.productDescription))}
        ${d.targetMarket ? row("Target Market", esc(d.targetMarket)) : ""}
        ${d.currentPricing ? row("Pricing", esc(d.currentPricing)) : ""}
        ${d.commissionBudget ? row("Commission Budget", esc(d.commissionBudget)) : ""}
        ${d.territories.length ? row("Territories", esc(d.territories.join(", "))) : ""}
        ${d.preferredTier ? row("Preferred Tier", esc(d.preferredTier)) : ""}
      </table>
      ${d.notes ? `<hr style="border:none;border-top:1px solid #e5eaf0;margin:16px 0"><h3 style="color:#0F2744;font-size:14px">Additional Notes</h3><p style="font-size:14px;line-height:1.6;color:#374151">${esc(d.notes).replace(/\n/g, "<br>")}</p>` : ""}
    </div>
  `;

  if (process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: "Consult For Africa <platform@consultforafrica.com>",
        to: "partnerships@consultforafrica.com",
        replyTo: d.email,
        subject: `Agent Channel Request: ${d.companyName}`,
        html,
      });
    } catch (err) {
      console.error("[agent-channel] email send failed", err);
    }
  } else {
    console.log("[agent-channel] RESEND not configured, skipping email");
  }

  return NextResponse.json({ success: true });
}
