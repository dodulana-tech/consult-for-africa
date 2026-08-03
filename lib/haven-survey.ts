// Metadata mirror of the two public Haven diagnostic-audit survey forms.
// The source of truth for question wording is the static forms:
//   public/haven-audit.html           -> survey "haven-safety-culture"
//   public/haven-patient-survey.html  -> survey "haven-patient-experience"
// Keep this in sync if those forms change. Submitted values are strings
// ("1".."5" for scale items, "NA" for not-applicable, plain text for open fields).

export type ScaleQuestion = {
  key: string;
  text: string;
  section: string;
  // Negatively worded item: a LOWER score is the good result. Used to colour
  // and interpret the mean correctly (we never silently rescore the raw data).
  reverse?: boolean;
};

export type CategoricalField = {
  key: string;
  label: string;
  options: string[]; // display order, best -> worst
};

export type SurveyMeta = {
  id: string;
  title: string;
  audience: string;
  scaleMax: number;
  questions: ScaleQuestion[];
  categorical: CategoricalField[];
  openText: { key: string; label: string }[];
};

// ---------------------------------------------------------------------------
// Staff safety & culture survey  (public/haven-audit.html)
// q1..q36 in section order, then rec_care / rec_work (agreement scale).
// ---------------------------------------------------------------------------
const SAFETY_QUESTIONS: ScaleQuestion[] = [
  // 1. Your area & teamwork
  { key: "q1", section: "Your area & teamwork", text: "Staff in my area treat each other with respect." },
  { key: "q2", section: "Your area & teamwork", text: "When the workload is heavy, we work together as a team to get it done." },
  { key: "q3", section: "Your area & teamwork", text: "In this area, people support one another." },
  { key: "q4", section: "Your area & teamwork", text: "During busy or difficult moments, we have the staff we need to handle the work." },
  { key: "q5", section: "Your area & teamwork", text: "The work pace here is so high that it feels unsafe.", reverse: true },
  // 2. Communication & openness
  { key: "q6", section: "Communication & openness", text: "Staff feel free to question the decisions or actions of those with more authority." },
  { key: "q7", section: "Communication & openness", text: "Staff speak up if they see something that might negatively affect patient care." },
  { key: "q8", section: "Communication & openness", text: "Staff are afraid to ask questions when something does not seem right.", reverse: true },
  { key: "q9", section: "Communication & openness", text: "When staff make an error, we talk about it so we can learn from it." },
  { key: "q10", section: "Communication & openness", text: "We are told about changes to procedures and about mistakes that happen here." },
  // 3. Response to mistakes
  { key: "q11", section: "Response to mistakes", text: "Staff feel that their mistakes are held against them.", reverse: true },
  { key: "q12", section: "Response to mistakes", text: "When an event is reported, it feels like the person is blamed, not the problem fixed.", reverse: true },
  { key: "q13", section: "Response to mistakes", text: "When we make mistakes, we are treated fairly." },
  { key: "q14", section: "Response to mistakes", text: "Repeated problems are dealt with constructively, not just punished." },
  // 4. Reporting & learning
  { key: "q15", section: "Reporting & learning", text: "When a mistake is caught before it reaches a patient, it is reported." },
  { key: "q16", section: "Reporting & learning", text: "When a mistake reaches a patient but causes no harm, it is reported." },
  { key: "q17", section: "Reporting & learning", text: "We are given feedback about changes made because of what gets reported." },
  { key: "q18", section: "Reporting & learning", text: "After a problem, this area actually changes how it works to prevent it recurring." },
  { key: "q19", section: "Reporting & learning", text: "I know how to report a patient-safety concern here." },
  // 5. Management & supervisor support
  { key: "q20", section: "Management & supervisor support", text: "My supervisor / matron seriously considers staff suggestions for improving safety." },
  { key: "q21", section: "Management & supervisor support", text: "My supervisor / matron overlooks safety problems that happen over and over.", reverse: true },
  { key: "q22", section: "Management & supervisor support", text: "Management provides the resources (staff, equipment, drugs) needed to give safe care." },
  { key: "q23", section: "Management & supervisor support", text: "Management's actions show that patient safety is a top priority." },
  { key: "q24", section: "Management & supervisor support", text: "Management only seems interested in patient safety after something goes wrong.", reverse: true },
  // 6. Handovers between shifts
  { key: "q25", section: "Handovers between shifts", text: "Important patient-care information is shared clearly across shifts." },
  { key: "q26", section: "Handovers between shifts", text: "Things fall between the cracks when patients are handed over between shifts or staff.", reverse: true },
  { key: "q27", section: "Handovers between shifts", text: "Shift changes are a risky time for patients here.", reverse: true },
  // 7. Emergency readiness & routines (frequency scale)
  { key: "q28", section: "Emergency readiness & routines", text: "The crash cart / emergency tray is fully stocked and ready." },
  { key: "q29", section: "Emergency readiness & routines", text: "There is a routine, every shift, for checking emergency drugs and equipment." },
  { key: "q30", section: "Emergency readiness & routines", text: "If a child needed emergency resuscitation right now, we would have what we need." },
  { key: "q31", section: "Emergency readiness & routines", text: "Essential drugs or consumables are out of stock when we need them.", reverse: true },
  // 8. Emergency readiness (about you)
  { key: "q32", section: "Emergency readiness (about you)", text: "I have had recent resuscitation training (BLS / PALS / NRP) for the patients I care for." },
  // 9. Fairness, incentives & ownership
  { key: "q33", section: "Fairness, incentives & ownership", text: "I understand clearly what I am responsible for and what good performance looks like in my role." },
  { key: "q34", section: "Fairness, incentives & ownership", text: "The way pay, commission or rewards work here is fair and clear." },
  { key: "q35", section: "Fairness, incentives & ownership", text: "The rewards and recognition here encourage good, safe, careful work, not just speed or volume." },
  { key: "q36", section: "Fairness, incentives & ownership", text: "I feel a sense of ownership for how well Haven runs, not just my own tasks." },
  // Recommendation (agreement scale)
  { key: "rec_care", section: "Recommendation", text: "I would recommend Haven as a place to receive care." },
  { key: "rec_work", section: "Recommendation", text: "I would recommend Haven as a place to work." },
];

