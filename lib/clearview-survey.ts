// The canonical question set for the five live Clearview instruments. This file
// is the source of truth: scripts/build-clearview-survey-pages.ts renders the
// public forms from it, so the live form and this definition cannot diverge.
// Mirrors lib/dennis-ashley-survey.ts and lib/osteon-survey.ts in shape.
//
//   clearview-patient      -> public/clearview-patient-survey.html      (anonymous)
//   clearview-enquirer     -> public/clearview-enquirer-survey.html     (anonymous)
//   clearview-staff        -> public/clearview-staff-survey.html        (anonymous)
//   clearview-referrer     -> public/clearview-referrer-survey.html     (attributed)
//   clearview-leadership   -> public/clearview-leadership-survey.html   (attributed)
//
// Submitted values are strings ("1".."5" for scale items, "NA" for not
// applicable, plain text for open fields, arrays for multi-select).

export type ScaleQuestion = {
  key: string;
  text: string;
  section: string;
  /** A lower score is the good result here. Never silently rescored. */
  reverse?: boolean;
  scale?: "agree" | "frequency";
};

export type CategoricalField = { key: string; label: string; options: string[] };
export type MultiField = { key: string; label: string; options: string[] };
export type OpenField = { key: string; label: string };

export type SurveyMeta = {
  id: string;
  title: string;
  /** Shown on the private project page. */
  who: string;
  tag: string;
  blurb: string;
  minutes: string;
  audience: string;
  anonymous: boolean;
  formPath: string;
  intro: string;
  questions: ScaleQuestion[];
  categorical: CategoricalField[];
  multi: MultiField[];
  open: OpenField[];
};

const empty = { questions: [], categorical: [], multi: [], open: [] };

// ---------------------------------------------------------------------------
// 1. Patients. Anonymous.
// ---------------------------------------------------------------------------

const P_FIND = "Finding Clearview";
const P_DECIDE = "Deciding to go ahead";
const P_MONEY = "The cost";
const P_CARE = "Your treatment";
const P_TOLD = "Being told things";
const P_PREG = "If you became pregnant";
const P_AFTER = "Looking back";

const PATIENT_QUESTIONS: ScaleQuestion[] = [
  { key: "q1", section: P_FIND, text: "It was easy to get a first appointment." },
  { key: "q2", section: P_FIND, text: "Reaching Clearview by telephone or message was easy." },
  { key: "q3", section: P_FIND, text: "I got a reply quickly when I first made contact." },

  { key: "q4", section: P_DECIDE, text: "I was given a clear written price before I had to decide." },
  { key: "q5", section: P_DECIDE, text: "I understood exactly what was included and what was not." },
  { key: "q6", section: P_DECIDE, text: "Nobody rushed me into starting before I was ready." },
  { key: "q7", section: P_DECIDE, text: "I was told honestly what my own chances were." },
  { key: "q8", section: P_DECIDE, reverse: true, text: "I felt I was being sold a treatment rather than advised." },

  { key: "q9", section: P_MONEY, text: "The way payment was structured made it manageable for us." },
  { key: "q10", section: P_MONEY, text: "The final amount was what I had been told it would be." },
  { key: "q11", section: P_MONEY, text: "I was told in advance about the costs of medication on top of the cycle." },

  { key: "q12", section: P_CARE, text: "I always knew who to call when I had a question." },
  { key: "q13", section: P_CARE, text: "The same people looked after me throughout." },
  { key: "q14", section: P_CARE, text: "I was treated with kindness and respect by everybody." },
  { key: "q15", section: P_CARE, text: "My privacy was respected." },
  { key: "q16", section: P_CARE, text: "Appointments happened close to the time I was given." },

  { key: "q17", section: P_TOLD, text: "My results were explained in a way I understood." },
  { key: "q18", section: P_TOLD, text: "When something did not work, it was explained to me with care." },
  { key: "q19", section: P_TOLD, text: "I understood what my options were at each stage." },

  { key: "q20", section: P_PREG, text: "I was clear about who would look after my pregnancy." },
  { key: "q21", section: P_PREG, text: "Moving from fertility care to pregnancy care felt looked after rather than abrupt." },
  { key: "q22", section: P_PREG, text: "I was offered the option of continuing my care at Clearview Hospital." },

  { key: "q23", section: P_AFTER, text: "I feel genuinely cared for by this clinic." },
  { key: "q24", section: P_AFTER, text: "I would come back to Clearview if we wanted another child." },
  { key: "q25", section: P_AFTER, text: "I would recommend Clearview to a friend going through this." },
];

