/* ─── Migration Pathway Data ──────────────────────────────────────────────── */
/* Hardcoded data for SEO migration pathway pages.                            */
/* Exchange rates (2026 est): GBP ~N1,800 | USD ~N1,500 | CAD ~N1,100        */
/*   AUD ~N1,000 | EUR ~N1,600 | SAR ~N400 | AED ~N410 | QAR ~N410          */
/* ──────────────────────────────────────────────────────────────────────────── */

export interface PathwayStep {
  step: number;
  title: string;
  description: string;
  estimatedTime: string;
  estimatedCost?: string;
}

export interface CostItem {
  item: string;
  costForeign: string;
  costNaira: string;
  notes?: string;
}

export interface ExamInfo {
  name: string;
  description: string;
  cost: string;
  passingScore?: string;
  validFor?: string;
  canTakeInNigeria: boolean;
}

export interface MigrationPathway {
  country: string;
  slug: string;
  flag: string;
  overview: string;
  processingTime: string;
  estimatedCostNaira: string;
  primaryRegulator: string;
  primaryExam: string;

  doctorPathway: PathwayStep[];
  nursePathway: PathwayStep[];
  pharmacistPathway?: PathwayStep[];

  costs: CostItem[];
  exams: ExamInfo[];
  requirements: string[];

  visaType: string;
  visaInfo: string;

