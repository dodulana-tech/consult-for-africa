import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ModuleViewer from "@/components/platform/academy/ModuleViewer";

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const mod = await prisma.trainingModule.findUnique({
    where: { slug },
    include: {
      questions: { orderBy: { order: "asc" } },
      track: {
        select: { id: true, name: true, slug: true, level: true, colorHex: true },
      },
    },
  });

  if (!mod) notFound();

  const enrollment = await prisma.trainingEnrollment.findUnique({
    where: {
      userId_trackId: { userId: session.user.id, trackId: mod.track.id },
    },
    include: {
      moduleProgress: { where: { moduleId: mod.id } },
    },
  });

  const progress = enrollment?.moduleProgress[0] ?? null;

  return (
    <ModuleViewer
      module={mod}
      track={mod.track}
      progress={progress}
      isEnrolled={!!enrollment}
    />
  );
}
