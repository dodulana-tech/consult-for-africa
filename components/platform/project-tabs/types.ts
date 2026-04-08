export type Tab = "overview" | "tracks" | "team" | "deliverables" | "timeline" | "calls" | "transform" | "playbook" | "debrief";

export type EngagementType = "PROJECT" | "RETAINER" | "SECONDMENT" | "FRACTIONAL" | "TRANSFORMATION" | "TRANSACTION";

export interface ConsultantProfile {
  title: string;
  location: string;
  isDiaspora: boolean;
  expertiseAreas: string[];
  tier: string;
  averageRating: number | null;
  availabilityStatus: string;
  hourlyRateUSD: number | null;
  monthlyRateNGN: number | null;
}

export interface Assignment {
  id: string;
  role: string;
  responsibilities: string;
  status: string;
  rateAmount: number;
  rateCurrency: string;
  rateType: string;
  estimatedHours: number | null;
  consultant: {
    id: string;
    name: string;
    email: string;
    consultantProfile: ConsultantProfile | null;
  };
  deliverables: { status: string }[];
  timeEntries: { hours: number; billableAmount: number | null; currency: string }[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  status: string;
  completionDate: string | null;
  order: number;
}

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  status: string;
  dueDate?: string | null;
  submittedAt: string | null;
  reviewScore: number | null;
  reviewNotes: string | null;
  version: number;
  assignmentId?: string | null;
  assignment: { id?: string; consultant: { name: string } } | null;
  fee: number | null;
  feeCurrency: string | null;
  feePaidAt: string | null;
}

export interface ProjectUpdate {
  id: string;
  content: string;
  type: string;
  clientVisible: boolean;
  createdAt: string;
  createdBy: { name: string };
}

export interface PhaseGate {
  id: string;
  name: string;
  passed: boolean;
  passedAt: string | null;
  notes: string | null;
}

export interface Phase {
  id: string;
  name: string;
  description: string | null;
  order: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "SKIPPED";
  percentComplete: number;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  createdAt: string;
  gates: PhaseGate[];
}

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "RED" | "AMBER" | "GREEN";
  likelihood: number;
  impact: number;
  riskScore: number;
  mitigation: string | null;
  status: "OPEN" | "MITIGATING" | "RESOLVED" | "ACCEPTED";
  resolvedAt: string | null;
  createdAt: string;
}

export interface StaffingRequestItem {
  id: string;
  role: string;
  description: string;
  skillsRequired: string[];
  hoursPerWeek: number;
  duration: string | null;
  rateType: string;
  rateBudget: number | null;
  rateCurrency: string;
  urgency: string;
  status: string;
  expressionCount: number;
  createdAt: string;
}

export interface TrackItem {
  id: string;
  name: string;
  description: string | null;
  order: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  team: {
    assignmentId: string;
    consultantId: string;
    consultantName: string;
    role: string;
    trackRole: string | null;
    allocationPct: number;
    isBillable: boolean;
    status: string;
  }[];
  deliverables: {
    id: string;
    name: string;
    status: string;
    assigned: boolean;
    dueDate: string | null;
  }[];
  openStaffingRequests: number;
}

export interface Interaction {
  id: string;
  type: string;
  summary: string;
  sentiment: string;
  conductedById: string;
  conductedAt: string;
  nextActionDate: string | null;
  nextActionNote: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  riskLevel: string;
  healthScore: number | null;
  budgetAmount: number;
  budgetCurrency: "NGN" | "USD";
  actualSpent: number;
  startDate: string;
  endDate: string;
  serviceType: string;
  engagementType: EngagementType;
  notes: string | null;
  client: { name: string; primaryContact: string; email: string; phone: string };
  engagementManager: { id: string; name: string; email: string };
  assignments: Assignment[];
  milestones: Milestone[];
  deliverables: Deliverable[];
  updates: ProjectUpdate[];
  phases: Phase[];
  risks: RiskItem[];
  interactions: Interaction[];
  staffingRequests: StaffingRequestItem[];
  tracks: TrackItem[];
  budgetSensitivity: string | null;
  consultantTierMin: string | null;
  consultantTierMax: string | null;
  internEligible: boolean;
  pricingNotes: string | null;
  // RETAINER
  retainerMonthlyFee: number | null;
  retainerHoursPool: number | null;
  retainerAutoRenew: boolean | null;
  retainerNoticePeriodDays: number | null;
  // SECONDMENT
  secondeeClientLineManager: string | null;
  secondeeRecallClauseDays: number | null;
  secondeeMonthlyFee: number | null;
  // FRACTIONAL
  fractionalPlacedName: string | null;
  fractionalRoleTitle: string | null;
  fractionalCommissionPct: number | null;
  fractionalArrangementFee: number | null;
  // TRANSFORMATION
  transformHospitalId: string | null;
  transformEquityPct: number | null;
  transformDealStructure: string | null;
  transformEntryValuation: number | null;
  transformBoardSeat: boolean | null;
  transformStepInTrigger: number | null;
  transformExitMonths: number | null;
  // TRANSACTION
  transactionMandateType: string | null;
  transactionTargetCompany: string | null;
  transactionDealSize: number | null;
  transactionSuccessFeePct: number | null;
  transactionCloseDate: string | null;
}
