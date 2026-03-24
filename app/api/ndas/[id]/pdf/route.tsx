import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { NdaPdf } from "@/lib/nda/nda-pdf";
import { NdaTemplateData } from "@/lib/nda/templates";
import { NextRequest } from "next/server";
import React from "react";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/ndas/:id/pdf
 * Generate and download NDA as PDF (current state, signed or unsigned).
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const nda = await prisma.nda.findUnique({ where: { id } });

  if (!nda) return Response.json({ error: "NDA not found" }, { status: 404 });

  const templateData: NdaTemplateData = {
    type: nda.type as NdaTemplateData["type"],
    version: nda.version,
    partyA: {
      name: nda.partyAName,
      organisation: nda.partyAOrg,
      title: nda.partyATitle || "",
      email: nda.partyAEmail,
    },
    partyB: {
      name: nda.partyBName,
      organisation: nda.partyBOrg,
      title: nda.partyBTitle || "",
      email: nda.partyBEmail || "",
    },
    effectiveDate: nda.effectiveDate.toLocaleDateString("en-GB"),
    partyASignature: nda.partyASignature || undefined,
    partyASignedDate: nda.partyASignedAt?.toLocaleDateString("en-GB"),
    partyBSignature: nda.partyBSignature || undefined,
    partyBSignedDate: nda.partyBSignedAt?.toLocaleDateString("en-GB"),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(
    React.createElement(NdaPdf, { data: templateData }) as any
  );

  const filename = `CFA_NDA_${nda.partyAOrg.replace(/\s+/g, "_")}_${nda.type}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
