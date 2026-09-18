// Metadata mirror of the four public Dennis Ashley audit forms. The source of
// truth for question wording is the static forms themselves:
//
//   public/dennis-ashley-staff-survey.html      -> "dennis-ashley-staff-culture"
//   public/dennis-ashley-patient-survey.html    -> "dennis-ashley-patient-experience"
//   public/dennis-ashley-referrer-survey.html   -> "dennis-ashley-referrer"
//   public/dennis-ashley-leadership-survey.html -> "dennis-ashley-leadership-direction"
//
// Keep this in sync if those forms change. Submitted values are strings
// ("1".."5" for scale items, "NA" for not applicable, plain text for open
// fields, arrays of strings for multi-select), and constant-sum splits arrive
// as numeric strings that add to 100. Mirrors lib/osteon-survey.ts.

export type ScaleQuestion = {
  key: string;
  text: string;
  section: string;
  /** A lower score is the good result here. Never silently rescored. */
  reverse?: boolean;
  /** Which 1-5 wording the form shows. Defaults to agreement. */
  scale?: "agree" | "frequency";
};

export type CategoricalField = { key: string; label: string; options: string[] };
export type MultiField = { key: string; label: string; options: string[] };
export type OpenField = { key: string; label: string };
export type SplitItem = { key: string; label: string };

export type SurveyMeta = {
  id: string;
  title: string;
  audience: string;
  anonymous: boolean;
  formPath: string;
  intro: string;
  questions: ScaleQuestion[];
  categorical: CategoricalField[];
  multi: MultiField[];
  open: OpenField[];
  splits: { label: string; items: SplitItem[] }[];
  tensions: { key: string; a: string; b: string }[];
};

const empty = { questions: [], categorical: [], multi: [], open: [], splits: [], tensions: [] };

// ---------------------------------------------------------------------------
// 1. Staff and safety culture.
// ---------------------------------------------------------------------------

const S_TEAM = "Your team and how the work gets done";
const S_SPEAK = "Speaking up";
const S_WRONG = "When something goes wrong";
const S_ENDO = "The endoscopy suite";
const S_REPRO = "Cleaning scopes and infection prevention";
const S_FLOW = "The clinic day and corporate clinics";
const S_KIT = "Equipment and supplies";
const S_COVER = "Cover, and how decisions get made";
const S_RUN = "How the place is run";
const S_PATIENTS = "Patients";

