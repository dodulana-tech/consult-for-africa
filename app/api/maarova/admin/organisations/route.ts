import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const VALID_TYPES = ["private_hospital", "hospital_group", "government", "ngo"];
const VALID_STREAMS = ["RECRUITMENT", "DEVELOPMENT", "INTELLIGENCE"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const body = await req.json();
  const {
    name,
    type,
    country,
    city,
    contactName,
    contactEmail,
    contactPhone,
    stream,
    maxAssessments,
  } = body;

  if (!name?.trim()) return new Response("Name is required", { status: 400 });
  if (!type?.trim() || !VALID_TYPES.includes(type)) {
    return new Response(
      `Type is required. Must be one of: ${VALID_TYPES.join(", ")}`,
      { status: 400 }
    );
  }
  if (!contactName?.trim()) return new Response("Contact name is required", { status: 400 });
  if (!contactEmail?.trim()) return new Response("Contact email is required", { status: 400 });
  if (!stream?.trim() || !VALID_STREAMS.includes(stream)) {
    return new Response(
      `Stream is required. Must be one of: ${VALID_STREAMS.join(", ")}`,
      { status: 400 }
    );
  }

  const org = await prisma.maarovaOrganisation.create({
    data: {
      name: name.trim(),
      type: type.trim(),
      country: country?.trim() || "Nigeria",
      city: city?.trim() || null,
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      contactPhone: contactPhone?.trim() || null,
      stream: stream as "RECRUITMENT" | "DEVELOPMENT" | "INTELLIGENCE",
      maxAssessments: maxAssessments ? parseInt(String(maxAssessments), 10) : 1,
    },
  });

  return Response.json({
    id: org.id,
    name: org.name,
    createdAt: org.createdAt.toISOString(),
  });
}
