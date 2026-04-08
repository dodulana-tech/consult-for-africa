import { prisma } from "@/lib/prisma";

export async function generateOpportunityCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `C4A-OPP-${year}-`;
  const last = await prisma.agentOpportunity.findFirst({
    where: { opportunityCode: { startsWith: prefix } },
    orderBy: { opportunityCode: "desc" },
    select: { opportunityCode: true },
  });
  const lastNum = last ? parseInt(last.opportunityCode.replace(prefix, ""), 10) : 0;
  return `${prefix}${String(lastNum + 1).padStart(3, "0")}`;
}

export async function generateDealCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `C4A-DEAL-${year}-`;
  const last = await prisma.agentDeal.findFirst({
    where: { dealCode: { startsWith: prefix } },
    orderBy: { dealCode: "desc" },
    select: { dealCode: true },
  });
  const lastNum = last ? parseInt(last.dealCode.replace(prefix, ""), 10) : 0;
  return `${prefix}${String(lastNum + 1).padStart(3, "0")}`;
}

export async function generatePayoutCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `C4A-PAY-${year}-`;
  const last = await prisma.agentPayout.findFirst({
    where: { payoutCode: { startsWith: prefix } },
    orderBy: { payoutCode: "desc" },
    select: { payoutCode: true },
  });
  const lastNum = last ? parseInt(last.payoutCode.replace(prefix, ""), 10) : 0;
  return `${prefix}${String(lastNum + 1).padStart(3, "0")}`;
}
