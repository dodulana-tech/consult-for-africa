import { prisma } from "@/lib/prisma";

export interface CapacitySnapshot {
  consultantId: string;
  consultantName: string;
  weeklyCapacityHours: number;
  maxUtilization: number;
  allocatedHoursPerWeek: number;
  utilizationPercent: number;
  isOverCapacity: boolean;
  isNearCapacity: boolean; // within 10% of max
  activeAssignmentCount: number;
  assignments: {
    id: string;
    engagementName: string;
    role: string;
    hoursPerWeek: number;
    status: string;
  }[];
}

/**
 * Calculate a consultant's current capacity and utilization.
 * Considers all ACTIVE and PENDING assignments.
 */
export async function getConsultantCapacity(consultantId: string): Promise<CapacitySnapshot | null> {
  const user = await prisma.user.findUnique({
    where: { id: consultantId },
    select: {
      id: true,
      name: true,
      consultantProfile: {
        select: { weeklyCapacityHours: true, maxUtilization: true },
      },
      assignments: {
        where: { status: { in: ["ACTIVE", "PENDING", "PENDING_ACCEPTANCE"] } },
        select: {
          id: true,
          role: true,
          status: true,
          estimatedHoursPerWeek: true,
          estimatedHours: true,
          engagement: { select: { name: true } },
        },
      },
    },
  });

  if (!user || !user.consultantProfile) return null;

  const weeklyCapacity = user.consultantProfile.weeklyCapacityHours;
  const maxUtil = user.consultantProfile.maxUtilization;

  const assignments = user.assignments.map((a) => ({
    id: a.id,
    engagementName: a.engagement.name,
    role: a.role,
    hoursPerWeek: a.estimatedHoursPerWeek ?? a.estimatedHours ?? 0,
    status: a.status,
  }));

  const allocatedHours = assignments.reduce((sum, a) => sum + a.hoursPerWeek, 0);
  const utilization = weeklyCapacity > 0 ? Math.round((allocatedHours / weeklyCapacity) * 100) : 0;

  return {
    consultantId: user.id,
    consultantName: user.name,
    weeklyCapacityHours: weeklyCapacity,
    maxUtilization: maxUtil,
    allocatedHoursPerWeek: allocatedHours,
    utilizationPercent: utilization,
    isOverCapacity: utilization > maxUtil,
    isNearCapacity: utilization >= maxUtil - 10 && utilization <= maxUtil,
    activeAssignmentCount: assignments.filter((a) => a.status === "ACTIVE").length,
    assignments,
  };
}

/**
 * Check if adding hours to a consultant would exceed their capacity.
 * Returns a warning message if over threshold, null if OK.
 */
export async function checkCapacityForAssignment(
  consultantId: string,
  additionalHoursPerWeek: number
): Promise<{ allowed: boolean; warning: string | null; capacity: CapacitySnapshot }> {
  const capacity = await getConsultantCapacity(consultantId);
  if (!capacity) {
    return { allowed: false, warning: "Consultant profile not found", capacity: null as unknown as CapacitySnapshot };
  }

  const projectedHours = capacity.allocatedHoursPerWeek + additionalHoursPerWeek;
  const projectedUtil = capacity.weeklyCapacityHours > 0
    ? Math.round((projectedHours / capacity.weeklyCapacityHours) * 100)
    : 0;

  if (projectedUtil > 100) {
    return {
      allowed: false,
      warning: `${capacity.consultantName} would be at ${projectedUtil}% utilization (${projectedHours}h/week of ${capacity.weeklyCapacityHours}h capacity). This exceeds 100% and the assignment cannot proceed without adjusting their workload.`,
      capacity,
    };
  }

  if (projectedUtil > capacity.maxUtilization) {
    return {
      allowed: true, // allowed with warning
      warning: `${capacity.consultantName} would be at ${projectedUtil}% utilization (${projectedHours}h/week). This exceeds their ${capacity.maxUtilization}% threshold. Consultant may be stretched thin.`,
      capacity,
    };
  }

  return { allowed: true, warning: null, capacity };
}
