import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { NdaPdf } from "@/lib/nda/nda-pdf";
import { NdaTemplateData } from "@/lib/nda/templates";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest } from "next/server";
import React from "react";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`${name} environment variable is required`);
  return val;
}

let _s3: S3Client | null = null;
function getS3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: process.env.AWS_REGION ?? "us-east-1",
      credentials: {
        accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
      },
    });
  }
  return _s3;
}

const BUCKET = process.env.AWS_S3_BUCKET ?? "cfa-platform";

/**
 * POST /api/ndas/:id/sign
 * Sign an NDA (Party A or Party B).
 * Body: { party: "A" | "B", signature: "base64 image data" }
 */
export const POST = handler(async function POST(req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const { party, signature } = body;

  if (!party || !signature) {
    return Response.json({ error: "Party and signature are required" }, { status: 400 });
  }

  const nda = await prisma.nda.findUnique({ where: { id } });
  if (!nda) return Response.json({ error: "NDA not found" }, { status: 404 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = new Date();

  if (party === "A") {
    if (nda.status !== "PENDING_PARTY_A") {
      return Response.json({ error: "NDA is not pending Party A signature" }, { status: 400 });
    }

    await prisma.nda.update({
      where: { id },
      data: {
        partyASignature: signature,
        partyASignedAt: now,
        partyAIp: ip,
        status: "PENDING_PARTY_B",
      },
    });

    return Response.json({ success: true, nextStep: "PENDING_PARTY_B" });
  }

  if (party === "B") {
    if (nda.status !== "PENDING_PARTY_B") {
      return Response.json({ error: "NDA is not pending Party B signature" }, { status: 400 });
    }

    // C4A countersign - only elevated roles
    const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];
    if (!ELEVATED.includes(session.user.role)) {
      return Response.json({ error: "Only Directors/Partners can countersign" }, { status: 403 });
    }

    // Update with Party B signature
    const updated = await prisma.nda.update({
      where: { id },
      data: {
        partyBSignature: signature,
        partyBSignedAt: now,
        partyBIp: ip,
        status: "ACTIVE",
        // Set expiry: 3 years from now
        expiresAt: new Date(now.getTime() + 3 * 365 * 24 * 60 * 60 * 1000),
      },
    });

    // Generate signed PDF and upload to S3
    try {
      const templateData: NdaTemplateData = {
        type: updated.type as NdaTemplateData["type"],
        version: updated.version,
        partyA: {
          name: updated.partyAName,
          organisation: updated.partyAOrg,
          title: updated.partyATitle || "",
          email: updated.partyAEmail,
        },
        partyB: {
          name: updated.partyBName,
          organisation: updated.partyBOrg,
          title: updated.partyBTitle || "",
          email: updated.partyBEmail || "",
        },
        effectiveDate: updated.effectiveDate.toLocaleDateString("en-GB"),
        partyASignature: updated.partyASignature || undefined,
        partyASignedDate: updated.partyASignedAt?.toLocaleDateString("en-GB"),
        partyBSignature: updated.partyBSignature || undefined,
        partyBSignedDate: updated.partyBSignedAt?.toLocaleDateString("en-GB"),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfBuffer = await renderToBuffer(
        React.createElement(NdaPdf, { data: templateData }) as any
      );

      const key = `ndas/${updated.id}/signed-${Date.now()}.pdf`;
      await getS3().send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: pdfBuffer,
          ContentType: "application/pdf",
          Metadata: {
            ndaId: updated.id,
            type: updated.type,
            partyA: updated.partyAName,
          },
        })
      );

      const signedPdfUrl = `https://${BUCKET}.s3.amazonaws.com/${key}`;

      await prisma.nda.update({
        where: { id },
        data: { signedPdfUrl, signedPdfKey: key },
      });
    } catch (err) {
      console.error("[nda] PDF generation/upload failed:", err);
      // NDA is still active, PDF can be regenerated
    }

    return Response.json({ success: true, status: "ACTIVE" });
  }

  return Response.json({ error: "Invalid party. Use 'A' or 'B'" }, { status: 400 });
});
