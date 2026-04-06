import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Search facilities by name (for autocomplete)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ facilities: [] });
    }

    const facilities = await prisma.cadreFacility.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      orderBy: { totalReviews: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        state: true,
        city: true,
        type: true,
      },
    });

    return NextResponse.json({ facilities });
  } catch (error) {
    console.error("Facility search error:", error);
    return NextResponse.json({ error: "Failed to search facilities" }, { status: 500 });
  }
}