const STAFF_QUESTIONS: ScaleQuestion[] = [
  { key: "q1", section: S_TEAM, text: "People here treat each other with respect." },
  { key: "q2", section: S_TEAM, text: "When the day is heavy, we pull together to get the work done." },
  { key: "q3", section: S_TEAM, text: "We have enough people on duty to run the clinic and the endoscopy list safely." },
  { key: "q4", section: S_TEAM, text: "The pace of work here is so high that it feels unsafe.", reverse: true },

  { key: "q5", section: S_SPEAK, text: "I can question a decision made by someone more senior without it being held against me." },
  { key: "q6", section: S_SPEAK, text: "If I saw something that could harm a patient, I would say so immediately." },
  { key: "q7", section: S_SPEAK, text: "Staff here are afraid to ask questions when something does not seem right.", reverse: true },
  { key: "q8", section: S_SPEAK, text: "When somebody raises a concern, something is actually done about it." },
  { key: "q9", section: S_SPEAK, text: "I know who to go to when something is wrong." },

  { key: "q10", section: S_WRONG, text: "When a mistake happens here, we talk about it so that we can learn from it." },
  { key: "q11", section: S_WRONG, text: "People here feel their mistakes are held against them.", reverse: true },
  { key: "q12", section: S_WRONG, text: "We are told when something has gone wrong, and what changed because of it." },

  { key: "q13", section: S_ENDO, text: "The endoscopy list starts at the time it was meant to start.", scale: "frequency" },
  { key: "q14", section: S_ENDO, text: "Everything needed for a procedure is ready before the patient comes into the suite.", scale: "frequency" },
  { key: "q15", section: S_ENDO, text: "A safety check is done out loud before each procedure, with the whole team listening.", scale: "frequency" },
  { key: "q16", section: S_ENDO, text: "The scope and equipment are checked and working before each patient.", scale: "frequency" },
  { key: "q17", section: S_ENDO, text: "During sedation, someone whose only job is watching the patient is monitoring them.", scale: "frequency" },
  { key: "q18", section: S_ENDO, text: "The findings, and any samples taken, are recorded in the patient's record before the patient leaves the suite.", scale: "frequency" },

  { key: "q19", section: S_REPRO, text: "I am confident that every scope used here has been properly cleaned and reprocessed before the next patient.", scale: "frequency" },
  { key: "q20", section: S_REPRO, text: "The decontamination and reprocessing records are completed for every scope.", scale: "frequency" },
  { key: "q21", section: S_REPRO, text: "Clean scopes are stored so that they stay clean until they are next used.", scale: "frequency" },
  { key: "q22", section: S_REPRO, text: "Hand hygiene happens as it should, by everybody, including the most senior people.", scale: "frequency" },

  { key: "q23", section: S_FLOW, text: "Clinics run close to the appointment times patients are given.", scale: "frequency" },
  { key: "q24", section: S_FLOW, text: "When a corporate or wellness day is booked, we have enough staff and rooms to run it well.", scale: "frequency" },
  { key: "q25", section: S_FLOW, text: "Results, referrals and follow-ups are chased so that patients do not fall through the cracks.", scale: "frequency" },
  { key: "q26", section: S_FLOW, text: "Patient records and history are to hand when the doctor needs them.", scale: "frequency" },
  { key: "q27", section: S_FLOW, text: "On busy corporate days, patient privacy and confidentiality are still protected.", scale: "frequency" },

  { key: "q28", section: S_KIT, text: "The equipment I need is working when I need it.", scale: "frequency" },
  { key: "q29", section: S_KIT, text: "We run short of something we need for a patient.", reverse: true, scale: "frequency" },
  { key: "q30", section: S_KIT, text: "Emergency equipment and drugs, including for reversing sedation, are checked and ready to use.", scale: "frequency" },

  { key: "q31", section: S_COVER, text: "When the senior doctor is away, it is clear who is in charge here." },
  { key: "q32", section: S_COVER, text: "I can get a senior clinical decision quickly when I need one." },
  { key: "q33", section: S_COVER, text: "The rota gives me enough notice to plan my life." },
  { key: "q34", section: S_COVER, text: "I have had the training I need to do my job properly." },
  { key: "q35", section: S_COVER, text: "New people are properly shown how things are done here." },

  { key: "q36", section: S_RUN, text: "I understand where this clinic is trying to get to." },
  { key: "q37", section: S_RUN, text: "Decisions here are made and explained clearly." },
  { key: "q38", section: S_RUN, text: "Someone would notice if I did my job especially well." },
  { key: "q39", section: S_RUN, text: "I am paid fairly for the work I do." },
  { key: "q40", section: S_RUN, text: "I have what I need to give patients a good experience." },

  { key: "q41", section: S_PATIENTS, text: "Patients here are treated with kindness." },
  { key: "q42", section: S_PATIENTS, text: "Patients understand what they are paying for before they pay it." },
  { key: "q43", section: S_PATIENTS, text: "Patients get their questions answered before they agree to a procedure." },
  { key: "q44", section: S_PATIENTS, text: "When care goes through an HMO or a company, the patient is clear about what is covered and what is not." },

  { key: "rec_care", section: "Overall", text: "I would be happy for a member of my own family to be treated here." },
  { key: "rec_work", section: "Overall", text: "I would recommend Dennis Ashley as a place to work." },
  { key: "stay", section: "Overall", text: "I expect to still be working here in a year." },
];

