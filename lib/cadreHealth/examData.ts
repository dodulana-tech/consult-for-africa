// ─── CadreHealth: Exam Preparation Guide Data ───
// Structured data for healthcare professional exams targeting Nigerian professionals

export interface ExamSection {
  name: string;
  description: string;
  questionCount?: number;
  duration?: string;
  passingScore?: string;
}

export interface ExamGuide {
  slug: string;
  name: string;
  fullName: string;
  description: string;
  whoNeedsIt: string;
  administeredBy: string;
  cost: string;
  costNaira: string;
  format: string;
  duration: string;
  passingScore: string;
  validFor: string;
  canTakeInNigeria: boolean;
  testCentresInNigeria?: string[];
  sections: ExamSection[];
  preparationTips: string[];
  recommendedResources: string[];
  registrationSteps: string[];
  nigerianSpecificTips: string[];
  relatedExams: string[];
  targetCadres: string[];
  category: "international" | "nigerian";
  difficulty: "moderate" | "hard" | "very-hard";
}

export const EXAM_GUIDES: ExamGuide[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNATIONAL EXAMS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    slug: "plab-1",
    name: "PLAB 1",
    fullName: "Professional and Linguistic Assessments Board Part 1",
    description:
      "The first of two exams required for international medical graduates to practise medicine in the UK. PLAB 1 tests your ability to apply medical knowledge to clinical scenarios common in the NHS.",
    whoNeedsIt:
      "International medical graduates (IMGs) who want to practise as doctors in the United Kingdom",
    administeredBy: "General Medical Council (GMC)",
    cost: "GBP 273",
    costNaira: "Approximately N530,000",
    format: "180 single best answer (SBA) multiple-choice questions",
    duration: "3 hours",
    passingScore: "Approximately 62% (varies by sitting)",
    validFor: "3 years from the date you pass (to complete PLAB 2)",
    canTakeInNigeria: true,
    testCentresInNigeria: [
      "British Council Lagos (Victoria Island)",
      "British Council Abuja",
    ],
    sections: [
      {
        name: "Clinical Medicine",
        description:
          "Questions covering diagnosis, investigation, and management of common medical conditions seen in UK general practice and hospitals.",
        questionCount: 180,
        duration: "3 hours",
        passingScore: "~62%",
      },
    ],
    preparationTips: [
      "Start with a strong foundation in clinical medicine, especially UK guidelines (NICE).",
      "Use the Oxford Handbook of Clinical Medicine as your primary reference.",
      "Practise at least 3,000 SBA questions before sitting the exam.",
      "Focus on emergency management, common presentations, and patient safety.",
      "Study UK-specific guidelines, especially for prescribing and referral pathways.",
      "Join study groups with other Nigerian doctors preparing for PLAB.",
      "Allow 3 to 6 months of dedicated preparation if working full-time.",
    ],
    recommendedResources: [
      "Oxford Handbook of Clinical Medicine",
      "Pastest PLAB 1 question bank",
      "Plabable (free question bank)",
      "NICE Clinical Knowledge Summaries (CKS)",
      "BMJ OnExamination",
      "Dr. Khaldoon YouTube channel",
    ],
    registrationSteps: [
      "Create a GMC Online account at gmc-uk.org.",
      "Apply for PLAB 1 through your GMC Online account.",
      "Submit your primary medical qualification documents for verification.",
      "Pay the GBP 273 exam fee online.",
      "Select your preferred test centre (Lagos or Abuja) and available date.",
      "Receive your confirmation email with exam details.",
      "Arrive at the British Council centre on exam day with valid ID.",
    ],
    nigerianSpecificTips: [
      "Book your exam date at least 3 months in advance as Lagos and Abuja slots fill up fast.",
      "The British Council Lagos centre is on Victoria Island. Plan for traffic, especially if coming from the mainland.",
      "Bring your international passport (not a national ID) as identification.",
      "PLAB 1 sittings in Nigeria typically happen 3 to 4 times per year. Check the GMC website for exact dates.",
      "Join the 'PLAB Nigeria' groups on Telegram and WhatsApp for peer support and exam date updates.",
      "Consider writing in Abuja if you find Lagos dates fully booked.",
      "Your MDCN registration certificate and medical school transcript will be needed for GMC verification.",
    ],
    relatedExams: ["plab-2", "ielts-academic", "oet"],
    targetCadres: ["MEDICINE", "DENTISTRY"],
    category: "international",
    difficulty: "hard",
  },

  {
    slug: "plab-2",
    name: "PLAB 2",
    fullName: "Professional and Linguistic Assessments Board Part 2",
    description:
      "The clinical skills assessment for UK medical registration. PLAB 2 is an OSCE (Objective Structured Clinical Examination) that tests your ability to communicate with patients, examine, diagnose, and manage clinical scenarios in a simulated NHS environment.",
    whoNeedsIt:
      "International medical graduates who have passed PLAB 1 and want to complete their GMC registration",
    administeredBy: "General Medical Council (GMC)",
    cost: "GBP 998",
    costNaira: "Approximately N1,940,000",
    format: "Objective Structured Clinical Examination (OSCE) with 16 stations",
    duration:
      "Approximately 2 hours 30 minutes (16 stations at 8 minutes each, plus changeover time)",
    passingScore: "Minimum competency standard set by the GMC each sitting",
    validFor:
      "You must apply for GMC registration within 2 years of passing PLAB 2",
    canTakeInNigeria: false,
    sections: [
      {
        name: "History Taking Stations",
        description:
          "Take a focused clinical history from a simulated patient, identify key problems, and formulate a management plan.",
      },
      {
        name: "Examination Stations",
        description:
          "Perform focused clinical examinations on manikins or simulated patients and interpret findings.",
      },
      {
        name: "Communication Stations",
        description:
          "Explain diagnoses, procedures, or results to patients. May include breaking bad news or discussing sensitive topics.",
      },
      {
        name: "Practical Skills Stations",
        description:
          "Demonstrate clinical procedures such as suturing, IV cannulation, catheterisation, or basic life support.",
      },
    ],
    preparationTips: [
      "Practise with OSCE partners regularly. Communication skills are heavily weighted.",
      "Learn the structured approach: introduce yourself, confirm patient identity, explain, check understanding.",
      "Master UK consent and safeguarding protocols.",
      "Practise time management strictly. You have exactly 8 minutes per station.",
      "Study common OSCE scenarios from resources like Samson's PLAB 2 book.",
      "Book a spot at a PLAB 2 academy in Manchester for structured practice.",
      "Watch YouTube OSCE demonstrations for station flow and examiner expectations.",
    ],
    recommendedResources: [
      "Samson's PLAB 2 Book",
      "PLAB 2 Academy Manchester",
      "Pastest PLAB 2 course",
      "Geeky Medics OSCE guides",
      "NICE CKS for management plans",
      "YouTube: Dr. Saleha Qureshi OSCE tips",
    ],
    registrationSteps: [
      "Pass PLAB 1 first (result valid for 3 years).",
      "Log into your GMC Online account and apply for PLAB 2.",
      "Pay the GBP 998 exam fee.",
      "Select an available date at the GMC Assessment Centre in Manchester.",
      "Apply for a UK Standard Visitor visa (you need a confirmed PLAB 2 booking for this).",
      "Travel to Manchester and attend the exam at the GMC Assessment Centre.",
      "Results are typically available within 10 working days.",
    ],
    nigerianSpecificTips: [
      "PLAB 2 can ONLY be taken in Manchester, UK. You must travel.",
      "Apply for a UK Standard Visitor visa early. State clearly that you are attending a professional exam.",
      "Budget GBP 2,500 to 4,000 total for flights, accommodation, visa, and the exam fee.",
      "Many Nigerian doctors stay in Manchester for 2 to 4 weeks before the exam to attend prep academies.",
      "Join the Telegram group 'PLAB 2 Nigerians' for accommodation tips and study partners in Manchester.",
      "Book your exam at least 4 to 6 months in advance. Popular dates sell out fast.",
      "Consider combining your trip with PLAB 2 academy attendance for structured OSCE practice.",
    ],
    relatedExams: ["plab-1", "ielts-academic", "oet"],
    targetCadres: ["MEDICINE", "DENTISTRY"],
    category: "international",
    difficulty: "very-hard",
  },

  {
    slug: "usmle-step-1",
    name: "USMLE Step 1",
    fullName: "United States Medical Licensing Examination Step 1",
    description:
      "Tests your understanding of foundational biomedical sciences and their application to clinical practice. Since January 2022, Step 1 is scored pass/fail, removing it as a competitive differentiator for residency applications.",
    whoNeedsIt:
      "Medical graduates who want to practise medicine in the United States",
    administeredBy: "National Board of Medical Examiners (NBME) and FSMB",
    cost: "USD 645 (plus ECFMG certification fees)",
    costNaira: "Approximately N1,000,000",
    format: "280 multiple-choice questions across 7 blocks of 40 questions each",
    duration: "1 day (8 hours of testing time with breaks)",
    passingScore: "Pass/fail (since January 2022)",
    validFor:
      "No expiry, but all 3 Steps should ideally be completed within 7 years",
    canTakeInNigeria: true,
    testCentresInNigeria: ["Prometric Test Centre Lagos (Victoria Island)"],
    sections: [
      {
        name: "Anatomy and Embryology",
        description:
          "Gross anatomy, histology, embryology, and neuroanatomy with clinical correlations.",
      },
      {
        name: "Biochemistry and Molecular Biology",
        description:
          "Metabolic pathways, enzyme deficiencies, molecular biology, and genetics.",
      },
      {
        name: "Pharmacology",
        description:
          "Drug mechanisms, side effects, interactions, and clinical therapeutics.",
      },
      {
        name: "Physiology",
        description:
          "Organ system physiology with emphasis on pathophysiological mechanisms.",
      },
      {
        name: "Pathology",
        description:
          "General and systemic pathology, including laboratory findings and disease mechanisms.",
      },
      {
        name: "Microbiology and Immunology",
        description:
          "Bacteriology, virology, parasitology, mycology, and immune system function.",
      },
      {
        name: "Behavioural Sciences and Biostatistics",
        description:
          "Epidemiology, biostatistics, ethics, patient communication, and health systems.",
      },
    ],
    preparationTips: [
      "Even though Step 1 is now pass/fail, do not underestimate the difficulty. A solid foundation here helps with Step 2 CK.",
      "Use First Aid for the USMLE Step 1 as your primary review book.",
      "Watch Pathoma videos for pathology and Sketchy for microbiology and pharmacology.",
      "Do all of UWorld Step 1 question bank at least once (ideally twice).",
      "Supplement with Boards and Beyond video lectures.",
      "Use Anki flashcard decks (AnKing is the most popular) for daily review.",
      "Plan for 3 to 8 months of dedicated study depending on your base knowledge.",
    ],
    recommendedResources: [
      "First Aid for the USMLE Step 1",
      "UWorld Step 1 Qbank",
      "Pathoma (Dr. Husain Sattar)",
      "Sketchy Medical (Micro, Pharm, Path)",
      "Boards and Beyond video lectures",
      "AnKing Anki deck",
      "AMBOSS Step 1 Qbank",
    ],
    registrationSteps: [
      "Apply for ECFMG certification at ecfmg.org (requires medical school verification).",
      "Complete the ECFMG application and document verification process.",
      "Once approved, receive your USMLE/ECFMG Identification Number.",
      "Apply for Step 1 through the ECFMG and pay the USD 645 exam fee.",
      "Receive your scheduling permit via email.",
      "Schedule your exam date at Prometric Lagos through prometric.com.",
      "Sit the exam at the Prometric centre in Lagos.",
    ],
    nigerianSpecificTips: [
      "The Prometric centre in Lagos is the only test centre in Nigeria. Book well in advance.",
      "ECFMG verification of your Nigerian medical degree can take 2 to 6 months. Start early.",
      "Your medical school must respond to ECFMG's verification request. Follow up with your university registrar.",
      "The scheduling permit has a 3-month eligibility window. Plan your study timeline accordingly.",
      "Many Nigerian doctors form study groups. Check the 'USMLE Nigeria' groups on Telegram.",
      "The exam starts early. Stay close to Victoria Island the night before to avoid Lagos traffic delays.",
      "Budget for ECFMG certification fees (approximately USD 160) in addition to the Step 1 fee.",
    ],
    relatedExams: ["usmle-step-2-ck", "ielts-academic", "oet"],
    targetCadres: ["MEDICINE"],
    category: "international",
    difficulty: "hard",
  },

  {
    slug: "usmle-step-2-ck",
    name: "USMLE Step 2 CK",
    fullName: "United States Medical Licensing Examination Step 2 Clinical Knowledge",
    description:
      "Tests your clinical knowledge and ability to provide patient care under supervision. Step 2 CK is now the most important USMLE score for residency applications, as Step 1 has moved to pass/fail.",
    whoNeedsIt:
      "Medical graduates who have passed Step 1 and are pursuing US residency",
    administeredBy: "National Board of Medical Examiners (NBME) and FSMB",
    cost: "USD 645",
    costNaira: "Approximately N1,000,000",
    format:
      "Up to 318 multiple-choice questions across 8 blocks of 40 questions each",
    duration: "1 day (9 hours of testing time with breaks)",
    passingScore: "Minimum passing score of 209 (three-digit score reported)",
    validFor:
      "No expiry, but all Steps should ideally be completed within 7 years",
    canTakeInNigeria: true,
    testCentresInNigeria: ["Prometric Test Centre Lagos (Victoria Island)"],
    sections: [
      {
        name: "Internal Medicine",
        description:
          "Diagnosis and management of adult medical conditions including cardiology, pulmonology, endocrinology, and more.",
      },
      {
        name: "Surgery",
        description:
          "Pre-operative evaluation, surgical indications, post-operative care, and emergency surgical conditions.",
      },
      {
        name: "Obstetrics and Gynaecology",
        description:
          "Antenatal care, labour management, gynaecological conditions, and reproductive health.",
      },
      {
        name: "Paediatrics",
        description:
          "Child development, paediatric diseases, neonatal conditions, and immunisation schedules.",
      },
      {
        name: "Psychiatry",
        description:
          "Psychiatric disorders, pharmacotherapy, psychotherapy indications, and emergency psychiatry.",
      },
      {
        name: "Preventive Medicine and Ethics",
        description:
          "Screening guidelines, epidemiology, bioethics, patient safety, and quality improvement.",
      },
    ],
    preparationTips: [
      "Step 2 CK is now the key differentiator for residency. Aim for the highest score possible.",
      "Complete UWorld Step 2 CK question bank thoroughly. Review every explanation.",
      "Use AMBOSS as a supplementary question bank and reference.",
      "Study UpToDate for evidence-based management guidelines.",
      "Focus heavily on internal medicine, as it makes up the largest portion of the exam.",
      "Practise clinical vignette-style questions under timed conditions.",
      "Plan for 2 to 4 months of dedicated study after completing clinical rotations.",
    ],
    recommendedResources: [
      "UWorld Step 2 CK Qbank",
      "AMBOSS Step 2 CK",
      "Step 2 CK: First Aid for the USMLE",
      "UpToDate (clinical reference)",
      "Online MedEd video lectures",
      "Divine Intervention podcast (Dr. Divine)",
      "MTB 2 (Master the Boards Step 2)",
    ],
    registrationSteps: [
      "Ensure your ECFMG certification is active.",
      "Apply for Step 2 CK through your ECFMG account.",
      "Pay the USD 645 exam fee.",
      "Receive your scheduling permit (3-month eligibility window).",
      "Schedule at Prometric Lagos through prometric.com.",
      "Sit the exam. Results typically arrive within 3 to 4 weeks.",
    ],
    nigerianSpecificTips: [
      "Step 2 CK is now more important than Step 1 for matching into US residency. Prioritise a high score.",
      "Book the Prometric Lagos centre well in advance, especially during peak testing seasons (June to September).",
      "Consider completing clinical observerships or electives in the US before writing Step 2 CK.",
      "Nigerian doctors who score 240+ on Step 2 CK significantly improve their residency match chances.",
      "The exam is long (9 hours). Practise stamina by doing full-length timed practice tests.",
      "Join USMLE study groups on Telegram for shared resources and accountability.",
      "Factor in the cost of ECFMG pathway requirements (such as clinical experience verification) alongside the exam fee.",
    ],
    relatedExams: ["usmle-step-1", "ielts-academic", "oet"],
    targetCadres: ["MEDICINE"],
    category: "international",
    difficulty: "very-hard",
  },

  {
    slug: "nmc-cbt",
    name: "NMC CBT",
    fullName: "Nursing and Midwifery Council Computer-Based Test",
    description:
      "The computer-based test required for internationally trained nurses and midwives seeking registration with the UK Nursing and Midwifery Council. It assesses your nursing knowledge against UK standards of proficiency.",
    whoNeedsIt:
      "Internationally trained nurses and midwives who want to practise in the United Kingdom",
    administeredBy: "Nursing and Midwifery Council (NMC), UK",
    cost: "GBP 83",
    costNaira: "Approximately N160,000",
    format: "120 multiple-choice questions",
    duration: "4 hours",
    passingScore: "Determined each sitting based on standard setting (typically around 60%)",
    validFor: "2 years (to complete the NMC OSCE)",
    canTakeInNigeria: true,
    testCentresInNigeria: [
      "Pearson VUE Lagos",
      "Pearson VUE Abuja",
      "Pearson VUE Port Harcourt",
    ],
    sections: [
      {
        name: "Professional Values",
        description:
          "Questions on nursing ethics, professional standards, duty of care, consent, safeguarding, and NMC Code compliance.",
        questionCount: 30,
      },
      {
        name: "Communication and Interpersonal Skills",
        description:
          "Effective communication with patients, families, and multidisciplinary teams. Documentation and handover.",
        questionCount: 30,
      },
      {
        name: "Nursing Practice and Decision Making",
        description:
          "Clinical assessment, care planning, medication administration, and evidence-based nursing interventions.",
        questionCount: 30,
      },
      {
        name: "Leadership, Management and Team Working",
        description:
          "Delegation, supervision, workload management, and quality improvement in nursing practice.",
        questionCount: 30,
      },
    ],
    preparationTips: [
      "Study the NMC Code of Conduct thoroughly. Many questions are based on professional standards.",
      "Understand UK-specific nursing practices, which differ from Nigerian training in some areas.",
      "Practise medication calculations (drug dosage, IV drip rates, unit conversions).",
      "Focus on patient safety, safeguarding (adults and children), and consent laws in the UK.",
      "Use the NMC Test of Competence practice test on the official website.",
      "Study infection control, manual handling, and NEWS2 scoring.",
      "Allow 2 to 3 months of preparation, especially if not familiar with UK nursing standards.",
    ],
    recommendedResources: [
      "NMC official practice test (free on nmc.org.uk)",
      "The NMC Code: Professional Standards of Practice and Behaviour",
      "OSCE and CBT Success app",
      "Florence Academy CBT prep materials",
      "YouTube: NMC CBT preparation channels",
      "Lippincott Q&A Review for NCLEX-RN (supplementary)",
    ],
    registrationSteps: [
      "Create an NMC Online account at nmc.org.uk.",
      "Submit your application for NMC registration as an overseas nurse/midwife.",
      "Provide verified copies of your nursing qualification and transcripts.",
      "Demonstrate English language proficiency (IELTS Academic overall 7.0 with minimum 7.0 in each band, or OET Grade B).",
      "Once approved to sit the CBT, book your test through Pearson VUE.",
      "Pay the GBP 83 exam fee.",
      "Select a Pearson VUE centre in Nigeria and choose your preferred date.",
      "Attend the exam with valid identification.",
    ],
    nigerianSpecificTips: [
      "Pearson VUE centres are available in Lagos, Abuja, and Port Harcourt. Book early as slots fill quickly.",
      "You need IELTS Academic (7.0 overall, 7.0 in each band) or OET Grade B BEFORE you can book the CBT.",
      "The NMC application process requires your nursing school to verify your training directly. Contact your school early.",
      "Credential verification through NMCN (Nursing and Midwifery Council of Nigeria) can take several weeks.",
      "Join Facebook groups like 'Nigerian Nurses in the UK' for guidance and study materials.",
      "UK nursing practice emphasises patient autonomy and shared decision-making more than the Nigerian model.",
      "Many Nigerian nurses pass the CBT on first attempt with 2 to 3 months of focused preparation.",
    ],
    relatedExams: ["nmc-osce", "ielts-academic", "oet"],
    targetCadres: ["NURSING", "MIDWIFERY"],
    category: "international",
    difficulty: "moderate",
  },

  {
    slug: "nmc-osce",
    name: "NMC OSCE",
    fullName: "Nursing and Midwifery Council Objective Structured Clinical Examination",
    description:
      "The practical clinical assessment for UK nursing registration. After passing the NMC CBT, internationally trained nurses must pass this OSCE to demonstrate clinical competence in a simulated UK healthcare setting.",
    whoNeedsIt:
      "Internationally trained nurses and midwives who have passed the NMC CBT",
    administeredBy: "Nursing and Midwifery Council (NMC), UK",
    cost: "GBP 794",
    costNaira: "Approximately N1,540,000",
    format: "6 OSCE stations (4 clinical, 2 non-clinical)",
    duration: "Approximately 1 hour 30 minutes",
    passingScore:
      "Must pass all 6 stations. Each station is scored against specific criteria.",
    validFor: "Must be completed within 2 years of passing the CBT",
    canTakeInNigeria: false,
    sections: [
      {
        name: "APIE Station (Assessment, Planning, Implementation, Evaluation)",
        description:
          "Demonstrate the full nursing process: assess a patient, create a care plan, implement interventions, and evaluate outcomes.",
        duration: "20 minutes",
      },
      {
        name: "Clinical Skills Stations",
        description:
          "Perform clinical procedures such as medication administration, wound care, vital signs assessment, or catheter care.",
        duration: "10 minutes each",
      },
      {
        name: "Professional Values Station",
        description:
          "Scenario testing professional judgement, ethics, safeguarding, or raising concerns about patient safety.",
        duration: "10 minutes",
      },
      {
        name: "Evidence-Based Practice Station",
        description:
          "Demonstrate ability to use evidence to inform clinical decisions and explain rationale for care.",
        duration: "10 minutes",
      },
    ],
    preparationTips: [
      "Practise the APIE framework until it becomes second nature.",
      "Master medication administration using the 10 Rights of Medication Administration.",
      "Practise clinical skills on manikins: BLS, wound dressing, NEWS2, catheterisation.",
      "Communication skills are critical. Practise introducing yourself, confirming patient identity, and gaining consent.",
      "Study the NMC Standards of Proficiency for Registered Nurses.",
      "Book a place at an OSCE preparation course in the UK before your exam.",
      "Do mock OSCEs with peers and time yourself strictly.",
    ],
    recommendedResources: [
      "NMC OSCE blueprint (available on nmc.org.uk)",
      "Northampton University OSCE prep course",
      "Ulster University OSCE prep course",
      "YouTube: Florence Academy OSCE preparation videos",
      "OSCE and CBT Success app",
      "Clinical Skills for Nurses (Wiley)",
    ],
    registrationSteps: [
      "Pass the NMC CBT first.",
      "The NMC will send you a link to book your OSCE once your CBT result is confirmed.",
      "Pay the GBP 794 OSCE fee.",
      "Select a test centre in the UK (available at multiple universities and testing sites).",
      "Apply for a UK Standard Visitor visa if not already in the UK.",
      "Travel to the UK and attend the exam.",
      "Results are usually available within 10 working days.",
    ],
    nigerianSpecificTips: [
      "The NMC OSCE can ONLY be taken in the UK. Budget for travel, visa, and accommodation.",
      "Total cost including travel from Nigeria typically ranges from GBP 2,000 to GBP 3,500.",
      "Apply for your UK visa early. Include your OSCE booking confirmation as supporting evidence.",
      "Many Nigerian nurses arrive 1 to 2 weeks early to attend OSCE prep courses at UK universities.",
      "Centres in Northampton and Belfast tend to have more availability than London.",
      "Connect with Nigerian nurses already in the UK through Facebook groups for accommodation and logistics advice.",
      "If you fail a station, you can rebook just that station (partial re-sit) rather than retaking the entire OSCE.",
    ],
    relatedExams: ["nmc-cbt", "ielts-academic", "oet"],
    targetCadres: ["NURSING", "MIDWIFERY"],
    category: "international",
    difficulty: "hard",
  },

  {
    slug: "ielts-academic",
    name: "IELTS Academic",
    fullName: "International English Language Testing System (Academic)",
    description:
      "The most widely accepted English language proficiency test for healthcare professionals seeking to work internationally. Most UK, Australian, and Canadian health regulators require IELTS Academic scores as part of registration.",
    whoNeedsIt:
      "All healthcare professionals seeking registration in the UK, Australia, Canada, or New Zealand",
    administeredBy:
      "British Council, IDP Education, and Cambridge Assessment English",
    cost: "N280,000 to N315,000 (varies by centre and test format)",
    costNaira: "N280,000 to N315,000",
    format: "4 sections: Listening, Reading, Writing, and Speaking",
    duration: "2 hours 45 minutes (Listening, Reading, Writing) plus a separate Speaking test",
    passingScore:
      "Healthcare requirements: Overall 7.0 to 7.5 with minimum 7.0 in each band (varies by regulator)",
    validFor: "2 years from the test date",
    canTakeInNigeria: true,
    testCentresInNigeria: [
      "British Council Lagos",
      "British Council Abuja",
      "British Council Port Harcourt",
      "IDP Lagos",
      "IDP Abuja",
    ],
    sections: [
      {
        name: "Listening",
        description:
          "4 recorded conversations and monologues. 40 questions. Tests ability to understand main ideas, specific details, opinions, and attitudes.",
        questionCount: 40,
        duration: "30 minutes (plus 10 minutes transfer time)",
      },
      {
        name: "Reading",
        description:
          "3 long academic passages with tasks. 40 questions. Tests reading skills including skimming, scanning, identifying arguments, and understanding logical structure.",
        questionCount: 40,
        duration: "60 minutes",
      },
      {
        name: "Writing",
        description:
          "Task 1: Describe/summarise visual information (graph, table, chart) in at least 150 words. Task 2: Write an essay responding to a point of view or problem in at least 250 words.",
        duration: "60 minutes",
      },
      {
        name: "Speaking",
        description:
          "Face-to-face interview with an examiner. Part 1: Introduction and interview. Part 2: Long turn (speak for 2 minutes on a topic). Part 3: Discussion.",
        duration: "11 to 14 minutes",
      },
    ],
    preparationTips: [
      "Writing is the hardest section for most Nigerian candidates. Start practising early and get your essays marked.",
      "For healthcare registration, you typically need 7.0 in every band. One weak band can fail you.",
      "Listen to BBC podcasts, NHS health talks, and academic lectures daily to improve listening skills.",
      "Read academic journals and newspaper editorials to build reading speed and comprehension.",
      "Practise writing under timed conditions. Task 2 essay structure: introduction, 2 body paragraphs, conclusion.",
      "For speaking, practise thinking aloud on random topics. Fluency and coherence matter more than accent.",
      "Take at least 2 full mock tests under exam conditions before the real exam.",
    ],
    recommendedResources: [
      "Cambridge IELTS practice test books (Books 15 to 19)",
      "IELTS Liz website (free writing and speaking tips)",
      "British Council free IELTS preparation course",
      "Road to IELTS (British Council online tool)",
      "Band 9 IELTS Writing Task 2 Essays (book)",
      "BBC Learning English",
      "IELTS Advantage website",
    ],
    registrationSteps: [
      "Visit the British Council or IDP website for Nigeria.",
      "Create an account and select 'IELTS Academic' as your test type.",
      "Choose between paper-based or computer-delivered format.",
      "Select your preferred test centre and date.",
      "Pay the exam fee (N280,000 to N315,000 depending on centre).",
      "Upload a passport photograph and provide identification details.",
      "Receive your confirmation with test venue and time details.",
      "Attend the test with your valid international passport.",
    ],
    nigerianSpecificTips: [
      "Computer-delivered IELTS gives results in 3 to 5 days versus 13 days for paper-based. Choose wisely based on your deadline.",
      "British Council Lagos (Adeola Odeku, VI) and Abuja centres are the largest and most established.",
      "The Speaking test may be on a different day from the other three sections. Check your schedule carefully.",
      "Writing is consistently the lowest-scoring band for Nigerian candidates. Invest in writing preparation specifically.",
      "Avoid memorised phrases or 'templates' that sound unnatural. Examiners penalise obviously rehearsed answers.",
      "Register 4 to 6 weeks before your preferred date. Popular dates (especially Saturdays) fill up fast.",
      "Many health regulators now accept OET as an alternative. Consider OET if you struggle with general academic IELTS topics.",
      "IELTS scores expire after 2 years. Time your exam so the score is still valid when you submit your registration application.",
    ],
    relatedExams: ["oet", "plab-1", "nmc-cbt"],
    targetCadres: [
      "MEDICINE",
      "DENTISTRY",
      "NURSING",
      "MIDWIFERY",
      "PHARMACY",
      "MEDICAL_LAB_SCIENCE",
      "RADIOGRAPHY",
      "PHYSIOTHERAPY",
      "OPTOMETRY",
    ],
    category: "international",
    difficulty: "moderate",
  },

  {
    slug: "oet",
    name: "OET",
    fullName: "Occupational English Test",
    description:
      "A healthcare-specific English language test accepted by regulators in the UK, Australia, New Zealand, Ireland, and other countries. Unlike IELTS, all reading and listening content is drawn from healthcare contexts, making it more relevant for clinical professionals.",
    whoNeedsIt:
      "Healthcare professionals who need to demonstrate English proficiency for international registration. Accepted by GMC, NMC, AHPRA, and others.",
    administeredBy: "Cambridge Boxhill Language Assessment (CBLA)",
    cost: "Approximately N150,000 (AUD 587 for the full test)",
    costNaira: "Approximately N150,000",
    format: "4 sub-tests: Listening, Reading, Writing, Speaking",
    duration: "Approximately 3 hours",
    passingScore:
      "Grade B (score of 350+) in each sub-test for most regulators",
    validFor: "2 years from the test date",
    canTakeInNigeria: true,
    testCentresInNigeria: [
      "OET test venue Lagos",
      "OET test venue Abuja",
    ],
    sections: [
      {
        name: "Listening",
        description:
          "Healthcare-themed recordings including consultations and lectures. Tests ability to follow health professional conversations and extract key clinical information.",
        questionCount: 42,
        duration: "Approximately 40 minutes",
      },
      {
        name: "Reading",
        description:
          "3 parts with healthcare-themed texts. Tests skimming, scanning, and detailed comprehension of clinical and health policy material.",
        questionCount: 42,
        duration: "60 minutes",
      },
      {
        name: "Writing",
        description:
          "Write a profession-specific letter (referral, discharge, or transfer letter) based on case notes. The task is tailored to your healthcare profession.",
        duration: "45 minutes",
      },
      {
        name: "Speaking",
        description:
          "Two role-plays simulating workplace communication. You play the healthcare professional and the examiner plays the patient or carer.",
        duration: "Approximately 20 minutes",
      },
    ],
    preparationTips: [
      "The writing sub-test is profession-specific. Practise writing clinical letters for your specific cadre.",
      "Familiarise yourself with the OET writing criteria: purpose, content, tone, and language.",
      "For speaking, practise clinical role-plays. Focus on empathy, clear explanations, and checking understanding.",
      "Reading Part A requires rapid scanning. Practise identifying key information quickly across multiple texts.",
      "Listening content is healthcare-focused, so your clinical vocabulary is an advantage over IELTS.",
      "Take OET practice tests on the official OET website to understand the format.",
      "If you score well on listening and reading but struggle with writing, consider OET over IELTS.",
    ],
    recommendedResources: [
      "Official OET preparation materials (oet.com)",
      "OET Masterclass (textbook)",
      "Swoosh English OET preparation",
      "E2 Language OET course (online)",
      "OET official practice tests",
      "YouTube: E2 OET preparation videos",
    ],
    registrationSteps: [
      "Create an account at oet.com.",
      "Select your healthcare profession (medicine, nursing, pharmacy, etc.).",
      "Choose between OET on paper or OET on computer.",
      "Select a test venue in Nigeria and choose your preferred date.",
      "Pay the test fee.",
      "Receive your confirmation and test day instructions.",
      "Attend the test with valid identification.",
    ],
    nigerianSpecificTips: [
      "OET is increasingly accepted as an alternative to IELTS for healthcare registration. Check if your target regulator accepts it.",
      "The GMC (UK doctors), NMC (UK nurses), and AHPRA (Australia) all accept OET Grade B.",
      "OET is generally considered easier for healthcare professionals because the content is clinical rather than general academic.",
      "The writing task is a clinical letter, not an essay. If you are comfortable writing referral letters, this may suit you better than IELTS.",
      "OET in Nigeria is available at select venues in Lagos and Abuja. Check oet.com for current locations.",
      "Results are typically available within 16 business days.",
      "You can re-sit individual sub-tests rather than the whole exam, saving money if you only fail one component.",
    ],
    relatedExams: ["ielts-academic", "plab-1", "nmc-cbt"],
    targetCadres: [
      "MEDICINE",
      "DENTISTRY",
      "NURSING",
      "MIDWIFERY",
      "PHARMACY",
      "MEDICAL_LAB_SCIENCE",
      "RADIOGRAPHY",
      "PHYSIOTHERAPY",
      "OPTOMETRY",
    ],
    category: "international",
    difficulty: "moderate",
  },

  {
    slug: "prometric-gulf",
    name: "Prometric (Gulf States)",
    fullName: "Prometric Healthcare Professional Licensing Examination (Gulf States)",
    description:
      "Licensing exams required for healthcare professionals seeking to work in Gulf countries including Saudi Arabia, UAE, Qatar, Bahrain, Oman, and Kuwait. Each country has its own licensing authority, but exams are administered through Prometric centres.",
    whoNeedsIt:
      "Healthcare professionals seeking to practise in Saudi Arabia (SCFHS), UAE (DHA/HAAD/MOH), Qatar (QCHP), and other Gulf states",
    administeredBy:
      "Prometric on behalf of SCFHS (Saudi), DHA/HAAD/MOH (UAE), QCHP (Qatar), NHRA (Bahrain)",
    cost: "USD 200 to USD 400 (varies by country and profession)",
    costNaira: "Approximately N310,000 to N620,000",
    format: "Multiple-choice questions, specialty-specific",
    duration: "Varies by exam (typically 3 to 4 hours)",
    passingScore: "Varies by licensing authority (typically 60% to 70%)",
    validFor: "Varies by country (typically 1 to 2 years)",
    canTakeInNigeria: true,
    testCentresInNigeria: ["Prometric Test Centre Lagos (Victoria Island)"],
    sections: [
      {
        name: "Clinical Knowledge",
        description:
          "Core clinical knowledge in your specialty area, including diagnosis, investigation, and management.",
      },
      {
        name: "Pharmacology",
        description:
          "Drug prescribing, dosage calculations, drug interactions, and therapeutic protocols relevant to your profession.",
      },
      {
        name: "Professional Practice",
        description:
          "Ethics, patient safety, infection control, and professional standards as practised in Gulf healthcare settings.",
      },
    ],
    preparationTips: [
      "Each Gulf country has slightly different exam content. Confirm which exam you need: SCFHS, DHA, HAAD, MOH, or QCHP.",
      "Prometric exams are specialty-specific. Study materials for your exact profession and specialisation.",
      "Use past questions and study guides specific to the licensing authority (e.g., SCFHS review materials for Saudi).",
      "Focus on clinical guidelines commonly used in Gulf hospitals (many follow American or British guidelines).",
      "Pharmacology questions are common across all Gulf exams. Review drug dosages and interactions.",
      "Many candidates find Gulf Prometric exams easier than PLAB or USMLE, but preparation is still essential.",
      "Allow 1 to 3 months of preparation depending on your clinical experience level.",
    ],
    recommendedResources: [
      "Prometric self-assessment tests (available on prometric.com)",
      "SCFHS exam prep materials (for Saudi)",
      "DHA exam prep books (for Dubai)",
      "Elsevier review books for your specialty",
      "Prometricmcq.com practice questions",
      "Gulf medical exam prep groups on Telegram",
    ],
    registrationSteps: [
      "Determine which licensing authority you are applying to (SCFHS, DHA, HAAD, MOH, QCHP, etc.).",
      "Apply for eligibility through the relevant licensing authority's website.",
      "Once approved, receive your eligibility ID or scheduling permit.",
      "Create an account on prometric.com and schedule your exam.",
      "Pay the exam fee (USD 200 to 400).",
      "Select the Prometric centre in Lagos and choose a date.",
      "Sit the exam with valid identification.",
    ],
    nigerianSpecificTips: [
      "Gulf Prometric exams can be taken at the Prometric centre in Lagos (Victoria Island).",
      "Saudi Arabia (SCFHS) is the most common destination for Nigerian healthcare workers going to the Gulf.",
      "Recruitment agencies often handle the Prometric booking process for you. Verify their legitimacy before paying.",
      "Some Gulf employers sponsor the exam fee and even provide study materials. Negotiate this upfront.",
      "The Prometric centre in Lagos serves multiple exam types. Ensure you book the correct exam code.",
      "Processing of Gulf licensing after passing the exam can take 2 to 6 months depending on the country.",
      "Gulf salaries for healthcare professionals are typically tax-free. Factor this into your career decision.",
    ],
    relatedExams: ["ielts-academic", "oet"],
    targetCadres: [
      "MEDICINE",
      "DENTISTRY",
      "NURSING",
      "MIDWIFERY",
      "PHARMACY",
      "MEDICAL_LAB_SCIENCE",
      "RADIOGRAPHY",
      "PHYSIOTHERAPY",
    ],
    category: "international",
    difficulty: "moderate",
  },

  {
    slug: "amc-mcq",
    name: "AMC MCQ",
    fullName: "Australian Medical Council Multiple Choice Examination",
    description:
      "The first stage examination for international medical graduates seeking to practise medicine in Australia. Tests applied medical knowledge across all major clinical disciplines at the level of a graduating Australian medical student.",
    whoNeedsIt:
      "International medical graduates (IMGs) who want to practise as doctors in Australia",
    administeredBy: "Australian Medical Council (AMC)",
    cost: "AUD 2,980",
    costNaira: "Approximately N3,050,000",
    format: "150 multiple-choice questions (MCQs) in a single 3.5-hour session",
    duration: "3 hours 30 minutes",
    passingScore: "Determined each sitting by standard setting (approximately 60%)",
    validFor:
      "You must pass the AMC Clinical Exam within 6 years of passing the MCQ",
    canTakeInNigeria: true,
    testCentresInNigeria: ["Pearson VUE Lagos"],
    sections: [
      {
        name: "Medicine",
        description:
          "Adult internal medicine including cardiology, respiratory, gastroenterology, endocrinology, neurology, and infectious diseases.",
      },
      {
        name: "Surgery",
        description:
          "General surgery, orthopaedics, urology, and surgical emergencies.",
      },
      {
        name: "Obstetrics and Gynaecology",
        description:
          "Pregnancy, labour, postnatal care, gynaecological conditions, and reproductive health.",
      },
      {
        name: "Paediatrics",
        description:
          "Child health, development, neonatal conditions, and paediatric emergencies.",
      },
      {
        name: "Psychiatry",
        description:
          "Common psychiatric conditions, emergency psychiatry, and psychopharmacology.",
      },
      {
        name: "Public Health and Ethics",
        description:
          "Preventive medicine, epidemiology, medical ethics, and Australian healthcare system knowledge.",
      },
    ],
    preparationTips: [
      "The AMC MCQ covers a broad range of clinical topics. Revise systematically across all disciplines.",
      "Use AMC-specific question banks. The exam style differs from USMLE and PLAB.",
      "Study Australian clinical guidelines, especially for emergency management and primary care.",
      "Focus on common presentations in Australian general practice and emergency departments.",
      "The exam includes clinical vignettes. Practise identifying the most likely diagnosis from limited information.",
      "Many questions test management decisions rather than pure diagnosis. Know when to refer, admit, or treat.",
      "Allow 3 to 6 months of dedicated study.",
    ],
    recommendedResources: [
      "AMC MCQ Handbook and study guide",
      "AMCQBank (dedicated AMC question bank)",
      "Therapeutic Guidelines (Australian prescribing reference)",
      "Australian Medicines Handbook",
      "eTG Complete (Therapeutic Guidelines online)",
      "AMC study groups on Facebook and Telegram",
    ],
    registrationSteps: [
      "Create an account on the AMC website (amc.org.au).",
      "Submit your application for AMC MCQ eligibility, including your medical qualification documents.",
      "The AMC will verify your primary medical qualification (this can take several months).",
      "Once deemed eligible, pay the AUD 2,980 exam fee.",
      "Schedule your exam through Pearson VUE.",
      "Select the Pearson VUE centre in Lagos and choose your date.",
      "Sit the exam with valid identification.",
    ],
    nigerianSpecificTips: [
      "The AUD 2,980 fee makes this one of the most expensive initial licensing exams. Budget carefully.",
      "AMC document verification of Nigerian medical degrees can take 3 to 6 months. Start the process early.",
      "The Pearson VUE centre in Lagos offers the AMC MCQ. Book well in advance.",
      "Australia has a structured pathway for IMGs, but the process from exam to full registration can take years.",
      "After passing the MCQ, you must pass the AMC Clinical Exam (OSCE) which is held ONLY in Australia.",
      "Consider whether the Standard Pathway (AMC exams) or Competent Authority Pathway (for UK/US-trained doctors) is better for you.",
      "Join AMC preparation groups on Telegram. Several Nigerian doctors in Australia share resources and mentorship.",
    ],
    relatedExams: ["ielts-academic", "oet"],
    targetCadres: ["MEDICINE"],
    category: "international",
    difficulty: "hard",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NIGERIAN PROFESSIONAL EXAMS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    slug: "mdcn-assessment",
    name: "MDCN Assessment Exam",
    fullName: "Medical and Dental Council of Nigeria Assessment Examination",
    description:
      "The licensing examination for foreign-trained medical and dental graduates who wish to practise in Nigeria. The exam verifies that your medical knowledge and clinical skills meet Nigerian standards.",
    whoNeedsIt:
      "Doctors and dentists who obtained their primary medical qualification outside Nigeria and want to practise in the country",
    administeredBy: "Medical and Dental Council of Nigeria (MDCN)",
    cost: "Approximately N100,000 to N150,000 (subject to change)",
    costNaira: "N100,000 to N150,000",
    format: "Two parts: Written examination followed by Clinical/Oral examination",
    duration:
      "Written: 3 hours. Clinical: varies (typically a full day of clinical stations)",
    passingScore: "50% in each component",
    validFor: "Leads to full MDCN registration upon passing both parts",
    canTakeInNigeria: true,
    testCentresInNigeria: [
      "MDCN Office Lagos",
      "MDCN Office Abuja",
      "Select teaching hospitals as designated by MDCN",
    ],
    sections: [
      {
        name: "Written Examination",
        description:
          "MCQs and short answer questions covering medicine, surgery, obstetrics & gynaecology, paediatrics, and community medicine.",
        duration: "3 hours",
      },
      {
        name: "Clinical/Oral Examination",
        description:
          "Clinical examination of real patients, oral viva, and practical skills assessment at a designated teaching hospital.",
      },
    ],
    preparationTips: [
      "Review the Nigerian medical curriculum structure, especially common tropical diseases and local health challenges.",
      "Study conditions common in Nigerian clinical practice: malaria, typhoid, sickle cell disease, HIV/AIDS, and tuberculosis.",
      "Practise clinical examination skills on real patients if possible.",
      "Review pharmacology with emphasis on drugs available in the Nigerian Essential Medicines List.",
      "The oral examination requires you to explain your clinical reasoning clearly. Practise verbalising your thought process.",
      "Connect with doctors who have previously taken the assessment for guidance on exam format and expectations.",
    ],
    recommendedResources: [
      "Davidson's Principles and Practice of Medicine",
      "Bailey and Love's Short Practice of Surgery",
      "Nelson Textbook of Pediatrics",
      "Dutta's Textbook of Obstetrics",
      "Nigerian Essential Medicines List",
      "MDCN past questions (if available through study groups)",
    ],
    registrationSteps: [
      "Visit the MDCN office or website (mdcn.gov.ng) to obtain the assessment exam application form.",
      "Submit your foreign medical degree, transcripts, and supporting documents for verification.",
      "MDCN will verify your qualification with the issuing institution.",
      "Pay the examination fee once your eligibility is confirmed.",
      "Receive notification of the exam date and venue.",
      "Attend the written examination at the designated centre.",
      "If you pass the written, attend the clinical/oral examination at a teaching hospital.",
      "Upon passing both parts, apply for full MDCN registration.",
    ],
    nigerianSpecificTips: [
      "The MDCN assessment is held infrequently (often once or twice a year). Check the MDCN website or visit their office for the current schedule.",
      "Document verification can take months. Submit your application well ahead of time.",
      "The clinical exam is usually held at a teaching hospital in Lagos or Abuja. Be prepared to travel.",
      "Foreign-trained Nigerian doctors returning home must also take this exam. Having a Nigerian background can help with the clinical context.",
      "After passing, you will need to complete a one-year internship (housemanship) at an MDCN-accredited hospital if you have not done so already.",
      "The exam tests knowledge relevant to Nigerian clinical practice, so review local disease burden and treatment protocols.",
    ],
    relatedExams: ["nmcn-licensing-exam"],
    targetCadres: ["MEDICINE", "DENTISTRY"],
    category: "nigerian",
    difficulty: "hard",
  },

  {
    slug: "nmcn-licensing-exam",
    name: "NMCN Licensing Exam",
    fullName: "Nursing and Midwifery Council of Nigeria Licensing Examination",
    description:
      "The national licensing examination for nurses and midwives seeking to practise in Nigeria. All graduates of accredited nursing and midwifery programmes must pass this exam to be registered and licensed by the NMCN.",
    whoNeedsIt:
      "Graduates of nursing and midwifery programmes in Nigeria seeking professional registration and licensure",
    administeredBy: "Nursing and Midwifery Council of Nigeria (NMCN)",
    cost: "Approximately N30,000 to N50,000",
    costNaira: "N30,000 to N50,000",
    format: "Written examination (MCQs and essay questions) plus practical assessment",
    duration: "Written: 3 hours. Practical: varies by programme",
    passingScore: "50% aggregate across all components",
    validFor:
      "Leads to professional registration with NMCN. Must renew licence periodically.",
    canTakeInNigeria: true,
    testCentresInNigeria: [
      "Various NMCN-approved examination centres across all states",
    ],
    sections: [
      {
        name: "Nursing Theory",
        description:
          "MCQs and essay questions covering fundamentals of nursing, medical-surgical nursing, community health nursing, and nursing ethics.",
        duration: "3 hours",
      },
      {
        name: "Practical Assessment",
        description:
          "Clinical skills demonstration including patient assessment, nursing procedures, medication administration, and care planning.",
      },
    ],
    preparationTips: [
      "Review your school notes and textbooks systematically across all nursing subjects.",
      "Focus on fundamentals: vital signs, medication administration, wound care, and patient assessment.",
      "Practise nursing calculations (drug dosages, IV fluid rates, BMI).",
      "Study the Nurses Code of Ethics as published by NMCN.",
      "Review community health nursing topics, especially primary healthcare in the Nigerian context.",
      "Practise essay writing for nursing topics. Be clear, structured, and use proper medical terminology.",
      "Form study groups with classmates and practise clinical procedures together.",
    ],
    recommendedResources: [
      "Brunner and Suddarth's Textbook of Medical-Surgical Nursing",
      "Fundamentals of Nursing (Kozier & Erb)",
      "NMCN past examination questions",
      "Community Health Nursing in Nigeria (local textbooks)",
      "Nursing Drug Handbook",
      "School of nursing lecture notes and clinical guides",
    ],
    registrationSteps: [
      "Complete your nursing or midwifery programme at an NMCN-accredited institution.",
      "Your school will register you for the licensing exam as part of your graduating class.",
      "Pay the examination fee through your institution.",
      "Receive your exam timetable and venue assignment from your school.",
      "Sit the written examination at the assigned centre.",
      "Complete the practical assessment at your training institution or designated hospital.",
      "Await results from NMCN (typically published within 2 to 3 months).",
      "Upon passing, apply for your NMCN registration certificate and practising licence.",
    ],
    nigerianSpecificTips: [
      "The NMCN licensing exam is typically held twice a year (around May and November). Confirm exact dates with your school.",
      "Results and registration processing can be slow. Follow up with the NMCN office if there are delays.",
      "Your NMCN registration is required before you can be employed as a nurse in any Nigerian hospital.",
      "Keep your registration current. The NMCN requires periodic licence renewal and continuing education.",
      "If you plan to work abroad later, your NMCN registration and exam pass are needed for international credential verification.",
      "The practical exam is conducted at your training institution. Familiarise yourself with the exact equipment and procedures used there.",
    ],
    relatedExams: ["nmc-cbt", "ielts-academic"],
    targetCadres: ["NURSING", "MIDWIFERY"],
    category: "nigerian",
    difficulty: "moderate",
  },

  {
    slug: "pcn-pep",
    name: "PCN PEP",
    fullName: "Pharmacists Council of Nigeria Pre-registration Examination for Pharmacists",
    description:
      "The national licensing examination for pharmacy graduates seeking registration to practise in Nigeria. All graduates of accredited pharmacy programmes must pass the PEP after completing their internship to be registered by the PCN.",
    whoNeedsIt:
      "Pharmacy graduates who have completed their one-year pre-registration internship in Nigeria",
    administeredBy: "Pharmacists Council of Nigeria (PCN)",
    cost: "Approximately N50,000 to N80,000",
    costNaira: "N50,000 to N80,000",
    format: "Written examination (MCQs) covering all major pharmacy disciplines",
    duration: "3 hours",
    passingScore: "50% overall pass mark",
    validFor:
      "Leads to full PCN registration and pharmacist practising licence",
    canTakeInNigeria: true,
    testCentresInNigeria: [
      "PCN-designated examination centres across Nigeria",
    ],
    sections: [
      {
        name: "Pharmaceutical Chemistry",
        description:
          "Drug chemistry, structure-activity relationships, analytical methods, and quality control.",
      },
      {
        name: "Pharmacology and Therapeutics",
        description:
          "Drug actions, adverse effects, drug interactions, and clinical therapeutics for common diseases.",
      },
      {
        name: "Pharmaceutics and Pharmaceutical Technology",
        description:
          "Drug formulation, dosage forms, manufacturing processes, and biopharmaceutics.",
      },
      {
        name: "Pharmacognosy",
        description:
          "Natural product chemistry, herbal medicines, and traditional medicine relevant to Nigerian pharmacy practice.",
      },
      {
        name: "Clinical Pharmacy and Pharmacy Practice",
        description:
          "Patient counselling, prescription review, drug information services, and pharmacy law in Nigeria.",
      },
    ],
    preparationTips: [
      "Review all five major pharmacy disciplines thoroughly. The exam tests breadth of knowledge.",
      "Focus on pharmacology and therapeutics as it typically carries the highest weight.",
      "Study the Nigerian Drug Formulary and Essential Medicines List.",
      "Review pharmacy law and ethics, including the Pharmacy Council Act and Poisons and Pharmacy Act.",
      "Practise MCQs from past PEP papers. Many questions follow a predictable pattern.",
      "Review clinical pharmacy concepts: drug interactions, adverse drug reactions, and patient counselling.",
      "Form study groups during your pre-registration year to maintain exam preparation momentum.",
    ],
    recommendedResources: [
      "Goodman and Gilman's Pharmacological Basis of Therapeutics",
      "Aulton's Pharmaceutics: The Design and Manufacture of Medicines",
      "BNF (British National Formulary)",
      "Trease and Evans Pharmacognosy",
      "Nigerian Drug Formulary",
      "PCN past examination questions",
      "Rang and Dale's Pharmacology",
    ],
    registrationSteps: [
      "Graduate from a PCN-accredited pharmacy programme.",
      "Complete your one-year pre-registration internship at an approved facility.",
      "Obtain your internship completion certificate from your supervising pharmacist and the PCN.",
      "Register for the PEP through the PCN (online or at PCN offices).",
      "Pay the examination fee.",
      "Receive your exam date and venue assignment.",
      "Sit the examination at the designated centre.",
      "Upon passing, apply for your full PCN registration and practising licence.",
    ],
    nigerianSpecificTips: [
      "The PEP is usually held once a year, typically between September and November. Confirm dates with the PCN.",
      "You must complete your full one-year internship before you can sit the PEP. No exemptions.",
      "During your internship, start reviewing for the PEP. Do not wait until after your internship ends.",
      "PCN registration is mandatory for employment in any pharmacy practice setting in Nigeria.",
      "Community pharmacy, hospital pharmacy, and industrial pharmacy graduates all take the same PEP.",
      "After passing, keep your PCN licence current. Renewal requires evidence of continuing professional development.",
      "If you plan to practise abroad, your PCN registration is needed for credential verification by international pharmacy regulators.",
    ],
    relatedExams: ["ielts-academic", "oet", "prometric-gulf"],
    targetCadres: ["PHARMACY"],
    category: "nigerian",
    difficulty: "moderate",
  },
];

export function getExamBySlug(slug: string): ExamGuide | undefined {
  return EXAM_GUIDES.find((e) => e.slug === slug);
}

export function getExamsByCategory(
  category: "international" | "nigerian",
): ExamGuide[] {
  return EXAM_GUIDES.filter((e) => e.category === category);
}

export function getAllExamSlugs(): string[] {
  return EXAM_GUIDES.map((e) => e.slug);
}
