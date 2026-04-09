import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if SalesAgent already exists for this user
  const existing = await prisma.salesAgent.findFirst({
    where: {
      OR: [
        { userId },
        { email: session.user.email! },
      ],
    },
  });

  if (existing) {
    // Link userId if not already linked
    if (!existing.userId) {
      await prisma.salesAgent.update({
        where: { id: existing.id },
        data: { userId },
      });
    }
    return NextResponse.json(existing);
  }

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      consultantProfile: {
        select: { location: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Split name into first and last
  const nameParts = user.name.trim().split(/\s+/);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") || (nameParts[0] ?? "");

  const agent = await prisma.salesAgent.create({
    data: {
      userId,
      email: user.email,
      phone: "",
      firstName,
      lastName,
      location: user.consultantProfile?.location ?? null,
      status: "APPROVED",
      emailVerified: true,
      isPortalEnabled: true,
    },
  });

  return NextResponse.json(agent);
}
