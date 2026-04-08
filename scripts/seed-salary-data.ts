/**
 * Seed baseline salary intelligence data for CadreHealth.
 *
 * Sources:
 * - NSIWC CONMESS/CONHESS salary structures (2023 review, 25-35% increase)
 * - ClinIKEHR salary guides 2026
 * - Glassdoor/PayScale Nigeria 2025-2026
 * - Punch HealthWise, Nairametrics reporting
 * - Industry recruiter benchmarks
 *
 * All figures are monthly in NGN. "baseSalary" = CONMESS/CONHESS gross (basic + statutory allowances).
 * "totalMonthlyTakeHome" = realistic total including locum/moonlighting where applicable.
 *
 * Tagged to a system professional so seed data can be cleanly removed once real user reports accumulate.
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-salary-data.ts
 */

import { PrismaClient, CadreProfessionalCadre } from "@prisma/client";

const prisma = new PrismaClient();

const SYSTEM_EMAIL = "salary-data@cadrehealth.system";

interface SalaryEntry {
  cadre: CadreProfessionalCadre;
  role: string;
  state: string;
  city?: string;
  facilityType: "PUBLIC_TERTIARY" | "PUBLIC_SECONDARY" | "PUBLIC_PRIMARY" | "PRIVATE_TERTIARY" | "PRIVATE_SECONDARY" | "PRIVATE_CLINIC" | "FAITH_BASED" | "NGO" | "MILITARY" | "INTERNATIONAL";
  yearsOfExperience: number;
  baseSalary: number;       // Gross monthly (basic + housing + transport + hazard)
  allowances?: number;      // Additional allowances (call duty, shift, rural)
  callDutyPay?: number;
  locumIncome?: number;
  totalMonthlyTakeHome?: number;
  paidOnTime?: boolean;
  averagePayDelayDays?: number;
}

// ─── CONMESS-based data (Doctors/Dentists) ──────────────────────────────────
// Post-2023 review: 25% increase for grades 01-06, 35% for grade 07
// Basic + Housing (50%) + Transport (25%) + Hazard (50%) = ~2.25x basic

// ─── CONHESS-based data (Nurses, Pharmacists, Lab Scientists, etc.) ─────────
// Post-2023 review: 25% increase for grades 01-14, 35% for grade 15
// Hazard revised: L01-05 N10,000; L06-15 N18,000