const STAFF: SurveyMeta = {
  ...empty,
  id: "dennis-ashley-staff-culture",
  title: "Staff and safety culture",
  audience: "Everyone who works at Dennis Ashley Medical Clinic & Endoscopy Suites",
  anonymous: true,
  formPath: "/dennis-ashley-staff-survey.html",
  intro: "Your answers are anonymous. They go to Consult for Africa, not to the clinic's owners or to anyone who manages you, and they are reported only as grouped totals. There are no right answers, and nothing here is a test of you. Use N/A freely where a question is about a part of the clinic you do not work in.",
  questions: STAFF_QUESTIONS,
  categorical: [
    { key: "grade", label: "Overall, how safe are patients here", options: ["Excellent", "Very good", "Acceptable", "Poor", "Failing"] },
    {
      key: "area", label: "Where they mostly work", options: [
        "Doctors and clinical", "Nursing", "Endoscopy suite and reprocessing",
        "Front desk and patient coordination", "Corporate, HMO and billing",
        "Accounts and admin", "Laboratory and diagnostics",
        "Support and housekeeping", "Other"],
    },
    { key: "tenure", label: "Time at Dennis Ashley", options: ["Under 6 months", "6 to 12 months", "1 to 3 years", "More than 3 years"] },
    { key: "elsewhere", label: "Also works elsewhere", options: ["No, only here", "Yes, one other place", "Yes, more than one other place"] },
  ],
  open: [
    { key: "open_safe", label: "The one thing that would make Dennis Ashley safer for patients" },
    { key: "open_work", label: "The one thing that would make Dennis Ashley a better place to work" },
    { key: "open_hidden", label: "Something a visitor would never notice" },
  ],
};

// ---------------------------------------------------------------------------
// 2. Patient experience.
// ---------------------------------------------------------------------------

const D_APPT = "Getting an appointment";
const D_RECEPTION = "Reception and waiting";
const D_CONSULT = "The consultation";
const D_COST = "The cost and your HMO";
const D_ENDO = "If you had an endoscopy";
const D_WELLNESS = "If you came for a health check or wellness package";
const D_NOW = "How you feel about your care";

const PATIENT_QUESTIONS: ScaleQuestion[] = [
  { key: "q1", section: D_APPT, text: "It was easy to book an appointment at a time that suited me." },
  { key: "q2", section: D_APPT, text: "Reaching the clinic by phone, WhatsApp or online was easy." },
  { key: "q3", section: D_APPT, text: "I was seen close to the time I was given." },

  { key: "q4", section: D_RECEPTION, text: "The reception team made me feel welcome and looked after." },
  { key: "q5", section: D_RECEPTION, text: "The clinic was clean, calm and comfortable." },
  { key: "q6", section: D_RECEPTION, text: "My privacy was respected at the front desk and while I waited." },

  { key: "q7", section: D_CONSULT, text: "The doctor listened carefully to what I came in with." },
  { key: "q8", section: D_CONSULT, text: "My condition or my results were explained in a way I understood." },
  { key: "q9", section: D_CONSULT, text: "I was told what my choices were, and what each one would involve." },
  { key: "q10", section: D_CONSULT, text: "I could ask questions without feeling rushed." },
  { key: "q11", section: D_CONSULT, text: "I was treated with respect and kindness by everybody." },

  { key: "q12", section: D_COST, text: "I was told what it would cost before I had to decide." },
  { key: "q13", section: D_COST, text: "If I used an HMO or insurance, the cover was sorted out smoothly for me." },
  { key: "q14", section: D_COST, text: "The final amount was what I had been told it would be." },
  { key: "q15", section: D_COST, text: "What I paid felt fair for what I received." },

  { key: "q16", section: D_ENDO, text: "The instructions for preparing for my procedure were clear and easy to follow." },
  { key: "q17", section: D_ENDO, text: "What would happen during the procedure was explained to me beforehand." },
  { key: "q18", section: D_ENDO, text: "I felt comfortable and cared for during the procedure." },
  { key: "q19", section: D_ENDO, text: "The sedation was handled well and I felt safe throughout." },
  { key: "q20", section: D_ENDO, text: "My results were explained clearly, and I knew what the next steps were." },

  { key: "q21", section: D_WELLNESS, text: "The health check covered what I expected it to." },
  { key: "q22", section: D_WELLNESS, text: "My results were explained in a way that helped me act on them." },
  { key: "q23", section: D_WELLNESS, text: "It felt like the visit was about my long-term health, not just today." },

  { key: "q24", section: D_NOW, text: "I feel genuinely looked after by this clinic." },
  { key: "q25", section: D_NOW, text: "Knowing what I know now, I would choose Dennis Ashley again." },
];

