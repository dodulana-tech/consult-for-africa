import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  console.log("New Partner Inquiry:", body);

  // connect to Resend, Supabase, or CRM later

  return NextResponse.json({ ok: true });
}