  nigerianTips: string[];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  UNITED KINGDOM                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

const uk: MigrationPathway = {
  country: "United Kingdom",
  slug: "uk",
  flag: "🇬🇧",
  overview:
    "The UK remains the most popular destination for Nigerian healthcare professionals. The Health and Care Worker visa offers reduced fees, and many NHS trusts now cover visa and IHS costs. Demand for doctors and nurses is at an all-time high.",
  processingTime: "6 to 18 months",
  estimatedCostNaira: "N8M to N18M",
  primaryRegulator: "General Medical Council (GMC) / Nursing and Midwifery Council (NMC)",
  primaryExam: "PLAB / NMC OSCE",

  doctorPathway: [
    {
      step: 1,
      title: "English language test (IELTS Academic or OET)",
      description:
        "Score at least 7.0 overall on IELTS Academic (minimum 6.5 per band) or B grade on OET. Results valid for 2 years. Book early as test centres in Lagos and Abuja fill quickly.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N280,000 to N350,000",
    },
    {
      step: 2,
      title: "PLAB 1 (Professional and Linguistic Assessments Board Part 1)",
      description:
        "Multiple-choice exam covering clinical knowledge. Can be taken in Lagos, Abuja, or other approved centres worldwide. 180 single-best-answer questions in 3 hours.",
      estimatedTime: "2 to 4 months preparation",
      estimatedCost: "N600,000 (GBP 334)",
    },
    {
      step: 3,
      title: "PLAB 2 (Objective Structured Clinical Examination)",
      description:
        "Clinical skills exam taken only in Manchester, UK. 16 OSCE stations testing communication and clinical skills. You will need a UK visitor visa to sit the exam.",
      estimatedTime: "3 to 6 months (including visa and travel)",
      estimatedCost: "N2,200,000 (GBP 1,222 exam fee + travel)",
    },
    {
      step: 4,
      title: "GMC Registration",
      description:
        "Apply for GMC registration with licence to practise. Submit all qualifications, certificates, and references. The GMC will verify your primary medical qualification.",
      estimatedTime: "4 to 12 weeks",
      estimatedCost: "N720,000 (GBP 399 registration)",
    },
    {
      step: 5,
      title: "Job search and offer",
      description:
        "Apply for NHS Foundation Trust or Health Education England posts. Many trusts actively recruit Nigerian doctors. Junior doctor or clinical fellow positions are the most common entry points.",
      estimatedTime: "1 to 6 months",
    },
    {
      step: 6,
      title: "Health and Care Worker visa",
      description:
        "Employer sponsors your visa. Reduced application fee and often the employer covers the Immigration Health Surcharge (IHS). Processing takes 3 to 8 weeks.",
      estimatedTime: "3 to 8 weeks",
      estimatedCost: "N3,600,000 (visa + IHS if self-funded)",
    },
  ],

  nursePathway: [
    {
      step: 1,
      title: "English language test (IELTS Academic or OET)",
      description:
        "Score at least 7.0 overall on IELTS Academic (minimum 6.5 in writing, 7.0 in other bands) or B grade on OET. Results valid for 2 years.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N280,000 to N350,000",
    },
    {
      step: 2,
      title: "NMC Computer Based Test (CBT)",
      description:
        "Multiple-choice test on nursing competencies. Can be taken in Nigeria at Pearson VUE centres. 120 questions covering adult, child, mental health, and learning disability nursing.",
      estimatedTime: "1 to 2 months preparation",
      estimatedCost: "N150,000 (GBP 83)",
    },
    {
      step: 3,
      title: "NMC OSCE (Objective Structured Clinical Examination)",
      description:
        "Practical clinical skills exam taken in the UK. Tests clinical procedures, communication, and patient safety across multiple stations.",
      estimatedTime: "2 to 4 months (including travel)",
      estimatedCost: "N1,350,000 (GBP 749 exam fee)",
    },
    {
      step: 4,
      title: "NMC Registration",
      description:
        "Apply for NMC PIN (registration number). Submit all qualifications and verified documents. NMC will confirm your eligibility to practise in the UK.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N216,000 (GBP 120 registration)",
    },
    {
      step: 5,
      title: "Job search and offer",
      description:
        "Many NHS trusts and private care providers actively recruit Nigerian nurses. Recruitment agencies often handle the entire process including visa and flights.",
      estimatedTime: "1 to 3 months",
    },
    {
      step: 6,
      title: "Health and Care Worker visa",
      description:
        "Employer sponsors your visa. Most nursing employers cover visa fees, IHS, and flights. Processing takes 3 to 8 weeks.",
      estimatedTime: "3 to 8 weeks",
      estimatedCost: "Often covered by employer",
    },
  ],

  pharmacistPathway: [
    {
      step: 1,
      title: "English language test (IELTS Academic or OET)",
      description:
        "Score at least 7.0 overall on IELTS Academic (minimum 7.0 per band) or B grade on OET. GPhC has strict language requirements.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N280,000 to N350,000",
    },
    {
      step: 2,
      title: "GPhC Overseas Pharmacist Assessment Programme (OSPAP)",
      description:
        "One-year postgraduate diploma at a UK university. Covers UK pharmacy practice, law, and clinical skills. You will need a student visa for this year.",
      estimatedTime: "12 months",
      estimatedCost: "N18,000,000+ (tuition + living costs)",
    },
    {
      step: 3,
      title: "GPhC Registration Assessment",
      description:
        "Sit the GPhC registration exam after completing OSPAP. Two papers testing applied pharmacy practice and clinical knowledge.",
      estimatedTime: "3 to 6 months",
      estimatedCost: "N540,000 (GBP 300)",
    },
    {
      step: 4,
      title: "Pre-registration training and GPhC registration",
      description:
        "Complete 52 weeks of supervised pre-registration training. After passing, apply for full GPhC registration.",
      estimatedTime: "12 months",
    },
    {
      step: 5,
      title: "Health and Care Worker visa",
      description:
        "Pharmacists qualify for the Health and Care Worker visa once you have a job offer from a licensed sponsor.",
      estimatedTime: "3 to 8 weeks",
      estimatedCost: "N3,600,000 (visa + IHS if self-funded)",
    },
  ],

  costs: [
    { item: "IELTS Academic", costForeign: "GBP 195", costNaira: "N280,000", notes: "Valid for 2 years" },
    { item: "PLAB 1 Exam", costForeign: "GBP 334", costNaira: "N600,000", notes: "Can take in Nigeria" },
    { item: "PLAB 2 Exam", costForeign: "GBP 1,222", costNaira: "N2,200,000", notes: "Manchester only" },
    { item: "NMC CBT (Nurses)", costForeign: "GBP 83", costNaira: "N150,000", notes: "Can take in Nigeria" },
    { item: "NMC OSCE (Nurses)", costForeign: "GBP 749", costNaira: "N1,350,000", notes: "UK only" },
    { item: "GMC Registration", costForeign: "GBP 399", costNaira: "N720,000" },
    { item: "NMC Registration", costForeign: "GBP 120", costNaira: "N216,000" },
    { item: "Visa Application (Health and Care Worker)", costForeign: "GBP 284", costNaira: "N510,000", notes: "Reduced rate" },
    { item: "Immigration Health Surcharge (IHS) - 3 years", costForeign: "GBP 3,120", costNaira: "N5,616,000", notes: "Often covered by employer" },
    { item: "Flights (Lagos to London)", costForeign: "GBP 500+", costNaira: "N900,000+" },
    { item: "TB Test and Medical", costForeign: "GBP 100", costNaira: "N180,000" },
  ],

  exams: [
    {
      name: "PLAB 1",
      description:
        "180 single-best-answer questions testing clinical knowledge. Covers medicine, surgery, paediatrics, obstetrics, psychiatry, and more. Similar in format to MDCN qualifying exams.",
      cost: "GBP 334 (N600,000)",
      passingScore: "Variable (typically 60 to 65%)",
      validFor: "3 years",
      canTakeInNigeria: true,
    },
    {
      name: "PLAB 2",
      description:
        "OSCE with 16 stations testing clinical and communication skills. Each station is 8 minutes. You interact with simulated patients and examiners in a clinical setting.",
      cost: "GBP 1,222 (N2,200,000)",
      passingScore: "Variable (station-based marking)",
      validFor: "3 years from PLAB 1 pass",
      canTakeInNigeria: false,
    },
    {
      name: "IELTS Academic / OET",
      description:
        "English language proficiency test. IELTS has four components: Listening, Reading, Writing, Speaking. OET is healthcare-specific and often easier for clinicians.",
      cost: "GBP 195 (N280,000) for IELTS",
      passingScore: "IELTS 7.0 overall / OET B grade",
      validFor: "2 years",
      canTakeInNigeria: true,
    },
    {
      name: "NMC CBT (Nurses)",
      description:
        "Computer-based test of nursing competencies. 120 questions covering clinical decision-making, patient safety, and UK nursing standards.",
      cost: "GBP 83 (N150,000)",
      passingScore: "Variable pass mark",
      validFor: "2 years",
      canTakeInNigeria: true,
    },
    {
      name: "NMC OSCE (Nurses)",
      description:
        "Practical exam with 6 stations testing clinical skills including APIE (Assessment, Planning, Implementation, Evaluation), medicine management, and communication.",
      cost: "GBP 749 (N1,350,000)",
      passingScore: "Pass all 6 stations",
      validFor: "Until NMC registration",
      canTakeInNigeria: false,
    },
  ],

  requirements: [
    "Valid medical or nursing degree from a recognised Nigerian institution",
    "Full registration with MDCN or NMCN",
    "Certificate of Good Standing from your regulatory body",
    "Minimum 12 months post-qualification experience (recommended)",
    "IELTS Academic 7.0+ or OET B grade",
    "Criminal record check (Police Character Certificate from Nigeria Police)",
    "TB test result (from approved clinic)",
    "Valid international passport with at least 6 months validity",
    "Proof of funds for initial settlement (if employer does not sponsor)",
  ],

  visaType: "Health and Care Worker visa",
  visaInfo:
    "The Health and Care Worker visa is a subcategory of the Skilled Worker visa, specifically for healthcare professionals. It comes with reduced application fees (no Immigration Skills Charge), and many NHS employers cover the IHS. You need a Certificate of Sponsorship from a licensed employer. Initial visa is granted for up to 5 years, and you can apply for Indefinite Leave to Remain (ILR) after 5 years.",

  nigerianTips: [
    "PLAB 1 test centre seats in Lagos and Abuja fill up fast. Book 2 to 3 months in advance.",
    "Many NHS trusts now run recruitment drives in Nigeria. Check NHS Jobs, Trac Jobs, and recruitment agencies like MedPro, Health Recruit Network, and M&E Global.",
    "Join PLAB study groups on Telegram and WhatsApp. Pastest and PassMedicine are the most-used question banks.",
    "For PLAB 2, book accommodation near the Manchester test centre early. Many Nigerian doctors share flats during preparation.",
    "The NMC has approved several agencies that recruit Nigerian nurses directly and cover all costs. Research carefully before signing contracts.",
    "Certificate of Good Standing can take 4 to 8 weeks from MDCN or NMCN. Start this process early.",
    "If your employer covers IHS, that saves you over N5M. Ask about this before accepting any offer.",
    "UK bank accounts can be opened with your BRP. Monzo, Starling, and HSBC are popular with Nigerian healthcare workers.",
    "The PLAB 2 pass rate for Nigerian doctors has improved significantly. Focused OSCE preparation courses in Lagos and online help greatly.",
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  UNITED STATES                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

const us: MigrationPathway = {
  country: "United States",
  slug: "us",
  flag: "🇺🇸",
  overview:
    "The US offers the highest earning potential for healthcare professionals but has the most competitive and expensive pathway. Doctors must complete residency training, while nurses follow the NCLEX route. The process typically takes 2 to 5 years from start to clinical practice.",
  processingTime: "2 to 5 years",
  estimatedCostNaira: "N12M to N30M",
  primaryRegulator: "ECFMG / State Nursing Boards",
  primaryExam: "USMLE / NCLEX",

  doctorPathway: [
    {
      step: 1,
      title: "USMLE Step 1",
      description:
        "Foundational science exam covering anatomy, physiology, biochemistry, pharmacology, pathology, and behavioural sciences. Now pass/fail (no numeric score). Can be taken at Prometric centres in Lagos.",
      estimatedTime: "3 to 12 months preparation",
      estimatedCost: "N1,500,000 (USD 1,000)",
    },
    {
      step: 2,
      title: "USMLE Step 2 CK (Clinical Knowledge)",
      description:
        "Clinical knowledge exam covering internal medicine, surgery, paediatrics, obstetrics, psychiatry, and preventive medicine. This score matters heavily for residency matching.",
      estimatedTime: "3 to 6 months preparation",
      estimatedCost: "N1,500,000 (USD 1,000)",
    },
    {
      step: 3,
      title: "ECFMG Certification",
      description:
        "Educational Commission for Foreign Medical Graduates certifies your qualifications. Requires passing USMLE Steps 1 and 2 CK, plus verification of your medical degree through EPIC (Electronic Portfolio of International Credentials).",
      estimatedTime: "2 to 6 months",
      estimatedCost: "N150,000 (verification fees)",
    },
    {
      step: 4,
      title: "USMLE Step 2 CS / Pathways (OET accepted)",
      description:
        "The former Step 2 CS has been replaced by Pathways. Most Nigerian graduates use Pathway 1, which requires passing the OET. This demonstrates English proficiency and clinical communication.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N750,000 (OET + pathway application)",
    },
    {
      step: 5,
      title: "Residency applications (Match)",
      description:
        "Apply through ERAS (Electronic Residency Application Service) and match through NRMP. International Medical Graduates (IMGs) matched into 13,079 positions in 2025. US clinical experience (observerships/externships) greatly improves your chances.",
      estimatedTime: "6 to 18 months (application cycle)",
      estimatedCost: "N4,500,000+ (applications, interviews, travel)",
    },
    {
      step: 6,
      title: "J-1 or H-1B visa",
      description:
        "Most residency programs sponsor J-1 visas. H-1B is available for some programs. J-1 requires a 2-year home country requirement waiver (or return to Nigeria) after residency.",
      estimatedTime: "2 to 4 months",
      estimatedCost: "N600,000 (visa fees + SEVIS)",
    },
  ],

  nursePathway: [
    {
      step: 1,
      title: "CGFNS (Commission on Graduates of Foreign Nursing Schools) Evaluation",
      description:
        "Credential evaluation verifying your nursing education meets US standards. Includes transcript review and qualification assessment.",
      estimatedTime: "2 to 4 months",
      estimatedCost: "N525,000 (USD 350)",
    },
    {
      step: 2,
      title: "English language test (IELTS or TOEFL iBT)",
      description:
        "Most states require IELTS Academic 6.5+ or TOEFL iBT 83+. Some states accept the CGFNS Qualifying Exam as proof of English proficiency.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N280,000 to N400,000",
    },
    {
      step: 3,
      title: "NCLEX-RN (National Council Licensure Examination)",
      description:
        "Computer-adaptive test for registered nurses. Covers patient safety, clinical judgement, and nursing practice. Can be taken at Pearson VUE centres (limited availability in Nigeria; many candidates travel to London or Dubai).",
      estimatedTime: "2 to 4 months preparation",
      estimatedCost: "N300,000 (USD 200) + state application fees",
    },
    {
      step: 4,
      title: "VisaScreen Certificate",
      description:
        "Required for all healthcare workers seeking US employment visas. Verifies education, English proficiency, and licence. Issued by CGFNS.",
      estimatedTime: "2 to 4 months",
      estimatedCost: "N840,000 (USD 560)",
    },
    {
      step: 5,
      title: "State licensing",
      description:
        "Apply for RN licence in your target state. Requirements vary by state. Some states require additional documentation or supervised hours.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N150,000 to N375,000",
    },
    {
      step: 6,
      title: "EB-3 Immigrant Visa",
      description:
        "Most Nigerian nurses use the EB-3 skilled worker immigrant visa category. Your employer files a petition. Current wait times for Nigerian nationals can be significant due to visa backlogs.",
      estimatedTime: "12 to 36 months (visa backlog)",
      estimatedCost: "Employer-sponsored (consular processing fees ~N250,000)",
    },
  ],

  costs: [
    { item: "USMLE Step 1", costForeign: "USD 1,000", costNaira: "N1,500,000" },
    { item: "USMLE Step 2 CK", costForeign: "USD 1,000", costNaira: "N1,500,000" },
    { item: "ECFMG Certification (EPIC)", costForeign: "USD 100+", costNaira: "N150,000+" },
    { item: "OET (for Pathway)", costForeign: "USD 400", costNaira: "N600,000" },
    { item: "ERAS Application (20 programs)", costForeign: "USD 1,500+", costNaira: "N2,250,000+" },
    { item: "Interview travel", costForeign: "USD 2,000+", costNaira: "N3,000,000+" },
    { item: "NCLEX-RN (Nurses)", costForeign: "USD 200", costNaira: "N300,000" },
    { item: "CGFNS / VisaScreen (Nurses)", costForeign: "USD 910+", costNaira: "N1,365,000+" },
    { item: "J-1 Visa + SEVIS", costForeign: "USD 510", costNaira: "N765,000" },
    { item: "Flights (Lagos to US)", costForeign: "USD 800+", costNaira: "N1,200,000+" },
  ],

  exams: [
    {
      name: "USMLE Step 1",
      description:
        "Tests foundational biomedical science knowledge. 280 questions across 7 blocks of 40 questions each. Now scored pass/fail. Most Nigerian medical graduates require 3 to 12 months of dedicated preparation.",
      cost: "USD 1,000 (N1,500,000)",
      passingScore: "Pass/Fail",
      validFor: "7 years",
      canTakeInNigeria: true,
    },
    {
      name: "USMLE Step 2 CK",
      description:
        "Tests clinical knowledge across all major disciplines. 318 questions across 8 blocks. Numeric score (important for residency matching). Aim for 240+ to be competitive.",
      cost: "USD 1,000 (N1,500,000)",
      passingScore: "Pass: ~210 / Competitive: 240+",
      validFor: "7 years",
      canTakeInNigeria: true,
    },
    {
      name: "NCLEX-RN",
      description:
        "Computer-adaptive nursing licensure exam. Minimum 75 questions, maximum 145. Covers safe care, health promotion, psychosocial integrity, and physiological integrity.",
      cost: "USD 200 (N300,000)",
      passingScore: "Pass/Fail (adaptive)",
      validFor: "Until licensed",
      canTakeInNigeria: false,
    },
  ],

  requirements: [
    "Medical degree (MBBS/MBChB) from a school listed in the World Directory of Medical Schools",
    "Full MDCN registration (for doctors)",
    "NMCN registration (for nurses)",
    "Valid ECFMG certification (for doctors)",
    "US clinical experience highly recommended (observerships, externships)",
    "Strong USMLE Step 2 CK score (240+ for competitive specialties)",
    "Letters of recommendation from US physicians (preferred)",
    "Personal statement and CV tailored for US residency",
    "Valid passport with US visa eligibility",
  ],

  visaType: "J-1 Exchange Visitor / H-1B / EB-3",
  visaInfo:
    "Most residency programs sponsor J-1 visas. The J-1 comes with a 2-year home residency requirement, which can be waived by working in underserved areas. H-1B is a dual-intent visa allowing permanent residency applications. For nurses, the EB-3 category is most common. Green card processing through EB-2/EB-3 can take several years depending on country backlog. Nigeria is not currently subject to major backlogs but processing times fluctuate.",

  nigerianTips: [
    "The US residency match is extremely competitive for International Medical Graduates (IMGs). Only about 60% of IMG applicants match each year.",
    "US clinical experience (USCE) through observerships and externships significantly improves your match odds. Plan to spend 2 to 6 months in the US for this.",
    "Consider less competitive specialties like Internal Medicine, Family Medicine, Paediatrics, and Psychiatry for better match rates.",
    "UWorld is the gold standard question bank for USMLE preparation. First Aid for Step 1 is essential.",
    "Many Nigerian doctors match after 2 to 3 attempts at the match cycle. Persistence and building connections matter greatly.",
    "Some Caribbean medical schools offer transfer pathways, but research thoroughly before considering this route.",
    "Join Nigerian physician communities in the US like ANPA (Association of Nigerian Physicians in the Americas) for mentorship.",
    "For nurses, some US states are easier for international graduates. Texas, New York, and Florida are popular starting points.",
    "The EB-3 visa route for nurses can have long wait times. Start the process as early as possible.",
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  CANADA                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const canada: MigrationPathway = {
  country: "Canada",
  slug: "canada",
  flag: "🇨🇦",
  overview:
    "Canada offers excellent quality of life and a welcoming immigration system through Express Entry. Doctors face the challenge of securing a residency position through CaRMS, while nurses have a more direct pathway through NNAS assessment and NCLEX-RN.",
  processingTime: "12 to 36 months",
  estimatedCostNaira: "N6M to N20M",
  primaryRegulator: "Medical Council of Canada (MCC) / Provincial Nursing Regulators",
  primaryExam: "NAC OSCE / NCLEX-RN",

  doctorPathway: [
    {
      step: 1,
      title: "English language test (IELTS Academic or CELPIP)",
      description:
        "IELTS Academic with minimum 7.0 overall or CELPIP General with CLB 7+. Required for both medical licensing and immigration (Express Entry).",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N280,000 to N350,000",
    },
    {
      step: 2,
      title: "Medical Council of Canada Qualifying Examination Part 1 (MCCQE1)",
      description:
        "Computer-based exam testing medical knowledge and clinical decision-making. Can be taken at Prometric centres worldwide. Equivalent to USMLE Step 2 CK in breadth.",
      estimatedTime: "3 to 6 months preparation",
      estimatedCost: "N1,760,000 (CAD 1,600)",
    },
    {
      step: 3,
      title: "National Assessment Collaboration (NAC) Examination",
      description:
        "OSCE-style exam with 12 clinical stations. Tests ability to manage clinical encounters in a Canadian context. Can only be taken in Canada.",
      estimatedTime: "3 to 6 months",
      estimatedCost: "N2,750,000 (CAD 2,500 + travel)",
    },
    {
      step: 4,
      title: "CaRMS Match (Canadian Resident Matching Service)",
      description:
        "Apply for residency positions through CaRMS. IMGs compete in the second iteration of the match. Only about 30 to 40% of IMG applicants match. Canadian clinical experience is very beneficial.",
      estimatedTime: "6 to 18 months (match cycle)",
      estimatedCost: "N1,100,000+ (applications and travel)",
    },
    {
      step: 5,
      title: "MCCQE Part 2 and provincial licensing",
      description:
        "Complete MCCQE Part 2 during residency. After residency completion, apply for independent practice licence from your provincial college of physicians.",
      estimatedTime: "During residency",
    },
    {
      step: 6,
      title: "Work permit / Permanent residency",
      description:
        "Most residents enter on a work permit. After residency, physicians can apply for permanent residency through Express Entry, Provincial Nominee Programs (PNP), or employer-sponsored routes.",
      estimatedTime: "3 to 12 months",
    },
  ],

  nursePathway: [
    {
      step: 1,
      title: "NNAS (National Nursing Assessment Service) evaluation",
      description:
        "Submit your nursing credentials for assessment against Canadian standards. Includes education, registration, and practice hours review.",
      estimatedTime: "3 to 6 months",
      estimatedCost: "N715,000 (CAD 650)",
    },
    {
      step: 2,
      title: "English language test (IELTS Academic or CELBAN)",
      description:
        "IELTS Academic with 6.5+ overall or CELBAN (Canadian English Language Benchmark Assessment for Nurses). Required for both licensing and immigration.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N280,000 to N350,000",
    },
    {
      step: 3,
      title: "Provincial regulatory body assessment",
      description:
        "Your province's regulatory body reviews the NNAS report and determines if you need bridging education or can proceed to the licensing exam.",
      estimatedTime: "1 to 3 months",
    },
    {
      step: 4,
      title: "NCLEX-RN (National Council Licensure Examination)",
      description:
        "Same exam used in the US and Canada. Computer-adaptive test taken at Pearson VUE centres. Can be taken in some Canadian and international locations.",
      estimatedTime: "2 to 4 months preparation",
      estimatedCost: "N550,000 (CAD 500 including application)",
    },
    {
      step: 5,
      title: "Provincial RN registration",
      description:
        "Apply for registration with your provincial nursing regulatory body. Requirements vary slightly by province.",
      estimatedTime: "1 to 2 months",
      estimatedCost: "N330,000 to N550,000",
    },
    {
      step: 6,
      title: "Express Entry or PNP immigration",
      description:
        "Apply for permanent residency through Express Entry (Federal Skilled Worker) or a Provincial Nominee Program. Nurses score well under Express Entry due to healthcare demand.",
      estimatedTime: "3 to 12 months",
    },
  ],

  costs: [
    { item: "IELTS Academic", costForeign: "CAD 320", costNaira: "N352,000", notes: "Valid for 2 years" },
    { item: "MCCQE Part 1", costForeign: "CAD 1,600", costNaira: "N1,760,000" },
    { item: "NAC OSCE", costForeign: "CAD 2,500", costNaira: "N2,750,000", notes: "Canada only" },
    { item: "CaRMS Application", costForeign: "CAD 500+", costNaira: "N550,000+" },
    { item: "NNAS Assessment (Nurses)", costForeign: "CAD 650", costNaira: "N715,000" },
    { item: "NCLEX-RN (Nurses)", costForeign: "CAD 500", costNaira: "N550,000" },
    { item: "Express Entry processing", costForeign: "CAD 1,365", costNaira: "N1,500,000" },
    { item: "Flights (Lagos to Toronto)", costForeign: "CAD 1,200+", costNaira: "N1,320,000+" },
    { item: "Settlement funds (required)", costForeign: "CAD 13,757", costNaira: "N15,130,000", notes: "Single applicant minimum" },
  ],

  exams: [
    {
      name: "MCCQE Part 1",
      description:
        "Computer-based exam with two components: multiple-choice questions and clinical decision-making cases. Tests medical knowledge in a Canadian healthcare context.",
      cost: "CAD 1,600 (N1,760,000)",
      passingScore: "Variable pass mark",
      validFor: "5 years",
      canTakeInNigeria: true,
    },
    {
      name: "NAC OSCE",
      description:
        "12 clinical stations testing history-taking, physical examination, communication, and clinical reasoning in a Canadian healthcare setting.",
      cost: "CAD 2,500 (N2,750,000)",
      passingScore: "Variable pass mark",
      validFor: "3 years",
      canTakeInNigeria: false,
    },
    {
      name: "NCLEX-RN (Nurses)",
      description:
        "Computer-adaptive nursing exam. Same exam used in the US. Tests clinical judgement and nursing competency.",
      cost: "CAD 500 (N550,000)",
      passingScore: "Pass/Fail (adaptive)",
      validFor: "Until licensed",
      canTakeInNigeria: false,
    },
  ],

  requirements: [
    "Medical degree from a recognised institution (World Directory listed)",
    "Full MDCN or NMCN registration",
    "IELTS Academic 7.0+ or CELPIP CLB 7+ (for Express Entry and licensing)",
    "Proof of settlement funds (CAD 13,757 for single applicant)",
    "Canadian clinical experience highly recommended for CaRMS",
    "Police clearance certificate from Nigeria",
    "Medical examination by panel physician",
    "Valid passport",
    "Educational Credential Assessment (ECA) from WES or equivalent",
  ],

  visaType: "Work Permit / Express Entry PR",
  visaInfo:
    "Canada uses a points-based Express Entry system for permanent residency. Healthcare professionals score well due to in-demand occupation lists. The Federal Skilled Worker program, Canadian Experience Class, and Provincial Nominee Programs (PNP) are the main pathways. Some provinces have specific healthcare worker streams. Work permits can be obtained through LMIA-supported job offers.",

  nigerianTips: [
    "The CaRMS match rate for IMGs is very competitive. Consider doing observerships or research in Canada to strengthen your application.",
    "WES credential evaluation is required for Express Entry. Start this process 3 to 6 months before you plan to apply.",
    "Provincial Nominee Programs (PNP) in Atlantic provinces, Saskatchewan, and Manitoba are often more accessible for healthcare workers.",
    "The minimum settlement funds requirement is strictly enforced. You must show the funds in your bank account.",
    "For nurses, provinces like Ontario, British Columbia, and Alberta have the highest demand. Atlantic provinces offer faster immigration processing.",
    "Canada accepts Nigerian qualifications more readily than many other countries. Your MBBS is generally well-regarded.",
    "Join the Association of Nigerian Physicians and Dentists of Canada for networking and mentorship.",
    "Consider starting in a smaller city or rural area where demand is highest and immigration processing can be faster.",
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  AUSTRALIA                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const australia: MigrationPathway = {
  country: "Australia",
  slug: "australia",
  flag: "🇦🇺",
  overview:
    "Australia uses a points-based immigration system and has strong demand for healthcare professionals, particularly in regional areas. The pathway involves AMC exams for doctors and AHPRA registration for all health practitioners. Regional areas offer faster visa processing and additional immigration points.",
  processingTime: "12 to 24 months",
  estimatedCostNaira: "N8M to N20M",
  primaryRegulator: "Australian Medical Council (AMC) / AHPRA",
  primaryExam: "AMC MCQ / AMC Clinical",

  doctorPathway: [
    {
      step: 1,
      title: "English language test (IELTS Academic or OET)",
      description:
        "IELTS Academic with minimum 7.0 in each band, or OET B grade in each component. Australia has strict per-band requirements.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N280,000 to N350,000",
    },
    {
      step: 2,
      title: "AMC MCQ (Multiple Choice Questions)",
      description:
        "Computer-adaptive exam covering clinical sciences. 150 questions testing knowledge across all major medical disciplines. Can be taken at Prometric centres in Nigeria.",
      estimatedTime: "3 to 6 months preparation",
      estimatedCost: "N4,500,000 (AUD 4,500)",
    },
    {
      step: 3,
      title: "AMC Clinical Examination",
      description:
        "OSCE-style exam with 16 clinical stations in Australian clinical settings. Must be taken in Australia. Tests clinical skills and communication.",
      estimatedTime: "3 to 6 months",
      estimatedCost: "N5,000,000 (AUD 5,000 + travel)",
    },
    {
      step: 4,
      title: "AHPRA Registration",
      description:
        "Apply for registration with the Australian Health Practitioner Regulation Agency. You may receive limited or provisional registration depending on your pathway.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N1,000,000 (AUD 1,000)",
    },
    {
      step: 5,
      title: "Job search (consider regional areas)",
      description:
        "Regional and rural areas offer the most opportunities and additional immigration points. Many area-of-need positions do not require full AMC exams if you go the Standard or Competent Authority pathway.",
      estimatedTime: "1 to 6 months",
    },
    {
      step: 6,
      title: "Skilled Worker visa (Subclass 482 or 494)",
      description:
        "Employer-sponsored visa or skilled independent visa (Subclass 189/190). Regional visas (494) offer faster processing and a pathway to permanent residency.",
      estimatedTime: "2 to 12 months",
      estimatedCost: "N5,000,000+ (AUD 5,000+ including health insurance)",
    },
  ],

  nursePathway: [
    {
      step: 1,
      title: "English language test (IELTS Academic or OET)",
      description:
        "IELTS Academic with minimum 7.0 in each band, or OET B grade in each component. No exceptions for per-band minimums.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N280,000 to N350,000",
    },
    {
      step: 2,
      title: "AHPRA / ANMAC skills assessment",
      description:
        "Australian Nursing and Midwifery Accreditation Council (ANMAC) assesses your qualifications. Includes evaluation of education, clinical hours, and registration status.",
      estimatedTime: "3 to 6 months",
      estimatedCost: "N600,000 (AUD 600)",
    },
    {
      step: 3,
      title: "Bridging program (if required)",
      description:
        "Some nurses are required to complete a bridging or adaptation program to meet Australian standards. This varies by individual assessment.",
      estimatedTime: "3 to 12 months",
      estimatedCost: "Varies",
    },
    {
      step: 4,
      title: "AHPRA registration",
      description:
        "Apply for registered nurse registration with AHPRA after completing assessment requirements.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N500,000 (AUD 500)",
    },
    {
      step: 5,
      title: "Skills assessment (for immigration)",
      description:
        "ANMAC provides a skills assessment letter for immigration purposes, confirming your qualifications meet Australian standards.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N350,000 (AUD 350)",
    },
    {
      step: 6,
      title: "Skilled visa application",
      description:
        "Apply through employer sponsorship (Subclass 482) or points-based system (Subclass 189/190). Regional visas (Subclass 491) offer additional points.",
      estimatedTime: "3 to 12 months",
      estimatedCost: "N5,000,000+ (visa + insurance)",
    },
  ],

  costs: [
    { item: "IELTS Academic / OET", costForeign: "AUD 410", costNaira: "N410,000", notes: "Valid for 2 years" },
    { item: "AMC MCQ (Doctors)", costForeign: "AUD 4,500", costNaira: "N4,500,000" },
    { item: "AMC Clinical Exam", costForeign: "AUD 5,000", costNaira: "N5,000,000", notes: "Australia only" },
    { item: "AHPRA Registration", costForeign: "AUD 1,000", costNaira: "N1,000,000" },
    { item: "ANMAC Assessment (Nurses)", costForeign: "AUD 600", costNaira: "N600,000" },
    { item: "Skills Assessment", costForeign: "AUD 350", costNaira: "N350,000" },
    { item: "Visa Application (Subclass 482)", costForeign: "AUD 1,455", costNaira: "N1,455,000" },
    { item: "Health Insurance (OVHC)", costForeign: "AUD 500/year", costNaira: "N500,000/year" },
    { item: "Flights (Lagos to Sydney)", costForeign: "AUD 1,500+", costNaira: "N1,500,000+" },
  ],

  exams: [
    {
      name: "AMC MCQ",
      description:
        "Computer-adaptive exam with 150 questions covering clinical medicine, surgery, obstetrics, paediatrics, and psychiatry.",
      cost: "AUD 4,500 (N4,500,000)",
      passingScore: "Variable pass mark",
      validFor: "3 years",
      canTakeInNigeria: true,
    },
    {
      name: "AMC Clinical Examination",
      description:
        "OSCE with 16 stations testing clinical skills, communication, and procedural competency in an Australian context.",
      cost: "AUD 5,000 (N5,000,000)",
      passingScore: "Variable pass mark",
      validFor: "Until registration",
      canTakeInNigeria: false,
    },
  ],

  requirements: [
    "Medical or nursing degree from a recognised institution",
    "Full registration with MDCN or NMCN",
    "IELTS 7.0 in each band or OET B in each component (strict per-band requirement)",
    "Police clearance from Nigeria and any country you have lived in 12+ months",
    "Health examination by panel physician",
    "Skills assessment from relevant authority (ANMAC for nurses, AMC for doctors)",
    "Proof of English at a high level (no waivers available)",
    "Valid passport",
  ],

  visaType: "Skilled Worker Visa (Subclass 482/189/190/491/494)",
  visaInfo:
    "Australia uses a points-based system where healthcare professionals score well due to occupation demand. Subclass 482 (Temporary Skill Shortage) requires employer sponsorship. Subclass 189/190 are permanent residency visas through SkillSelect. Regional visas (491/494) offer additional points and faster processing. Medical practitioners and nurses are on the Priority Migration Skilled Occupation List (PMSOL).",

  nigerianTips: [
    "Australia has strict per-band IELTS requirements (7.0 in each band). Many Nigerian applicants struggle with Writing. Focus heavily on this.",
    "Regional areas (outside Sydney, Melbourne, Brisbane) offer 15 additional immigration points and faster visa processing.",
    "The Competent Authority pathway (through employers in areas of need) can bypass the AMC Clinical exam. Research this option.",
    "Overseas Health Cover (OVHC) is mandatory. Compare plans before purchasing.",
    "Credential assessment through AMC can take several months. Start this process as early as possible.",
    "Many Nigerian doctors successfully use the Standard Pathway, which allows supervised practice while preparing for exams.",
    "Join the Nigerian Medical Association of Australia for community and mentorship.",
    "Cost of living in Australia is high. Budget AUD 25,000+ for the first 3 months of settlement.",
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SAUDI ARABIA                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const saudiArabia: MigrationPathway = {
  country: "Saudi Arabia",
  slug: "saudi-arabia",
  flag: "🇸🇦",
  overview:
    "Saudi Arabia is a top destination for Nigerian healthcare professionals due to relatively straightforward licensing, employer-covered costs, and tax-free salaries. The Saudi Commission for Health Specialties (SCFHS) oversees licensing. Most employers handle visa, housing, and flights.",
  processingTime: "3 to 9 months",
  estimatedCostNaira: "N1M to N4M",
  primaryRegulator: "Saudi Commission for Health Specialties (SCFHS)",
  primaryExam: "Prometric (SCFHS)",

  doctorPathway: [
    {
      step: 1,
      title: "Dataflow verification",
      description:
        "All qualifications must be verified through Dataflow Group. This includes your medical degree, MDCN registration, and work experience. Employers usually initiate this process.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N150,000 (SAR 375)",
    },
    {
      step: 2,
      title: "Prometric (SCFHS) Examination",
      description:
        "Computer-based exam specific to your specialty. Tests clinical knowledge relevant to Saudi healthcare practice. Can be taken at Prometric centres in Nigeria.",
      estimatedTime: "1 to 3 months preparation",
      estimatedCost: "N160,000 (SAR 400)",
    },
    {
      step: 3,
      title: "SCFHS Classification and Registration",
      description:
        "SCFHS classifies your qualifications and experience level. This determines your practice grade (Consultant, Specialist, Resident, or General Practitioner).",
      estimatedTime: "2 to 4 weeks",
      estimatedCost: "N80,000 (SAR 200)",
    },
    {
      step: 4,
      title: "Job offer and contract",
      description:
        "Secure a job offer from a Saudi hospital or medical city. Government hospitals (MOH, National Guard, KFSH&RC) and private groups (Habib, Dr. Sulaiman Al-Habib) are major employers.",
      estimatedTime: "1 to 3 months",
    },
    {
      step: 5,
      title: "Employment visa and iqama",
      description:
        "Employer processes your employment visa and residence permit (iqama). They cover visa costs, flights, and usually provide housing or housing allowance.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "Usually covered by employer",
    },
  ],

  nursePathway: [
    {
      step: 1,
      title: "Dataflow verification",
      description:
        "Submit nursing qualifications for Dataflow verification. Includes degree, NMCN registration, and experience letters.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N150,000 (SAR 375)",
    },
    {
      step: 2,
      title: "Prometric (SCFHS) Nursing Examination",
      description:
        "Computer-based nursing exam covering general nursing, specialty nursing, or midwifery depending on your role. Can be taken in Nigeria.",
      estimatedTime: "1 to 2 months preparation",
      estimatedCost: "N160,000 (SAR 400)",
    },
    {
      step: 3,
      title: "SCFHS Registration",
      description:
        "Classification and registration with SCFHS. Nursing classifications determine your salary grade.",
      estimatedTime: "2 to 4 weeks",
      estimatedCost: "N80,000 (SAR 200)",
    },
    {
      step: 4,
      title: "Job offer and contract",
      description:
        "Many recruitment agencies handle Saudi nursing placements from Nigeria. Government and private hospitals actively recruit Nigerian nurses.",
      estimatedTime: "1 to 3 months",
    },
    {
      step: 5,
      title: "Employment visa and iqama",
      description:
        "Employer handles all visa and travel arrangements. Expect housing, annual flights, and end-of-service benefits.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "Covered by employer",
    },
  ],

  costs: [
    { item: "Dataflow Verification", costForeign: "SAR 375", costNaira: "N150,000" },
    { item: "Prometric (SCFHS) Exam", costForeign: "SAR 400", costNaira: "N160,000", notes: "Can take in Nigeria" },
    { item: "SCFHS Registration", costForeign: "SAR 200", costNaira: "N80,000" },
    { item: "Medical checkup", costForeign: "N50,000", costNaira: "N50,000", notes: "In Nigeria before travel" },
    { item: "Police clearance", costForeign: "N10,000", costNaira: "N10,000" },
    { item: "Visa processing", costForeign: "SAR 0", costNaira: "Free", notes: "Employer-sponsored" },
    { item: "Flights", costForeign: "SAR 0", costNaira: "Free", notes: "Usually employer-covered" },
  ],

  exams: [
    {
      name: "Prometric (SCFHS) Exam",
      description:
        "Computer-based exam tailored to your healthcare specialty. Covers clinical knowledge, patient safety, and professional practice in the Saudi context. Question banks are available online.",
      cost: "SAR 400 (N160,000)",
      passingScore: "60% (varies by specialty)",
      validFor: "2 years",
      canTakeInNigeria: true,
    },
  ],

  requirements: [
    "Medical or nursing degree from a recognised institution",
    "Full MDCN or NMCN registration",
    "Minimum 2 years post-qualification experience (varies by employer)",
    "Dataflow verification of all credentials",
    "Prometric exam pass",
    "Medical fitness test (including HIV, Hepatitis B/C screening)",
    "Police clearance certificate",
    "Valid passport with minimum 6 months validity",
  ],

  visaType: "Employment Visa (Iqama)",
  visaInfo:
    "Saudi Arabia uses an employer-sponsored visa system. Your employer applies for an employment visa and residence permit (iqama) on your behalf. The iqama is tied to your employer. Contracts are typically 2 to 3 years, renewable. Benefits usually include housing (or allowance), annual return flights, end-of-service gratuity, and medical insurance. All income is tax-free.",

  nigerianTips: [
    "Saudi salaries are tax-free, which makes the take-home pay significantly higher than it appears compared to UK or US roles.",
    "Government hospitals (MOH, National Guard) offer better job security and benefits. Private hospitals may offer higher base salary.",
    "Recruitment agencies in Nigeria that place in Saudi Arabia include Workforce Group, Lorache Consulting, and several specialized medical agencies. Verify their credentials carefully.",
    "Never pay for a job placement. Legitimate employers cover all recruitment costs.",
    "Women healthcare professionals work in Saudi Arabia with no restrictions in healthcare settings. Hospitals are mixed-gender workplaces.",
    "Learn basic Arabic greetings and medical terms. While hospitals use English, patients often speak Arabic.",
    "The end-of-service gratuity (half month salary per year for first 5 years, full month per year after) adds up significantly.",
    "Housing is typically provided or a housing allowance of 25% of base salary is standard.",
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  UAE                                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const uae: MigrationPathway = {
  country: "United Arab Emirates",
  slug: "uae",
  flag: "🇦🇪",
  overview:
    "The UAE offers modern healthcare facilities, competitive tax-free salaries, and a cosmopolitan lifestyle. Dubai and Abu Dhabi have separate licensing authorities (DHA and DOH respectively), but the process is similar. Employers typically handle licensing and visa costs.",
  processingTime: "3 to 9 months",
  estimatedCostNaira: "N1.5M to N5M",
  primaryRegulator: "DHA (Dubai) / DOH (Abu Dhabi) / MOH (Other Emirates)",
  primaryExam: "DHA / DOH / MOH Licensing Exam",

  doctorPathway: [
    {
      step: 1,
      title: "Dataflow verification",
      description:
        "Primary source verification of all qualifications through Dataflow Group. Required by DHA, DOH, and MOH for all healthcare professionals.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N165,000 (AED 400)",
    },
    {
      step: 2,
      title: "DHA/DOH/MOH Licensing Exam",
      description:
        "Computer-based exam specific to your licensing authority and specialty. DHA exams can be taken at Prometric centres in Nigeria. Some experienced specialists may be exempt.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N250,000 (AED 610 + Prometric fee)",
    },
    {
      step: 3,
      title: "Licence application",
      description:
        "Submit licence application with all verified documents. DHA, DOH, and MOH have online portals (Sheryan for DHA). Processing time varies.",
      estimatedTime: "2 to 6 weeks",
      estimatedCost: "N410,000 (AED 1,000)",
    },
    {
      step: 4,
      title: "Job offer from licensed facility",
      description:
        "Secure offer from a UAE healthcare facility. Major employers include Cleveland Clinic Abu Dhabi, Mediclinic, NMC Health, Aster DM Healthcare, and government hospitals.",
      estimatedTime: "1 to 4 months",
    },
    {
      step: 5,
      title: "Employment visa and Emirates ID",
      description:
        "Employer processes your employment visa and Emirates ID. They typically cover visa fees, medical insurance, and sometimes housing.",
      estimatedTime: "2 to 4 weeks",
      estimatedCost: "Usually covered by employer",
    },
  ],

  nursePathway: [
    {
      step: 1,
      title: "Dataflow verification",
      description:
        "Submit nursing qualifications for Dataflow verification. Same process as doctors.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N165,000 (AED 400)",
    },
    {
      step: 2,
      title: "DHA/DOH/MOH Nursing Exam",
      description:
        "Licensing exam for nurses. Covers clinical nursing knowledge. Can be taken in Nigeria at Prometric centres.",
      estimatedTime: "1 to 2 months",
      estimatedCost: "N200,000 (AED 490)",
    },
    {
      step: 3,
      title: "Licence application and job search",
      description:
        "Apply for nursing licence and secure a job offer simultaneously. Many agencies recruit Nigerian nurses for UAE facilities.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N300,000 (licence fees)",
    },
    {
      step: 4,
      title: "Employment visa",
      description:
        "Employer processes visa and provides medical insurance. Housing allowance is common for nursing positions.",
      estimatedTime: "2 to 4 weeks",
      estimatedCost: "Covered by employer",
    },
  ],

  costs: [
    { item: "Dataflow Verification", costForeign: "AED 400", costNaira: "N165,000" },
    { item: "DHA Licensing Exam", costForeign: "AED 610", costNaira: "N250,000", notes: "Can take in Nigeria" },
    { item: "DHA Licence Fee", costForeign: "AED 1,000", costNaira: "N410,000" },
    { item: "Medical Fitness Test (UAE)", costForeign: "AED 350", costNaira: "N143,000" },
    { item: "Emirates ID", costForeign: "AED 370", costNaira: "N152,000", notes: "Employer usually covers" },
    { item: "Visa stamping", costForeign: "AED 500", costNaira: "N205,000", notes: "Employer usually covers" },
    { item: "Flights (Lagos to Dubai)", costForeign: "AED 2,000+", costNaira: "N820,000+" },
  ],

  exams: [
    {
      name: "DHA Licensing Exam",
      description:
        "Multiple-choice exam covering clinical knowledge for your specialty. 100 questions in 3 hours. Pearson VUE format at Prometric centres.",
      cost: "AED 610 (N250,000)",
      passingScore: "Variable (typically 60%)",
      validFor: "2 years",
      canTakeInNigeria: true,
    },
    {
      name: "DOH Licensing Exam (Abu Dhabi)",
      description:
        "Similar to DHA exam but administered by the Department of Health Abu Dhabi. Some specialties have different question distributions.",
      cost: "AED 500 (N205,000)",
      passingScore: "Variable",
      validFor: "2 years",
      canTakeInNigeria: true,
    },
  ],

  requirements: [
    "Medical or nursing degree from a recognised institution",
    "Minimum 2 years clinical experience post-qualification",
    "Dataflow verification of all credentials",
    "Licensing exam pass (DHA/DOH/MOH)",
    "Medical fitness certificate",
    "Police clearance (good conduct certificate)",
    "Valid passport",
    "Passport-sized photos (UAE specifications)",
  ],

  visaType: "Employment Visa (Residence Permit)",
  visaInfo:
    "The UAE uses an employer-sponsored visa system. Your employer applies for your entry permit, and after arrival, you complete medical fitness testing and obtain your Emirates ID and residence visa. Visas are typically valid for 2 to 3 years and renewable. Healthcare workers can sponsor family members. The UAE recently introduced 10-year Golden Visas for highly skilled professionals, including some medical specialists.",

  nigerianTips: [
    "Dubai tends to offer higher salaries but Abu Dhabi has better benefits packages (housing is often fully provided).",
    "The DHA exam can be taken at Prometric centres in Lagos and Abuja. Book early.",
    "Tax-free salary, but consider housing costs in Dubai which can be very high.",
    "Many Nigerian healthcare professionals are already in the UAE. Join community groups for housing and settlement advice.",
    "Contracts typically include annual flights home, medical insurance, and end-of-service gratuity.",
    "Never pay recruitment agencies for job placement. Legitimate agencies are paid by the employer.",
    "Dubai and Abu Dhabi have different licensing bodies. You cannot work in Dubai with an Abu Dhabi licence and vice versa.",
    "The cost of living in Dubai is higher than Saudi Arabia, but the lifestyle and social environment are more open.",
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  QATAR                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

const qatar: MigrationPathway = {
  country: "Qatar",
  slug: "qatar",
  flag: "🇶🇦",
  overview:
    "Qatar offers excellent compensation packages and world-class facilities like Hamad Medical Corporation and Sidra Medicine. The licensing process through QCHP (Qatar Council for Healthcare Practitioners) is straightforward. Employer-provided benefits are generous and typically include housing, flights, and schooling allowance.",
  processingTime: "3 to 8 months",
  estimatedCostNaira: "N1M to N3M",
  primaryRegulator: "Qatar Council for Healthcare Practitioners (QCHP)",
  primaryExam: "QCHP Licensing Exam (Prometric)",

  doctorPathway: [
    {
      step: 1,
      title: "Dataflow verification",
      description:
        "Primary source verification of medical degree, registration, and experience through Dataflow Group.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N165,000 (QAR 400)",
    },
    {
      step: 2,
      title: "QCHP Prometric Exam",
      description:
        "Computer-based specialty exam administered through Prometric. Can be taken in Nigeria. Tests clinical knowledge relevant to practice in Qatar.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N165,000 (QAR 400)",
    },
    {
      step: 3,
      title: "QCHP Licence application",
      description:
        "Submit application through QCHP online portal (Hayya). Processing includes review of qualifications, experience, and exam results.",
      estimatedTime: "2 to 4 weeks",
      estimatedCost: "N205,000 (QAR 500)",
    },
    {
      step: 4,
      title: "Job offer and contract",
      description:
        "Secure offer from Hamad Medical Corporation (public), Sidra Medicine, or private facilities. HMC is the largest employer and recruits internationally.",
      estimatedTime: "1 to 3 months",
    },
    {
      step: 5,
      title: "Employment visa and Qatar ID",
      description:
        "Employer handles the entire visa process. Typically includes housing, annual flights, and end-of-service benefits.",
      estimatedTime: "2 to 4 weeks",
      estimatedCost: "Covered by employer",
    },
  ],

  nursePathway: [
    {
      step: 1,
      title: "Dataflow verification",
      description:
        "Submit nursing qualifications for Dataflow verification.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N165,000 (QAR 400)",
    },
    {
      step: 2,
      title: "QCHP Nursing Exam",
      description:
        "Prometric-based nursing exam. Can be taken in Nigeria. Covers clinical nursing practice.",
      estimatedTime: "1 to 2 months",
      estimatedCost: "N165,000 (QAR 400)",
    },
    {
      step: 3,
      title: "QCHP registration and job offer",
      description:
        "Apply for QCHP nursing licence. Hamad Medical Corporation actively recruits Nigerian nurses.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N205,000 (QAR 500)",
    },
    {
      step: 4,
      title: "Employment visa",
      description:
        "Employer processes visa and provides comprehensive benefits package.",
      estimatedTime: "2 to 4 weeks",
      estimatedCost: "Covered by employer",
    },
  ],

  costs: [
    { item: "Dataflow Verification", costForeign: "QAR 400", costNaira: "N165,000" },
    { item: "QCHP Prometric Exam", costForeign: "QAR 400", costNaira: "N165,000", notes: "Can take in Nigeria" },
    { item: "QCHP Licence", costForeign: "QAR 500", costNaira: "N205,000" },
    { item: "Medical checkup", costForeign: "N50,000", costNaira: "N50,000" },
    { item: "Police clearance", costForeign: "N10,000", costNaira: "N10,000" },
    { item: "Flights", costForeign: "QAR 0", costNaira: "Free", notes: "Employer-covered" },
  ],

  exams: [
    {
      name: "QCHP Prometric Exam",
      description:
        "Computer-based exam testing clinical knowledge for your specialty. Similar format to DHA and SCFHS Prometric exams. Question banks overlap significantly.",
      cost: "QAR 400 (N165,000)",
      passingScore: "60% (varies by specialty)",
      validFor: "2 years",
      canTakeInNigeria: true,
    },
  ],

  requirements: [
    "Medical or nursing degree from a recognised institution",
    "Minimum 2 years post-qualification experience",
    "Dataflow verification of credentials",
    "QCHP Prometric exam pass",
    "Medical fitness certificate",
    "Police clearance certificate",
    "Valid passport",
  ],

  visaType: "Employment Visa (Work Residence Permit)",
  visaInfo:
    "Qatar uses an employer-sponsored visa system. Benefits typically include furnished housing (or housing allowance), annual return flights for the employee and family, medical insurance, children's education allowance, and end-of-service gratuity. Contracts are usually 2 to 3 years. The RP (Residence Permit) allows you to sponsor family members. Qatar has recently reformed its kafala system, allowing easier job mobility.",

  nigerianTips: [
    "Hamad Medical Corporation (HMC) is the largest employer and offers the most comprehensive benefits, including family housing and education.",
    "The Prometric exam for Qatar is very similar to the Saudi SCFHS exam. Preparation resources overlap significantly.",
    "Qatar has a small but active Nigerian community. Join community groups before arrival for housing and settlement advice.",
    "Salaries are tax-free and benefits are generous. Total compensation packages are among the best in the Gulf region.",
    "Qatar is expensive for daily living, but employer-provided housing significantly reduces this burden.",
    "Arabic is not strictly required but basic phrases help. Hospitals operate primarily in English.",
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  IRELAND                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const ireland: MigrationPathway = {
  country: "Ireland",
  slug: "ireland",
  flag: "🇮🇪",
  overview:
    "Ireland has significant healthcare workforce shortages and actively recruits internationally. The pathway is similar to the UK but uses the Irish Medical Council for registration. English language requirements are often waived for graduates of English-medium programs. HSE (Health Service Executive) is the main public employer.",
  processingTime: "6 to 15 months",
  estimatedCostNaira: "N6M to N15M",
  primaryRegulator: "Medical Council of Ireland / NMBI (Nursing and Midwifery Board of Ireland)",
  primaryExam: "PRES (Pre-Registration Examination System)",

  doctorPathway: [
    {
      step: 1,
      title: "English language proficiency (if required)",
      description:
        "Graduates of English-medium medical schools may be exempt. Otherwise, IELTS Academic 7.0 overall with minimum 6.5 per band, or OET B grade.",
      estimatedTime: "0 to 3 months",
      estimatedCost: "N280,000 (if required)",
    },
    {
      step: 2,
      title: "Medical Council of Ireland registration",
      description:
        "Apply for registration on the Supervised Division of the register. This allows supervised practice while completing further assessments.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N960,000 (EUR 600 registration)",
    },
    {
      step: 3,
      title: "PRES Clinical Assessment (if required)",
      description:
        "Some doctors may need to take a clinical assessment. Requirements vary based on qualifications and experience.",
      estimatedTime: "2 to 4 months",
      estimatedCost: "N1,600,000 (EUR 1,000)",
    },
    {
      step: 4,
      title: "Job search (HSE or private)",
      description:
        "Apply for positions through HSE, hospital groups, or recruitment agencies. NCHD (Non-Consultant Hospital Doctor) positions are the most common entry level.",
      estimatedTime: "1 to 6 months",
    },
    {
      step: 5,
      title: "Employment Permit / Stamp 1 visa",
      description:
        "Your employer applies for a Critical Skills Employment Permit (doctors qualify). This leads to Stamp 1 residence permission.",
      estimatedTime: "4 to 12 weeks",
      estimatedCost: "N1,600,000 (EUR 1,000 permit fee)",
    },
  ],

  nursePathway: [
    {
      step: 1,
      title: "NMBI Assessment",
      description:
        "Submit application to the Nursing and Midwifery Board of Ireland (NMBI) for assessment of your qualifications.",
      estimatedTime: "3 to 6 months",
      estimatedCost: "N480,000 (EUR 300)",
    },
    {
      step: 2,
      title: "Adaptation and aptitude test (if required)",
      description:
        "NMBI may require a clinical adaptation programme or aptitude test depending on their assessment of your qualifications.",
      estimatedTime: "3 to 6 months",
      estimatedCost: "N1,600,000 (varies)",
    },
    {
      step: 3,
      title: "NMBI Registration",
      description:
        "Once assessment requirements are met, apply for full NMBI registration.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N160,000 (EUR 100)",
    },
    {
      step: 4,
      title: "Job search and Employment Permit",
      description:
        "Nurses qualify for the Critical Skills Employment Permit. HSE and private nursing homes actively recruit internationally.",
      estimatedTime: "1 to 4 months",
      estimatedCost: "N1,600,000 (EUR 1,000 permit fee)",
    },
  ],

  costs: [
    { item: "IELTS Academic (if required)", costForeign: "EUR 225", costNaira: "N360,000" },
    { item: "Medical Council Registration (Doctors)", costForeign: "EUR 600", costNaira: "N960,000" },
    { item: "NMBI Assessment (Nurses)", costForeign: "EUR 300", costNaira: "N480,000" },
    { item: "Critical Skills Employment Permit", costForeign: "EUR 1,000", costNaira: "N1,600,000" },
    { item: "Garda Vetting (police clearance)", costForeign: "EUR 0", costNaira: "Free", notes: "Employer-initiated" },
    { item: "Flights (Lagos to Dublin)", costForeign: "EUR 600+", costNaira: "N960,000+" },
    { item: "IRP Registration (immigration)", costForeign: "EUR 300", costNaira: "N480,000" },
  ],

  exams: [
    {
      name: "PRES (if required)",
      description:
        "Pre-Registration Examination System clinical assessment for doctors. Format and requirements depend on the Medical Council's assessment of your qualifications.",
      cost: "EUR 1,000 (N1,600,000)",
      passingScore: "Variable",
      validFor: "Until registration",
      canTakeInNigeria: false,
    },
  ],

  requirements: [
    "Medical or nursing degree from a recognised institution",
    "Full MDCN or NMCN registration",
    "English language proficiency (may be waived for English-medium graduates)",
    "Certificate of Good Standing",
    "Police clearance from Nigeria",
    "Proof of TB screening",
    "Valid passport",
  ],

  visaType: "Critical Skills Employment Permit / Stamp 1",
  visaInfo:
    "Ireland's Critical Skills Employment Permit is designed for in-demand occupations, which includes healthcare roles. The permit is valid for 2 years, and after 2 years you can apply for Stamp 4 (unrestricted work permission). After 5 years, you can apply for citizenship. Spouses/partners receive an open work permit. Healthcare workers may also qualify for the General Employment Permit route.",

  nigerianTips: [
    "Ireland often waives English language tests for graduates of English-medium programs. Check with the Medical Council or NMBI.",
    "The HSE regularly conducts recruitment campaigns in Nigeria. Watch for announcements on their website and social media.",
    "Ireland is part of the EU/EEA, but as a non-EU citizen you need an employment permit. The Critical Skills permit is the fastest route.",
    "Cost of living in Dublin is very high. Consider Cork, Galway, Limerick, or Waterford for lower living costs.",
    "After 2 years on a Critical Skills permit, you get unrestricted work permission (Stamp 4). This is a major advantage.",
    "Irish weather takes adjustment. Invest in warm, waterproof clothing.",
    "The Nigerian community in Ireland is well-established. Connect before you travel for practical settlement advice.",
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GERMANY                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

const germany: MigrationPathway = {
  country: "Germany",
  slug: "germany",
  flag: "🇩🇪",
  overview:
    "Germany has a severe healthcare worker shortage and actively recruits internationally. The key challenge for Nigerian professionals is the German language requirement (B2 level minimum). Germany offers an Approbation (full licence) pathway and a Berufserlaubnis (temporary licence) for supervised practice while you complete requirements.",
  processingTime: "12 to 30 months",
  estimatedCostNaira: "N5M to N12M",
  primaryRegulator: "State Medical Chambers (Landesarztekammer) / State Nursing Authorities",
  primaryExam: "Kenntnisprufung (Knowledge Exam) or Approbation",

  doctorPathway: [
    {
      step: 1,
      title: "German language training (B2 level minimum)",
      description:
        "You must reach B2 level in general German and B2/C1 in medical German (Fachsprachprufung). This is the most time-consuming step. Goethe-Institut courses are available in Lagos.",
      estimatedTime: "6 to 18 months",
      estimatedCost: "N1,500,000 to N3,000,000",
    },
    {
      step: 2,
      title: "Credential recognition application (Approbation)",
      description:
        "Apply to the regional authority (Regierungsprasidium) for recognition of your medical degree. They assess equivalency with German medical training.",
      estimatedTime: "3 to 6 months",
      estimatedCost: "N800,000 (EUR 500)",
    },
    {
      step: 3,
      title: "Fachsprachprufung (Medical German language exam)",
      description:
        "Oral exam testing your ability to communicate medically in German. Covers patient history-taking, colleague communication, and medical documentation.",
      estimatedTime: "1 to 2 months",
      estimatedCost: "N640,000 (EUR 400)",
    },
    {
      step: 4,
      title: "Kenntnisprufung (Knowledge exam) or Gleichwertigkeitsprufung",
      description:
        "Clinical knowledge exam if your degree is not deemed fully equivalent. Practical clinical exam at a German hospital. Alternatively, direct Approbation if deemed equivalent.",
      estimatedTime: "3 to 6 months",
      estimatedCost: "N800,000 (EUR 500)",
    },
    {
      step: 5,
      title: "Approbation (full medical licence)",
      description:
        "Once all requirements are met, you receive the Approbation (unlimited licence to practise medicine in Germany). You can also start with a Berufserlaubnis (temporary licence) while completing steps.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N640,000 (EUR 400 processing)",
    },
    {
      step: 6,
      title: "Job search and residence permit",
      description:
        "Apply for positions at hospitals (Krankenhaus) or practices. Germany's accelerated skilled worker immigration process applies to healthcare professionals.",
      estimatedTime: "1 to 4 months",
      estimatedCost: "N120,000 (visa fees)",
    },
  ],

  nursePathway: [
    {
      step: 1,
      title: "German language training (B1/B2 level)",
      description:
        "Nurses typically need B1 to B2 level German. Some programmes include language training as part of a structured recruitment package.",
      estimatedTime: "6 to 12 months",
      estimatedCost: "N1,000,000 to N2,000,000",
    },
    {
      step: 2,
      title: "Credential recognition",
      description:
        "Apply for recognition of your nursing qualification. German authorities assess equivalency and determine if a compensation measure (adaptation course or exam) is needed.",
      estimatedTime: "3 to 6 months",
      estimatedCost: "N320,000 (EUR 200)",
    },
    {
      step: 3,
      title: "Adaptation course or knowledge exam",
      description:
        "Complete an adaptation course (Anpassungslehrgang) at a German healthcare facility or pass a knowledge exam (Kenntnisprufung) for nurses.",
      estimatedTime: "3 to 12 months",
      estimatedCost: "N1,600,000 (varies by programme)",
    },
    {
      step: 4,
      title: "Full nursing licence and job placement",
      description:
        "Receive Anerkennung (full recognition) and apply for nursing positions. Many structured programmes include guaranteed job placement.",
      estimatedTime: "1 to 3 months",
    },
  ],

  costs: [
    { item: "German language course (B2)", costForeign: "EUR 1,500+", costNaira: "N2,400,000+", notes: "6 to 18 months" },
    { item: "Fachsprachprufung", costForeign: "EUR 400", costNaira: "N640,000" },
    { item: "Credential recognition", costForeign: "EUR 500", costNaira: "N800,000" },
    { item: "Kenntnisprufung", costForeign: "EUR 500", costNaira: "N800,000" },
    { item: "Approbation processing", costForeign: "EUR 400", costNaira: "N640,000" },
    { item: "Visa application", costForeign: "EUR 75", costNaira: "N120,000" },
    { item: "Flights (Lagos to Frankfurt)", costForeign: "EUR 500+", costNaira: "N800,000+" },
    { item: "Health insurance (first months)", costForeign: "EUR 110/month", costNaira: "N176,000/month" },
  ],

  exams: [
    {
      name: "Fachsprachprufung (Medical German Exam)",
      description:
        "Oral exam lasting 60 minutes testing your ability to take a patient history, write a doctor's letter, and communicate with colleagues in German.",
      cost: "EUR 400 (N640,000)",
      passingScore: "Pass/Fail",
      validFor: "Until Approbation",
      canTakeInNigeria: false,
    },
    {
      name: "Kenntnisprufung (Knowledge Exam)",
      description:
        "Practical clinical exam at a German hospital. Covers internal medicine, surgery, and your specialty. Conducted in German.",
      cost: "EUR 500 (N800,000)",
      passingScore: "Pass/Fail",
      validFor: "Until Approbation",
      canTakeInNigeria: false,
    },
  ],

  requirements: [
    "Medical or nursing degree from a recognised institution",
    "German language proficiency (B2 minimum for doctors, B1/B2 for nurses)",
    "Medical German proficiency (Fachsprachprufung) for doctors",
    "Full MDCN or NMCN registration",
    "Certificate of Good Standing",
    "Police clearance certificate (apostilled)",
    "Health certificate",
    "Valid passport",
  ],

  visaType: "Skilled Worker Visa (Fachkraftevisum) / EU Blue Card",
  visaInfo:
    "Germany's Skilled Immigration Act (Fachkrafteeinwanderungsgesetz) streamlines immigration for healthcare professionals. You can apply for a Fachkraftevisum (skilled worker visa) or EU Blue Card. There is also a visa for job seekers (up to 6 months to find work). After 4 years (or 21 months with B1 German and EU Blue Card), you can apply for permanent residency (Niederlassungserlaubnis).",

  nigerianTips: [
    "The biggest barrier is German language. Start learning as early as possible. Goethe-Institut in Lagos offers structured courses.",
    "Several German-Nigerian healthcare recruitment programmes offer language training plus guaranteed job placement. Research Triple Win (GIZ) and similar programmes.",
    "Germany has an aging population and severe nursing shortage. Nurses with German language skills are highly sought after.",
    "Salaries in Germany are taxed (30 to 40%), but benefits include excellent social security, health insurance, and work-life balance.",
    "The Berufserlaubnis (temporary licence) allows you to start working and earning while completing Approbation requirements. Use this to your advantage.",
    "Some German states (Bundeslander) process Approbation faster than others. Brandenburg, Saxony, and Thuringia are often faster.",
    "Cost of living outside major cities (Berlin, Munich, Frankfurt) is very reasonable compared to the UK or Australia.",
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  NEW ZEALAND                                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

const newZealand: MigrationPathway = {
  country: "New Zealand",
  slug: "new-zealand",
  flag: "🇳🇿",
  overview:
    "New Zealand offers excellent quality of life and actively recruits healthcare professionals to address workforce shortages. The Medical Council of New Zealand and Nursing Council of New Zealand oversee registration. Regional and rural areas have the highest demand.",
  processingTime: "6 to 18 months",
  estimatedCostNaira: "N6M to N15M",
  primaryRegulator: "Medical Council of New Zealand (MCNZ) / Nursing Council of New Zealand",
  primaryExam: "NZREX Clinical / Competence Assessment",

  doctorPathway: [
    {
      step: 1,
      title: "English language test (IELTS Academic or OET)",
      description:
        "IELTS Academic with minimum 7.5 overall and 7.0 in each band, or OET B grade. New Zealand has some of the highest English requirements.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N280,000 to N350,000",
    },
    {
      step: 2,
      title: "MCNZ Registration pathway assessment",
      description:
        "Apply to the Medical Council of New Zealand for registration. They assess your qualifications and determine your pathway (NZREX Clinical exam or supervised practice).",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N1,000,000 (NZD 1,000)",
    },
    {
      step: 3,
      title: "NZREX Clinical Examination",
      description:
        "OSCE-style exam with clinical stations. Must be taken in New Zealand. Tests clinical skills in a New Zealand healthcare context.",
      estimatedTime: "3 to 6 months",
      estimatedCost: "N5,500,000 (NZD 5,500 + travel)",
    },
    {
      step: 4,
      title: "Provisional registration and supervised practice",
      description:
        "Work under supervision for 12 to 24 months at an accredited hospital. This is a required part of the registration pathway.",
      estimatedTime: "12 to 24 months",
    },
    {
      step: 5,
      title: "Full MCNZ registration",
      description:
        "After satisfactory supervised practice, apply for a general scope of practice (full registration).",
      estimatedTime: "4 to 8 weeks",
    },
    {
      step: 6,
      title: "Skilled Migrant Category visa",
      description:
        "Apply for residence through the Skilled Migrant Category or employer-assisted work visa. Healthcare professionals are on the Green List for fast-track residency.",
      estimatedTime: "1 to 6 months",
      estimatedCost: "N900,000+ (visa fees)",
    },
  ],

  nursePathway: [
    {
      step: 1,
      title: "English language test",
      description:
        "IELTS Academic 7.0 overall with 7.0 in each band, or OET B grade.",
      estimatedTime: "1 to 3 months",
      estimatedCost: "N280,000 to N350,000",
    },
    {
      step: 2,
      title: "Nursing Council competence assessment",
      description:
        "Apply to the Nursing Council of New Zealand for assessment. Includes evaluation of your education, experience, and registration history.",
      estimatedTime: "3 to 6 months",
      estimatedCost: "N600,000 (NZD 600)",
    },
    {
      step: 3,
      title: "Competence assessment programme (CAP)",
      description:
        "Complete a supervised clinical programme in New Zealand to demonstrate competency against NZ nursing standards.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N2,000,000 (NZD 2,000 + living costs)",
    },
    {
      step: 4,
      title: "Nursing Council registration",
      description:
        "Apply for full registration with the Nursing Council once the CAP is completed satisfactorily.",
      estimatedTime: "4 to 8 weeks",
      estimatedCost: "N500,000 (NZD 500)",
    },
    {
      step: 5,
      title: "Green List visa",
      description:
        "Registered nurses are on the Green List for straight-to-residence visas. This is one of the fastest pathways to permanent residency.",
      estimatedTime: "1 to 4 months",
      estimatedCost: "N600,000 (visa fees)",
    },
  ],

  costs: [
    { item: "IELTS Academic / OET", costForeign: "NZD 400", costNaira: "N280,000" },
    { item: "MCNZ Application (Doctors)", costForeign: "NZD 1,000", costNaira: "N700,000" },
    { item: "NZREX Clinical (Doctors)", costForeign: "NZD 5,500", costNaira: "N3,850,000", notes: "New Zealand only" },
    { item: "Nursing Council Assessment", costForeign: "NZD 600", costNaira: "N420,000" },
    { item: "CAP Programme (Nurses)", costForeign: "NZD 2,000", costNaira: "N1,400,000" },
    { item: "Visa Application", costForeign: "NZD 700+", costNaira: "N490,000+" },
    { item: "Flights (Lagos to Auckland)", costForeign: "NZD 2,500+", costNaira: "N1,750,000+" },
  ],

  exams: [
    {
      name: "NZREX Clinical",
      description:
        "OSCE-style clinical exam with multiple stations testing history-taking, examination, diagnosis, and management in a New Zealand context.",
      cost: "NZD 5,500 (N3,850,000)",
      passingScore: "Variable",
      validFor: "Until registration",
      canTakeInNigeria: false,
    },
  ],

  requirements: [
    "Medical or nursing degree from a recognised institution",
    "Full MDCN or NMCN registration",
    "IELTS 7.0+ in each band (doctors 7.5 overall) or OET B",
    "Certificate of Good Standing",
    "Police clearance from all countries lived in for 12+ months",
    "Medical and chest X-ray clearance",
    "Valid passport",
  ],

  visaType: "Green List / Skilled Migrant Category / Employer-Assisted Work Visa",
  visaInfo:
    "New Zealand's Green List offers straight-to-residence for in-demand occupations including doctors, nurses, and midwives. The Skilled Migrant Category uses a points-based system. Employer-assisted work visas are also available. Healthcare professionals benefit from streamlined processing. Permanent residency can be achieved in 2 to 5 years depending on the visa category.",

  nigerianTips: [
    "New Zealand has the highest per-band IELTS requirements. Writing and Speaking at 7.0+ requires significant preparation.",
    "The Green List for nurses means you can get residency much faster than most other visa categories.",
    "Rural and regional areas offer the best job opportunities and often provide relocation assistance.",
    "Cost of living in Auckland is high but other cities like Christchurch, Wellington, and Hamilton are more affordable.",
    "New Zealand has a small but growing Nigerian community, particularly in Auckland.",
    "The healthcare system is publicly funded (similar to the NHS) so the practice environment will feel familiar.",
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  EXPORT                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const MIGRATION_PATHWAYS: MigrationPathway[] = [
  uk,
  us,
  canada,
  australia,
  saudiArabia,
  uae,
  qatar,
  ireland,
  germany,
  newZealand,
];

export function getMigrationPathway(slug: string): MigrationPathway | undefined {
  return MIGRATION_PATHWAYS.find((p) => p.slug === slug);
}

export const MIGRATION_COUNTRY_SLUGS = MIGRATION_PATHWAYS.map((p) => p.slug);
