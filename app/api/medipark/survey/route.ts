import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Public, unauthenticated endpoint: consultant survey submissions from
// public/premium-medipark-survey.html.
//
// Research answers are stored anonymously in `payload`. Contact details are
// stored in their own columns and only when the respondent opts in on Q16, so
// an NDPR erasure request can drop the PII without destroying the research.

const ALLOWED = ["premium-medipark"] as const;
const CONTACT_CHOICES = ["contact", "findings", "none"] as const;

const bodySchema = z.object({
  survey: z.enum(ALLOWED),
  submittedAt: z.string().optional(),
  responses: z.record(z.string(), z.any()),
  contact: z
    .object({
      choice: z.enum(CONTACT_CHOICES).optional(),
      name: z.string().max(160).optional(),
      specialty: z.string().max(160).optional(),
      email: z.string().email().max(200).optional().or(z.literal("")),
      phone: z.string().max(40).optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }
    if (JSON.stringify(parsed.data.responses).length > 20_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // Only retain contact details when the respondent actually asked us to.
    const c = parsed.data.contact;
    const wantsContact = c?.choice === "contact" || c?.choice === "findings";

    await prisma.mediparkSurveyResponse.create({
      data: {
        survey: parsed.data.survey,
        payload: parsed.data.responses,
        contactChoice: c?.choice ?? null,
        name: wantsContact ? c?.name?.trim() || null : null,
        specialty: wantsContact ? c?.specialty?.trim() || null : null,
        email: wantsContact ? c?.email?.trim().toLowerCase() || null : null,
        phone: wantsContact ? c?.phone?.trim() || null : null,
        userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
