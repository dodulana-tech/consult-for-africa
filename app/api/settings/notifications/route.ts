import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handler } from "@/lib/api-handler";

const DEFAULT_PREFERENCES = {
  email_deliverable: true,
  email_timesheet: true,
  email_project: true,
  email_assignment: true,
  push_enabled: false,
};

export const GET = handler(async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPreferences: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const prefs = {
    ...DEFAULT_PREFERENCES,
    ...(typeof user.notificationPreferences === "object" && user.notificationPreferences !== null
      ? user.notificationPreferences
      : {}),
  };

  return NextResponse.json(prefs);
});

export const PATCH = handler(async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowedKeys = new Set([
    "email_deliverable",
    "email_timesheet",
    "email_project",
    "email_assignment",
    "push_enabled",
  ]);

  const updates: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(body)) {
    if (!allowedKeys.has(key)) continue;
    if (typeof value !== "boolean") continue;
    updates[key] = value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid preferences provided" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPreferences: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing =
    typeof user.notificationPreferences === "object" && user.notificationPreferences !== null
      ? user.notificationPreferences
      : {};

  const merged = { ...DEFAULT_PREFERENCES, ...existing, ...updates };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notificationPreferences: merged },
  });

  return NextResponse.json(merged);
});
