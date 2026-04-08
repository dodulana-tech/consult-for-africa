import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

interface CommissionResult {
  amount: Decimal;
  rate: Decimal;
  commissionType: string;
}

export async function calculateCommission(
  opportunity: {
    commissionType: string;
    commissionValue: Decimal;
    commissionCurrency: string;
    commissionTiers: unknown;
    recurringMonths: number | null;
  },
  deal: {
    id: string;
    agentId: string;
    closedValue: Decimal | null;
  }
): Promise<CommissionResult> {
  const dealValue = deal.closedValue ? Number(deal.closedValue) : 0;
  const commValue = Number(opportunity.commissionValue);

  switch (opportunity.commissionType) {
    case "FIXED_PER_DEAL":
      return {
        amount: new Decimal(commValue),
        rate: new Decimal(commValue),
        commissionType: "FIXED_PER_DEAL",
      };

    case "PERCENTAGE":
      return {
        amount: new Decimal(dealValue * (commValue / 100)),
        rate: new Decimal(commValue),
        commissionType: "PERCENTAGE",
      };

    case "TIERED": {
      const tiers = opportunity.commissionTiers as Array<{
        minDeals: number;
        maxDeals: number;
        rate: number;
      }> | null;

      if (!tiers || tiers.length === 0) {
        return {
          amount: new Decimal(0),
          rate: new Decimal(0),
          commissionType: "TIERED",
        };
      }

      // Count agent's completed deals for this opportunity
      const completedDeals = await prisma.agentDeal.count({
        where: {
          agentId: deal.agentId,
          stage: "CLOSED_WON",
        },
      });

      const tier = tiers.find(
        (t) => completedDeals >= t.minDeals && completedDeals <= t.maxDeals
      ) ?? tiers[tiers.length - 1];

      return {
        amount: new Decimal(dealValue * (tier.rate / 100)),
        rate: new Decimal(tier.rate),
        commissionType: "TIERED",
      };
    }

    case "RECURRING":
      // For recurring, we create the first month's commission
      // Subsequent months are created by a scheduled job
      return {
        amount: new Decimal(dealValue * (commValue / 100)),
        rate: new Decimal(commValue),
        commissionType: "RECURRING",
      };

    default:
      return {
        amount: new Decimal(0),
        rate: new Decimal(0),
        commissionType: opportunity.commissionType,
      };
  }
}

export async function createCommissionForDeal(dealId: string) {
  const deal = await prisma.agentDeal.findUnique({
    where: { id: dealId },
    include: {
      opportunity: {
        select: {
          commissionType: true,
          commissionValue: true,
          commissionCurrency: true,
          commissionTiers: true,
          recurringMonths: true,
        },
      },
    },
  });

  if (!deal || deal.stage !== "CLOSED_WON") return null;

  // Check if commission already exists for this deal
  const existing = await prisma.agentCommission.findFirst({
    where: { dealId: deal.id },
  });
  if (existing) return existing;

  const result = await calculateCommission(deal.opportunity, {
    id: deal.id,
    agentId: deal.agentId,
    closedValue: deal.closedValue,
  });

  const commission = await prisma.agentCommission.create({
    data: {
      dealId: deal.id,
      agentId: deal.agentId,
      commissionType: result.commissionType as "FIXED_PER_DEAL" | "PERCENTAGE" | "TIERED" | "RECURRING",
      baseValue: deal.closedValue ?? new Decimal(0),
      rate: result.rate,
      amount: result.amount,
      currency: deal.opportunity.commissionCurrency as "NGN" | "USD",
      status: "PENDING",
      period: result.commissionType === "RECURRING"
        ? new Date().toISOString().slice(0, 7)
        : null,
      periodNumber: result.commissionType === "RECURRING" ? 1 : null,
    },
  });

  return commission;
}
