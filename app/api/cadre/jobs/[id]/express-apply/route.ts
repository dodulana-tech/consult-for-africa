import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";
import { handler } from "@/lib/api-handler";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
  cadre: z.string().min(1),
});

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, phone, cadre } = parsed.data;

  // Verify job exists and is open
  const job = await prisma.cadreMandate.findFirst({
    where: { id, isPublished: true, status: "OPEN" },
  });
  if (!job) return new Response("Job not found", { status: 404 });

  // Find or create a minimal professional record
  let professional = await prisma.cadreProfessional.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!professional) {
    // Create minimal profile - no password needed yet
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "";

    professional = await prisma.cadreProfessional.create({
      data: {
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        cadre: cadre as any,
        accountStatus: "UNVERIFIED",
        availability: "ACTIVELY_LOOKING",
      },
    });
  }

  // Check if already applied
  const existing = await prisma.cadreMandateMatch.findUnique({
    where: {
      mandateId_professionalId: {
        mandateId: id,
        professionalId: professional.id,
      },
    },
  });
  if (existing) {
    return Response.json(
      { error: "You have already applied for this role" },
      { status: 409 }
    );
  }

  // Create application
  await prisma.cadreMandateMatch.create({
    data: {
      mandateId: id,
      professionalId: professional.id,
      status: "MATCHED",
    },
  });

  // Increment application count
  await prisma.cadreMandate.update({
    where: { id },
    data: { applicationCount: { increment: 1 } },
  });

  return Response.json({
    ok: true,
    professionalId: professional.id,
    isNew: !professional.passwordHash,
  });
});