const PATIENT: SurveyMeta = {
  ...empty,
  id: "clearview-patient",
  title: "Your experience of Clearview",
  who: "Patients",
  tag: "Anonymous",
  blurb:
    "For anyone who has had fertility treatment at Clearview, whether it worked or not. Your answers go to Consult for Africa, not to the clinic, and nobody at Clearview sees who said what.",
  minutes: "about 8 minutes",
  audience: "Patients who have had fertility treatment at Clearview",
  anonymous: true,
  formPath: "/clearview-patient-survey.html",
  intro:
    "Thank you for doing this. Your answers are anonymous. They go to Consult for Africa, who are advising Clearview, and not to the clinic or to anyone who treated you. They are reported only as grouped totals, so nothing you write can be traced back to you. There are no right answers. We know some of these questions touch on a hard time, so please skip anything you would rather not answer.",
  questions: PATIENT_QUESTIONS,
  categorical: [
    {
      key: "where", label: "Where do you live?", options: [
        "Lekki, Victoria Island or Ikoyi", "Mainland Lagos", "Elsewhere in Lagos State",
        "Another Nigerian state", "Another West African country", "Outside Africa",
        "Prefer not to say"],
    },
    {
      key: "found", label: "How did you first hear about Clearview?", options: [
        "Dr Ajayi was already my doctor", "Another doctor referred me",
        "A friend or family member", "Instagram or Facebook", "Google or the website",
        "I saw the building", "Other"],
    },
    {
      key: "shopped", label: "How many clinics did you seriously consider?", options: [
        "Only Clearview", "Two", "Three", "More than three"],
    },
    {
      key: "abroad", label: "Did you consider having treatment outside Nigeria?", options: [
        "No", "I thought about it", "Yes, and I got prices", "Yes, and I did a cycle abroad"],
    },
    {
      key: "howlong", label: "From first contacting Clearview to starting treatment, how long?", options: [
        "Under a month", "One to three months", "Three to six months",
        "Six to twelve months", "More than a year", "I have not started yet"],
    },
    {
      key: "cycles", label: "How many treatment cycles have you had at Clearview?", options: [
        "None yet", "One", "Two", "Three", "More than three"],
    },
    {
      key: "outcome", label: "Has treatment at Clearview led to a pregnancy?", options: [
        "Yes, and we have our baby", "Yes, but we lost the pregnancy", "I am pregnant now",
        "Not yet", "Prefer not to say"],
    },
    {
      key: "delivered", label: "If you had a baby, where did you deliver?", options: [
        "Clearview Hospital", "Another hospital in Lagos", "Outside Lagos", "Outside Nigeria",
        "Does not apply", "Prefer not to say"],
    },
    {
      key: "frozen", label: "Do you have embryos stored at Clearview?", options: [
        "Yes", "No", "I do not know"],
    },
  ],
  open: [
    { key: "open_nearly", label: "What nearly stopped you going ahead with treatment at Clearview?" },
    { key: "open_better", label: "What did Clearview do better than you expected?" },
    { key: "open_change", label: "If you could change one thing about the experience, what would it be?" },
  ],
};

// ---------------------------------------------------------------------------
// 2. People who enquired and did not go ahead. Anonymous.
//    The instrument nobody in this sector runs, and the one that tests the
//    conversion thesis directly.
// ---------------------------------------------------------------------------

