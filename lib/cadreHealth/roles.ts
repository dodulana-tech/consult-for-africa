// ─── Healthcare roles by cadre ───
// Used in the salary survey, work history, and mandate forms.
//
// The `role` field is a single string that the salary map groups on, so this
// catalogue has to be MECE: for any real person there should be exactly one
// correct entry, and every real person should find one.
//
// That means each cadre's own list holds ONE dimension, professional grade,
// ordered junior to senior. Three things that used to live here have been
// pulled out because they are separate dimensions and forced people to choose
// between two labels that were both true of them:
//
//   employment mode  (locum vs permanent)  -> CadreProfessional.openTo,
//                                             locumDailyRate, and the survey's
//                                             own locumIncome field
//   setting          (community vs hospital) -> facilityType
//   specialisation   (ICU, sonography, MRI)  -> subSpecialty
//
// Leadership, executive and advisory roles are genuinely cross-cutting: a
// nurse, a pharmacist or a lab scientist can run a hospital or move into
// consulting. They are appended to every cadre below rather than duplicated by
// hand, so a new cadre picks them up automatically.

const GRADE_LADDER_BY_CADRE: Record<string, string[]> = {
  MEDICINE: [
    "House Officer",
    "Medical Officer",
    "Senior Medical Officer",
    "Registrar",
    "Senior Registrar",
    "Consultant",
    "Senior Consultant",
    "Chief Consultant",
  ],
  DENTISTRY: [
    "Dental House Officer",
    "Dental Officer",
    "Senior Dental Officer",
    "Dental Registrar",
    "Senior Dental Registrar",
    "Dental Consultant",
    // Distinct professions within the cadre, not grades on the ladder above.
    "Dental Therapist",
    "Dental Technologist",
    "Dental Hygienist",
  ],
  NURSING: [
    "Nursing Officer II",
    "Nursing Officer I",
    "Senior Nursing Officer",
    "Principal Nursing Officer",
    "Assistant Chief Nursing Officer",
    "Chief Nursing Officer",
    "Deputy Director of Nursing",
    "Director of Nursing",
    // Private sector titles that do not map onto the public scheme of service.
    "Nurse Manager",
    "Matron",
  ],
  MIDWIFERY: [
    "Midwife II",
    "Midwife I",
    "Senior Midwife",
    "Principal Midwife",
    "Chief Midwife",
    "Deputy Director of Midwifery",
    "Director of Midwifery",
  ],
  PHARMACY: [
    "Intern Pharmacist",
    "Pharmacist II",
    "Pharmacist I",
    "Senior Pharmacist",
    "Principal Pharmacist",
    "Assistant Chief Pharmacist",
    "Chief Pharmacist",
    "Director of Pharmacy",
  ],
  MEDICAL_LABORATORY_SCIENCE: [
    "Intern Medical Laboratory Scientist",
    "Lab Scientist II",
    "Lab Scientist I",
    "Senior Lab Scientist",
    "Principal Lab Scientist",
    "Chief Lab Scientist",
    "Director of Lab Services",
    // A separate profession with its own registration, not a junior scientist.
    "Lab Technician",
    "Senior Lab Technician",
  ],
  RADIOGRAPHY_IMAGING: [
    "Intern Radiographer",
    "Radiographer II",
    "Radiographer I",
    "Senior Radiographer",
    "Principal Radiographer",
    "Chief Radiographer",
    "Director of Radiography",
  ],
  REHABILITATION_THERAPY: [
    // Four distinct professions share this cadre. Each gets its own entry so
    // that a senior occupational therapist is not forced onto the physio ladder.
    "Physiotherapist II",
    "Physiotherapist I",
    "Senior Physiotherapist",
    "Principal Physiotherapist",
    "Chief Physiotherapist",
    "Occupational Therapist",
    "Senior Occupational Therapist",
    "Speech and Language Therapist",
    "Senior Speech and Language Therapist",
    "Audiologist",
    "Senior Audiologist",
  ],
  OPTOMETRY: [
    "Intern Optometrist",
    "Optometrist II",
    "Optometrist I",
    "Senior Optometrist",
    "Principal Optometrist",
    "Chief Optometrist",
    "Dispensing Optician",
  ],
  COMMUNITY_HEALTH: [
    "Junior CHEW",
    "Community Health Extension Worker (CHEW)",
    "Senior CHEW",
    "Community Health Officer (CHO)",
    "Principal CHO",
  ],
  ENVIRONMENTAL_HEALTH: [
    "Environmental Health Officer II",
    "Environmental Health Officer I",
    "Senior Environmental Health Officer",
    "Principal Environmental Health Officer",
    "Chief Environmental Health Officer",
  ],
  NUTRITION_DIETETICS: [
    "Dietitian II",
    "Dietitian I",
    "Senior Dietitian",
    "Principal Dietitian",
    "Chief Dietitian",
    // A separate profession, commonly non-clinical.
    "Nutritionist",
    "Senior Nutritionist",
  ],
  PSYCHOLOGY_SOCIAL_WORK: [
    // Two distinct professions share this cadre.
    "Clinical Psychologist",
    "Counselling Psychologist",
    "Senior Psychologist",
    "Principal Psychologist",
    "Chief Psychologist",
    "Medical Social Worker",
    "Senior Medical Social Worker",
    "Principal Medical Social Worker",
    "Chief Medical Social Worker",
  ],
  PUBLIC_HEALTH: [
    "Public Health Officer",
    "Public Health Specialist",
    "Epidemiologist",
    "Health Educator",
    "M&E Officer",
    "Biostatistician",
    "Health Economist",
    "Programme Manager",
    "Health Policy Adviser",
    "Director of Public Health",
  ],
  HEALTH_RECORDS: [
    "Health Records Officer II",
    "Health Records Officer I",
    "Senior Health Records Officer",
    "Principal Health Records Officer",
    "Chief Health Records Officer",
    "Health Information Manager",
    "Medical Coder",
    "Clinical Documentation Specialist",
    "Health Informatics Officer",
  ],
  HOSPITAL_MANAGEMENT: [
    "Hospital Administrator",
    "Care Coordinator",
    "Operations Manager",
    "Quality Manager",
    "HMO Officer",
    "Healthcare Finance Manager",
    "Healthcare HR Manager",
    "Healthcare Procurement Manager",
    "Director of Administration",
    // The advisory ladder proper. The two client-facing titles in
    // ADVISORY_ROLES below are available to every cadre; these are not.
    "Healthcare Analyst",
    "Engagement Manager (Healthcare Advisory)",
    "Principal / Partner (Healthcare Advisory)",
  ],
  BIOMEDICAL_ENGINEERING: [
    "Biomedical Engineer II",
    "Biomedical Engineer I",
    "Senior Biomedical Engineer",
    "Chief Biomedical Engineer",
    "Clinical Engineer",
    "Medical Equipment Technician",
  ],
};

