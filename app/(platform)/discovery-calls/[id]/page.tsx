import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DiscoveryCallDetail from "./DiscoveryCallDetail";

export default async function DiscoveryCallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const call = await prisma.discoveryCall.findUnique({
    where: { id },
    include: {
      conductedBy: { select: { id: true, name: true } },
      convertedToClient: { select: { id: true, name: true } },
    },
  });

  if (!call) notFound();

  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);

  return (
    <div className="flex-1 overflow-y-auto">
      <DiscoveryCallDetail
        call={JSON.parse(JSON.stringify(call))}
        isElevated={isElevated}
      />
    </div>
  );
}
