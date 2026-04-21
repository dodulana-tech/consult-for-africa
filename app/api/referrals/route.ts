import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { ReferralType, ReferralStatus } from "@prisma/client";
import { z } from "zod";
import { handler } from "@/lib/api-handler";

const VALID_TYPES: ReferralType[] = ["CLIENT", "CONSULTANT", "STAFF"];

const createReferralSchema = z.object({
  type: z.enum(["CLIENT", "CONSULTANT", "STAFF"]),
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().nullable().optional(),
  organisation: z.string().trim().nullable().optional(),
  suggestedRole: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

export const GET = handler(async function GET() {
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
});

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const parsed = createReferralSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { type, name, email, phone, organisation, suggestedRole, notes } = parsed.data;

  const referral = await prisma.referral.create({
    data: {
      referrerId: session.user.id,
      type,
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      organisation: organisation || null,
      suggestedRole: suggestedRole || null,
      notes: notes || null,
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
});
