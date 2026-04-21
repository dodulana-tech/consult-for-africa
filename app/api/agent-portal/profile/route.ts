import { prisma } from "@/lib/prisma";
import { getAgentSession } from "@/lib/agentPortalAuth";
import { handler } from "@/lib/api-handler";

export const PATCH = handler(async function PATCH(req: Request) {
  const session = await getAgentSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { firstName, lastName, phone, company, title, state, bio, linkedinUrl, industries, salesExperience, bankName, accountNumber, accountName } = body;

  const updated = await prisma.salesAgent.update({
    where: { id: session.sub },
    data: {
      ...(firstName !== undefined ? { firstName: firstName.trim() } : {}),
      ...(lastName !== undefined ? { lastName: lastName.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() } : {}),
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
});
