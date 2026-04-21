// Consultant Specialty Taxonomy
// MECE: 10 categories, ~30 specialties
// Categories are mutually exclusive functional disciplines
// Specialties within each category are collectively exhaustive for C4A's consultant base

export interface SpecialtyCategory {
  key: string;
  label: string;
  specialties: { key: string; label: string }[];
  /** Which C4A ServiceTypes this category typically maps to */
  serviceTypes: string[];
}

export const SPECIALTY_CATEGORIES: SpecialtyCategory[] = [
  {
    key: "CLINICAL",
    label: "Clinical",
    specialties: [
      { key: "MEDICINE", label: "Medicine" },
      { key: "NURSING", label: "Nursing" },
      { key: "PHARMACY", label: "Pharmacy & Drug Management" },
      { key: "LABORATORY", label: "Laboratory" },
      { key: "RADIOLOGY", label: "Radiology & Imaging" },
      { key: "PHYSIOTHERAPY", label: "Physiotherapy & Rehabilitation" },
    ],
    serviceTypes: ["CLINICAL_GOVERNANCE", "HOSPITAL_OPERATIONS"],
  },
  {
    key: "OPERATIONS",
    label: "Operations",
    specialties: [
      { key: "OPERATIONS_MANAGEMENT", label: "Operations Management" },
      { key: "PROCESS_ENGINEERING", label: "Process Engineering" },
      { key: "SUPPLY_CHAIN", label: "Supply Chain & Procurement" },
      { key: "FACILITIES_MANAGEMENT", label: "Facilities Management" },
      { key: "BIOMEDICAL_ENGINEERING", label: "Biomedical Engineering" },
    ],
    serviceTypes: ["HOSPITAL_OPERATIONS", "TURNAROUND"],
  },
  {
    key: "FINANCE",
    label: "Finance",
    specialties: [
      { key: "FINANCIAL_MANAGEMENT", label: "Financial Management" },
      { key: "ACCOUNTING", label: "Accounting & Audit" },
      { key: "REVENUE_CYCLE", label: "Revenue Cycle Management" },
      { key: "HEALTH_INSURANCE", label: "Health Insurance & HMO" },
    ],
    serviceTypes: ["HOSPITAL_OPERATIONS", "TURNAROUND"],
  },
  {
    key: "PEOPLE",
    label: "People",
    specialties: [
      { key: "HUMAN_RESOURCES", label: "Human Resources" },
      { key: "TRAINING_DEVELOPMENT", label: "Training & Development" },
      { key: "CHANGE_MANAGEMENT", label: "Change Management" },
    ],
    serviceTypes: ["EMBEDDED_LEADERSHIP", "TURNAROUND", "EM_AS_SERVICE"],
  },
  {
    key: "STRATEGY",
    label: "Strategy",
    specialties: [
      { key: "STRATEGY", label: "Strategy & Planning" },
      { key: "BUSINESS_DEVELOPMENT", label: "Business Development" },
      { key: "RESEARCH_ANALYTICS", label: "Research & Analytics" },
    ],
    serviceTypes: ["HEALTH_SYSTEMS", "HOSPITAL_OPERATIONS"],
  },
  {
    key: "TECHNOLOGY",
    label: "Technology",
    specialties: [
      { key: "HEALTH_INFORMATICS", label: "Health Informatics" },
      { key: "SOFTWARE_ENGINEERING", label: "Software Engineering" },
      { key: "DATA_SCIENCE", label: "Data Science & BI" },
    ],
    serviceTypes: ["DIGITAL_HEALTH"],
  },
  {
    key: "GOVERNANCE",
    label: "Governance",
    specialties: [
      { key: "LEGAL_COMPLIANCE", label: "Legal & Compliance" },
      { key: "QUALITY_SAFETY", label: "Quality & Patient Safety" },
      { key: "RISK_MANAGEMENT", label: "Risk Management" },
      { key: "INTERNAL_AUDIT", label: "Internal Audit" },
    ],
    serviceTypes: ["CLINICAL_GOVERNANCE", "HOSPITAL_OPERATIONS"],
  },
  {
    key: "COMMUNICATIONS",
    label: "Communications",
    specialties: [
      { key: "MARKETING", label: "Marketing & Public Relations" },
      { key: "GRAPHIC_DESIGN", label: "Graphic Design & Branding" },
      { key: "CONTENT_COPYWRITING", label: "Content & Copywriting" },
    ],
    serviceTypes: ["HOSPITAL_OPERATIONS", "TURNAROUND"],
  },
  {
    key: "INFRASTRUCTURE",
    label: "Infrastructure",
    specialties: [
      { key: "ARCHITECTURE", label: "Architecture & Space Planning" },
      { key: "INTERIOR_DESIGN", label: "Interior Design" },
      { key: "PROJECT_MANAGEMENT_CAPITAL", label: "Capital Project Management" },
    ],
    serviceTypes: ["HOSPITAL_OPERATIONS", "TURNAROUND"],
  },
  {
    key: "PUBLIC_HEALTH",
    label: "Public Health",
    specialties: [
      { key: "EPIDEMIOLOGY", label: "Epidemiology" },
      { key: "HEALTH_POLICY", label: "Health Policy" },
      { key: "COMMUNITY_HEALTH", label: "Community Health" },
      { key: "MONITORING_EVALUATION", label: "Monitoring & Evaluation" },
    ],
    serviceTypes: ["HEALTH_SYSTEMS", "DIASPORA_EXPERTISE"],
  },
];

/** Flat list of all specialty keys */
export const ALL_SPECIALTY_KEYS = SPECIALTY_CATEGORIES.flatMap((c) =>
  c.specialties.map((s) => s.key)
);

/** Get the label for a specialty key */
export function getSpecialtyLabel(key: string): string {
  for (const cat of SPECIALTY_CATEGORIES) {
    const found = cat.specialties.find((s) => s.key === key);
    if (found) return found.label;
  }
  return key;
}

/** Get the category for a specialty key */
export function getSpecialtyCategory(key: string): SpecialtyCategory | null {
  return SPECIALTY_CATEGORIES.find((c) =>
    c.specialties.some((s) => s.key === key)
  ) ?? null;
}

/** Get ServiceTypes that map to a set of specialties */
export function getServiceTypesForSpecialties(specialtyKeys: string[]): string[] {
  const serviceTypes = new Set<string>();
  for (const key of specialtyKeys) {
    const cat = getSpecialtyCategory(key);
    if (cat) {
      for (const st of cat.serviceTypes) {
        serviceTypes.add(st);
      }
    }
  }
  return [...serviceTypes];
}
