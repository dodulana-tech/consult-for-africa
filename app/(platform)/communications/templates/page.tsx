import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import TemplatesClient from "./TemplatesClient";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

export default async function TemplatesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!ALLOWED_ROLES.includes(session.user.role)) redirect("/dashboard");

  const templates = await prisma.communicationTemplate.findMany({
    orderBy: [{ isActive: "desc" }, { usageCount: "desc" }, { name: "asc" }],
    include: { createdBy: { select: { id: true, name: true } } },
  });

  const serialized = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    type: t.type,
    subject: t.subject,
    body: t.body,
    variables: t.variables,
    isActive: t.isActive,
    usageCount: t.usageCount,
    createdBy: t.createdBy,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Templates"
        subtitle={`${templates.filter((t) => t.isActive).length} active · ${templates.length} total`}
        backHref="/communications"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <TemplatesClient initialTemplates={serialized} />
      </main>
    </div>
  );
}
