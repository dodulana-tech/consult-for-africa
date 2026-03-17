import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendInvite } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const { email } = await req.json();
  if (!email) return new Response("Email required", { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) return new Response("User not found", { status: 404 });

  // Generate new temp password
  const tempPassword = randomBytes(12).toString("base64url") + "!1A";
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  try {
    await sendInvite(user.email, user.name, user.role, tempPassword);
  } catch (err) {
    console.error("Failed to resend invite:", err);
    return new Response("Failed to send email", { status: 500 });
  }

  return Response.json({ ok: true });
}
