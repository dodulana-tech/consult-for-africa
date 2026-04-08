import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { professionalIds, filter } = await req.json();

  let ids: string[] = [];

  if (Array.isArray(professionalIds) && professionalIds.length > 0) {
    ids = professionalIds;
  } else if (filter === "all_without_outreach") {
    // Find all professionals who don't have an outreach record yet
    const professionals = await prisma.cadreProfessional.findMany({
      where: {
        outreachRecord: null,
        email: { not: { contains: "@cadrehealth.system" } },
      },
      select: { id: true },
    });
    ids = professionals.map((p) => p.id);
  } else {
    return Response.json({ error: "Provide professionalIds or filter." }, { status: 400 });
  }

  if (ids.length === 0) {
    return Response.json({ ok: true, created: 0, message: "No eligible professionals found." });
  }

  // Check which already have outreach records
  const existing = await prisma.cadreOutreachRecord.findMany({
    where: { professionalId: { in: ids } },
    select: { professionalId: true },
  });
  const existingSet = new Set(existing.map((e) => e.professionalId));
  const newIds = ids.filter((id) => !existingSet.has(id));

  if (newIds.length === 0) {
    return Response.json({ ok: true, created: 0, message: "All professionals already have outreach records." });
  }

  // Batch create outreach records
  const result = await prisma.cadreOutreachRecord.createMany({
    data: newIds.map((professionalId) => ({
      professionalId,
      status: "READY",
      tier: "B", // Default tier, can be adjusted later
    })),
    skipDuplicates: true,
  });

  return Response.json({ ok: true, created: result.count, total: ids.length });
}
