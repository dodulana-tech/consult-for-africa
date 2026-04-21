import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.maarovaUser.findUnique({ where: { id } });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  await prisma.maarovaUser.update({
    where: { id },
    data: { isPortalEnabled: false },
  });

  return Response.json({ success: true });
});
