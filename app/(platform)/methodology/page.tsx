import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import MethodologyLibraryClient from "@/components/platform/methodology/MethodologyLibraryClient";

export default async function MethodologyPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [methodologies, frameworks] = await Promise.all([
    prisma.methodologyTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        serviceTypes: true,
        estimatedWeeks: true,
        _count: { select: { projects: true } },
        phases: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            order: true,
            typicalWeeks: true,
            keyActivities: true,
            keyDeliverables: true,
            gates: {
              orderBy: { order: "asc" },
              select: { id: true, name: true, criteria: true, order: true },
            },
          },
        },
      },
    }),
    prisma.frameworkTemplate.findMany({
      where: { isActive: true },
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
    }),
  ]);

  // Group frameworks by category
  const frameworksByCategory = frameworks.reduce<Record<string, typeof frameworks>>((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {});

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Methodology Library" subtitle="Consulting methodologies and analysis frameworks" />
      <main className="flex-1 overflow-y-auto p-6">
        <MethodologyLibraryClient
          methodologies={methodologies}
          frameworksByCategory={frameworksByCategory}
          userRole={session.user.role}
        />
      </main>
    </div>
  );
}
