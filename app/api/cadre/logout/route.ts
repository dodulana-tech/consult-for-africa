import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("cadre_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
});
