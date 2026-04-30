// ─── CadreHealth: Professional Cadre Taxonomy ───
// 16 MECE cadres covering the entire Nigerian healthcare workforce
// Each maps to a regulatory body and contains sub-specialties

export interface CadreDefinition {
  value: string;
  label: string;
  shortLabel: string;
  regulatoryBody: string;
  regulatoryAbbrev: string;
  subSpecialties: string[];
}

export const CADRE_DEFINITIONS: CadreDefinition[] = [
  {
    value: "MEDICINE",
    label: "Medicine & Surgery",
    shortLabel: "Doctor",
    regulatoryBody: "Medical and Dental Council of Nigeria",
    regulatoryAbbrev: "MDCN",
    subSpecialties: [
      "General Practice / Family Medicine",
      "Internal Medicine",
      "General Surgery",
      "Orthopaedic Surgery",
      "Neurosurgery",
      "Cardiothoracic Surgery",
      "Plastic Surgery",
      "Urology",
      "Paediatric Surgery",
      "Paediatrics",
      "Obstetrics & Gynaecology",
      "Psychiatry",
      "Anaesthesia",
      "Emergency Medicine",
      "Radiology",
      "Pathology",
      "Ophthalmology",
      "ENT / Otorhinolaryngology",
      "Dermatology",
      "Public Health Medicine",
      "Haematology",
      "Cardiology",
      "Nephrology",
      "Gastroenterology",
      "Pulmonology",
      "Endocrinology",
      "Rheumatology",
      "Oncology",
      "Infectious Disease",
      "Neonatology",
      "Geriatrics",
      "Occupational Medicine",
      "Sports Medicine",
    ],
  },
  {
    value: "DENTISTRY",
    label: "Dentistry",
    shortLabel: "Dentist",
    regulatoryBody: "Medical and Dental Council of Nigeria / Dental Therapist Registration Board",
    regulatoryAbbrev: "MDCN / DTRBN",
    subSpecialties: [
      "General Dentistry",
      "Oral & Maxillofacial Surgery",
      "Orthodontics",
      "Periodontics",
      "Prosthodontics",
      "Paediatric Dentistry",
      "Oral Pathology & Medicine",
      "Restorative Dentistry",
      "Community Dentistry",
      "Dental Therapy",
      "Dental Technology",
      "Dental Hygiene",
    ],
  },
  {
    value: "NURSING",
    label: "Nursing",
    shortLabel: "Nurse",
    regulatoryBody: "Nursing and Midwifery Council of Nigeria",
    regulatoryAbbrev: "NMCN",
    subSpecialties: [
      "General Nursing",
      "Perioperative / Theatre Nursing",
      "ICU / Critical Care Nursing",
      "Paediatric Nursing",
      "Psychiatric / Mental Health Nursing",
      "Ophthalmic Nursing",
      "A&E / Emergency Nursing",
      "Nurse Anaesthetist",
      "Public Health Nursing",
      "Orthopaedic Nursing",
      "Oncology Nursing",
      "Renal / Dialysis Nursing",
      "Neonatal Nursing",
      "Community Health Nursing",
      "Occupational Health Nursing",
      "Nurse Education",
    ],
  },
  {
    value: "MIDWIFERY",
    label: "Midwifery",
    shortLabel: "Midwife",
    regulatoryBody: "Nursing and Midwifery Council of Nigeria",
    regulatoryAbbrev: "NMCN",
    subSpecialties: [
      "Hospital-Based Midwifery",
      "Community Midwifery",
      "Advanced Practice Midwifery",
    ],
  },
  {
    value: "PHARMACY",
    label: "Pharmacy",
    shortLabel: "Pharmacist",
    regulatoryBody: "Pharmacists Council of Nigeria",
    regulatoryAbbrev: "PCN",
    subSpecialties: [
      "Hospital Pharmacy",
      "Community / Retail Pharmacy",
      "Clinical Pharmacy",
      "Industrial / Manufacturing Pharmacy",
      "Regulatory Pharmacy",
      "Pharmaceutical Sales & Marketing",
      "Pharmacovigilance",
      "Pharmacy Education",
    ],
  },
  {
    value: "MEDICAL_LABORATORY_SCIENCE",
    label: "Medical Laboratory Science",
    shortLabel: "Lab Scientist",
    regulatoryBody: "Medical Laboratory Science Council of Nigeria",
    regulatoryAbbrev: "MLSCN",
    subSpecialties: [
      "Chemical Pathology / Clinical Chemistry",
      "Haematology & Blood Transfusion",
      "Medical Microbiology",
      "Histopathology & Cytology",
      "Parasitology & Entomology",
      "Immunology",
      "Virology",
      "Clinical Biology",
      "Public Health Laboratory",
    ],
  },
  {
    value: "RADIOGRAPHY_IMAGING",
    label: "Radiography & Imaging",
    shortLabel: "Radiographer",
    regulatoryBody: "Radiographers Registration Board of Nigeria",
    regulatoryAbbrev: "RRBN",
    subSpecialties: [
      "Diagnostic Radiography",
      "Therapeutic Radiography / Radiation Therapy",
      "Ultrasonography",
      "CT / MRI Imaging",
      "Nuclear Medicine",
    ],
  },
  {
    value: "REHABILITATION_THERAPY",
    label: "Rehabilitation Therapy",
    shortLabel: "Therapist",
    regulatoryBody: "Medical Rehabilitation Therapists Board",
    regulatoryAbbrev: "MRTB",
    subSpecialties: [
      "Physiotherapy",
      "Occupational Therapy",
      "Speech & Language Therapy",
      "Audiology",
      "Prosthetics & Orthotics",
    ],
  },
  {
    value: "OPTOMETRY",
    label: "Optometry",
    shortLabel: "Optometrist",
    regulatoryBody: "Optometrists and Dispensing Opticians Registration Board of Nigeria",
    regulatoryAbbrev: "ODORBN",
    subSpecialties: [
      "Clinical Optometry",
      "Dispensing Optics",
      "Public Health Optometry",
      "Paediatric Optometry",
      "Low Vision Rehabilitation",
    ],
  },
  {
    value: "COMMUNITY_HEALTH",
    label: "Community Health",
    shortLabel: "CHO/CHEW",
    regulatoryBody: "Community Health Practitioners Registration Board of Nigeria",
    regulatoryAbbrev: "CHPRBN",
    subSpecialties: [
      "Community Health Officer (CHO)",
      "Senior CHEW",
      "Community Health Extension Worker (CHEW)",
      "Junior CHEW",
    ],
  },
  {
    value: "ENVIRONMENTAL_HEALTH",
    label: "Environmental Health",
    shortLabel: "EHO",
    regulatoryBody: "Environmental Health Officers Registration Council of Nigeria",
    regulatoryAbbrev: "EHORECON",
    subSpecialties: [
      "Environmental Health Officer",
      "Sanitary Inspector",
      "Pest & Vector Control",
      "Food Safety & Hygiene",
      "Occupational & Environmental Health",
    ],
  },
  {
    value: "NUTRITION_DIETETICS",
    label: "Nutrition & Dietetics",
    shortLabel: "Dietitian",
    regulatoryBody: "Institute of Chartered Nutritionists and Dietitians of Nigeria",
    regulatoryAbbrev: "ICNDN",
    subSpecialties: [
      "Clinical Nutrition",
      "Community Nutrition",
      "Food Service Management",
      "Public Health Nutrition",
      "Sports Nutrition",
    ],
  },
  {
    value: "PSYCHOLOGY_SOCIAL_WORK",
    label: "Psychology & Social Work",
    shortLabel: "Psychologist",
    regulatoryBody: "Various",
    regulatoryAbbrev: "-",
    subSpecialties: [
      "Clinical Psychology",
      "Counselling Psychology",
      "Health Psychology",
      "Neuropsychology",
      "Medical Social Work",
      "Psychiatric Social Work",
      "Community Health Social Work",
    ],
  },
  {
    value: "PUBLIC_HEALTH",
    label: "Public Health",
    shortLabel: "Public Health",
    regulatoryBody: "Various",
    regulatoryAbbrev: "-",
    subSpecialties: [
      "Epidemiology",
      "Health Promotion & Education",
      "Health Policy & Management",
      "Monitoring & Evaluation",
      "Biostatistics",
      "Health Economics",
      "Global Health",
      "Disease Surveillance",
    ],
  },
  {
    value: "HEALTH_RECORDS",
    label: "Health Records",
    shortLabel: "Health Records",
    regulatoryBody: "Health Records Registration Board of Nigeria",
    regulatoryAbbrev: "HRRBN",
    subSpecialties: [
      "Medical Records",
      "Health Information Management",
      "Medical Coding",
      "Health Informatics",
      "Clinical Documentation",
    ],
  },
  {
    value: "HOSPITAL_MANAGEMENT",
    label: "Hospital Management & Leadership",
    shortLabel: "Hospital Mgmt",
    regulatoryBody: "Association of Hospital and Healthcare Management Nigeria",
    regulatoryAbbrev: "AHHMN",
    subSpecialties: [
      "Chief Medical Director",
      "Chief Executive Officer",
      "Chief Operating Officer",
      "Hospital Administrator",
      "Care Coordinator",
      "Quality Management",
      "Operations Manager",
      "HMO Operations",
      "Healthcare Finance",
      "Healthcare HR",
      "Healthcare Procurement",
    ],
  },
  {
    value: "HEALTH_ADMINISTRATION",
    label: "Health Administration (legacy)",
    shortLabel: "Health Admin",
    regulatoryBody: "Health Records Registration Board of Nigeria",
    regulatoryAbbrev: "HRRBN",
    subSpecialties: [
      "Hospital Management / Administration",
      "Health Information Management",
      "Medical Records",
    ],
  },
  {
    value: "BIOMEDICAL_ENGINEERING",
    label: "Biomedical Engineering",
    shortLabel: "Biomed Engineer",
    regulatoryBody: "Council for the Regulation of Engineering in Nigeria",
    regulatoryAbbrev: "COREN",
    subSpecialties: [
      "Clinical Engineering",
      "Medical Equipment Maintenance",
      "Medical Device Management",
      "Healthcare Facility Engineering",
    ],
  },
];

// ─── Lookup helpers ───

export function getCadreByValue(value: string): CadreDefinition | undefined {
  return CADRE_DEFINITIONS.find((c) => c.value === value);
}

export function getCadreLabel(value: string): string {
  return getCadreByValue(value)?.label ?? value;
}

export function getCadreShortLabel(value: string): string {
  return getCadreByValue(value)?.shortLabel ?? value;
}

export function getSubSpecialties(cadreValue: string): string[] {
  return getCadreByValue(cadreValue)?.subSpecialties ?? [];
}

export function getRegulatoryBody(cadreValue: string): string {
  return getCadreByValue(cadreValue)?.regulatoryBody ?? "Unknown";
}

// ─── For dropdowns ───

// Excludes deprecated/legacy cadres from new signup forms.
const DEPRECATED_CADRES = new Set(["HEALTH_ADMINISTRATION"]);

export const CADRE_OPTIONS = CADRE_DEFINITIONS.filter(
  (c) => !DEPRECATED_CADRES.has(c.value)
).map((c) => ({
  value: c.value,
  label: c.label,
}));

// ─── Nigerian states for location dropdowns ───

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];
