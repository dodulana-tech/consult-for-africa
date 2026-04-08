import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { ProposalPdf, ProposalPdfData } from "@/lib/proposal/proposal-pdf";
import { NextRequest } from "next/server";
import React from "react";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60;

const ELEVATED_ROLES = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/proposals/:id/pdf
 * Generate and download a proposal as a professionally branded PDF.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!proposal) {
    return Response.json({ error: "Proposal not found" }, { status: 404 });
  }

  const isElevated = ELEVATED_ROLES.includes(session.user.role);
  if (!isElevated && proposal.createdById !== session.user.id) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  // Load logo as base64 data URI
  // Try multiple paths: Vercel bundles files differently from local dev
  let logoBase64: string | null = null;
  const logoPaths = [
    path.join(process.cwd(), "public", "logo-cfa.png"),
    path.join(process.cwd(), ".next", "static", "media", "logo-cfa.png"),
    path.resolve("public", "logo-cfa.png"),
  ];
  for (const logoPath of logoPaths) {
    try {
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
        break;
      }
    } catch {
      // Try next path
    }
  }
  // Fallback: fetch from the app's own public URL
  if (!logoBase64) {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
      const logoRes = await fetch(`${baseUrl}/logo-cfa.png`);
      if (logoRes.ok) {
        const buf = Buffer.from(await logoRes.arrayBuffer());
        logoBase64 = `data:image/png;base64,${buf.toString("base64")}`;
      }
    } catch {
      console.warn("[proposals/pdf] Could not load logo via HTTP fallback");
    }
  }

  const pdfData: ProposalPdfData = {
    title: proposal.title,
    clientName: proposal.clientName,
    clientContact: proposal.clientContact,
    serviceType: proposal.serviceType,
    budgetRange: proposal.budgetRange,
    timeline: proposal.timeline,
    challenges: proposal.challenges,
    objectives: proposal.objectives,
    content: proposal.content,
    createdAt: proposal.createdAt.toISOString(),
    createdByName: proposal.createdBy?.name ?? "Consult For Africa",
    logoBase64,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(
    React.createElement(ProposalPdf, { data: pdfData }) as any,
  );

  const safeClient = proposal.clientName.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `CFA_Proposal_${safeClient}_${proposal.id.slice(-6)}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
