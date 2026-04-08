import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { firstName, lastName, email, phone, password, company, title, state, industries, salesExperience, referralSource } = body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim() || !password?.trim()) {
    return Response.json({ error: "First name, last name, email, phone, and password are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const emailLower = (email as string).toLowerCase().trim();

  const existing = await prisma.salesAgent.findUnique({
    where: { email: emailLower },
    select: { id: true },
  });

  if (existing) {
    return Response.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const agent = await prisma.salesAgent.create({
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: emailLower,
      phone: phone.trim(),
      passwordHash,
      company: company?.trim() || null,
      title: title?.trim() || null,
      state: state?.trim() || null,
      industries: Array.isArray(industries) ? industries : [],
      salesExperience: salesExperience ? parseInt(salesExperience) : null,
      referralSource: referralSource?.trim() || null,
      status: "APPLIED",
      isPortalEnabled: true,
    },
    select: { id: true, firstName: true, email: true },
  });

  return Response.json({ ok: true, agentId: agent.id, firstName: agent.firstName });
}