const E_CONTACT = "When you got in touch";
const E_INFO = "The information you were given";
const E_AFTER = "Afterwards";

const ENQUIRER_QUESTIONS: ScaleQuestion[] = [
  { key: "q1", section: E_CONTACT, text: "It was easy to reach somebody at Clearview." },
  { key: "q2", section: E_CONTACT, text: "I got a reply quickly." },
  { key: "q3", section: E_CONTACT, text: "The person I spoke to seemed to have time for me." },

  { key: "q4", section: E_INFO, text: "I was given a clear price, in writing." },
  { key: "q5", section: E_INFO, text: "I understood what the treatment would involve." },
  { key: "q6", section: E_INFO, text: "I understood what it would cost in total, including medication." },
  { key: "q7", section: E_INFO, text: "I was told honestly what my chances were likely to be." },
  { key: "q8", section: E_INFO, text: "I felt listened to rather than processed." },

  { key: "q9", section: E_AFTER, text: "Somebody followed up with me after my first contact." },
  { key: "q10", section: E_AFTER, text: "I knew exactly what the next step would be if I wanted to proceed." },
  { key: "q11", section: E_AFTER, text: "I would still consider Clearview in the future." },
];

const ENQUIRER: SurveyMeta = {
  ...empty,
  id: "clearview-enquirer",
  title: "If you got in touch and did not go ahead",
  who: "People who enquired",
  tag: "Anonymous",
  blurb:
    "For anyone who contacted Clearview about fertility treatment and did not end up starting. This is the most useful survey of the five and the one almost nobody ever asks. There is no wrong answer and nobody is going to chase you.",
  minutes: "about 5 minutes",
  audience: "People who contacted Clearview about treatment and did not proceed",
  anonymous: true,
  formPath: "/clearview-enquirer-survey.html",
  intro:
    "You contacted Clearview at some point and did not go ahead with treatment. We would very much like to understand why, because it is the single most useful thing anyone can tell us and it is the thing clinics almost never ask. This is anonymous, it goes to Consult for Africa rather than to Clearview, and nobody will contact you afterwards unless you ask us to. If the reason is personal, or the situation has changed, you are welcome to skip straight to the last question.",
  questions: ENQUIRER_QUESTIONS,
  categorical: [
    {
      key: "outcome", label: "What happened in the end?", options: [
        "I had treatment at another clinic in Nigeria", "I had treatment abroad",
        "I am still deciding", "I decided not to have treatment for now",
        "We conceived without treatment", "Prefer not to say"],
    },
    {
      key: "reason", label: "What was the main reason you did not go ahead at Clearview?", options: [
        "The cost", "I needed more time to think", "I wanted a second opinion",
        "The distance or the travel", "I did not feel confident enough",
        "I never got a clear price", "Nobody followed up with me",
        "Personal or family reasons", "Something else"],
    },
    {
      key: "reply", label: "How quickly did Clearview reply to you?", options: [
        "Same day", "Within two or three days", "It took over a week",
        "I never got a proper reply", "I cannot remember"],
    },
    {
      key: "price", label: "Did you get a written price?", options: [
        "Yes, clear and complete", "Yes, but it was incomplete", "No", "I cannot remember"],
    },
    {
      key: "where", label: "Where do you live?", options: [
        "Lekki, Victoria Island or Ikoyi", "Mainland Lagos", "Elsewhere in Lagos State",
        "Another Nigerian state", "Another West African country", "Outside Africa",
        "Prefer not to say"],
    },
  ],
  open: [
    { key: "open_would", label: "What would have made you go ahead at Clearview?" },
    { key: "open_chose", label: "If you went elsewhere, what made you choose them?" },
    { key: "open_any", label: "Anything else you would like Clearview to know" },
  ],
};

// ---------------------------------------------------------------------------
// 3. Staff. Anonymous.
// ---------------------------------------------------------------------------