const PATIENT: SurveyMeta = {
  id: "dennis-ashley-patient-experience",
  title: "Patient experience",
  audience: "Patients seen for a consultation, health check or endoscopy in the last 12 months",
  anonymous: true,
  formPath: "/dennis-ashley-patient-survey.html",
  intro: "This survey is anonymous, so we do not ask your name and nobody can tell which answers are yours. Whether you came in for a consultation, a health check or an endoscopy, please be honest, including about anything that disappointed you. That is how it becomes useful.",
  questions: PATIENT_QUESTIONS,
  categorical: [
    {
      key: "pay_source", label: "How the care was paid for", options: [
        "My own money", "Family here in Nigeria", "Family living abroad", "HMO or health insurance",
        "My employer or a corporate plan", "A loan or instalments", "Still owing some of it", "Prefer not to say"],
    },
    {
      key: "which_hmo", label: "Which HMO or insurer, if any", options: [
        "Leadway Health", "AXA Mansard", "Avon HMO", "Hygeia HMO", "Reliance HMO", "Clearline HMO",
        "Redcare / Fidelity", "ProHealth HMO", "Novo Health Africa", "Another HMO on the panel",
        "I did not use an HMO", "Prefer not to say"],
    },
    {
      key: "abroad", label: "Considered having this done outside Nigeria", options: [
        "It never crossed my mind", "I thought about it", "I looked into it seriously",
        "I usually go abroad for this", "I have had this done abroad before"],
    },
    { key: "now", label: "How well looked after their health feels", options: ["Much better", "Better", "About the same", "Worse", "Much worse", "Too early to say"] },
    { key: "recommend", label: "Would recommend Dennis Ashley", options: ["Definitely", "Probably", "Not sure", "Probably not", "Definitely not"] },
    {
      key: "asked", label: "Has anyone asked them since", options: [
        "Yes, and I recommended it", "Yes, but I was not sure what to say",
        "Yes, and I did not recommend it", "Nobody has asked"],
    },
    {
      key: "reason", label: "What they mainly came for", options: [
        "General or specialist consultation", "A health check or wellness package",
        "An endoscopy (gastroscopy or colonoscopy)", "A follow-up visit", "Corporate or employee health",
        "Vaccination or travel health", "Something else"],
    },
    { key: "when", label: "When", options: ["In the last 3 months", "3 to 6 months ago", "6 to 12 months ago", "More than a year ago"] },
    { key: "visits", label: "How often they have visited", options: ["This was my first visit", "I have been a few times", "I come here regularly for my care"] },
    {
      key: "found_us", label: "How they first heard of Dennis Ashley", options: [
        "Another doctor sent me", "My HMO or insurer", "My employer", "A friend or family member",
        "A former patient", "I searched online", "Social media", "I live or work nearby", "Other"],
    },
  ],
  multi: [
    {
      key: "services_used", label: "Which services they used", options: [
        "General or specialist consultation", "A health check or wellness package",
        "Gastroscopy (upper endoscopy)", "Colonoscopy", "Laboratory tests", "Vaccination or travel health",
        "Corporate or employee health", "Pharmacy", "Other"],
    },
    {
      key: "almost_stopped", label: "What almost stopped them coming or going ahead", options: [
        "The cost", "I was not sure it was necessary", "Fear of the procedure itself",
        "Sorting out my HMO or cover", "Travel or distance", "I could not get a convenient time",
        "Worry about privacy", "Nothing, I was ready", "Other"],
    },
  ],
  open: [
    { key: "referrer_name", label: "Who sent them, named by the patient" },
    { key: "open_best", label: "The best thing about the experience" },
    { key: "open_improve", label: "The one thing we should do better" },
  ],
  splits: [],
  tensions: [],
};

