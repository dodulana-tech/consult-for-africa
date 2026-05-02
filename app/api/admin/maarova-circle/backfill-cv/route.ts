import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { screenCircleApplication } from "@/lib/maarovaCircleScreening";

export const maxDuration = 300;

/**
 * POST /api/admin/maarova-circle/backfill-cv
 *
 * Re-fetches each applicant's CV from R2, re-extracts the text, re-runs the
 * Claude screening, and updates the application. Used to recover from the
 * silent CV-extraction failure that affected the first cohort of applicants.
 */
export const POST = handler(async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const candidates = await prisma.maarovaCircleApplication.findMany({
    where: {
      cvFileUrl: { not: null },
      OR: [{ cvText: null }, { cvText: "" }],
    },
    orderBy: { createdAt: "asc" },
  });

  const results: Array<{ id: string; email: string; ok: boolean; chars: number; newScore?: number; error?: string }> = [];

  for (const app of candidates) {
    try {
      const fileRes = await fetch(app.cvFileUrl!, { signal: AbortSignal.timeout(15_000) });
      if (!fileRes.ok) {
        results.push({ id: app.id, email: app.email, ok: false, chars: 0, error: `fetch ${fileRes.status}` });
        continue;
      }
      const arrayBuf = await fileRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const contentType = fileRes.headers.get("content-type") || "";

      let text = "";
      if (contentType.includes("pdf") || app.cvFileUrl!.toLowerCase().endsWith(".pdf")) {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        text = result.text || "";
        await parser.destroy();
      } else {
        text = buffer.toString("utf-8").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }

      if (!text) {
        results.push({ id: app.id, email: app.email, ok: false, chars: 0, error: "no text extracted" });
        continue;
      }

      // Re-screen with the freshly extracted CV text
      const screening = await screenCircleApplication({
        firstName: app.firstName,
        lastName: app.lastName,
        currentRole: app.currentRole,
        currentEmployer: app.currentEmployer,
        yearsInRole: app.yearsInRole ?? undefined,
        city: app.city ?? undefined,
        country: app.country ?? undefined,
        linkedinUrl: app.linkedinUrl,
        cvText: text,
      });

      await prisma.maarovaCircleApplication.update({
        where: { id: app.id },
        data: {
          cvText: text.slice(0, 30000),
          aiScore: screening?.score ?? app.aiScore,
          aiSummary: screening?.summary ?? app.aiSummary,
          aiStrengths: screening?.strengths ?? app.aiStrengths,
          aiConcerns: screening?.concerns ?? app.aiConcerns,
          aiRecommendation: screening?.recommendation ?? app.aiRecommendation,
          aiBreakdown: (screening?.breakdown as never) ?? (app.aiBreakdown as never),
        },
      });

      results.push({
        id: app.id,
        email: app.email,
        ok: true,
        chars: text.length,
        newScore: screening?.score,
      });
    } catch (err) {
      results.push({
        id: app.id,
        email: app.email,
        ok: false,
        chars: 0,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    successful: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
});
