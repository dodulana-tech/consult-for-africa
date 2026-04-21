import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signMaarovaCoachJWT } from "@/lib/maarovaAuth";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password)
    return Response.json({ error: "Email and password required" }, { status: 400 });

  const coach = await prisma.maarovaCoach.findUnique({
    where: { email: (email as string).toLowerCase() },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      isPortalEnabled: true,
    },
  });

  if (!coach || !coach.isPortalEnabled || !coach.passwordHash) {
    return Response.json({ error: "Invalid credentials or portal not enabled" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password as string, coach.passwordHash);
  if (!valid) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  const token = signMaarovaCoachJWT({
    sub: coach.id,
    name: coach.name,
    email: coach.email,
  });

  const cookieStore = await cookies();
  cookieStore.set("maarova_coach_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  await prisma.maarovaCoach.update({
    where: { id: coach.id },
    data: { lastLoginAt: new Date() },
  });

  return Response.json({ ok: true, coach: { name: coach.name, email: coach.email } });
});

export const DELETE = handler(async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("maarova_coach_token");
  return Response.json({ ok: true });
});
