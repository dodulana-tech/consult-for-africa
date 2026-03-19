import { prisma } from "@/lib/prisma";
import { getMaarovaSession } from "@/lib/maarovaAuth";
import bcrypt from "bcryptjs";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,}$/;

export async function PUT(req: Request) {
  const auth = await getMaarovaSession();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return Response.json(
      { error: "Current password and new password are required" },
      { status: 400 },
    );
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    return Response.json(
      {
        error:
          "Password must be at least 10 characters with uppercase, lowercase, number, and special character",
      },
      { status: 400 },
    );
  }

  const user = await prisma.maarovaUser.findUnique({
    where: { id: auth.sub },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.maarovaUser.update({
    where: { id: auth.sub },
    data: { passwordHash: newHash },
  });

  return Response.json({ ok: true });
}
