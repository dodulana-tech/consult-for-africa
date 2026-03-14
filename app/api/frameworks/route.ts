import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const frameworks = await prisma.frameworkTemplate.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      category: true,
      dimensions: true,
      guideText: true,
      sortOrder: true,
    },
  });

  // Group by category
  const grouped = frameworks.reduce<Record<string, typeof frameworks>>((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {});

  return Response.json({ frameworks, grouped });
}
