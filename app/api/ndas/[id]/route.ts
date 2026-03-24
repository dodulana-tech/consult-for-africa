import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/ndas/:id
 * Get NDA details.
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const nda = await prisma.nda.findUnique({
    where: { id },
    include: {
      engagement: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      consultant: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!nda) return Response.json({ error: "NDA not found" }, { status: 404 });

  return Response.json({ nda });
}

/**
 * DELETE /api/ndas/:id
 * Cancel/terminate an NDA. Only DRAFT or PENDING can be deleted.
 */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];
  if (!ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const nda = await prisma.nda.findUnique({ where: { id } });
  if (!nda) return Response.json({ error: "NDA not found" }, { status: 404 });

  if (nda.status === "ACTIVE") {
    // Terminate active NDA
    await prisma.nda.update({
      where: { id },
      data: { status: "TERMINATED" },
    });
    return Response.json({ success: true, status: "TERMINATED" });
  }

  // Delete draft/pending NDAs
  await prisma.nda.delete({ where: { id } });
  return Response.json({ success: true });
}
