import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

// GET: List/search facilities
export const GET = handler(async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const state = url.searchParams.get("state");
    const type = url.searchParams.get("type");
    const sort = url.searchParams.get("sort") || "overallRating";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = 20;

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (state) where.state = state;
    if (type) where.type = type;

    const [facilities, total] = await Promise.all([
      prisma.cadreFacility.findMany({
        where,
        orderBy: sort === "reviews" ? { totalReviews: "desc" } : { overallRating: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          state: true,
          city: true,
          overallRating: true,
          totalReviews: true,
          wouldRecommendPct: true,
          compensationRating: true,
          payTimelinessRating: true,
          equipmentRating: true,
          managementRating: true,
        },
      }),
      prisma.cadreFacility.count({ where }),
    ]);

    return NextResponse.json({ facilities, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Facilities list error:", error);
    return NextResponse.json({ error: "Failed to load facilities" }, { status: 500 });
  }
});