const SALARY_DATA: SalaryEntry[] = [
  // ══════════════════════════════════════════════════════════════════════
  //                          MEDICINE (CONMESS)
  // ══════════════════════════════════════════════════════════════════════

  // CONMESS 01 - House Officer (Basic: N254,616-N287,031; Gross: N633,388-N706,820)
  { cadre: "MEDICINE", role: "House Officer", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 633388, callDutyPay: 60000, totalMonthlyTakeHome: 580000, paidOnTime: true },
  { cadre: "MEDICINE", role: "House Officer", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 633388, callDutyPay: 60000, totalMonthlyTakeHome: 575000, paidOnTime: true },
  { cadre: "MEDICINE", role: "House Officer", state: "Rivers", city: "Port Harcourt", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 633388, callDutyPay: 60000, totalMonthlyTakeHome: 570000, paidOnTime: true },
  { cadre: "MEDICINE", role: "House Officer", state: "Oyo", city: "Ibadan", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 633388, callDutyPay: 60000, totalMonthlyTakeHome: 565000, paidOnTime: true },
  { cadre: "MEDICINE", role: "House Officer", state: "Kano", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 633388, callDutyPay: 60000, totalMonthlyTakeHome: 560000, paidOnTime: true },

  // CONMESS 02 - Medical Officer (Basic: N281,380-N324,480; Gross: N703,450-N800,600)
  { cadre: "MEDICINE", role: "Medical Officer", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 2, baseSalary: 750000, callDutyPay: 70000, locumIncome: 200000, totalMonthlyTakeHome: 680000, paidOnTime: true },
  { cadre: "MEDICINE", role: "Medical Officer", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_SECONDARY", yearsOfExperience: 1, baseSalary: 500000, totalMonthlyTakeHome: 420000, paidOnTime: false, averagePayDelayDays: 21 },
  { cadre: "MEDICINE", role: "Medical Officer", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 2, baseSalary: 750000, callDutyPay: 70000, locumIncome: 180000, totalMonthlyTakeHome: 670000, paidOnTime: true },
  { cadre: "MEDICINE", role: "Medical Officer", state: "Lagos", city: "Lagos", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 2, baseSalary: 700000, allowances: 150000, locumIncome: 200000, totalMonthlyTakeHome: 850000, paidOnTime: true },
  { cadre: "MEDICINE", role: "Medical Officer", state: "FCT", city: "Abuja", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 3, baseSalary: 600000, allowances: 120000, locumIncome: 180000, totalMonthlyTakeHome: 800000, paidOnTime: true },
  { cadre: "MEDICINE", role: "Medical Officer", state: "Oyo", city: "Ibadan", facilityType: "PUBLIC_SECONDARY", yearsOfExperience: 2, baseSalary: 500000, callDutyPay: 60000, totalMonthlyTakeHome: 480000, paidOnTime: false, averagePayDelayDays: 30 },

  // CONMESS 03 - Registrar (Basic: N339,181-N400,776; Gross: N848,952-N981,940)
  { cadre: "MEDICINE", role: "Registrar", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 4, baseSalary: 900000, callDutyPay: 80000, locumIncome: 250000, totalMonthlyTakeHome: 850000, paidOnTime: true },
  { cadre: "MEDICINE", role: "Registrar", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 5, baseSalary: 950000, callDutyPay: 80000, locumIncome: 200000, totalMonthlyTakeHome: 830000, paidOnTime: true },
  { cadre: "MEDICINE", role: "Registrar", state: "Rivers", city: "Port Harcourt", facilityType: "PUBLIC_SECONDARY", yearsOfExperience: 4, baseSalary: 750000, callDutyPay: 70000, totalMonthlyTakeHome: 700000, paidOnTime: false, averagePayDelayDays: 14 },

  // CONMESS 04 - Senior Registrar (Basic: N451,516-N534,936; Gross: N1,118,790-N1,303,170)
  { cadre: "MEDICINE", role: "Senior Registrar", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 7, baseSalary: 1200000, callDutyPay: 90000, locumIncome: 350000, totalMonthlyTakeHome: 1100000, paidOnTime: true },
  { cadre: "MEDICINE", role: "Senior Registrar", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 7, baseSalary: 1200000, callDutyPay: 90000, locumIncome: 300000, totalMonthlyTakeHome: 1050000, paidOnTime: true },
  { cadre: "MEDICINE", role: "Senior Registrar", state: "Rivers", city: "Port Harcourt", facilityType: "PUBLIC_SECONDARY", yearsOfExperience: 6, baseSalary: 950000, callDutyPay: 80000, totalMonthlyTakeHome: 900000, paidOnTime: false, averagePayDelayDays: 14 },
  { cadre: "MEDICINE", role: "Senior Registrar", state: "Kano", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 7, baseSalary: 1200000, callDutyPay: 90000, locumIncome: 200000, totalMonthlyTakeHome: 1000000, paidOnTime: true },

  // CONMESS 05 - Consultant (Basic: N624,182-N750,772; Gross: N1,505,409-N1,788,463)
  { cadre: "MEDICINE", role: "Consultant", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 10, baseSalary: 1650000, callDutyPay: 100000, locumIncome: 500000, totalMonthlyTakeHome: 1500000, paidOnTime: true },
  { cadre: "MEDICINE", role: "Consultant", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 12, baseSalary: 1700000, callDutyPay: 100000, locumIncome: 400000, totalMonthlyTakeHome: 1450000, paidOnTime: true },
  { cadre: "MEDICINE", role: "Consultant", state: "Lagos", city: "Lagos", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 10, baseSalary: 2500000, allowances: 500000, totalMonthlyTakeHome: 3000000, paidOnTime: true },
  { cadre: "MEDICINE", role: "Consultant", state: "FCT", city: "Abuja", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 12, baseSalary: 2000000, allowances: 400000, totalMonthlyTakeHome: 2400000, paidOnTime: true },
  { cadre: "MEDICINE", role: "Consultant", state: "Ogun", city: "Abeokuta", facilityType: "PUBLIC_SECONDARY", yearsOfExperience: 15, baseSalary: 1300000, callDutyPay: 80000, totalMonthlyTakeHome: 1200000, paidOnTime: false, averagePayDelayDays: 45 },
  { cadre: "MEDICINE", role: "Consultant", state: "Kano", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 12, baseSalary: 1650000, callDutyPay: 100000, locumIncome: 250000, totalMonthlyTakeHome: 1400000, paidOnTime: true },

  // CONMESS 06 - Chief Consultant (Basic: N824,610-N981,560; Gross: N1,975,375-N2,323,900)
  { cadre: "MEDICINE", role: "Chief Consultant", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 18, baseSalary: 2150000, callDutyPay: 120000, locumIncome: 600000, totalMonthlyTakeHome: 1950000, paidOnTime: true },
  { cadre: "MEDICINE", role: "Chief Consultant", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 20, baseSalary: 2300000, callDutyPay: 120000, totalMonthlyTakeHome: 1900000, paidOnTime: true },

  // ══════════════════════════════════════════════════════════════════════
  //                          NURSING (CONHESS)
  // ══════════════════════════════════════════════════════════════════════

  // CONHESS 08 - Nursing Officer I (Basic: N122,850; Gross: ~N276,413)
  { cadre: "NURSING", role: "Nursing Officer I", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 276413, callDutyPay: 15000, totalMonthlyTakeHome: 260000, paidOnTime: true },
  { cadre: "NURSING", role: "Nursing Officer I", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 1, baseSalary: 276413, callDutyPay: 15000, totalMonthlyTakeHome: 255000, paidOnTime: true },
  { cadre: "NURSING", role: "Nursing Officer I", state: "Lagos", city: "Lagos", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 1, baseSalary: 220000, allowances: 50000, totalMonthlyTakeHome: 250000, paidOnTime: true },
  { cadre: "NURSING", role: "Nursing Officer I", state: "Rivers", city: "Port Harcourt", facilityType: "PUBLIC_SECONDARY", yearsOfExperience: 0, baseSalary: 230000, callDutyPay: 12000, totalMonthlyTakeHome: 210000, paidOnTime: false, averagePayDelayDays: 21 },
  { cadre: "NURSING", role: "Nursing Officer I", state: "Oyo", city: "Ibadan", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 276413, callDutyPay: 15000, totalMonthlyTakeHome: 255000, paidOnTime: true },
  { cadre: "NURSING", role: "Nursing Officer I", state: "Kano", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 276413, callDutyPay: 12000, totalMonthlyTakeHome: 250000, paidOnTime: true },

  // CONHESS 09-10 - Senior Nursing Officer / Principal (Gross: ~N354,308-N451,800)
  { cadre: "NURSING", role: "Senior Nursing Officer", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 5, baseSalary: 354308, callDutyPay: 20000, totalMonthlyTakeHome: 340000, paidOnTime: true },
  { cadre: "NURSING", role: "Senior Nursing Officer", state: "FCT", city: "Abuja", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 6, baseSalary: 380000, allowances: 80000, totalMonthlyTakeHome: 430000, paidOnTime: true },
  { cadre: "NURSING", role: "ICU Nurse", state: "Lagos", city: "Lagos", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 4, baseSalary: 400000, allowances: 80000, totalMonthlyTakeHome: 450000, paidOnTime: true },
  { cadre: "NURSING", role: "Principal Nursing Officer", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 10, baseSalary: 451800, callDutyPay: 25000, totalMonthlyTakeHome: 430000, paidOnTime: true },

  // CONHESS 12-14 - Chief / Asst Director (Gross: ~N590,715-N890,595)
  { cadre: "NURSING", role: "Chief Nursing Officer", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 15, baseSalary: 590715, callDutyPay: 30000, totalMonthlyTakeHome: 580000, paidOnTime: true },
  { cadre: "NURSING", role: "Chief Nursing Officer", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 18, baseSalary: 590715, callDutyPay: 30000, totalMonthlyTakeHome: 570000, paidOnTime: true },
  { cadre: "NURSING", role: "Nurse Manager", state: "Lagos", city: "Lagos", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 10, baseSalary: 500000, allowances: 100000, totalMonthlyTakeHome: 550000, paidOnTime: true },

  // ══════════════════════════════════════════════════════════════════════
  //                          PHARMACY (CONHESS)
  // ══════════════════════════════════════════════════════════════════════

  // CONHESS 08 - Pharmacist II; CONHESS 09 - Pharmacist I; CONHESS 10 - Senior
  { cadre: "PHARMACY", role: "Pharmacist II", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 276413, totalMonthlyTakeHome: 260000, paidOnTime: true },
  { cadre: "PHARMACY", role: "Pharmacist I", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 3, baseSalary: 354308, totalMonthlyTakeHome: 330000, paidOnTime: true },
  { cadre: "PHARMACY", role: "Pharmacist", state: "Lagos", city: "Lagos", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 2, baseSalary: 350000, allowances: 80000, totalMonthlyTakeHome: 400000, paidOnTime: true },
  { cadre: "PHARMACY", role: "Pharmacist", state: "FCT", city: "Abuja", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 3, baseSalary: 300000, allowances: 70000, totalMonthlyTakeHome: 350000, paidOnTime: true },
  { cadre: "PHARMACY", role: "Senior Pharmacist", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 6, baseSalary: 451800, totalMonthlyTakeHome: 420000, paidOnTime: true },
  { cadre: "PHARMACY", role: "Principal Pharmacist", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 10, baseSalary: 590715, totalMonthlyTakeHome: 550000, paidOnTime: true },
  { cadre: "PHARMACY", role: "Pharmacist", state: "Rivers", city: "Port Harcourt", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 3, baseSalary: 280000, allowances: 60000, totalMonthlyTakeHome: 320000, paidOnTime: true },

  // ══════════════════════════════════════════════════════════════════════
  //                          DENTISTRY (CONMESS)
  // ══════════════════════════════════════════════════════════════════════

  { cadre: "DENTISTRY", role: "Dental House Officer", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 633388, callDutyPay: 60000, totalMonthlyTakeHome: 575000, paidOnTime: true },
  { cadre: "DENTISTRY", role: "Dental Officer", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 2, baseSalary: 750000, callDutyPay: 70000, totalMonthlyTakeHome: 660000, paidOnTime: true },
  { cadre: "DENTISTRY", role: "Dental Registrar", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 5, baseSalary: 900000, callDutyPay: 80000, totalMonthlyTakeHome: 830000, paidOnTime: true },
  { cadre: "DENTISTRY", role: "Dental Consultant", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 10, baseSalary: 1650000, callDutyPay: 100000, totalMonthlyTakeHome: 1450000, paidOnTime: true },
  { cadre: "DENTISTRY", role: "Dental Consultant", state: "Lagos", city: "Lagos", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 8, baseSalary: 2000000, allowances: 400000, totalMonthlyTakeHome: 2200000, paidOnTime: true },

  // ══════════════════════════════════════════════════════════════════════
  //                    MEDICAL LABORATORY SCIENCE (CONHESS)
  // ══════════════════════════════════════════════════════════════════════

  { cadre: "MEDICAL_LABORATORY_SCIENCE", role: "Lab Scientist II", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 276413, totalMonthlyTakeHome: 245000, paidOnTime: true },
  { cadre: "MEDICAL_LABORATORY_SCIENCE", role: "Lab Scientist I", state: "FCT", city: "Abuja", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 3, baseSalary: 250000, allowances: 60000, totalMonthlyTakeHome: 290000, paidOnTime: true },
  { cadre: "MEDICAL_LABORATORY_SCIENCE", role: "Senior Lab Scientist", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 6, baseSalary: 451800, totalMonthlyTakeHome: 400000, paidOnTime: true },
  { cadre: "MEDICAL_LABORATORY_SCIENCE", role: "Chief Lab Scientist", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 15, baseSalary: 590715, totalMonthlyTakeHome: 540000, paidOnTime: true },
  { cadre: "MEDICAL_LABORATORY_SCIENCE", role: "Lab Scientist", state: "Rivers", city: "Port Harcourt", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 2, baseSalary: 180000, allowances: 40000, totalMonthlyTakeHome: 200000, paidOnTime: true },

  // ══════════════════════════════════════════════════════════════════════
  //                    RADIOGRAPHY & IMAGING (CONHESS)
  // ══════════════════════════════════════════════════════════════════════

  { cadre: "RADIOGRAPHY_IMAGING", role: "Radiographer II", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 276413, totalMonthlyTakeHome: 250000, paidOnTime: true },
  { cadre: "RADIOGRAPHY_IMAGING", role: "Radiographer", state: "FCT", city: "Abuja", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 3, baseSalary: 300000, allowances: 70000, totalMonthlyTakeHome: 350000, paidOnTime: true },
  { cadre: "RADIOGRAPHY_IMAGING", role: "Senior Radiographer", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 8, baseSalary: 451800, totalMonthlyTakeHome: 410000, paidOnTime: true },
  { cadre: "RADIOGRAPHY_IMAGING", role: "Radiographer", state: "Lagos", city: "Lagos", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 5, baseSalary: 400000, allowances: 80000, totalMonthlyTakeHome: 450000, paidOnTime: true },

  // ══════════════════════════════════════════════════════════════════════
  //                    REHABILITATION THERAPY (CONHESS)
  // ══════════════════════════════════════════════════════════════════════

  { cadre: "REHABILITATION_THERAPY", role: "Physiotherapist II", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 276413, totalMonthlyTakeHome: 240000, paidOnTime: true },
  { cadre: "REHABILITATION_THERAPY", role: "Physiotherapist", state: "Lagos", city: "Lagos", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 3, baseSalary: 280000, allowances: 60000, totalMonthlyTakeHome: 320000, paidOnTime: true },
  { cadre: "REHABILITATION_THERAPY", role: "Senior Physiotherapist", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 7, baseSalary: 451800, totalMonthlyTakeHome: 400000, paidOnTime: true },

  // ══════════════════════════════════════════════════════════════════════
  //                          MIDWIFERY (CONHESS)
  // ══════════════════════════════════════════════════════════════════════

  { cadre: "MIDWIFERY", role: "Midwife I", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_SECONDARY", yearsOfExperience: 0, baseSalary: 230000, callDutyPay: 12000, totalMonthlyTakeHome: 210000, paidOnTime: false, averagePayDelayDays: 14 },
  { cadre: "MIDWIFERY", role: "Midwife I", state: "Kano", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 276413, callDutyPay: 12000, totalMonthlyTakeHome: 250000, paidOnTime: true },
  { cadre: "MIDWIFERY", role: "Midwife I", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 1, baseSalary: 276413, callDutyPay: 15000, totalMonthlyTakeHome: 255000, paidOnTime: true },
  { cadre: "MIDWIFERY", role: "Senior Midwife", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 5, baseSalary: 354308, callDutyPay: 18000, totalMonthlyTakeHome: 330000, paidOnTime: true },
  { cadre: "MIDWIFERY", role: "Chief Midwife", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 15, baseSalary: 590715, callDutyPay: 25000, totalMonthlyTakeHome: 560000, paidOnTime: true },

  // ══════════════════════════════════════════════════════════════════════
  //                     COMMUNITY HEALTH (CONHESS)
  // ══════════════════════════════════════════════════════════════════════

  // JCHEW/CHEW on CONHESS 06-07; CHO on CONHESS 08+
  { cadre: "COMMUNITY_HEALTH", role: "Junior CHEW", state: "Lagos", facilityType: "PUBLIC_PRIMARY", yearsOfExperience: 0, baseSalary: 100000, allowances: 15000, totalMonthlyTakeHome: 95000, paidOnTime: false, averagePayDelayDays: 30 },
  { cadre: "COMMUNITY_HEALTH", role: "CHEW", state: "Lagos", facilityType: "PUBLIC_PRIMARY", yearsOfExperience: 3, baseSalary: 130000, allowances: 20000, totalMonthlyTakeHome: 120000, paidOnTime: false, averagePayDelayDays: 30 },
  { cadre: "COMMUNITY_HEALTH", role: "Senior CHEW", state: "Lagos", facilityType: "PUBLIC_PRIMARY", yearsOfExperience: 6, baseSalary: 170000, allowances: 25000, totalMonthlyTakeHome: 155000, paidOnTime: false, averagePayDelayDays: 30 },
  { cadre: "COMMUNITY_HEALTH", role: "CHO", state: "FCT", city: "Abuja", facilityType: "PUBLIC_PRIMARY", yearsOfExperience: 3, baseSalary: 200000, allowances: 35000, totalMonthlyTakeHome: 195000, paidOnTime: true },
  { cadre: "COMMUNITY_HEALTH", role: "CHO", state: "Oyo", city: "Ibadan", facilityType: "PUBLIC_PRIMARY", yearsOfExperience: 2, baseSalary: 150000, allowances: 25000, totalMonthlyTakeHome: 140000, paidOnTime: false, averagePayDelayDays: 45 },
  { cadre: "COMMUNITY_HEALTH", role: "CHEW", state: "Kano", facilityType: "PUBLIC_PRIMARY", yearsOfExperience: 2, baseSalary: 100000, allowances: 15000, totalMonthlyTakeHome: 90000, paidOnTime: false, averagePayDelayDays: 45 },

  // ══════════════════════════════════════════════════════════════════════
  //                     PUBLIC HEALTH (CONHESS)
  // ══════════════════════════════════════════════════════════════════════

  { cadre: "PUBLIC_HEALTH", role: "Public Health Officer", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_SECONDARY", yearsOfExperience: 2, baseSalary: 354308, totalMonthlyTakeHome: 320000, paidOnTime: true },
  { cadre: "PUBLIC_HEALTH", role: "Public Health Specialist", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 8, baseSalary: 590715, totalMonthlyTakeHome: 550000, paidOnTime: true },
  { cadre: "PUBLIC_HEALTH", role: "Epidemiologist", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 5, baseSalary: 451800, totalMonthlyTakeHome: 420000, paidOnTime: true },

  // ══════════════════════════════════════════════════════════════════════
  //                  ENVIRONMENTAL HEALTH (CONHESS)
  // ══════════════════════════════════════════════════════════════════════

  { cadre: "ENVIRONMENTAL_HEALTH", role: "Environmental Health Officer II", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_SECONDARY", yearsOfExperience: 0, baseSalary: 276413, totalMonthlyTakeHome: 240000, paidOnTime: true },
  { cadre: "ENVIRONMENTAL_HEALTH", role: "Senior Environmental Health Officer", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 6, baseSalary: 451800, totalMonthlyTakeHome: 400000, paidOnTime: true },

  // ══════════════════════════════════════════════════════════════════════
  //                  NUTRITION & DIETETICS (CONHESS)
  // ══════════════════════════════════════════════════════════════════════

  { cadre: "NUTRITION_DIETETICS", role: "Dietitian II", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 276413, totalMonthlyTakeHome: 240000, paidOnTime: true },
  { cadre: "NUTRITION_DIETETICS", role: "Senior Dietitian", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 5, baseSalary: 451800, totalMonthlyTakeHome: 400000, paidOnTime: true },

  // ══════════════════════════════════════════════════════════════════════
  //                      OPTOMETRY (CONHESS)
  // ══════════════════════════════════════════════════════════════════════

  { cadre: "OPTOMETRY", role: "Optometrist II", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 276413, totalMonthlyTakeHome: 245000, paidOnTime: true },
  { cadre: "OPTOMETRY", role: "Senior Optometrist", state: "Lagos", city: "Lagos", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 5, baseSalary: 350000, allowances: 80000, totalMonthlyTakeHome: 400000, paidOnTime: true },

  // ══════════════════════════════════════════════════════════════════════
  //              PSYCHOLOGY & SOCIAL WORK (CONHESS)
  // ══════════════════════════════════════════════════════════════════════

  { cadre: "PSYCHOLOGY_SOCIAL_WORK", role: "Clinical Psychologist", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 2, baseSalary: 354308, totalMonthlyTakeHome: 310000, paidOnTime: true },
  { cadre: "PSYCHOLOGY_SOCIAL_WORK", role: "Medical Social Worker", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 3, baseSalary: 354308, totalMonthlyTakeHome: 310000, paidOnTime: true },

  // ══════════════════════════════════════════════════════════════════════
  //                HEALTH ADMINISTRATION (CONHESS)
  // ══════════════════════════════════════════════════════════════════════

  { cadre: "HEALTH_ADMINISTRATION", role: "Health Records Officer II", state: "Lagos", city: "Lagos", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 0, baseSalary: 276413, totalMonthlyTakeHome: 235000, paidOnTime: true },
  { cadre: "HEALTH_ADMINISTRATION", role: "Hospital Administrator", state: "Lagos", city: "Lagos", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 5, baseSalary: 500000, allowances: 150000, totalMonthlyTakeHome: 600000, paidOnTime: true },
  { cadre: "HEALTH_ADMINISTRATION", role: "Medical Director", state: "Lagos", city: "Lagos", facilityType: "PRIVATE_TERTIARY", yearsOfExperience: 15, baseSalary: 2500000, allowances: 500000, totalMonthlyTakeHome: 2800000, paidOnTime: true },
  { cadre: "HEALTH_ADMINISTRATION", role: "Health Records Officer I", state: "FCT", city: "Abuja", facilityType: "PUBLIC_TERTIARY", yearsOfExperience: 3, baseSalary: 354308, totalMonthlyTakeHome: 310000, paidOnTime: true },
];

async function main() {
  console.log("Seeding salary intelligence data...\n");

  // Create or find system professional for seed data attribution
  let systemPro = await prisma.cadreProfessional.findUnique({
    where: { email: SYSTEM_EMAIL },
  });

  if (!systemPro) {
    systemPro = await prisma.cadreProfessional.create({
      data: {
        firstName: "CadreHealth",
        lastName: "System",
        email: SYSTEM_EMAIL,
        passwordHash: "SYSTEM_ACCOUNT_NO_LOGIN",
        cadre: "PUBLIC_HEALTH",
        accountStatus: "VERIFIED",
      },
    });
    console.log("Created system professional for seed data attribution");
  }

  // Clear existing seed data
  const deleted = await prisma.cadreSalaryReport.deleteMany({
    where: { professionalId: systemPro.id },
  });
  if (deleted.count > 0) {
    console.log(`Cleared ${deleted.count} existing seed salary reports`);
  }

  // Insert seed data
  let created = 0;
  for (const entry of SALARY_DATA) {
    await prisma.cadreSalaryReport.create({
      data: {
        professionalId: systemPro.id,
        cadre: entry.cadre,
        role: entry.role,
        state: entry.state,
        city: entry.city || null,
        facilityType: entry.facilityType,
        yearsOfExperience: entry.yearsOfExperience,
        baseSalary: entry.baseSalary,
        currency: "NGN",
        allowances: entry.allowances || null,
        callDutyPay: entry.callDutyPay || null,
        locumIncome: entry.locumIncome || null,
        totalMonthlyTakeHome: entry.totalMonthlyTakeHome || null,
        paidOnTime: entry.paidOnTime ?? null,
        averagePayDelayDays: entry.averagePayDelayDays || null,
      },
    });
    created++;
  }

  // Summary
  const cadres = [...new Set(SALARY_DATA.map((d) => d.cadre))];
  const states = [...new Set(SALARY_DATA.map((d) => d.state))];
  const facilities = [...new Set(SALARY_DATA.map((d) => d.facilityType))];

  console.log(`\nSeeded ${created} salary reports:`);
  console.log(`  ${cadres.length} cadres: ${cadres.join(", ")}`);
  console.log(`  ${states.length} states: ${states.join(", ")}`);
  console.log(`  ${facilities.length} facility types: ${facilities.join(", ")}`);
  console.log(`\nTo remove seed data later:`);
  console.log(`  DELETE FROM "CadreSalaryReport" WHERE "professionalId" = '${systemPro.id}';`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