const S_WORK = "Your work and the team";
const S_ENQ = "When somebody enquires";
const S_ONE = "The two businesses";
const S_LAB = "The laboratory and capacity";
const S_SPEAK = "Speaking up";
const S_RUN = "How the place is run";

const STAFF_QUESTIONS: ScaleQuestion[] = [
  { key: "q1", section: S_WORK, text: "I am clear about what my job is and what I am responsible for." },
  { key: "q2", section: S_WORK, text: "We have enough people to do the work properly." },
  { key: "q3", section: S_WORK, text: "Patients are treated with kindness here, even when the news is bad." },

  { key: "q4", section: S_ENQ, text: "I know exactly what to say when somebody calls asking about treatment." },
  { key: "q5", section: S_ENQ, text: "There is a clear written price that we all give out." },
  { key: "q6", section: S_ENQ, text: "An enquiry gets a proper answer the same day." },
  { key: "q7", section: S_ENQ, text: "Somebody is clearly responsible for following up people who have not booked." },
  { key: "q8", section: S_ENQ, text: "We could say how many people contacted us last month if we were asked." },

  { key: "q9", section: S_ONE, text: "The fertility clinic and the hospital work as one organisation." },
  { key: "q10", section: S_ONE, text: "When a patient becomes pregnant, it is clear what happens next." },
  { key: "q11", section: S_ONE, text: "We actively make sure our own pregnancies book with Clearview Hospital." },

  { key: "q12", section: S_LAB, text: "The laboratory could handle more cycles than we currently do." },
  { key: "q13", section: S_LAB, text: "If our lead embryologist were away for a month, we would manage." },
  { key: "q14", section: S_LAB, text: "We know who covers clinically when Dr Ajayi is away." },
  { key: "q15", section: S_LAB, text: "We contact patients who have embryos stored with us." },

  { key: "q16", section: S_SPEAK, text: "I can raise a concern here without it going badly for me." },
  { key: "q17", section: S_SPEAK, text: "When something goes wrong we look at why, rather than who." },
  { key: "q18", section: S_SPEAK, text: "If I saw something unsafe I would know exactly who to tell." },

  { key: "q19", section: S_RUN, text: "Decisions get made quickly enough for us to do our jobs." },
  { key: "q20", section: S_RUN, text: "I understand where the business is trying to go." },
  { key: "q21", section: S_RUN, text: "I expect to still be working here in two years." },
];

const STAFF: SurveyMeta = {
  ...empty,
  id: "clearview-staff",
  title: "Working at Clearview",
  who: "Staff",
  tag: "Anonymous",
  blurb:
    "For everyone who works at Clearview Fertility or Clearview Hospital, clinical or not. Answers go to Consult for Africa, never to management, and are reported only as grouped totals.",
  minutes: "about 7 minutes",
  audience: "Everyone who works at Clearview Fertility or Clearview Hospital",
  anonymous: true,
  formPath: "/clearview-staff-survey.html",
  intro:
    "Your answers are anonymous. They go to Consult for Africa, not to Dr Ajayi and not to anyone who manages you, and they are reported only as grouped totals. There are no right answers and nothing here is a test of you. Use N/A freely where a question is about a part of the group you do not work in.",
  questions: STAFF_QUESTIONS,
  categorical: [
    {
      key: "business", label: "Where do you mostly work?", options: [
        "Clearview Fertility", "Clearview Hospital", "Both about equally"],
    },
    {
      key: "area", label: "What sort of work do you do?", options: [
        "Doctor", "Nursing", "Embryology and laboratory", "Front desk and patient coordination",
        "Billing and accounts", "Pharmacy", "Imaging and scanning",
        "Support and housekeeping", "Management", "Other"],
    },
    {
      key: "tenure", label: "How long have you worked here?", options: [
        "Under 6 months", "6 to 12 months", "1 to 3 years", "More than 3 years"],
    },
  ],
  open: [
    { key: "open_more", label: "The one thing that would bring Clearview more patients" },
    { key: "open_work", label: "The one thing that would make Clearview a better place to work" },
    { key: "open_hidden", label: "Something a visitor would never notice" },
  ],
};

