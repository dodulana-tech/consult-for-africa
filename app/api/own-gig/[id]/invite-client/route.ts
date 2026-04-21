import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emailClientPortalInvite } from "@/lib/email";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import crypto from "crypto";
import { handler } from "@/lib/api-handler";

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { contactName, contactEmail } = body;

  if (!contactName || !contactEmail) {
    return Response.json({ error: "contactName and contactEmail are required" }, { status: 400 });
  }

  const gig = await prisma.engagement.findUnique({
    where: { id },
    select: { id: true, isOwnGig: true, ownGigOwnerId: true, clientId: true, client: { select: { name: true } } },
  });

  if (!gig || !gig.isOwnGig) {
    return Response.json({ error: "Own gig not found" }, { status: 404 });
  }

  const isOwner = gig.ownGigOwnerId === session.user.id;
  const isElevated = ELEVATED.includes(session.user.role);
  if (!isOwner && !isElevated) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if contact already exists
  const existing = await prisma.clientContact.findUnique({ where: { email: contactEmail } });
  if (existing) {
    return Response.json({ error: "A contact with this email already exists" }, { status: 409 });
  }

  // Generate temp password
  const tempPassword = crypto.randomBytes(8).toString("base64url").slice(0, 12);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const contact = await prisma.clientContact.create({
    data: {
      clientId: gig.clientId,
      name: contactName,
      email: contactEmail,
      passwordHash,
      isPrimary: false,
      isPortalEnabled: true,
    },
  });

  // Send portal invite email
  try {
    await emailClientPortalInvite({
      contactEmail,
      contactName,
      clientName: gig.client.name,
      password: tempPassword,
    });
  } catch (e) {
    console.error("Failed to send portal invite email:", e);
  }

  return Response.json({ contact, message: "Client invited to portal" }, { status: 201 });
});
