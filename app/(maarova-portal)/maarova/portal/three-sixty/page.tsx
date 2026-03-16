import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ThreeSixtyClient from "./ThreeSixtyClient";

export default async function ThreeSixtyPage() {
  const session = await getMaarovaSession();
  if (!session) redirect("/maarova/portal/login");

  const userId = session.sub;

  const request = await prisma.maarova360Request.findFirst({
    where: { subjectId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      invites: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          raterEmail: true,
          raterName: true,
          role: true,
          status: true,
          completedAt: true,
          createdAt: true,
        },
      },
    },
  });

  return (
    <ThreeSixtyClient
      request={request ? JSON.parse(JSON.stringify(request)) : null}
      userName={session.name}
    />
  );
}