// ---------------------------------------------------------------------------
// 4. Referring doctors. Attributed, because a referrer's answer is only
//    actionable if we know which referrer gave it. This is also the instrument
//    that tests whether shared care is buildable.
// ---------------------------------------------------------------------------

const R_NOW = "Referring today";
const R_BACK = "What comes back to you";
const R_SHARED = "Working together on monitoring";

const REFERRER_QUESTIONS: ScaleQuestion[] = [
  { key: "q1", section: R_NOW, text: "I am confident in the clinical quality at Clearview." },
  { key: "q2", section: R_NOW, text: "I know what Clearview charges for a cycle." },
  { key: "q3", section: R_NOW, text: "Referring a patient there is straightforward." },
  { key: "q4", section: R_NOW, text: "My patients tell me they were well looked after." },

  { key: "q5", section: R_BACK, text: "I get a report back on patients I refer." },
  { key: "q6", section: R_BACK, text: "My patients come back to me for their ongoing care." },
  { key: "q7", section: R_BACK, text: "I am kept informed while my patient is under treatment." },
  { key: "q8", section: R_BACK, reverse: true, text: "I worry that referring a patient means losing them." },

  { key: "q9", section: R_SHARED, text: "I would be comfortable doing monitoring scans locally under a written protocol." },
  { key: "q10", section: R_SHARED, text: "My practice has the equipment to do follicle tracking scans." },
  { key: "q11", section: R_SHARED, text: "I would refer more if my patient only had to travel for the procedure itself." },
  { key: "q12", section: R_SHARED, text: "I would recommend Clearview to a patient travelling from outside Lagos." },
];

const REFERRER: SurveyMeta = {
  ...empty,
  id: "clearview-referrer",
  title: "For referring colleagues",
  who: "Referring doctors",
  tag: "Attributed",
  blurb:
    "For gynaecologists and doctors who see patients with fertility problems, whether or not you currently refer to Clearview. We ask for your name because a colleague's view is only useful if we know whose it is.",
  minutes: "about 6 minutes",
  audience: "Doctors who see patients with fertility problems",
  anonymous: false,
  formPath: "/clearview-referrer-survey.html",
  intro:
    "Thank you for the time. Consult for Africa is advising Clearview on how it works with referring colleagues, and your view carries more weight than anything we could work out from inside the building. We ask for your name because a referrer's answer is only actionable if we know whose it is. Your individual answers are not shown to Clearview without your agreement. If you do not currently refer there, that is exactly the view we most want.",
  questions: REFERRER_QUESTIONS,
  categorical: [
    {
      key: "city", label: "Where is your practice?", options: [
        "Lekki, Victoria Island or Ikoyi", "Mainland Lagos", "Elsewhere in Lagos State",
        "Abuja", "Port Harcourt", "Another Nigerian city", "Another West African country"],
    },
    {
      key: "volume", label: "Roughly how many patients with fertility problems do you see a month?", options: [
        "Fewer than 5", "5 to 10", "10 to 20", "More than 20"],
    },
    {
      key: "refer_now", label: "Do you currently refer to Clearview?", options: [
        "Regularly", "Occasionally", "I have once or twice", "No, never"],
    },
    {
      key: "scanner", label: "Do you have ultrasound in your own practice?", options: [
        "Yes, and I scan myself", "Yes, someone else scans", "No"],
    },
    {
      key: "bloods", label: "Can hormone blood tests be done reliably near your practice?", options: [
        "Yes, easily", "Yes, but turnaround is slow", "No"],
    },
    {
      key: "shared_interest", label: "Would you be interested in a formal shared care arrangement, paid for the monitoring work you do?", options: [
        "Yes, definitely", "Yes, I would want to know more", "Possibly", "No"],
    },
  ],
  open: [
    { key: "open_more", label: "What would make you refer more patients to Clearview?" },
    { key: "open_stops", label: "What stops you referring, or makes you hesitate?" },
    { key: "open_need", label: "What do you most need back from a fertility centre?" },
  ],
};