// ---------------------------------------------------------------------------
// 3. Referring colleagues.
// ---------------------------------------------------------------------------

const R_EXP = "Referring to Dennis Ashley";
const R_INT = "Would you take part";

const REFERRER_QUESTIONS: ScaleQuestion[] = [
  { key: "r_clarity", section: R_EXP, text: "I am clear about what the clinic does well, and which patients it suits." },
  { key: "r_speed", section: R_EXP, text: "My patients are seen and scheduled quickly when I refer them." },
  { key: "r_report", section: R_EXP, text: "I receive a clear report on what was found." },
  { key: "r_report_speed", section: R_EXP, text: "I receive the report quickly enough for it to be useful to me." },
  { key: "r_satisfied", section: R_EXP, text: "My patients come back satisfied with how they were treated." },
  { key: "r_price", section: R_EXP, text: "I am confident about what my patient will be charged before I send them." },
  { key: "r_hmo", section: R_EXP, text: "Billing through the HMO or a corporate scheme is handled smoothly." },
  { key: "r_complex", section: R_EXP, text: "I would be comfortable sending a frail or higher-risk patient for a procedure under sedation here." },
  { key: "r_ownership", section: R_EXP, text: "The patient stays mine. I do not worry about losing them." },
  { key: "i_mdt", section: R_INT, text: "A regular meeting where GI, diagnostic and wellness cases are discussed." },
  { key: "i_teaching", section: R_INT, text: "Teaching or hands-on sessions on when to scope and how to act on a report." },
  { key: "i_portal", section: R_INT, text: "An online way to refer and follow a patient." },
  { key: "i_corporate", section: R_INT, text: "A joint employee-health or wellness programme run with your organisation." },
];

