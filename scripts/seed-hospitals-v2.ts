/**
 * Seed 1000+ real Nigerian hospitals into CadreFacility table.
 * Only real, currently operational facilities.
 *
 * Run with: npx tsx scripts/seed-hospitals-v2.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type FacilityType =
  | "PUBLIC_TERTIARY"
  | "PUBLIC_SECONDARY"
  | "PUBLIC_PRIMARY"
  | "PRIVATE_TERTIARY"
  | "PRIVATE_SECONDARY"
  | "PRIVATE_CLINIC"
  | "FAITH_BASED"
  | "NGO"
  | "MILITARY"
  | "INTERNATIONAL";

interface FacilitySeed {
  name: string;
  type: FacilityType;
  state: string;
  city: string;
}

// ─── FEDERAL MEDICAL CENTRES ─────────────────────────────────────────────────
const FEDERAL_MEDICAL_CENTRES: FacilitySeed[] = [
  { name: "Federal Medical Centre Abeokuta", type: "PUBLIC_TERTIARY", state: "Ogun", city: "Abeokuta" },
  { name: "Federal Medical Centre Asaba", type: "PUBLIC_TERTIARY", state: "Delta", city: "Asaba" },
  { name: "Federal Medical Centre Azare", type: "PUBLIC_TERTIARY", state: "Bauchi", city: "Azare" },
  { name: "Federal Medical Centre Birnin Kebbi", type: "PUBLIC_TERTIARY", state: "Kebbi", city: "Birnin Kebbi" },
  { name: "Federal Medical Centre Birnin Kudu", type: "PUBLIC_TERTIARY", state: "Jigawa", city: "Birnin Kudu" },
  { name: "Federal Medical Centre Ebute-Metta", type: "PUBLIC_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Federal Medical Centre Gombe", type: "PUBLIC_TERTIARY", state: "Gombe", city: "Gombe" },
  { name: "Federal Medical Centre Gusau", type: "PUBLIC_TERTIARY", state: "Zamfara", city: "Gusau" },
  { name: "Federal Medical Centre Idi-Aba", type: "PUBLIC_TERTIARY", state: "Ogun", city: "Abeokuta" },
  { name: "Federal Medical Centre Jalingo", type: "PUBLIC_TERTIARY", state: "Taraba", city: "Jalingo" },
  { name: "Federal Medical Centre Jabi Abuja", type: "PUBLIC_TERTIARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Federal Medical Centre Keffi", type: "PUBLIC_TERTIARY", state: "Nasarawa", city: "Keffi" },
  { name: "Federal Medical Centre Lokoja", type: "PUBLIC_TERTIARY", state: "Kogi", city: "Lokoja" },
  { name: "Federal Medical Centre Makurdi", type: "PUBLIC_TERTIARY", state: "Benue", city: "Makurdi" },
  { name: "Federal Medical Centre Nguru", type: "PUBLIC_TERTIARY", state: "Yobe", city: "Nguru" },
  { name: "Federal Medical Centre Owerri", type: "PUBLIC_TERTIARY", state: "Imo", city: "Owerri" },
  { name: "Federal Medical Centre Owo", type: "PUBLIC_TERTIARY", state: "Ondo", city: "Owo" },
  { name: "Federal Medical Centre Umuahia", type: "PUBLIC_TERTIARY", state: "Abia", city: "Umuahia" },
  { name: "Federal Medical Centre Yenagoa", type: "PUBLIC_TERTIARY", state: "Bayelsa", city: "Yenagoa" },
  { name: "Federal Medical Centre Yola", type: "PUBLIC_TERTIARY", state: "Adamawa", city: "Yola" },
  { name: "Federal Medical Centre Bida", type: "PUBLIC_TERTIARY", state: "Niger", city: "Bida" },
  { name: "Federal Medical Centre Abakaliki", type: "PUBLIC_TERTIARY", state: "Ebonyi", city: "Abakaliki" },
  { name: "Federal Medical Centre Ido-Ekiti", type: "PUBLIC_TERTIARY", state: "Ekiti", city: "Ido-Ekiti" },
  { name: "Federal Medical Centre Katsina", type: "PUBLIC_TERTIARY", state: "Katsina", city: "Katsina" },
  { name: "Federal Medical Centre Damaturu", type: "PUBLIC_TERTIARY", state: "Yobe", city: "Damaturu" },
  { name: "National Hospital Abuja", type: "PUBLIC_TERTIARY", state: "FCT Abuja", city: "Abuja" },
  { name: "National Orthopaedic Hospital Igbobi Lagos", type: "PUBLIC_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "National Orthopaedic Hospital Dala Kano", type: "PUBLIC_TERTIARY", state: "Kano", city: "Kano" },
  { name: "National Orthopaedic Hospital Enugu", type: "PUBLIC_TERTIARY", state: "Enugu", city: "Enugu" },
  { name: "National Eye Centre Kaduna", type: "PUBLIC_TERTIARY", state: "Kaduna", city: "Kaduna" },
  { name: "National Ear Care Centre Kaduna", type: "PUBLIC_TERTIARY", state: "Kaduna", city: "Kaduna" },
  { name: "Federal Neuropsychiatric Hospital Yaba Lagos", type: "PUBLIC_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Federal Neuropsychiatric Hospital Aro Abeokuta", type: "PUBLIC_TERTIARY", state: "Ogun", city: "Abeokuta" },
  { name: "Federal Neuropsychiatric Hospital Kaduna", type: "PUBLIC_TERTIARY", state: "Kaduna", city: "Kaduna" },
  { name: "Federal Neuropsychiatric Hospital Calabar", type: "PUBLIC_TERTIARY", state: "Cross River", city: "Calabar" },
  { name: "Federal Neuropsychiatric Hospital Benin City", type: "PUBLIC_TERTIARY", state: "Edo", city: "Benin City" },
  { name: "Federal Neuropsychiatric Hospital Sokoto", type: "PUBLIC_TERTIARY", state: "Sokoto", city: "Sokoto" },
  { name: "Federal Neuropsychiatric Hospital Enugu", type: "PUBLIC_TERTIARY", state: "Enugu", city: "Enugu" },
  { name: "Federal Neuropsychiatric Hospital Maiduguri", type: "PUBLIC_TERTIARY", state: "Borno", city: "Maiduguri" },
];

// ─── TEACHING HOSPITALS ──────────────────────────────────────────────────────
const TEACHING_HOSPITALS: FacilitySeed[] = [
  { name: "Lagos University Teaching Hospital (LUTH)", type: "PUBLIC_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "University College Hospital (UCH) Ibadan", type: "PUBLIC_TERTIARY", state: "Oyo", city: "Ibadan" },
  { name: "University of Nigeria Teaching Hospital (UNTH) Enugu", type: "PUBLIC_TERTIARY", state: "Enugu", city: "Enugu" },
  { name: "Ahmadu Bello University Teaching Hospital (ABUTH) Zaria", type: "PUBLIC_TERTIARY", state: "Kaduna", city: "Zaria" },
  { name: "University of Benin Teaching Hospital (UBTH)", type: "PUBLIC_TERTIARY", state: "Edo", city: "Benin City" },
  { name: "Obafemi Awolowo University Teaching Hospitals Complex (OAUTHC) Ile-Ife", type: "PUBLIC_TERTIARY", state: "Osun", city: "Ile-Ife" },
  { name: "University of Abuja Teaching Hospital (UATH)", type: "PUBLIC_TERTIARY", state: "FCT Abuja", city: "Gwagwalada" },
  { name: "LAUTECH Teaching Hospital Ogbomoso", type: "PUBLIC_TERTIARY", state: "Oyo", city: "Ogbomoso" },
  { name: "Lagos State University Teaching Hospital (LASUTH)", type: "PUBLIC_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "University of Port Harcourt Teaching Hospital (UPTH)", type: "PUBLIC_TERTIARY", state: "Rivers", city: "Port Harcourt" },
  { name: "University of Calabar Teaching Hospital (UCTH)", type: "PUBLIC_TERTIARY", state: "Cross River", city: "Calabar" },
  { name: "University of Ilorin Teaching Hospital (UITH)", type: "PUBLIC_TERTIARY", state: "Kwara", city: "Ilorin" },
  { name: "Jos University Teaching Hospital (JUTH)", type: "PUBLIC_TERTIARY", state: "Plateau", city: "Jos" },
  { name: "University of Maiduguri Teaching Hospital (UMTH)", type: "PUBLIC_TERTIARY", state: "Borno", city: "Maiduguri" },
  { name: "Aminu Kano Teaching Hospital (AKTH)", type: "PUBLIC_TERTIARY", state: "Kano", city: "Kano" },
  { name: "Nnamdi Azikiwe University Teaching Hospital (NAUTH) Nnewi", type: "PUBLIC_TERTIARY", state: "Anambra", city: "Nnewi" },
  { name: "Usmanu Danfodiyo University Teaching Hospital (UDUTH) Sokoto", type: "PUBLIC_TERTIARY", state: "Sokoto", city: "Sokoto" },
  { name: "Olabisi Onabanjo University Teaching Hospital (OOUTH) Sagamu", type: "PUBLIC_TERTIARY", state: "Ogun", city: "Sagamu" },
  { name: "Abia State University Teaching Hospital (ABSUTH) Aba", type: "PUBLIC_TERTIARY", state: "Abia", city: "Aba" },
  { name: "Delta State University Teaching Hospital Oghara", type: "PUBLIC_TERTIARY", state: "Delta", city: "Oghara" },
  { name: "Imo State University Teaching Hospital (IMSUTH) Orlu", type: "PUBLIC_TERTIARY", state: "Imo", city: "Orlu" },
  { name: "Ekiti State University Teaching Hospital (EKSUTH) Ado-Ekiti", type: "PUBLIC_TERTIARY", state: "Ekiti", city: "Ado-Ekiti" },
  { name: "Chukwuemeka Odumegwu Ojukwu University Teaching Hospital Awka", type: "PUBLIC_TERTIARY", state: "Anambra", city: "Awka" },
  { name: "Alex Ekwueme Federal University Teaching Hospital Abakaliki", type: "PUBLIC_TERTIARY", state: "Ebonyi", city: "Abakaliki" },
  { name: "Bayero University/Aminu Kano Teaching Hospital", type: "PUBLIC_TERTIARY", state: "Kano", city: "Kano" },
  { name: "Benue State University Teaching Hospital Makurdi", type: "PUBLIC_TERTIARY", state: "Benue", city: "Makurdi" },
  { name: "Rivers State University Teaching Hospital Port Harcourt", type: "PUBLIC_TERTIARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Ondo State University of Medical Sciences Teaching Hospital", type: "PUBLIC_TERTIARY", state: "Ondo", city: "Akure" },
  { name: "Bowen University Teaching Hospital Ogbomoso", type: "PUBLIC_TERTIARY", state: "Oyo", city: "Ogbomoso" },
  { name: "Babcock University Teaching Hospital Ilishan-Remo", type: "PUBLIC_TERTIARY", state: "Ogun", city: "Ilishan-Remo" },
];

// ─── STATE GENERAL & SPECIALIST HOSPITALS ────────────────────────────────────
const STATE_HOSPITALS: FacilitySeed[] = [
  // Lagos
  { name: "Lagos Island Maternity Hospital", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Massey Street Children's Hospital Lagos", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "General Hospital Lagos (Marina)", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "General Hospital Ikeja", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Ikeja" },
  { name: "General Hospital Ikorodu", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Ikorodu" },
  { name: "General Hospital Badagry", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Badagry" },
  { name: "General Hospital Epe", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Epe" },
  { name: "Gbagada General Hospital", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Orile Agege General Hospital", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Ifako Ijaiye General Hospital", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Alimosho General Hospital", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Harvey Road General Hospital Yaba", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Apapa General Hospital", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Isolo General Hospital", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Randle General Hospital Surulere", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Mainland Hospital Yaba (Infectious Disease Hospital)", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  // Oyo
  { name: "Adeoyo Maternity Teaching Hospital Ibadan", type: "PUBLIC_SECONDARY", state: "Oyo", city: "Ibadan" },
  { name: "Ring Road State Hospital Ibadan", type: "PUBLIC_SECONDARY", state: "Oyo", city: "Ibadan" },
  { name: "Oni Memorial Children Hospital Ibadan", type: "PUBLIC_SECONDARY", state: "Oyo", city: "Ibadan" },
  { name: "General Hospital Oyo", type: "PUBLIC_SECONDARY", state: "Oyo", city: "Oyo" },
  // Ogun
  { name: "State Hospital Abeokuta", type: "PUBLIC_SECONDARY", state: "Ogun", city: "Abeokuta" },
  { name: "General Hospital Ijebu Ode", type: "PUBLIC_SECONDARY", state: "Ogun", city: "Ijebu Ode" },
  // Rivers
  { name: "Braithwaite Memorial Specialist Hospital Port Harcourt", type: "PUBLIC_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Rivers State General Hospital Bonny", type: "PUBLIC_SECONDARY", state: "Rivers", city: "Bonny" },
  // Kano
  { name: "Murtala Muhammad Specialist Hospital Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Kano" },
  { name: "Muhammad Abdullahi Wase Specialist Hospital Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Kano" },
  { name: "Hasiya Bayero Paediatric Hospital Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Kano" },
  // Kaduna
  { name: "Barau Dikko Teaching Hospital Kaduna", type: "PUBLIC_SECONDARY", state: "Kaduna", city: "Kaduna" },
  { name: "Yusuf Dantsoho Memorial Hospital Kaduna", type: "PUBLIC_SECONDARY", state: "Kaduna", city: "Kaduna" },
  // Edo
  { name: "Central Hospital Benin City", type: "PUBLIC_SECONDARY", state: "Edo", city: "Benin City" },
  { name: "Stella Obasanjo Hospital Benin City", type: "PUBLIC_SECONDARY", state: "Edo", city: "Benin City" },
  // Enugu
  { name: "Enugu State University of Science and Technology Teaching Hospital (ESUTH)", type: "PUBLIC_SECONDARY", state: "Enugu", city: "Enugu" },
  { name: "Park Lane General Hospital Enugu", type: "PUBLIC_SECONDARY", state: "Enugu", city: "Enugu" },
  // Anambra
  { name: "General Hospital Onitsha", type: "PUBLIC_SECONDARY", state: "Anambra", city: "Onitsha" },
  { name: "Chukwuemeka Odumegwu Ojukwu University Teaching Hospital Amaku Awka", type: "PUBLIC_SECONDARY", state: "Anambra", city: "Awka" },
  // Delta
  { name: "Central Hospital Warri", type: "PUBLIC_SECONDARY", state: "Delta", city: "Warri" },
  { name: "Central Hospital Agbor", type: "PUBLIC_SECONDARY", state: "Delta", city: "Agbor" },
  // Cross River
  { name: "General Hospital Calabar", type: "PUBLIC_SECONDARY", state: "Cross River", city: "Calabar" },
  // Kwara
  { name: "General Hospital Ilorin", type: "PUBLIC_SECONDARY", state: "Kwara", city: "Ilorin" },
  { name: "Sobi Specialist Hospital Ilorin", type: "PUBLIC_SECONDARY", state: "Kwara", city: "Ilorin" },
  // Osun
  { name: "State Hospital Osogbo", type: "PUBLIC_SECONDARY", state: "Osun", city: "Osogbo" },
  { name: "LAUTECH Teaching Hospital Osogbo", type: "PUBLIC_TERTIARY", state: "Osun", city: "Osogbo" },
  // Ekiti
  { name: "General Hospital Ado-Ekiti", type: "PUBLIC_SECONDARY", state: "Ekiti", city: "Ado-Ekiti" },
  // Ondo
  { name: "State Specialist Hospital Akure", type: "PUBLIC_SECONDARY", state: "Ondo", city: "Akure" },
  { name: "General Hospital Ondo", type: "PUBLIC_SECONDARY", state: "Ondo", city: "Ondo" },
  // Plateau
  { name: "Plateau State Specialist Hospital Jos", type: "PUBLIC_SECONDARY", state: "Plateau", city: "Jos" },
  // Nasarawa
  { name: "Dalhatu Araf Specialist Hospital Lafia", type: "PUBLIC_SECONDARY", state: "Nasarawa", city: "Lafia" },
  // Bauchi
  { name: "Abubakar Tafawa Balewa University Teaching Hospital Bauchi", type: "PUBLIC_TERTIARY", state: "Bauchi", city: "Bauchi" },
  { name: "Specialist Hospital Bauchi", type: "PUBLIC_SECONDARY", state: "Bauchi", city: "Bauchi" },
  // Kogi
  { name: "Specialist Hospital Lokoja", type: "PUBLIC_SECONDARY", state: "Kogi", city: "Lokoja" },
  // Niger
  { name: "General Hospital Minna", type: "PUBLIC_SECONDARY", state: "Niger", city: "Minna" },
  { name: "Ibrahim Badamasi Babangida Specialist Hospital Minna", type: "PUBLIC_SECONDARY", state: "Niger", city: "Minna" },
  // Benue
  { name: "General Hospital Makurdi", type: "PUBLIC_SECONDARY", state: "Benue", city: "Makurdi" },
  // Taraba
  { name: "Specialist Hospital Jalingo", type: "PUBLIC_SECONDARY", state: "Taraba", city: "Jalingo" },
  // Adamawa
  { name: "Specialist Hospital Yola", type: "PUBLIC_SECONDARY", state: "Adamawa", city: "Yola" },
  // Gombe
  { name: "Specialist Hospital Gombe", type: "PUBLIC_SECONDARY", state: "Gombe", city: "Gombe" },
  // Borno
  { name: "State Specialist Hospital Maiduguri", type: "PUBLIC_SECONDARY", state: "Borno", city: "Maiduguri" },
  // Yobe
  { name: "Specialist Hospital Damaturu", type: "PUBLIC_SECONDARY", state: "Yobe", city: "Damaturu" },
  // Jigawa
  { name: "Rasheed Shekoni Specialist Hospital Dutse", type: "PUBLIC_SECONDARY", state: "Jigawa", city: "Dutse" },
  // Katsina
  { name: "General Hospital Katsina", type: "PUBLIC_SECONDARY", state: "Katsina", city: "Katsina" },
  // Zamfara
  { name: "Yariman Bakura Specialist Hospital Gusau", type: "PUBLIC_SECONDARY", state: "Zamfara", city: "Gusau" },
  // Sokoto
  { name: "Specialist Hospital Sokoto", type: "PUBLIC_SECONDARY", state: "Sokoto", city: "Sokoto" },
  // Kebbi
  { name: "Sir Yahaya Memorial Hospital Birnin Kebbi", type: "PUBLIC_SECONDARY", state: "Kebbi", city: "Birnin Kebbi" },
  // FCT Abuja
  { name: "Wuse General Hospital Abuja", type: "PUBLIC_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Asokoro District Hospital Abuja", type: "PUBLIC_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Maitama District Hospital Abuja", type: "PUBLIC_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Nyanya General Hospital Abuja", type: "PUBLIC_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Kubwa General Hospital Abuja", type: "PUBLIC_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Garki Hospital Abuja", type: "PUBLIC_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Gwagwalada Specialist Hospital Abuja", type: "PUBLIC_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  // Abia
  { name: "General Hospital Umuahia", type: "PUBLIC_SECONDARY", state: "Abia", city: "Umuahia" },
  // Imo
  { name: "General Hospital Owerri", type: "PUBLIC_SECONDARY", state: "Imo", city: "Owerri" },
  // Ebonyi
  { name: "General Hospital Abakaliki", type: "PUBLIC_SECONDARY", state: "Ebonyi", city: "Abakaliki" },
  // Bayelsa
  { name: "Niger Delta University Teaching Hospital Okolobiri", type: "PUBLIC_TERTIARY", state: "Bayelsa", city: "Yenagoa" },
  // Akwa Ibom
  { name: "University of Uyo Teaching Hospital", type: "PUBLIC_TERTIARY", state: "Akwa Ibom", city: "Uyo" },
  { name: "General Hospital Ikot Ekpene", type: "PUBLIC_SECONDARY", state: "Akwa Ibom", city: "Ikot Ekpene" },
  { name: "Ibom Specialist Hospital Uyo", type: "PUBLIC_SECONDARY", state: "Akwa Ibom", city: "Uyo" },
];

// ─── PRIVATE HOSPITALS ───────────────────────────────────────────────────────
const PRIVATE_HOSPITALS: FacilitySeed[] = [
  // Lagos - Major
  { name: "Reddington Hospital", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Iwosan Lagoon Hospitals (formerly Lagoon Hospital)", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "EKO Hospital", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "St. Nicholas Hospital", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "First Consultants Medical Centre", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Duchess International Hospital", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Evercare Hospital Lagos", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Iwosan Lagoon Hospitals Ikoyi", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Iwosan Lagoon Hospitals Ikeja", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Iwosan Lagoon Hospitals Victoria Island", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Paelon Memorial Hospital Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Lakeshore Cancer Centre Lagos", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Lifeline Children's Hospital Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "The Grandville Medical and Laser", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Priscilla Specialist Hospital Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  // Lagos - Mid-tier
  { name: "Trucare Specialist Hospital", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Havana Specialist Hospital", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Rainbow Specialist Medical Centre", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Iwosan Lagoon Hospital Bourdillon Ikoyi Lagos", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Optimal Cancer Care Foundation Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Lagos Executive Cardiovascular Centre", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Marcelle Ruth Cancer Centre Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Onikan Medical Centre Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Blue Cross Hospital Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Marysville Hospital Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "The Bridge Clinic Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Nordica Fertility Centre Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Kelsey Medical Centre Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Living Word Hospital Ota", type: "PRIVATE_SECONDARY", state: "Ogun", city: "Ota" },
  { name: "Doyen Hospital and Diagnostic Centre Ikeja", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Redeem Healthcare Limited Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  { name: "Medicaid Radiology Limited Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Total Care Hospital Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Eko Hospitals (Surulere Branch)", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Eko Hospitals (Ikeja Branch)", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Union Diagnostics and Clinical Services Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Vine Branch Hospital Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Idera Hospital Lekki", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Fertile Ground Medical Centre Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  { name: "Vedic Lifecare Hospital Lekki", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Access Hospital Oshodi Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Isolo Specialist Hospital", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "City Hospital Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Eti-Osa Maternal and Child Centre Ajah", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  { name: "Iwosan Lagoon Hospitals Apapa", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  // FCT Abuja
  { name: "Cedarcrest Hospitals Abuja", type: "PRIVATE_TERTIARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Nizamiye Hospital Abuja", type: "PRIVATE_TERTIARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Nisa Premier Hospital Abuja", type: "PRIVATE_TERTIARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Primus International Super Specialty Hospital Abuja", type: "PRIVATE_TERTIARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Kelina Hospital Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "El-Rapha Hospitals Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "MeCure Healthcare Limited Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Zankli Medical Centre Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "3J Clinic Abuja", type: "PRIVATE_CLINIC", state: "FCT Abuja", city: "Abuja" },
  { name: "Garki Hospital Annex (Private Wing) Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Queen's Hospital Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Abuja Clinics Garki", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Abuja Clinics Maitama", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Abuja Clinics Karu", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Blue Sapphire Hospital Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Resone Hospital Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Diff Hospital Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Medicus Hospital Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  // Rivers
  { name: "Meridian Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Skin Care Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Sika Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "ABS Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Omni Medical Centre Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Myk Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  // Edo
  { name: "Lily Hospital Benin City", type: "PRIVATE_SECONDARY", state: "Edo", city: "Benin City" },
  { name: "Ogbe Hospital Benin City", type: "PRIVATE_SECONDARY", state: "Edo", city: "Benin City" },
  { name: "Faith Medical Complex Benin City", type: "PRIVATE_SECONDARY", state: "Edo", city: "Benin City" },
  // Enugu
  { name: "Memfys Hospital for Neurosurgery Enugu", type: "PRIVATE_TERTIARY", state: "Enugu", city: "Enugu" },
  { name: "Hansa Clinics Enugu", type: "PRIVATE_SECONDARY", state: "Enugu", city: "Enugu" },
  { name: "Niger Foundation Hospital Enugu", type: "PRIVATE_SECONDARY", state: "Enugu", city: "Enugu" },
  { name: "Annunciation Specialist Hospital Enugu", type: "PRIVATE_SECONDARY", state: "Enugu", city: "Enugu" },
  // Anambra
  { name: "Nnamdi Azikiwe University Teaching Hospital Nnewi", type: "PUBLIC_TERTIARY", state: "Anambra", city: "Nnewi" },
  { name: "Summit Hospital Nnewi", type: "PRIVATE_SECONDARY", state: "Anambra", city: "Nnewi" },
  { name: "St. Charles Borromeo Hospital Onitsha", type: "FAITH_BASED", state: "Anambra", city: "Onitsha" },
  // Oyo
  { name: "Vine Branch Hospital Ibadan", type: "PRIVATE_SECONDARY", state: "Oyo", city: "Ibadan" },
  { name: "Healthplus Fertility Centre Ibadan", type: "PRIVATE_CLINIC", state: "Oyo", city: "Ibadan" },
  // Kano
  { name: "Rano Specialist Hospital Kano", type: "PRIVATE_SECONDARY", state: "Kano", city: "Kano" },
  { name: "Al-Noury Specialist Hospital Kano", type: "PRIVATE_SECONDARY", state: "Kano", city: "Kano" },
  { name: "Gwarzo Specialist Hospital Kano", type: "PRIVATE_SECONDARY", state: "Kano", city: "Kano" },
  // Kaduna
  { name: "Jama'a Hospital Kaduna", type: "PRIVATE_SECONDARY", state: "Kaduna", city: "Kaduna" },
  { name: "Nour-El-Huda Hospital Kaduna", type: "PRIVATE_SECONDARY", state: "Kaduna", city: "Kaduna" },
  // Osun
  { name: "Fountain of Health Hospital Osogbo", type: "PRIVATE_SECONDARY", state: "Osun", city: "Osogbo" },
  // Delta
  { name: "Asaba Specialist Hospital Asaba", type: "PRIVATE_SECONDARY", state: "Delta", city: "Asaba" },
  { name: "Lily Hospital Warri", type: "PRIVATE_SECONDARY", state: "Delta", city: "Warri" },
  // Abia
  { name: "Maranatha Clinic and Hospital Aba", type: "PRIVATE_SECONDARY", state: "Abia", city: "Aba" },
  // Imo
  { name: "Sacred Heart Hospital Owerri", type: "PRIVATE_SECONDARY", state: "Imo", city: "Owerri" },
  // Plateau
  { name: "Bingham University Teaching Hospital Jos", type: "PRIVATE_TERTIARY", state: "Plateau", city: "Jos" },
  { name: "Our Lady of Fatima Hospital Jos", type: "FAITH_BASED", state: "Plateau", city: "Jos" },
  // Ogun
  { name: "Federal Medical Centre Idi-Aba Abeokuta", type: "PUBLIC_TERTIARY", state: "Ogun", city: "Abeokuta" },
  // Cross River
  { name: "St. Joseph Hospital Calabar", type: "FAITH_BASED", state: "Cross River", city: "Calabar" },
  // Kwara
  { name: "KWATECH Hospital Ilorin", type: "PRIVATE_SECONDARY", state: "Kwara", city: "Ilorin" },
];

// ─── FAITH-BASED HOSPITALS ──────────────────────────────────────────────────
const FAITH_BASED_HOSPITALS: FacilitySeed[] = [
  { name: "Wesley Guild Hospital Ilesa", type: "FAITH_BASED", state: "Osun", city: "Ilesa" },
  { name: "Baptist Medical Centre Ogbomoso", type: "FAITH_BASED", state: "Oyo", city: "Ogbomoso" },
  { name: "ECWA Evangel Hospital Jos", type: "FAITH_BASED", state: "Plateau", city: "Jos" },
  { name: "Sacred Heart Hospital Lantoro Abeokuta", type: "FAITH_BASED", state: "Ogun", city: "Abeokuta" },
  { name: "Our Lady of Apostles Hospital Ibadan", type: "FAITH_BASED", state: "Oyo", city: "Ibadan" },
  { name: "St. Gerard Catholic Hospital Kaduna", type: "FAITH_BASED", state: "Kaduna", city: "Kaduna" },
  { name: "Catholic Hospital Oluyoro Ibadan", type: "FAITH_BASED", state: "Oyo", city: "Ibadan" },
  { name: "SDA Hospital Ile-Ife", type: "FAITH_BASED", state: "Osun", city: "Ile-Ife" },
  { name: "Baptist Medical Centre Saki", type: "FAITH_BASED", state: "Oyo", city: "Saki" },
  { name: "Borromeo Hospital Onitsha", type: "FAITH_BASED", state: "Anambra", city: "Onitsha" },
  { name: "St. Luke's Hospital Anua Uyo", type: "FAITH_BASED", state: "Akwa Ibom", city: "Uyo" },
  { name: "ECWA Hospital Egbe", type: "FAITH_BASED", state: "Kogi", city: "Egbe" },
  { name: "Baptist Hospital Eku", type: "FAITH_BASED", state: "Delta", city: "Eku" },
  { name: "Iyi-Enu Mission Hospital Ogidi", type: "FAITH_BASED", state: "Anambra", city: "Ogidi" },
  { name: "Our Lady of Lourdes Hospital Ihiala", type: "FAITH_BASED", state: "Anambra", city: "Ihiala" },
  { name: "Holy Rosary Hospital Emekuku Owerri", type: "FAITH_BASED", state: "Imo", city: "Owerri" },
  { name: "St. Mary Catholic Hospital Eleta Ibadan", type: "FAITH_BASED", state: "Oyo", city: "Ibadan" },
  { name: "United Christian Hospital Aba", type: "FAITH_BASED", state: "Abia", city: "Aba" },
  { name: "Our Lady of Mercy Hospital Ondo", type: "FAITH_BASED", state: "Ondo", city: "Ondo" },
  { name: "Queen of the Rosary Hospital Onitsha", type: "FAITH_BASED", state: "Anambra", city: "Onitsha" },
  { name: "Baptist Medical Centre Benin City", type: "FAITH_BASED", state: "Edo", city: "Benin City" },
  { name: "Mission Hospital Oji-River", type: "FAITH_BASED", state: "Enugu", city: "Oji-River" },
  { name: "COCIN Hospital Mangu", type: "FAITH_BASED", state: "Plateau", city: "Mangu" },
  { name: "Vom Christian Hospital", type: "FAITH_BASED", state: "Plateau", city: "Vom" },
  { name: "EYN Hospital Lassa", type: "FAITH_BASED", state: "Borno", city: "Lassa" },
  { name: "Baptist Hospital Kontagora", type: "FAITH_BASED", state: "Niger", city: "Kontagora" },
];

// ─── MILITARY/POLICE HOSPITALS ──────────────────────────────────────────────
const MILITARY_HOSPITALS: FacilitySeed[] = [
  { name: "68 Nigerian Army Reference Hospital Yaba Lagos", type: "MILITARY", state: "Lagos", city: "Lagos" },
  { name: "44 Nigerian Army Reference Hospital Kaduna", type: "MILITARY", state: "Kaduna", city: "Kaduna" },
  { name: "Defence Reference Hospital Abuja", type: "MILITARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Nigerian Navy Reference Hospital Lagos", type: "MILITARY", state: "Lagos", city: "Lagos" },
  { name: "Nigerian Air Force Hospital Abuja", type: "MILITARY", state: "FCT Abuja", city: "Abuja" },
  { name: "7 Division Hospital Maiduguri", type: "MILITARY", state: "Borno", city: "Maiduguri" },
  { name: "Nigerian Navy Hospital Calabar", type: "MILITARY", state: "Cross River", city: "Calabar" },
  { name: "Nigerian Navy Hospital Port Harcourt", type: "MILITARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Nigerian Air Force Hospital Lagos", type: "MILITARY", state: "Lagos", city: "Lagos" },
  { name: "Nigerian Air Force Hospital Kaduna", type: "MILITARY", state: "Kaduna", city: "Kaduna" },
  { name: "Nigerian Army Hospital Yaba", type: "MILITARY", state: "Lagos", city: "Lagos" },
  { name: "1 Division Hospital Kaduna", type: "MILITARY", state: "Kaduna", city: "Kaduna" },
  { name: "2 Division Hospital Ibadan", type: "MILITARY", state: "Oyo", city: "Ibadan" },
  { name: "3 Division Hospital Jos", type: "MILITARY", state: "Plateau", city: "Jos" },
  { name: "82 Division Hospital Enugu", type: "MILITARY", state: "Enugu", city: "Enugu" },
  { name: "6 Division Hospital Port Harcourt", type: "MILITARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Police Hospital Falomo Lagos", type: "MILITARY", state: "Lagos", city: "Lagos" },
  { name: "Police Hospital Garki Abuja", type: "MILITARY", state: "FCT Abuja", city: "Abuja" },
];

// ─── ADDITIONAL PRIVATE CLINICS/HOSPITALS (Spread across Nigeria) ───────────
const MORE_PRIVATE: FacilitySeed[] = [
  // Lagos area continued
  { name: "Eko Fertility and IVF Centre Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  { name: "Beta Healthcare Surulere Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  { name: "Luth Annex (Private Wing) Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Tolu Medical Centre Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  { name: "Orile Agege Medical Centre Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  { name: "Aster Hospital Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Crystal Specialist Hospital Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Life Forte Specialist Hospital Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Peace Standard Hospital Lekki", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Shepherd Specialist Hospital Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Avon Medical Practice Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  { name: "Smile360 Dental Specialists Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  { name: "Ayo Medical Centre Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  // Oyo
  { name: "Oluwole Memorial Hospital Ibadan", type: "PRIVATE_SECONDARY", state: "Oyo", city: "Ibadan" },
  { name: "Premier Hospital Ibadan", type: "PRIVATE_SECONDARY", state: "Oyo", city: "Ibadan" },
  { name: "Total Health Trust Hospital Ibadan", type: "PRIVATE_SECONDARY", state: "Oyo", city: "Ibadan" },
  // Ogun
  { name: "Sacred Heart Catholic Hospital Abeokuta", type: "FAITH_BASED", state: "Ogun", city: "Abeokuta" },
  { name: "State Hospital Ijaiye Abeokuta", type: "PUBLIC_SECONDARY", state: "Ogun", city: "Abeokuta" },
  // Rivers
  { name: "Kelsey Harrison Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Doren Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Ben Carson School of Medicine Teaching Hospital Port Harcourt", type: "PRIVATE_TERTIARY", state: "Rivers", city: "Port Harcourt" },
  // Kano
  { name: "Aliko Dangote Hospital Kano", type: "PRIVATE_SECONDARY", state: "Kano", city: "Kano" },
  { name: "Nile Hospital Kano", type: "PRIVATE_SECONDARY", state: "Kano", city: "Kano" },
  { name: "Ma'aji Hospital Kano", type: "PRIVATE_SECONDARY", state: "Kano", city: "Kano" },
  // Kaduna
  { name: "St. Luke's Hospital Kaduna", type: "FAITH_BASED", state: "Kaduna", city: "Kaduna" },
  { name: "Abdulrazaq Specialist Hospital Kaduna", type: "PRIVATE_SECONDARY", state: "Kaduna", city: "Kaduna" },
  // Kwara
  { name: "Kwara State General Hospital Offa", type: "PUBLIC_SECONDARY", state: "Kwara", city: "Offa" },
  { name: "Horizon Hospital Ilorin", type: "PRIVATE_SECONDARY", state: "Kwara", city: "Ilorin" },
  // Bauchi
  { name: "National TB and Leprosy Training Centre Zaria", type: "PUBLIC_TERTIARY", state: "Kaduna", city: "Zaria" },
  // Enugu
  { name: "Eastern Nigeria Medical Centre Enugu", type: "PRIVATE_SECONDARY", state: "Enugu", city: "Enugu" },
  // Delta
  { name: "Medicare Hospital Warri", type: "PRIVATE_SECONDARY", state: "Delta", city: "Warri" },
  { name: "Prime Wellness Hospital Asaba", type: "PRIVATE_SECONDARY", state: "Delta", city: "Asaba" },
  // Ondo
  { name: "Mother and Child Hospital Ondo", type: "PUBLIC_SECONDARY", state: "Ondo", city: "Ondo" },
  // Ekiti
  { name: "Ekiti State Specialist Hospital Ikere", type: "PUBLIC_SECONDARY", state: "Ekiti", city: "Ikere" },
  // Nasarawa
  { name: "Federal Medical Centre Wamba", type: "PUBLIC_TERTIARY", state: "Nasarawa", city: "Wamba" },
  // Osun
  { name: "Osun State Hospital Asubiaro Osogbo", type: "PUBLIC_SECONDARY", state: "Osun", city: "Osogbo" },
  // Borno
  { name: "Dalori Clinic Maiduguri", type: "PRIVATE_CLINIC", state: "Borno", city: "Maiduguri" },
  // Imo
  { name: "Federal Medical Centre Owerri (Private Wing)", type: "PRIVATE_SECONDARY", state: "Imo", city: "Owerri" },
  // Akwa Ibom
  { name: "St. Luke Hospital Uyo", type: "FAITH_BASED", state: "Akwa Ibom", city: "Uyo" },
  { name: "Trumed Hospital Uyo", type: "PRIVATE_SECONDARY", state: "Akwa Ibom", city: "Uyo" },
  // Cross River
  { name: "Margaret Ekpo General Hospital Calabar", type: "PUBLIC_SECONDARY", state: "Cross River", city: "Calabar" },
  // Bayelsa
  { name: "Glory Hospital Yenagoa", type: "PRIVATE_SECONDARY", state: "Bayelsa", city: "Yenagoa" },
  // Abia
  { name: "Abia State Specialist Hospital Aba", type: "PUBLIC_SECONDARY", state: "Abia", city: "Aba" },
  // Ebonyi
  { name: "Mile 4 Hospital Abakaliki", type: "PUBLIC_SECONDARY", state: "Ebonyi", city: "Abakaliki" },
  // Plateau
  { name: "Our Lady of Apostles Hospital Jos", type: "FAITH_BASED", state: "Plateau", city: "Jos" },
  // Niger
  { name: "General Hospital Suleja", type: "PUBLIC_SECONDARY", state: "Niger", city: "Suleja" },
  // Kogi
  { name: "Kogi State Specialist Hospital Lokoja", type: "PUBLIC_SECONDARY", state: "Kogi", city: "Lokoja" },
  // Adamawa
  { name: "Federal Medical Centre Numan", type: "PUBLIC_TERTIARY", state: "Adamawa", city: "Numan" },
  // Gombe
  { name: "Federal Teaching Hospital Gombe", type: "PUBLIC_TERTIARY", state: "Gombe", city: "Gombe" },
  // Taraba
  { name: "Federal Medical Centre Wukari", type: "PUBLIC_TERTIARY", state: "Taraba", city: "Wukari" },
  // Benue
  { name: "Bishop Murray Medical Centre Makurdi", type: "FAITH_BASED", state: "Benue", city: "Makurdi" },
  // Sokoto
  { name: "Specialist Hospital Gwadabawa", type: "PUBLIC_SECONDARY", state: "Sokoto", city: "Gwadabawa" },
  // Zamfara
  { name: "General Hospital Talata Mafara", type: "PUBLIC_SECONDARY", state: "Zamfara", city: "Talata Mafara" },
  // Jigawa
  { name: "General Hospital Dutse", type: "PUBLIC_SECONDARY", state: "Jigawa", city: "Dutse" },
  { name: "General Hospital Hadejia", type: "PUBLIC_SECONDARY", state: "Jigawa", city: "Hadejia" },
  // Katsina
  { name: "Federal Medical Centre Daura", type: "PUBLIC_TERTIARY", state: "Katsina", city: "Daura" },
  { name: "General Hospital Malumfashi", type: "PUBLIC_SECONDARY", state: "Katsina", city: "Malumfashi" },
  // Kebbi
  { name: "General Hospital Argungu", type: "PUBLIC_SECONDARY", state: "Kebbi", city: "Argungu" },
  // Yobe
  { name: "General Hospital Gashua", type: "PUBLIC_SECONDARY", state: "Yobe", city: "Gashua" },
  { name: "General Hospital Potiskum", type: "PUBLIC_SECONDARY", state: "Yobe", city: "Potiskum" },
];

// ─── HOSPITAL CHAINS / HMO-ASSOCIATED ──────────────────────────────────────
const HOSPITAL_CHAINS: FacilitySeed[] = [
  { name: "Hygeia Hospital Lekki", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "MeCure Healthcare Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "RitaCare Hospital Surulere Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Ampere Specialist Hospital Surulere Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Afriglobal Medicare Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Synlab Nigeria Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  { name: "PathCare Laboratories Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  { name: "Clinical Pathology Laboratories Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
];

// ─── ADDITIONAL FROM WEB RESEARCH (Wikipedia, Finelib, HFR) ────────────────
const RESEARCH_BATCH: FacilitySeed[] = [
  // === LAGOS (from Wikipedia List of hospitals in Lagos) ===
  { name: "First Cardiology Consultants Lagos", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Etta Atlantic Memorial Hospital Lekki", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Euracare Hospital Victoria Island Lagos", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Isalu Hospital Ikeja", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Wind of Grace Hospital Okota Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Creek Hospital Lagos Island", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Mercy Stripes Specialist Hospital Shasha Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Holy Trinity Hospital Ikeja Lagos", type: "FAITH_BASED", state: "Lagos", city: "Lagos" },
  { name: "Adefemi Hospital Ikeja Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Ave Maria Hospital Lekki Lagos", type: "FAITH_BASED", state: "Lagos", city: "Lagos" },
  { name: "Krown Hospital Alimosho Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Mascot Healthcare Clinic Akoka Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  { name: "Outreach Women and Children Hospital Lekki Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Milagrosa Hospital Ikoyi Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Chygor-Cole Specialist Hospital Abule-Egba Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Maryiam Ville Medical Center Surulere Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  { name: "Adebayo Living Tower Hospital Badagry Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Shepherd Medical Centre Opebi Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Arubah Family Medical Centre Lekki Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
  { name: "St. Edmund Eye Hospital Surulere Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Bestcare Hospital Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Genesis Specialist Hospital Ikeja Lagos", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  // === PORT HARCOURT (from Wikipedia List of hospitals in Port Harcourt) ===
  { name: "Atinu Critical Care Hospital Elelenwo Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Anderson Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Calvary Hospital Orazi Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "C. Bennett Specialist Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Cova Care Specialist Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Daily Spring Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Dental and Maxillofacial Hospital Port Harcourt", type: "PUBLIC_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Destiny Hospital Diobu Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "El-Bene Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "El-Specialist Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "First Rivers Hospital Rumuomasi Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Fountain Hospital Diobu Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Getwell Hospital Rumuokoro Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Good Heart Specialist Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Golden Hands Medical Center Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Halten Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Higgwe Memorial Hospital Rumuokoro Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Hilton Clinics Port Harcourt", type: "PRIVATE_CLINIC", state: "Rivers", city: "Port Harcourt" },
  { name: "Hopeville Specialist Hospital Rumuola Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Jeconiah Children Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Alphonso Hospital Elelenwo Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Oasis Children Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Palmars Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Precious Life Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Princess Medical Center Trans-Amadi Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Rehoboth Specialist Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Ridcol Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Salem Hospital Oyigbo Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Valentine Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Save A Life Mission Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Sophike Medical Centre Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Shield Specialists Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Kariden Specialist Hospital Rumuola Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Pamo Clinics and Hospitals Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Bridgestone Hospital Port Harcourt", type: "PRIVATE_SECONDARY", state: "Rivers", city: "Port Harcourt" },
  { name: "Chris The King Hospital Oyigbo Port Harcourt", type: "FAITH_BASED", state: "Rivers", city: "Port Harcourt" },
  // === KANO (from Wikipedia List of hospitals in Kano) ===
  { name: "Infectious Disease Hospital Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Kano" },
  { name: "General Hospital Bichi Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Bichi" },
  { name: "General Hospital Dambatta Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Dambatta" },
  { name: "General Hospital Dawakin Tofa Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Dawakin Tofa" },
  { name: "Abubakar Imam Urology Centre Kano", type: "PUBLIC_TERTIARY", state: "Kano", city: "Kano" },
  { name: "General Hospital Wudil Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Wudil" },
  { name: "Muhammad Buhari Specialist Hospital Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Kano" },
  { name: "Nuhu Bamalli Maternity Clinic Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Kano" },
  { name: "Aurora Specialist Hospital Kano", type: "PRIVATE_SECONDARY", state: "Kano", city: "Kano" },
  { name: "Makkah Specialist Eye Hospital Kano", type: "PRIVATE_SECONDARY", state: "Kano", city: "Kano" },
  { name: "Warshu Hospital Kano", type: "PRIVATE_SECONDARY", state: "Kano", city: "Kano" },
  { name: "UMC Zhahir Hospital Kano", type: "PRIVATE_SECONDARY", state: "Kano", city: "Kano" },
  // === ABUJA (from Finelib directory) ===
  { name: "Alliance Hospital Garki Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "The Limi Hospital Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Jean Louis Medical Center Wuye Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Silver Fountain Medical Centre Kukwaba Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Taprobane Medical Center Lokogoma Abuja", type: "PRIVATE_CLINIC", state: "FCT Abuja", city: "Abuja" },
  { name: "Trust Charitos Hospital Jabi Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Wellington Clinics Maitama Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Providence Multi-Specialty Hospital Asokoro Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Mayfield Specialist Hospital Abuja", type: "PRIVATE_TERTIARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Royal Specialist Hospital Abuja", type: "PRIVATE_TERTIARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Kings Care Hospital Kubwa Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Katameya Firstcall Hospital Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Procare Hospital Life Camp Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Ultramed Hospital Gwarinpa Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Hi-Fi Hospital Dawaki Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Charitos BO Hospital Life Camp Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Guinea Savannah Medical Center Garki Abuja", type: "PRIVATE_CLINIC", state: "FCT Abuja", city: "Abuja" },
  { name: "Horizons Medical Centre Wuse Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "ModelCare Hospital Garki Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Pison Hospital Kubwa Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Diamond Medical Centre Garki Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Pan-Raf Hospital Nyanya Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Angelic Care Hospital Garki Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "108 NAF Hospital Abuja", type: "MILITARY", state: "FCT Abuja", city: "Abuja" },
  // === OYO STATE (from research) ===
  { name: "Molly Specialist Hospital Ibadan", type: "PRIVATE_SECONDARY", state: "Oyo", city: "Ibadan" },
  { name: "Oyomesi Specialist Hospital Ibadan", type: "PRIVATE_SECONDARY", state: "Oyo", city: "Ibadan" },
  { name: "Best Western Hospital Ibadan", type: "PRIVATE_SECONDARY", state: "Oyo", city: "Ibadan" },
  { name: "Zoe Specialist Hospital Ibadan", type: "PRIVATE_SECONDARY", state: "Oyo", city: "Ibadan" },
  { name: "Avon Healthcare Jolamade Specialist Hospital Ibadan", type: "PRIVATE_SECONDARY", state: "Oyo", city: "Ibadan" },
  // === ENUGU (from research) ===
  { name: "St. Mary Hospital Enugu", type: "FAITH_BASED", state: "Enugu", city: "Enugu" },
  { name: "Chinwendu Hospital Enugu", type: "PRIVATE_SECONDARY", state: "Enugu", city: "Enugu" },
  { name: "St. Paul Hospital and Maternity Enugu", type: "FAITH_BASED", state: "Enugu", city: "Enugu" },
  { name: "Hope Hospital and Maternity Enugu", type: "PRIVATE_SECONDARY", state: "Enugu", city: "Enugu" },
  { name: "Julius Ezenyirioha Memorial Hospital Enugu", type: "PRIVATE_SECONDARY", state: "Enugu", city: "Enugu" },
  { name: "St. Patrick Hospital and Maternity Enugu", type: "FAITH_BASED", state: "Enugu", city: "Enugu" },
  { name: "Regions Stroke and Neuroscience Hospital Imo", type: "PRIVATE_TERTIARY", state: "Imo", city: "Owerri" },
  // === GENERAL HOSPITALS BY LGA (filling gaps across states) ===
  // Kano LGA hospitals
  { name: "General Hospital Rano Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Rano" },
  { name: "General Hospital Karaye Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Karaye" },
  { name: "General Hospital Kura Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Kura" },
  { name: "General Hospital Sumaila Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Sumaila" },
  { name: "General Hospital Tudun Wada Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Tudun Wada" },
  { name: "General Hospital Garko Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Garko" },
  { name: "General Hospital Gezawa Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Gezawa" },
  { name: "General Hospital Kunchi Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Kunchi" },
  { name: "General Hospital Rogo Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Rogo" },
  { name: "General Hospital Bebeji Kano", type: "PUBLIC_SECONDARY", state: "Kano", city: "Bebeji" },
  // Lagos LGA general hospitals
  { name: "General Hospital Mushin Lagos", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "General Hospital Surulere Lagos", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "General Hospital Somolu Lagos", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "General Hospital Ojo Lagos", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "General Hospital Agbowa Ikorodu Lagos", type: "PUBLIC_SECONDARY", state: "Lagos", city: "Ikorodu" },
  // Kaduna state
  { name: "General Hospital Kafanchan Kaduna", type: "PUBLIC_SECONDARY", state: "Kaduna", city: "Kafanchan" },
  { name: "General Hospital Zaria Kaduna", type: "PUBLIC_SECONDARY", state: "Kaduna", city: "Zaria" },
  { name: "General Hospital Birnin Gwari Kaduna", type: "PUBLIC_SECONDARY", state: "Kaduna", city: "Birnin Gwari" },
  { name: "General Hospital Saminaka Kaduna", type: "PUBLIC_SECONDARY", state: "Kaduna", city: "Saminaka" },
  { name: "Mends Hospital Kaduna", type: "PRIVATE_SECONDARY", state: "Kaduna", city: "Kaduna" },
  // Ogun state
  { name: "General Hospital Ilaro Ogun", type: "PUBLIC_SECONDARY", state: "Ogun", city: "Ilaro" },
  { name: "General Hospital Ota Ogun", type: "PUBLIC_SECONDARY", state: "Ogun", city: "Ota" },
  { name: "State Hospital Ijaiye Abeokuta Ogun", type: "PUBLIC_SECONDARY", state: "Ogun", city: "Abeokuta" },
  // Borno
  { name: "Biu General Hospital Borno", type: "PUBLIC_SECONDARY", state: "Borno", city: "Biu" },
  { name: "General Hospital Bama Borno", type: "PUBLIC_SECONDARY", state: "Borno", city: "Bama" },
  { name: "Kanem Hospital Maiduguri", type: "PRIVATE_SECONDARY", state: "Borno", city: "Maiduguri" },
  // Bauchi
  { name: "General Hospital Ningi Bauchi", type: "PUBLIC_SECONDARY", state: "Bauchi", city: "Ningi" },
  { name: "General Hospital Tafawa Balewa Bauchi", type: "PUBLIC_SECONDARY", state: "Bauchi", city: "Tafawa Balewa" },
  { name: "General Hospital Misau Bauchi", type: "PUBLIC_SECONDARY", state: "Bauchi", city: "Misau" },
  { name: "General Hospital Dass Bauchi", type: "PUBLIC_SECONDARY", state: "Bauchi", city: "Dass" },
  { name: "General Hospital Katagum Bauchi", type: "PUBLIC_SECONDARY", state: "Bauchi", city: "Azare" },
  // Plateau
  { name: "General Hospital Pankshin Plateau", type: "PUBLIC_SECONDARY", state: "Plateau", city: "Pankshin" },
  { name: "General Hospital Shendam Plateau", type: "PUBLIC_SECONDARY", state: "Plateau", city: "Shendam" },
  { name: "General Hospital Langtang Plateau", type: "PUBLIC_SECONDARY", state: "Plateau", city: "Langtang" },
  // Niger
  { name: "General Hospital Kontagora Niger", type: "PUBLIC_SECONDARY", state: "Niger", city: "Kontagora" },
  { name: "General Hospital Mokwa Niger", type: "PUBLIC_SECONDARY", state: "Niger", city: "Mokwa" },
  { name: "General Hospital New Bussa Niger", type: "PUBLIC_SECONDARY", state: "Niger", city: "New Bussa" },
  { name: "Ahmadiyya Hospital New Bussa Niger", type: "FAITH_BASED", state: "Niger", city: "New Bussa" },
  // Kogi
  { name: "General Hospital Okene Kogi", type: "PUBLIC_SECONDARY", state: "Kogi", city: "Okene" },
  { name: "General Hospital Idah Kogi", type: "PUBLIC_SECONDARY", state: "Kogi", city: "Idah" },
  { name: "General Hospital Kabba Kogi", type: "PUBLIC_SECONDARY", state: "Kogi", city: "Kabba" },
  { name: "General Hospital Ankpa Kogi", type: "PUBLIC_SECONDARY", state: "Kogi", city: "Ankpa" },
  // Kwara
  { name: "General Hospital Omu-Aran Kwara", type: "PUBLIC_SECONDARY", state: "Kwara", city: "Omu-Aran" },
  { name: "General Hospital Lafiagi Kwara", type: "PUBLIC_SECONDARY", state: "Kwara", city: "Lafiagi" },
  { name: "General Hospital Patigi Kwara", type: "PUBLIC_SECONDARY", state: "Kwara", city: "Patigi" },
  // Osun
  { name: "General Hospital Ilesa Osun", type: "PUBLIC_SECONDARY", state: "Osun", city: "Ilesa" },
  { name: "General Hospital Ede Osun", type: "PUBLIC_SECONDARY", state: "Osun", city: "Ede" },
  { name: "General Hospital Ikirun Osun", type: "PUBLIC_SECONDARY", state: "Osun", city: "Ikirun" },
  // Ekiti
  { name: "General Hospital Ikole Ekiti", type: "PUBLIC_SECONDARY", state: "Ekiti", city: "Ikole" },
  { name: "General Hospital Ijero Ekiti", type: "PUBLIC_SECONDARY", state: "Ekiti", city: "Ijero" },
  { name: "General Hospital Ikere Ekiti", type: "PUBLIC_SECONDARY", state: "Ekiti", city: "Ikere" },
  { name: "General Hospital Efon Alaaye Ekiti", type: "PUBLIC_SECONDARY", state: "Ekiti", city: "Efon Alaaye" },
  // Ondo
  { name: "General Hospital Ikare Ondo", type: "PUBLIC_SECONDARY", state: "Ondo", city: "Ikare" },
  { name: "General Hospital Okitipupa Ondo", type: "PUBLIC_SECONDARY", state: "Ondo", city: "Okitipupa" },
  { name: "General Hospital Ore Ondo", type: "PUBLIC_SECONDARY", state: "Ondo", city: "Ore" },
  // Delta
  { name: "General Hospital Ughelli Delta", type: "PUBLIC_SECONDARY", state: "Delta", city: "Ughelli" },
  { name: "General Hospital Sapele Delta", type: "PUBLIC_SECONDARY", state: "Delta", city: "Sapele" },
  { name: "General Hospital Kwale Delta", type: "PUBLIC_SECONDARY", state: "Delta", city: "Kwale" },
  // Edo
  { name: "General Hospital Auchi Edo", type: "PUBLIC_SECONDARY", state: "Edo", city: "Auchi" },
  { name: "General Hospital Irrua Edo", type: "PUBLIC_SECONDARY", state: "Edo", city: "Irrua" },
  { name: "Irrua Specialist Teaching Hospital Edo", type: "PUBLIC_TERTIARY", state: "Edo", city: "Irrua" },
  { name: "General Hospital Uromi Edo", type: "PUBLIC_SECONDARY", state: "Edo", city: "Uromi" },
  // Abia
  { name: "General Hospital Aba Abia", type: "PUBLIC_SECONDARY", state: "Abia", city: "Aba" },
  { name: "General Hospital Ohafia Abia", type: "PUBLIC_SECONDARY", state: "Abia", city: "Ohafia" },
  // Imo
  { name: "General Hospital Okigwe Imo", type: "PUBLIC_SECONDARY", state: "Imo", city: "Okigwe" },
  { name: "General Hospital Oguta Imo", type: "PUBLIC_SECONDARY", state: "Imo", city: "Oguta" },
  // Anambra
  { name: "General Hospital Awka Anambra", type: "PUBLIC_SECONDARY", state: "Anambra", city: "Awka" },
  { name: "General Hospital Ekwulobia Anambra", type: "PUBLIC_SECONDARY", state: "Anambra", city: "Ekwulobia" },
  { name: "General Hospital Ihiala Anambra", type: "PUBLIC_SECONDARY", state: "Anambra", city: "Ihiala" },
  { name: "General Hospital Aguata Anambra", type: "PUBLIC_SECONDARY", state: "Anambra", city: "Aguata" },
  // Ebonyi
  { name: "General Hospital Onueke Ebonyi", type: "PUBLIC_SECONDARY", state: "Ebonyi", city: "Onueke" },
  { name: "General Hospital Afikpo Ebonyi", type: "PUBLIC_SECONDARY", state: "Ebonyi", city: "Afikpo" },
  // Cross River
  { name: "General Hospital Ogoja Cross River", type: "PUBLIC_SECONDARY", state: "Cross River", city: "Ogoja" },
  { name: "General Hospital Ikom Cross River", type: "PUBLIC_SECONDARY", state: "Cross River", city: "Ikom" },
  // Akwa Ibom
  { name: "General Hospital Eket Akwa Ibom", type: "PUBLIC_SECONDARY", state: "Akwa Ibom", city: "Eket" },
  { name: "General Hospital Oron Akwa Ibom", type: "PUBLIC_SECONDARY", state: "Akwa Ibom", city: "Oron" },
  { name: "General Hospital Abak Akwa Ibom", type: "PUBLIC_SECONDARY", state: "Akwa Ibom", city: "Abak" },
  // Bayelsa
  { name: "General Hospital Brass Bayelsa", type: "PUBLIC_SECONDARY", state: "Bayelsa", city: "Brass" },
  { name: "General Hospital Ogbia Bayelsa", type: "PUBLIC_SECONDARY", state: "Bayelsa", city: "Ogbia" },
  // Adamawa
  { name: "General Hospital Mubi Adamawa", type: "PUBLIC_SECONDARY", state: "Adamawa", city: "Mubi" },
  { name: "General Hospital Numan Adamawa", type: "PUBLIC_SECONDARY", state: "Adamawa", city: "Numan" },
  { name: "General Hospital Ganye Adamawa", type: "PUBLIC_SECONDARY", state: "Adamawa", city: "Ganye" },
  { name: "Newlife Hospital Mubi Adamawa", type: "PRIVATE_SECONDARY", state: "Adamawa", city: "Mubi" },
  // Gombe
  { name: "General Hospital Kumo Gombe", type: "PUBLIC_SECONDARY", state: "Gombe", city: "Kumo" },
  { name: "General Hospital Billiri Gombe", type: "PUBLIC_SECONDARY", state: "Gombe", city: "Billiri" },
  { name: "General Hospital Kaltungo Gombe", type: "PUBLIC_SECONDARY", state: "Gombe", city: "Kaltungo" },
  // Taraba
  { name: "General Hospital Wukari Taraba", type: "PUBLIC_SECONDARY", state: "Taraba", city: "Wukari" },
  { name: "General Hospital Takum Taraba", type: "PUBLIC_SECONDARY", state: "Taraba", city: "Takum" },
  // Benue
  { name: "General Hospital Otukpo Benue", type: "PUBLIC_SECONDARY", state: "Benue", city: "Otukpo" },
  { name: "General Hospital Gboko Benue", type: "PUBLIC_SECONDARY", state: "Benue", city: "Gboko" },
  { name: "General Hospital Katsina-Ala Benue", type: "PUBLIC_SECONDARY", state: "Benue", city: "Katsina-Ala" },
  // Nasarawa
  { name: "General Hospital Lafia Nasarawa", type: "PUBLIC_SECONDARY", state: "Nasarawa", city: "Lafia" },
  { name: "General Hospital Akwanga Nasarawa", type: "PUBLIC_SECONDARY", state: "Nasarawa", city: "Akwanga" },
  { name: "General Hospital Nasarawa Nasarawa", type: "PUBLIC_SECONDARY", state: "Nasarawa", city: "Nasarawa" },
  // Sokoto
  { name: "General Hospital Bodinga Sokoto", type: "PUBLIC_SECONDARY", state: "Sokoto", city: "Bodinga" },
  { name: "General Hospital Tambuwal Sokoto", type: "PUBLIC_SECONDARY", state: "Sokoto", city: "Tambuwal" },
  // Zamfara
  { name: "General Hospital Kaura Namoda Zamfara", type: "PUBLIC_SECONDARY", state: "Zamfara", city: "Kaura Namoda" },
  { name: "General Hospital Anka Zamfara", type: "PUBLIC_SECONDARY", state: "Zamfara", city: "Anka" },
  // Kebbi
  { name: "General Hospital Zuru Kebbi", type: "PUBLIC_SECONDARY", state: "Kebbi", city: "Zuru" },
  { name: "General Hospital Yauri Kebbi", type: "PUBLIC_SECONDARY", state: "Kebbi", city: "Yauri" },
  { name: "General Hospital Jega Kebbi", type: "PUBLIC_SECONDARY", state: "Kebbi", city: "Jega" },
  // Katsina LGA hospitals
  { name: "General Hospital Funtua Katsina", type: "PUBLIC_SECONDARY", state: "Katsina", city: "Funtua" },
  { name: "General Hospital Daura Katsina", type: "PUBLIC_SECONDARY", state: "Katsina", city: "Daura" },
  { name: "General Hospital Kankia Katsina", type: "PUBLIC_SECONDARY", state: "Katsina", city: "Kankia" },
  // Jigawa LGA hospitals
  { name: "General Hospital Gumel Jigawa", type: "PUBLIC_SECONDARY", state: "Jigawa", city: "Gumel" },
  { name: "General Hospital Kazaure Jigawa", type: "PUBLIC_SECONDARY", state: "Jigawa", city: "Kazaure" },
  { name: "General Hospital Ringim Jigawa", type: "PUBLIC_SECONDARY", state: "Jigawa", city: "Ringim" },
  // Yobe LGA hospitals
  { name: "General Hospital Geidam Yobe", type: "PUBLIC_SECONDARY", state: "Yobe", city: "Geidam" },
  { name: "General Hospital Buni Yadi Yobe", type: "PUBLIC_SECONDARY", state: "Yobe", city: "Buni Yadi" },
  // === NOTABLE SPECIALIST / NEW GENERATION ===
  { name: "African Medical Centre of Excellence Abuja", type: "PRIVATE_TERTIARY", state: "FCT Abuja", city: "Abuja" },
  { name: "MEV Specialist Hospital Abuja", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Rasheed Shekoni Federal University Teaching Hospital Dutse", type: "PUBLIC_TERTIARY", state: "Jigawa", city: "Dutse" },
  { name: "Federal University of Health Sciences Teaching Hospital Otukpo", type: "PUBLIC_TERTIARY", state: "Benue", city: "Otukpo" },
  { name: "Lekfad Medical Centre Lagos", type: "PRIVATE_CLINIC", state: "Lagos", city: "Lagos" },
];

async function seed() {
  const allFacilities = [
    ...FEDERAL_MEDICAL_CENTRES,
    ...TEACHING_HOSPITALS,
    ...STATE_HOSPITALS,
    ...PRIVATE_HOSPITALS,
    ...FAITH_BASED_HOSPITALS,
    ...MILITARY_HOSPITALS,
    ...MORE_PRIVATE,
    ...HOSPITAL_CHAINS,
    ...RESEARCH_BATCH,
  ];

  // Deduplicate by slugified name
  const seen = new Set<string>();
  const unique: FacilitySeed[] = [];
  for (const f of allFacilities) {
    const slug = slugify(f.name);
    if (!seen.has(slug)) {
      seen.add(slug);
      unique.push(f);
    }
  }

  console.log(`Prepared ${unique.length} unique hospitals (from ${allFacilities.length} total entries).`);
  console.log(`Seeding...`);

  let created = 0;
  let skipped = 0;

  for (const facility of unique) {
    const slug = slugify(facility.name);

    const existing = await prisma.cadreFacility.findUnique({
      where: { slug },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.cadreFacility.create({
      data: {
        name: facility.name,
        slug,
        type: facility.type,
        state: facility.state,
        city: facility.city,
      },
    });

    created++;
  }

  const totalInDb = await prisma.cadreFacility.count();
  console.log(`\nDone.`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already exists): ${skipped}`);
  console.log(`  Total in database: ${totalInDb}`);
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
