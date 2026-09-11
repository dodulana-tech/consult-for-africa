import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import InternProgrammeClient from "./InternProgrammeClient";

export const metadata = { title: "Intern Programme | Consult For Africa" };

export default async function InternsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["PARTNER", "ADMIN"].includes(session.user.role)) redirect("/dashboard");

  // Anyone who could supervise a rotation or sit in one. The Administrative
  // Assistant is a rotation like any other, with the EA as supervisor.
  const people = await prisma.user.findMany({
    where: { role: { not: "ACADEMY_LEARNER" } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Intern Programme" subtitle="Cohorts, rotations and monthly evaluations" />
      <InternProgrammeClient people={JSON.parse(JSON.stringify(people))} />
    </div>
  );
}
