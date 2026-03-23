import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import LibraryClient from "@/components/platform/knowledge/LibraryClient";
import { BookOpen, ShieldCheck, Layers, FileText } from "lucide-react";

export const metadata = { title: "Asset Library | Consult For Africa" };

export default async function LibraryPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const assets = await prisma.libraryAsset.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = assets.map((a) => ({
    ...a,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    lastUpdatedAt: a.lastUpdatedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  const total = assets.length;
  const validated = assets.filter((a) => a.maturity === "VALIDATED").length;
  const battleTested = assets.filter((a) => a.maturity === "BATTLE_TESTED").length;
  const drafts = assets.filter((a) => a.maturity === "DRAFT").length;

  // Collect unique stream tags
  const allStreams = Array.from(new Set(assets.flatMap((a) => a.streamTags)));

  const canCreate = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Asset Library"
        subtitle="Frameworks, templates, models, and reusable knowledge assets"
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Assets" value={total} icon={BookOpen} color="#0F2744" />
          <StatCard label="Battle-Tested" value={battleTested} icon={ShieldCheck} color="#059669" />
          <StatCard label="Validated" value={validated} icon={Layers} color="#3B82F6" />
          <StatCard label="Drafts" value={drafts} icon={FileText} color="#9CA3AF" />
        </div>

        <LibraryClient
          initialAssets={serialized}
          allStreams={allStreams}
          canCreate={canCreate}
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
  icon: typeof BookOpen;
  color: string;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: "#fff", border: "1px solid #e5eaf0" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} style={{ color }} />
        <p className="text-[10px] text-gray-500">{label}</p>
      </div>
      <p className="text-xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
