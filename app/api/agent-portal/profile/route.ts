import { prisma } from "@/lib/prisma";
import { getAgentSession } from "@/lib/agentPortalAuth";

export async function PATCH(req: Request) {
  const session = await getAgentSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { company, title, state, bio, linkedinUrl, industries, salesExperience, bankName, accountNumber, accountName } = body;

  const updated = await prisma.salesAgent.update({
    where: { id: session.sub },
    data: {
      ...(company !== undefined ? { company: company || null } : {}),
      ...(title !== undefined ? { title: title || null } : {}),
      ...(state !== undefined ? { state: state || null } : {}),
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(linkedinUrl !== undefined ? { linkedinUrl: linkedinUrl || null } : {}),
      ...(Array.isArray(industries) ? { industries } : {}),
      ...(salesExperience !== undefined ? { salesExperience: salesExperience ? parseInt(salesExperience) : null } : {}),
      ...(bankName !== undefined ? { bankName: bankName || null } : {}),
      ...(accountNumber !== undefined ? { accountNumber: accountNumber || null } : {}),
      ...(accountName !== undefined ? { accountName: accountName || null } : {}),
    },
    select: { id: true, firstName: true },
  });

  return Response.json(updated);
}
