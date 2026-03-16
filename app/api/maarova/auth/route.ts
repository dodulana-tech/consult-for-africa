import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signMaarovaJWT } from "@/lib/maarovaAuth";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password)
    return new Response("Email and password required", { status: 400 });

  const user = await prisma.maarovaUser.findUnique({
    where: { email: (email as string).toLowerCase() },
    select: {
      id: true,
      organisationId: true,
      name: true,
      email: true,
      passwordHash: true,
      isPortalEnabled: true,
    },
  });

  if (!user || !user.isPortalEnabled || !user.passwordHash) {
    return new Response("Invalid credentials or portal not enabled", {
      status: 401,
    });
  }

  const valid = await bcrypt.compare(password as string, user.passwordHash);
  if (!valid) return new Response("Invalid credentials", { status: 401 });

  const token = signMaarovaJWT({
    sub: user.id,
    organisationId: user.organisationId,
    name: user.name,
    email: user.email,
  });

  const cookieStore = await cookies();
  cookieStore.set("maarova_portal_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/maarova/portal",
  });

  await prisma.maarovaUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return Response.json({ ok: true, user: { name: user.name, email: user.email } });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("maarova_portal_token");
  return Response.json({ ok: true });
}
