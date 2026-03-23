import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import KnowledgeBase from "@/components/platform/KnowledgeBase";
import { BookOpen, Archive, RotateCcw } from "lucide-react";

export const metadata = { title: "Knowledge Base | Consult For Africa" };

export default async function KnowledgePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const assets = await prisma.knowledgeAsset.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      engagement: { select: { id: true, name: true } },
    },
  });

  const serialized = assets.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  // Stats
  const total = assets.length;
  const reusable = assets.filter((a) => a.isReusable).length;
  const byType = {
    INSIGHT: assets.filter((a) => a.assetType === "INSIGHT").length,
    FRAMEWORK: assets.filter((a) => a.assetType === "FRAMEWORK").length,
    TEMPLATE: assets.filter((a) => a.assetType === "TEMPLATE").length,
    CASE_STUDY: assets.filter((a) => a.assetType === "CASE_STUDY").length,
    LESSON_LEARNED: assets.filter((a) => a.assetType === "LESSON_LEARNED").length,
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Knowledge Base" subtitle="Insights, frameworks, and lessons from your engagements" />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard label="Total Assets" value={total} icon={BookOpen} color="#0F2744" />
          <StatCard label="Reusable" value={reusable} icon={RotateCcw} color="#D4AF37" />
          <StatCard label="Insights" value={byType.INSIGHT} color="#3B82F6" />
          <StatCard label="Frameworks" value={byType.FRAMEWORK} color="#16A34A" />
          <StatCard label="Templates" value={byType.TEMPLATE} color="#EA580C" />
          <StatCard label="Case Studies" value={byType.CASE_STUDY} color="#9333EA" />
          <StatCard label="Lessons" value={byType.LESSON_LEARNED} color="#E11D48" />
        </div>

        {/* Main knowledge base */}
        <KnowledgeBase
          initialAssets={serialized}
          userId={session.user.id}
        />
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon?: typeof BookOpen;
  color: string;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: "#fff", border: "1px solid #e5eaf0" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon size={12} style={{ color }} />}
        <p className="text-[10px] text-gray-500">{label}</p>
      </div>
      <p className="text-xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