// ---------------------------------------------------------------------------
// 5. Leadership. Attributed, because the instrument exists to compare named
//    views against each other.
// ---------------------------------------------------------------------------

const L_DIR = "Direction";
const L_TRUTH = "How things actually are";
const L_FUTURE = "The next five years";

const LEADERSHIP_QUESTIONS: ScaleQuestion[] = [
  { key: "q1", section: L_DIR, text: "We all agree on what Clearview is trying to become." },
  { key: "q2", section: L_DIR, text: "There is a written plan that people actually use." },
  { key: "q3", section: L_DIR, text: "We know which of our services makes money and which does not." },

  { key: "q4", section: L_TRUTH, text: "We could produce our live birth rate by age band if asked tomorrow." },
  { key: "q5", section: L_TRUTH, text: "We know how many people enquired last month and what happened to them." },
  { key: "q6", section: L_TRUTH, text: "The business would run properly for a month without Dr Ajayi." },
  { key: "q7", section: L_TRUTH, text: "The two companies are managed as one group." },
  { key: "q8", section: L_TRUTH, reverse: true, text: "Cash is tight often enough that it affects decisions." },

  { key: "q9", section: L_FUTURE, text: "We have the people we need to grow." },
  { key: "q10", section: L_FUTURE, text: "The laboratory could take significantly more volume." },
  { key: "q11", section: L_FUTURE, text: "I would be comfortable treating patients who travel from outside Lagos." },
  { key: "q12", section: L_FUTURE, text: "I am optimistic about the next three years." },
];

const LEADERSHIP: SurveyMeta = {
  ...empty,
  id: "clearview-leadership",
  title: "Leadership and direction",
  who: "Leadership",
  tag: "Attributed",
  blurb:
    "For Dr Ajayi and anyone else who carries responsibility for how the group is run. Answers are attributed, because the point of this one is to see where senior views agree and where they quietly do not.",
  minutes: "about 6 minutes",
  audience: "Dr Ajayi and the senior team across both businesses",
  anonymous: false,
  formPath: "/clearview-leadership-survey.html",
  intro:
    "This one is attributed, deliberately. Its purpose is to see where the senior views agree and where they quietly do not, which is only visible if we know who said what. Nothing here is reported back to your colleagues as an individual answer. Please answer as you actually see it rather than as you think you should.",
  questions: LEADERSHIP_QUESTIONS,
  categorical: [
    {
      key: "role", label: "Your role", options: [
        "Founder and medical director", "Clinical lead", "Laboratory lead",
        "Operations or administration", "Finance", "Nursing lead", "Other"],
    },
    {
      key: "stability", label: "When you hear the word stability about this business, which is closest to what you think of?", options: [
        "Filling the quiet months, so cash is predictable",
        "The business running without depending on one person",
        "Being worth something to an outside buyer or investor",
        "Simply surviving the next two years"],
    },
    {
      key: "constraint", label: "What most limits growth today?", options: [
        "Not enough patients coming in", "Too few of those who come in go ahead",
        "Laboratory or theatre capacity", "People and skills", "Cash", "Something else"],
    },
    {
      key: "capital", label: "How would you feel about outside investment?", options: [
        "Open to it", "Only from the right partner", "Would rather not", "Strongly against"],
    },
  ],
  open: [
    { key: "open_breaks", label: "If patient volume doubled next month, what breaks first?" },
    { key: "open_worry", label: "What worries you most about the group?" },
    { key: "open_success", label: "What would make you say, in two years, that this was worth it?" },
  ],
};

export const CLEARVIEW_SURVEYS: SurveyMeta[] = [
  PATIENT, ENQUIRER, STAFF, REFERRER, LEADERSHIP,
];

export const CLEARVIEW_SURVEY_IDS = CLEARVIEW_SURVEYS.map((s) => s.id);
