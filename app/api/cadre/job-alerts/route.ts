import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { z } from "zod";
import { handler } from "@/lib/api-handler";

const schema = z.object({
  email: z.string().email(),
  cadre: z.string().optional(),
  state: z.string().optional(),
});

export const POST = handler(async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid email" }, { status: 400 });

  const { email, cadre, state } = parsed.data;

  await prisma.cadreNewsletterSubscriber.upsert({
    where: { email: email.trim().toLowerCase() },
    update: {
      ...(cadre && { cadreFilter: cadre }),
      ...(state && { stateFilter: state }),
    },
    create: {
      email: email.trim().toLowerCase(),
      source: "job-alert",
      ...(cadre && { cadreFilter: cadre }),
      ...(state && { stateFilter: state }),
    },
  });

  return Response.json({ ok: true });
});
