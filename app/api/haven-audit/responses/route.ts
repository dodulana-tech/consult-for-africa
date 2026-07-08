import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Public, unauthenticated endpoint: anonymous survey submissions from the
// Haven diagnostic-audit forms (public/haven-audit.html, public/haven-patient-survey.html).
// No PII is collected; we store the raw form payload as JSON.

const HAVEN_ENGAGEMENT_ID = "cmqazdnsx0002nzx3kfh8gop0";
const ALLOWED = ["haven-safety-culture", "haven-patient-experience"] as const;

const bodySchema = z.object({
  survey: z.enum(ALLOWED),
  submittedAt: z.string().optional(),
  responses: z.record(z.string(), z.any()),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }
    // guard against oversized payloads
    if (JSON.stringify(parsed.data.responses).length > 20_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    await prisma.auditSurveyResponse.create({
      data: {
        survey: parsed.data.survey,
        engagementId: HAVEN_ENGAGEMENT_ID,
        payload: parsed.data.responses,
        userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