// Any cadre can reach these. A chief nursing officer who becomes a hospital
// CEO is still a nurse by cadre.
const EXECUTIVE_ROLES = [
  "Head of Department",
  "Chief Executive Officer",
  "Chief Operating Officer",
];

// In Nigeria the medical directorship is held by a registered doctor or
// dentist, so these are not offered to every cadre.
const MEDICAL_EXECUTIVE_ROLES = ["Medical Director", "Chief Medical Director"];
const MEDICAL_CADRES = new Set(["MEDICINE", "DENTISTRY"]);

// Any cadre can move into advisory work.
const ADVISORY_ROLES = [
  "Healthcare Management Consultant",
  "Healthcare Strategy Consultant",
];

function unique(roles: string[]): string[] {
  return Array.from(new Set(roles));
}

export const ROLES_BY_CADRE: Record<string, string[]> = Object.fromEntries(
  Object.entries(GRADE_LADDER_BY_CADRE).map(([cadre, ladder]) => [
    cadre,
    unique([
      ...ladder,
      ...EXECUTIVE_ROLES,
      ...(MEDICAL_CADRES.has(cadre) ? MEDICAL_EXECUTIVE_ROLES : []),
      ...ADVISORY_ROLES,
    ]),
  ])
);

// Deprecated cadre, kept so legacy records still render a sensible list.
// Its holders were split between hospital management and health records, and
// it historically carried medical directors, so it keeps those two titles.
ROLES_BY_CADRE.HEALTH_ADMINISTRATION = unique([
  ...ROLES_BY_CADRE.HOSPITAL_MANAGEMENT,
  ...ROLES_BY_CADRE.HEALTH_RECORDS,
  ...MEDICAL_EXECUTIVE_ROLES,
]);

// Flat list of all roles (for general search)
export const ALL_ROLES = Array.from(
  new Set(Object.values(ROLES_BY_CADRE).flat())
).sort();

export function getRolesForCadre(cadre: string): string[] {
  return ROLES_BY_CADRE[cadre] || ALL_ROLES;
}
