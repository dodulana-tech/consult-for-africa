import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const professional = await prisma.cadreProfessional.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!professional) {
    return Response.json({ error: "Account not found" }, { status: 404 });
  }

  if (professional.passwordHash) {
    return Response.json({ error: "Account already activated. Please log in." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.cadreProfessional.update({
    where: { id: professional.id },
    data: {
      passwordHash,
      accountStatus: "PENDING_REVIEW",
    },
  });

  return Response.json({ ok: true });
}
