import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { ReferralStatus } from "@prisma/client";

const VALID_STATUSES: ReferralStatus[] = ["PENDING", "CONTACTED", "CONVERTED", "REJECTED"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const { status } = await req.json();

  if (!status || !VALID_STATUSES.includes(status)) {
    return new Response("Invalid status", { status: 400 });
  }

  const referral = await prisma.referral.update({
    where: { id },
    data: { status },
  });

  return Response.json({ ok: true, referral: { ...referral, createdAt: referral.createdAt.toISOString(), updatedAt: referral.updatedAt.toISOString() } });
}
