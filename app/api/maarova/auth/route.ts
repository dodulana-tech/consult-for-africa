import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signMaarovaJWT } from "@/lib/maarovaAuth";
import { NextRequest } from "next/server";
import { z } from "zod";
import { handler } from "@/lib/api-handler";

const loginSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const POST = handler(async function POST(req: NextRequest) {
  const parsed = loginSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  const user = await prisma.maarovaUser.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      organisationId: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
      isPortalEnabled: true,
    },
  });

  if (!user || !user.isPortalEnabled || !user.passwordHash) {
    return new Response("Invalid credentials or portal not enabled", {
      status: 401,
    });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return new Response("Invalid credentials", { status: 401 });

  const token = signMaarovaJWT({
    sub: user.id,
    organisationId: user.organisationId,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set("maarova_portal_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  await prisma.maarovaUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return Response.json({ ok: true, user: { name: user.name, email: user.email } });
});

export const DELETE = handler(async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("maarova_portal_token");
  return Response.json({ ok: true });
});
