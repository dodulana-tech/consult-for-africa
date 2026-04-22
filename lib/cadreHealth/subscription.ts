import { prisma } from "@/lib/prisma";

const FREE_AI_MESSAGES_PER_MONTH = 3;

export async function getOrCreateSubscription(professionalId: string) {
  let sub = await prisma.cadreSubscription.findUnique({
    where: { professionalId },
  });

  if (!sub) {
    sub = await prisma.cadreSubscription.create({
      data: { professionalId, plan: "FREE", status: "ACTIVE" },
    });
  }

  return sub;
}

/**
 * Check whether the professional can send an AI advisor message.
 * Pro users: unlimited. Free users: 3 per calendar month.
 */
export async function checkAIMessageAllowance(professionalId: string): Promise<{
  allowed: boolean;
  remaining: number;
  plan: string;
}> {
  const sub = await getOrCreateSubscription(professionalId);

  if (sub.plan === "PRO" && sub.status === "ACTIVE") {
    return { allowed: true, remaining: -1, plan: "PRO" };
  }

  // Reset counter if month rolled over
  const now = new Date();
  const resetAt = new Date(sub.aiMessagesResetAt);
  if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
    await prisma.cadreSubscription.update({
      where: { id: sub.id },
      data: { aiMessagesThisMonth: 0, aiMessagesResetAt: now },
    });
    sub.aiMessagesThisMonth = 0;
  }

  const remaining = FREE_AI_MESSAGES_PER_MONTH - sub.aiMessagesThisMonth;

  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    plan: "FREE",
  };
}

/**
 * Increment the AI message counter after a successful message.
 */
export async function incrementAIMessageCount(professionalId: string) {
  const sub = await getOrCreateSubscription(professionalId);
  await prisma.cadreSubscription.update({
    where: { id: sub.id },
    data: { aiMessagesThisMonth: { increment: 1 } },
  });
}

export const PLANS = {
  FREE: {
    name: "Free",
    priceNGN: 0,
    aiMessages: FREE_AI_MESSAGES_PER_MONTH,
    mentorSessions: 0,
    features: [
      `${FREE_AI_MESSAGES_PER_MONTH} career advisor messages per month`,
      "Career readiness score",
      "Browse mentors",
      "Job alerts",
    ],
  },
  PRO: {
    name: "Pro",
    priceNGN: 1500,
    aiMessages: -1, // unlimited
    mentorSessions: 0, // pay per session separately
    features: [
      "Unlimited career advisor messages",
      "Career reports and 90-day plans",
      "Priority mentor matching",
      "Salary benchmarking",
      "Book mentor sessions (N5,000 each)",
    ],
  },
} as const;
