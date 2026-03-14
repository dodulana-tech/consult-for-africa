import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { ReferralType, ReferralStatus } from "@prisma/client";

const VALID_TYPES: ReferralType[] = ["CLIENT", "CONSULTANT", "STAFF"];

export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);

  // Admins see all referrals; other users see only their own
  const referrals = await prisma.referral.findMany({
    where: isAdmin ? {} : { referrerId: session.user.id },
    include: {
      referrer: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    referrals: referrals.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { type, name, email, phone, organisation, suggestedRole, notes } = await req.json();

  if (!type || !name?.trim() || !email?.trim()) {
    return new Response("type, name, and email are required", { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return new Response("Invalid type", { status: 400 });
  }

  const referral = await prisma.referral.create({
    data: {
      referrerId: session.user.id,
      type,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      organisation: organisation?.trim() || null,
      suggestedRole: suggestedRole?.trim() || null,
      notes: notes?.trim() || null,
    },
    include: {
      referrer: { select: { name: true } },
    },
  });

  return Response.json({
    ok: true,
    referral: {
      ...referral,
      createdAt: referral.createdAt.toISOString(),
      updatedAt: referral.updatedAt.toISOString(),
    },
  }, { status: 201 });
}