const REFERRER: SurveyMeta = {
  id: "dennis-ashley-referrer",
  title: "Referring colleagues",
  audience: "GPs, physicians and clinics that refer, and corporate and HR buyers of employee-health",
  anonymous: false,
  formPath: "/dennis-ashley-referrer-survey.html",
  intro:
    "Consult for Africa is working with Dennis Ashley Medical Clinic & Endoscopy Suites, in Oniru, on how its referral, diagnostics and wellness service should be built over the next two years. Rather than design it around what we think referring colleagues and corporate buyers want, we are asking you directly. The questions are about your practice, your patients or your staff, and the least useful thing you could do is be polite.",
  questions: REFERRER_QUESTIONS,
  categorical: [
    {
      key: "referrer_type", label: "What best describes them", options: [
        "A GP or family physician", "A specialist physician", "Another clinic or hospital",
        "A corporate or HR buyer of employee health", "An HMO or insurer",
        "A wellness, laboratory or imaging partner", "Something else"],
    },
    {
      key: "know_us", label: "How they know Dennis Ashley", options: [
        "I have referred patients here", "I know the clinic but have not referred", "I know of it only",
        "I have not come across it before", "We have worked together"],
    },
    { key: "volume", label: "Endoscopy, diagnostic or wellness patients seen per month", options: ["None", "1 to 2", "3 to 5", "6 to 10", "More than 10"] },
    { key: "abroad_count", label: "Patients who travelled abroad for a check in two years", options: ["None that I know of", "One or two", "Three to five", "More than five"] },
    {
      key: "main_barrier", label: "Main reason a patient does not get the workup", options: [
        "They cannot afford it", "They are afraid of the procedure",
        "They do not trust the result they will get here", "They do not believe it is necessary yet",
        "They cannot get a timely appointment", "Their HMO will not cover it",
        "They are waiting to travel abroad", "Something else"],
    },
    {
      key: "price_belief", label: "What they believe a private gastroscopy or colonoscopy costs", options: [
        "Under 100,000 naira", "100,000 to 200,000", "200,000 to 350,000",
        "350,000 to 500,000", "Over 500,000", "I genuinely do not know"],
    },
    {
      key: "trend", label: "How their referring has changed in two years", options: [
        "I refer more than I used to", "About the same", "I refer less than I used to",
        "I used to refer and I stopped", "I have never referred here"],
    },
    {
      key: "intro_consent", label: "May we name them when approaching the colleagues they suggested", options: [
        "Yes, you may use my name", "Please do not use my name",
        "I would rather forward it to them myself"],
    },
    {
      key: "consent", label: "Attribution consent", options: [
        "Yes, my name may be attached to what I said", "Report my answers, but without my name",
        "Share the substance with Dennis Ashley but keep my identity with Consult for Africa only"],
    },
    { key: "wants_findings", label: "Wants the findings", options: ["Yes, please send it", "No thank you"] },
  ],
  multi: [
    {
      key: "what_happens", label: "What usually happens to those patients", options: [
        "I manage or investigate them myself for as long as I can", "I refer to a named clinic or endoscopist",
        "I refer to a hospital rather than a person", "I send them to a laboratory or imaging centre",
        "They go abroad for a check or workup", "They do nothing, usually because of cost",
        "I am not sure what happens to them"],
    },
    {
      key: "would_change", label: "What would make them refer more", options: [
        "A clear, fixed price my patient can plan around",
        "Direct HMO billing so my patient pays little or nothing at the point of care",
        "A structured report back to me within 48 hours, guaranteed",
        "Photographs and histology results included in the report",
        "A direct number that reaches the clinician",
        "Being able to discuss a case before I refer",
        "Online booking with a guaranteed slot within the week",
        "Being able to follow my patient's result online",
        "Same-day or next-day appointments",
        "A named contact who looks after my referrals",
        "Nothing, I already refer everything I can"],
    },
  ],
  open: [
    { key: "open_where", label: "Where their patients actually end up for endoscopy or diagnostics" },
    { key: "open_stopped", label: "Why their referring dropped, or stopped" },
    { key: "biggest_change", label: "The single biggest change" },
    { key: "open_abroad", label: "What they tell a patient asking about going abroad" },
    { key: "open_ideal", label: "What a genuinely good service would give them" },
    { key: "open_other", label: "Anything else" },
    { key: "refer_name_1", label: "Colleague they suggest we speak to (1)" },
    { key: "refer_contact_1", label: "Contact for colleague 1" },
    { key: "refer_name_2", label: "Colleague they suggest we speak to (2)" },
    { key: "refer_contact_2", label: "Contact for colleague 2" },
    { key: "refer_name_3", label: "Colleague they suggest we speak to (3)" },
    { key: "refer_contact_3", label: "Contact for colleague 3" },
  ],
  splits: [{
    label: "What decides where a patient is sent (100 points)", items: [
      { key: "split_quality", label: "The clinician's skill, and how reliable the findings are" },
      { key: "split_cost", label: "What it will cost my patient" },
      { key: "split_speed", label: "How quickly my patient is seen and the procedure done" },
      { key: "split_report", label: "Whether I get a clear report back, promptly" },
      { key: "split_facility", label: "The facility: sedation safety, decontamination, comfort" },
      { key: "split_hmo", label: "HMO cover, and how easily it is billed" },
    ],
  }],
  tensions: [],
};

// ---------------------------------------------------------------------------
// 4. Leadership direction.
// ---------------------------------------------------------------------------