const SAFETY_META: SurveyMeta = {
  id: "haven-safety-culture",
  title: "Staff Safety & Culture",
  audience: "Haven staff (anonymous)",
  scaleMax: 5,
  questions: SAFETY_QUESTIONS,
  categorical: [
    { key: "grade", label: "Overall grade on patient safety", options: ["Excellent", "Very good", "Acceptable", "Poor", "Failing"] },
    { key: "area", label: "Primary area", options: ["Nursing", "Medical / Clinical", "Pharmacy", "Front desk / Customer service", "Admin / Accounts", "Operations", "Other"] },
    { key: "tenure", label: "Time at Haven", options: ["Under 6 months", "6–12 months", "1–2 years", "2 years or more"] },
  ],
  openText: [
    { key: "open_safe", label: "One thing that would make Haven safer for patients" },
    { key: "open_work", label: "One thing that would make Haven a better place to work" },
  ],
};

// ---------------------------------------------------------------------------
// Patient / parent experience survey  (public/haven-patient-survey.html)
// q1..q10, all positively worded. overall + recommend are categorical.
// ---------------------------------------------------------------------------
const PATIENT_QUESTIONS: ScaleQuestion[] = [
  { key: "q1", section: "Getting seen", text: "It was easy to book and be seen at Haven." },
  { key: "q2", section: "Getting seen", text: "I did not wait too long to be attended to." },
  { key: "q3", section: "The team & how they treated us", text: "Staff treated me and my child with respect and kindness." },
  { key: "q4", section: "The team & how they treated us", text: "The doctor or nurse explained my child's care in a way I understood." },
  { key: "q5", section: "The team & how they treated us", text: "I felt listened to, and able to ask questions." },
  { key: "q6", section: "The team & how they treated us", text: "I always knew what was happening with my child's care." },
  { key: "q7", section: "Safety & the place", text: "The facility was clean and comfortable." },
  { key: "q8", section: "Safety & the place", text: "I felt my child was safe and well cared for here." },
  { key: "q9", section: "Safety & the place", text: "I had confidence in the medical team." },
  { key: "q10", section: "Cost", text: "Charges and payments were explained to me clearly." },
];

const PATIENT_META: SurveyMeta = {
  id: "haven-patient-experience",
  title: "Patient & Parent Experience",
  audience: "Haven parents / patients (anonymous)",
  scaleMax: 5,
  questions: PATIENT_QUESTIONS,
  categorical: [
    { key: "overall", label: "Overall experience", options: ["Excellent", "Very good", "Good", "Fair", "Poor"] },
    { key: "recommend", label: "Would recommend Haven to other parents", options: ["Definitely", "Probably", "Not sure", "Probably not", "No"] },
  ],
  openText: [{ key: "open_better", label: "One thing we could do better" }],
};

export const HAVEN_SURVEYS: SurveyMeta[] = [SAFETY_META, PATIENT_META];

export function surveyMetaById(id: string): SurveyMeta | undefined {
  return HAVEN_SURVEYS.find((s) => s.id === id);
}