const LEADERSHIP: SurveyMeta = {
  id: "dennis-ashley-leadership-direction",
  title: "Leadership direction",
  audience: "Dr Chima Oti, the board and the senior people at Dennis Ashley",
  anonymous: false,
  formPath: "/dennis-ashley-leadership-survey.html",
  intro:
    "This one is not anonymous, and that is deliberate. Its whole value is in seeing where you agree with each other without knowing it, and where you quietly disagree. Answer as you actually think, not as you think the group thinks.",
  questions: [
    { key: "b_capacity", section: "Beliefs", text: "We could safely run considerably more endoscopy and clinic volume than we do today, with what we already have." },
    { key: "b_cost", section: "Beliefs", text: "We know what a scope, a wellness package and a clinic visit actually cost us to deliver." },
    { key: "b_payer", section: "Beliefs", text: "The HMO panel we are on is, on balance, worth what it costs us to serve it." },
    { key: "b_absence", section: "Beliefs", text: "If Dr Oti could not work for three months, this business would be fine." },
    { key: "b_afford", section: "Beliefs", text: "Our patients and corporate clients can comfortably afford what we charge." },
    { key: "b_leak", section: "Beliefs", text: "We lose patients and referrals we could have kept, and we do not know how many." },
    { key: "b_partner", section: "Beliefs", text: "We would move faster and further with an outside management partner than on our own." },
  ],
  categorical: [],
  multi: [],
  splits: [
    {
      label: "Where the growth comes from (100 points)",
      items: [
        { key: "g_endoscopy", label: "More endoscopy cases through the suites we already run" },
        { key: "g_corporate", label: "A bigger corporate employee-health book" },
        { key: "g_wellness", label: "Wellness packages and executive health check-ups" },
        { key: "g_referral", label: "More referrals from other doctors for scopes and specialist care" },
        { key: "g_payer", label: "A better payer mix: less reliance on the lowest-paying HMOs, more self-pay and premium cover" },
        { key: "g_sites", label: "A second site or satellite beyond Oniru" },
      ],
    },
    {
      label: "What is holding the business back (100 points)",
      items: [
        { key: "c_capacity", label: "Physical capacity: rooms, suite slots, recovery and equipment" },
        { key: "c_payer", label: "What the HMOs pay, and how slowly they settle it" },
        { key: "c_referral", label: "Not enough doctors referring patients to us" },
        { key: "c_oti", label: "Dr Oti's own time, and how much still runs through him" },
        { key: "c_team", label: "The team, and how the clinic is run day to day" },
        { key: "c_brand", label: "Not enough of the right people knowing who we are" },
        { key: "c_price", label: "What patients have to pay out of their own pocket" },
      ],
    },
  ],
  tensions: [
    { key: "t_price", a: "Grow volume by widening access and keeping prices reachable", b: "Hold the premium positioning and grow on reputation" },
    { key: "t_payer", a: "Lean harder into the HMO and corporate panel for volume", b: "Shift toward self-pay and premium cover for margin" },
    { key: "t_focus", a: "Stay a broad primary-care clinic that does a bit of everything", b: "Concentrate on endoscopy and wellness as the signature offer" },
    { key: "t_system", a: "Keep the important decisions in Dr Oti's own hands", b: "Build a system that other people can run" },
    { key: "t_site", a: "Put money into deepening the Oniru site", b: "Put money into a presence somewhere else" },
    { key: "t_partner", a: "Stay fully independent and self-directed", b: "Bring in a management partner to accelerate" },
    { key: "t_pace", a: "Move now and fix the gaps as we go", b: "Get the systems right before growing" },
    { key: "t_legacy", a: "Dennis Ashley is Dr Oti's clinic", b: "Dennis Ashley should become an institution that outlives its founders" },
  ],
  open: [
    { key: "open_change", label: "The one thing they would change tomorrow" },
    { key: "open_unsaid", label: "What the audit will find that nobody says out loud" },
    { key: "open_success", label: "What success looks like in three years" },
  ],
};

export const DENNIS_ASHLEY_SURVEYS: SurveyMeta[] = [STAFF, PATIENT, REFERRER, LEADERSHIP];

export function tensionSide(mean: number): "A" | "B" | "Split" {
  if (mean <= 2.4) return "A";
  if (mean >= 3.6) return "B";
  return "Split";
}
