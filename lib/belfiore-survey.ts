// The canonical question set for the four live Belfiore instruments. This file
// is the source of truth: scripts/build-belfiore-survey-pages.ts renders the
// public forms from it, so the live form and this definition cannot diverge.
// Mirrors lib/clearview-survey.ts in shape.
//
//   belfiore-team        -> public/belfiore-team-survey.html        (anonymous)
//   belfiore-client      -> public/belfiore-client-survey.html      (anonymous)
//   belfiore-enquirer    -> public/belfiore-enquirer-survey.html    (anonymous)
//   belfiore-leadership  -> public/belfiore-leadership-survey.html  (attributed)
//
// The five sections of the team and leadership instruments are the same five
// domains as the training programme, so the baseline reads directly onto the
// syllabus: Standard, Encounter, Difficult, Follow-through, System.
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

// ---------------------------------------------------------------------------
// 1. The front-of-house and admin team. Anonymous.
//    This is the instrument that answers "where is our capacity actually
//    straining", which is why it is the longest of the four.
// ---------------------------------------------------------------------------
const team: SurveyMeta = {
  id: "belfiore-team",
  title: "The front desk, from the inside",
  who: "Everyone at Belfiore who deals with clients",
  tag: "Anonymous",
  blurb:
    "The team survey. What is actually hard about the job right now: the volume, the tools, the " +
    "questions you cannot answer, the clients who are difficult, and the parts of the work that " +
    "nobody has given you a method for.",
  minutes: "About 8 minutes",
  audience: "Front desk, client care, bookings, admin, marketing and clinical support",
  anonymous: true,
  formPath: "/belfiore-team-survey.html",
  intro:
    "Nobody at Belfiore will see who said what. Consult for Africa reads the answers and reports " +
    "the themes, never the individuals. Please be blunt. The two days of training are being built " +
    "from these answers, so a polite answer gives you a generic course.",
  questions: [
    // A. The standard
    { key: "t_std_expect", section: "What good looks like here", text: "I know exactly what Belfiore expects of me when a client gets in touch." },
    { key: "t_std_written", section: "What good looks like here", text: "There is a written standard for how quickly we reply to an enquiry." },
    { key: "t_std_ask", section: "What good looks like here", text: "When I am not sure what to do, I know who to ask." },
    { key: "t_std_decide", section: "What good looks like here", text: "I am clear about what I can decide myself and what I have to pass up." },
    { key: "t_std_treatments", section: "What good looks like here", text: "I can confidently answer most questions a client asks me about our treatments." },
    { key: "t_std_price", section: "What good looks like here", text: "I can quote a price to a client without checking with somebody else." },

    // B. The encounter
    { key: "t_enc_time", section: "Doing the job day to day", text: "I have enough time in the day to handle enquiries properly." },
    { key: "t_enc_volume", section: "Doing the job day to day", text: "The number of enquiries I handle in a day is manageable." },
    { key: "t_enc_find", section: "Doing the job day to day", text: "When a client contacts us I can find their history quickly." },
    { key: "t_enc_tools", section: "Doing the job day to day", text: "The phone, WhatsApp, Instagram, the diary and our records work well together." },
    { key: "t_enc_channels", section: "Doing the job day to day", text: "Nothing falls through the cracks when a client moves from one channel to another." },
    { key: "t_enc_wait", section: "Doing the job day to day", text: "Clients are rarely kept waiting longer than they were told to expect." },
    { key: "t_enc_privacy", section: "Doing the job day to day", text: "It is hard to keep a conversation private at the front desk.", reverse: true },
    { key: "t_enc_interrupt", section: "Doing the job day to day", text: "I am interrupted so often that I lose track of what I was doing.", reverse: true },
    { key: "t_enc_admin", section: "Doing the job day to day", text: "I spend time on tasks that somebody else, or a system, should be doing.", reverse: true },

    // C. The difficult
    { key: "t_dif_angry", section: "When it is difficult", text: "I feel confident handling a client who is angry or upset." },
    { key: "t_dif_result", section: "When it is difficult", text: "I know what to say when a client is unhappy with their result." },
    { key: "t_dif_limits", section: "When it is difficult", text: "I am clear about what I must not say about a clinical outcome." },
    { key: "t_dif_public", section: "When it is difficult", text: "I would know what to do if a client threatened to post about us online." },
    { key: "t_dif_backup", section: "When it is difficult", text: "When an interaction becomes difficult, a senior colleague steps in and supports me." },
    { key: "t_dif_record", section: "When it is difficult", text: "There is a clear way to record a complaint so that it is not forgotten." },
    { key: "t_dif_drain", section: "When it is difficult", text: "A difficult client leaves me drained for the rest of the day.", reverse: true },

    // D. The follow-through
    { key: "t_fol_after", section: "The client who is not in the room", text: "We reliably check in with a client after their treatment." },
    { key: "t_fol_due", section: "The client who is not in the room", text: "I can see which clients are due to come back and when." },
    { key: "t_fol_remind", section: "The client who is not in the room", text: "Appointment reminders go out consistently, without somebody having to remember." },
    { key: "t_fol_noshow", section: "The client who is not in the room", text: "No-shows and last-minute cancellations are a serious problem for us.", reverse: true },
    { key: "t_fol_dormant", section: "The client who is not in the room", text: "We get back in touch with clients we have not seen for a long time." },
    { key: "t_fol_rebook", section: "The client who is not in the room", text: "Clients usually leave with their next appointment already booked." },

    // E. The system
    { key: "t_sys_feedback", section: "How we know it is working", text: "We ask clients for feedback in an organised way." },
    { key: "t_sys_see", section: "How we know it is working", text: "I get to see the feedback clients give." },
    { key: "t_sys_review", section: "How we know it is working", text: "Somebody reviews how we handled an enquiry and tells us how we did." },
    { key: "t_sys_huddle", section: "How we know it is working", text: "We meet as a team to talk about how clients are being looked after." },
    { key: "t_sys_coach", section: "How we know it is working", text: "My manager coaches me on how I handle clients." },
    { key: "t_sys_praise", section: "How we know it is working", text: "I am recognised when I handle a client well." },
    { key: "t_sys_trained", section: "How we know it is working", text: "I have been properly trained for the job I am actually asked to do." },
  ],
  categorical: [
    {
      key: "t_role",
      label: "What is your role?",
      options: [
        "Front desk and reception",
        "Client care and bookings",
        "Admin, accounts and operations",
        "Marketing and social media",
        "Nursing or clinical support",
        "Management",
        "Something else",
      ],
    },
    {
      key: "t_tenure",
      label: "How long have you been at Belfiore?",
      options: ["Less than 3 months", "3 to 12 months", "1 to 2 years", "More than 2 years"],
    },
    {
      key: "t_volume",
      label: "On a typical day, how many client enquiries do you personally handle?",
      options: ["Fewer than 5", "5 to 15", "16 to 30", "More than 30", "It varies far too much to say"],
    },
    {
      key: "t_busiest",
      label: "Which part of the week is hardest to keep on top of?",
      options: ["Monday", "Midweek", "Friday", "Saturday", "It is the same every day", "It is unpredictable"],
    },
  ],
  multi: [
    {
      key: "t_handles",
      label: "Which of these do you personally handle? Choose all that apply.",
      options: [
        "Phone calls",
        "WhatsApp",
        "Instagram direct messages",
        "Email",
        "Walk-ins at the door",
        "The appointment diary",
        "Payments and deposits",
        "Following up after treatment",
      ],
    },
  ],
  open: [
    { key: "t_o_frustrating", label: "What is the single most frustrating part of your job right now?" },
    { key: "t_o_cannot_answer", label: "What is the question clients ask that you most often cannot answer?" },
    { key: "t_o_waste", label: "What do you spend time on that you do not think is a good use of your time?" },
    { key: "t_o_unhappy", label: "Think of the last client who left unhappy. What happened, and what would have changed it?" },
    { key: "t_o_change_one", label: "If you could change one thing about how Belfiore handles clients, what would it be?" },
    { key: "t_o_keep", label: "What do we already do well that we should be careful not to lose?" },
    { key: "t_o_training", label: "What would you most like the two days of training to cover?" },
  ],
};

// ---------------------------------------------------------------------------
// 2. Clients who have been treated. Anonymous.
// ---------------------------------------------------------------------------
const client: SurveyMeta = {
  id: "belfiore-client",
  title: "Your experience of Belfiore",
  who: "Clients who have been treated at Belfiore",
  tag: "Anonymous",
  blurb:
    "The client survey. How it felt to get in touch, to be seen, and to be looked after afterwards. " +
    "Short, and it asks the questions a clinic usually does not.",
  minutes: "About 5 minutes",
  audience: "Anyone who has had a treatment or a consultation at Belfiore",
  anonymous: true,
  formPath: "/belfiore-client-survey.html",
  intro:
    "Your answers are not linked to your name or your file, and nobody at Belfiore will be able to " +
    "tell which answers are yours. Consult for Africa is reviewing the client experience on behalf " +
    "of Dr Rapu, and your honest view is the point of the exercise.",
  questions: [
    { key: "c_get_easy", section: "Getting in touch", text: "It was easy to get in touch with Belfiore." },
    { key: "c_get_quick", section: "Getting in touch", text: "I got a reply as quickly as I expected." },
    { key: "c_get_answered", section: "Getting in touch", text: "The reply actually answered what I had asked." },
    { key: "c_get_price", section: "Getting in touch", text: "I was clear about what it would cost before I committed to anything." },
    { key: "c_get_book", section: "Getting in touch", text: "Booking my appointment was straightforward." },

    { key: "c_vis_ontime", section: "The visit", text: "I was seen close to my appointment time." },
    { key: "c_vis_welcome", section: "The visit", text: "I was welcomed properly when I arrived." },
    { key: "c_vis_private", section: "The visit", text: "The reception area felt private and discreet." },
    { key: "c_vis_warm", section: "The visit", text: "The team were warm as well as professional." },
    { key: "c_vis_confidential", section: "The visit", text: "I trust Belfiore to keep what I share confidential." },
    { key: "c_vis_explain", section: "The visit", text: "It was explained clearly what would happen and what to expect." },
    { key: "c_vis_expectations", section: "The visit", text: "I was given an honest picture of what the treatment could and could not do." },
    { key: "c_vis_pay", section: "The visit", text: "Paying and checking out was smooth." },

    { key: "c_aft_instructions", section: "Afterwards", text: "I was clear about what to do after my treatment." },
    { key: "c_aft_checkin", section: "Afterwards", text: "Somebody from Belfiore checked in with me after my treatment." },
    { key: "c_aft_worry", section: "Afterwards", text: "If I had been worried about something, I would have known exactly who to contact." },
    { key: "c_aft_response", section: "Afterwards", text: "When I have contacted Belfiore after a treatment, I got a quick response." },
    { key: "c_aft_when_back", section: "Afterwards", text: "I was told when I should come back." },
    { key: "c_aft_reminded", section: "Afterwards", text: "I have been reminded about my next appointment." },

    { key: "c_ov_value", section: "Overall", text: "What I paid was worth what I received." },
    { key: "c_ov_recommend", section: "Overall", text: "I would recommend Belfiore to a friend." },
    { key: "c_ov_return", section: "Overall", text: "I intend to come back to Belfiore for my next treatment." },
  ],
  categorical: [
    {
      key: "c_treatment",
      label: "What did you come to Belfiore for?",
      options: [
        "Injectables",
        "Skin treatments and facials",
        "Laser",
        "Body treatments",
        "Hair",
        "A consultation only",
        "Something else, or I would rather not say",
      ],
    },
    {
      key: "c_visits",
      label: "How many times have you been to Belfiore?",
      options: ["Once", "Two or three times", "Four to six times", "More than six times"],
    },
    {
      key: "c_heard",
      label: "How did you first hear about Belfiore?",
      options: [
        "Instagram",
        "A friend or family member",
        "Another doctor or clinic",
        "Google or a web search",
        "I passed the clinic",
        "Somewhere else",
      ],
    },
    {
      key: "c_contact",
      label: "How did you first get in touch?",
      options: ["Instagram direct message", "WhatsApp", "Phone call", "Email", "The website", "I walked in"],
    },
  ],
  multi: [],
  open: [
    { key: "c_o_best", label: "What was the best part of your experience?" },
    { key: "c_o_worst", label: "What was the least good part?" },
    { key: "c_o_nearly", label: "Was there a moment when you nearly did not go ahead? What was it?" },
    { key: "c_o_onething", label: "What one thing would make you recommend Belfiore without hesitating?" },
  ],
};

// ---------------------------------------------------------------------------
// 3. People who enquired and did not book. Anonymous.
//    Nobody in this sector asks these people anything. They are the single
//    best evidence of what the front desk is costing the practice.
// ---------------------------------------------------------------------------
const enquirer: SurveyMeta = {
  id: "belfiore-enquirer",
  title: "You got in touch, and did not book",
  who: "People who enquired and never came in",
  tag: "Anonymous",
  blurb:
    "The instrument almost nobody runs. It asks the people who contacted Belfiore and did not " +
    "proceed what actually stopped them, which is the most direct measure there is of what the " +
    "front desk is winning or losing.",
  minutes: "About 4 minutes",
  audience: "Anyone who contacted Belfiore about a treatment and did not go ahead",
  anonymous: true,
  formPath: "/belfiore-enquirer-survey.html",
  intro:
    "You are not being sold anything here, and your answers are anonymous. You got in touch with " +
    "Belfiore and did not go ahead, and understanding why is worth more to them than any other " +
    "piece of feedback they could get.",
  questions: [
    { key: "e_reply_got", section: "The enquiry", text: "I got a reply to my enquiry." },
    { key: "e_reply_quick", section: "The enquiry", text: "The reply came quickly enough." },
    { key: "e_reply_answered", section: "The enquiry", text: "The reply answered what I had actually asked." },
    { key: "e_reply_price", section: "The enquiry", text: "I was given a clear price." },
    { key: "e_reply_clear", section: "The enquiry", text: "I understood what I would be getting for the money." },
    { key: "e_reply_understood", section: "The enquiry", text: "The person I dealt with understood what I was hoping for." },
    { key: "e_reply_human", section: "The enquiry", text: "It felt like a person rather than a script." },

    { key: "e_conv_appt", section: "What happened next", text: "I was offered an appointment that suited me." },
    { key: "e_conv_followup", section: "What happened next", text: "Somebody followed up with me after the first reply." },
    { key: "e_conv_pressure", section: "What happened next", text: "I felt pushed towards booking before I was ready.", reverse: true },
    { key: "e_conv_trust", section: "What happened next", text: "I came away trusting Belfiore with my face or my body." },
    { key: "e_conv_again", section: "What happened next", text: "I would consider Belfiore again in the future." },
  ],
  categorical: [
    {
      key: "e_channel",
      label: "How did you get in touch?",
      options: ["Instagram direct message", "WhatsApp", "Phone call", "Email", "The website form", "I walked in"],
    },
    {
      key: "e_wait",
      label: "How long before you got a reply?",
      options: [
        "Within an hour",
        "The same day",
        "The next day",
        "Two or three days",
        "More than three days",
        "I never got a reply",
      ],
    },
    {
      key: "e_interest",
      label: "What were you interested in?",
      options: [
        "Injectables",
        "Skin treatments and facials",
        "Laser",
        "Body treatments",
        "Hair",
        "I was not sure yet, I wanted advice",
      ],
    },
    {
      key: "e_where",
      label: "Did you go somewhere else instead?",
      options: [
        "Yes, another clinic",
        "No, I have not had the treatment at all",
        "Not yet, I am still thinking about it",
        "I would rather not say",
      ],
    },
  ],
  multi: [
    {
      key: "e_stopped",
      label: "What stopped you from going ahead? Choose all that apply.",
      options: [
        "The price",
        "I never got a reply",
        "The reply took too long",
        "I did not get the information I needed",
        "No appointment that suited me",
        "I did not feel confident in the clinic",
        "I found somewhere I preferred",
        "My circumstances changed",
        "Something else",
      ],
    },
  ],
  open: [
    { key: "e_o_different", label: "What would Belfiore have had to do differently for you to go ahead?" },
    { key: "e_o_elsewhere", label: "If you went elsewhere, what did they do better?" },
    { key: "e_o_anything", label: "Anything else you would want Dr Rapu to know?" },
  ],
};

// ---------------------------------------------------------------------------
// 4. Dr Rapu and the senior team. Attributed.
//    Same five domains as the team instrument, so the gap between what
//    leadership believes and what the desk experiences is readable directly.
// ---------------------------------------------------------------------------
const leadership: SurveyMeta = {
  id: "belfiore-leadership",
  title: "The view from the top",
  who: "Dr Rapu and the senior team",
  tag: "Attributed",
  blurb:
    "The leadership survey. It runs the same five domains as the team survey, so the difference " +
    "between what leadership believes is happening and what the desk experiences becomes visible " +
    "rather than assumed.",
  minutes: "About 6 minutes",
  audience: "The Managing Director, clinical leads and anyone managing the client-facing team",
  anonymous: false,
  formPath: "/belfiore-leadership-survey.html",
  intro:
    "This one is attributed, because the value is in seeing where the senior team agrees and where " +
    "it does not. Answer as you believe things actually are today, not as you intend them to be.",
  questions: [
    { key: "l_std_written", section: "What good looks like here", text: "We have a written standard for how clients are to be handled." },
    { key: "l_std_known", section: "What good looks like here", text: "Every client-facing person could tell you what that standard is." },
    { key: "l_std_trained", section: "What good looks like here", text: "Our team has been properly trained for the job we actually ask them to do." },
    { key: "l_std_authority", section: "What good looks like here", text: "Our team has the authority to resolve a small problem without coming to me." },
    { key: "l_std_represent", section: "What good looks like here", text: "Our team represents Belfiore the way I would represent it myself." },

    { key: "l_enc_speed", section: "Doing the job day to day", text: "I know how quickly our enquiries are answered." },
    { key: "l_enc_convert", section: "Doing the job day to day", text: "I know what proportion of enquiries turn into booked appointments." },
    { key: "l_enc_capacity", section: "Doing the job day to day", text: "The team is sized correctly for the volume of enquiries we get." },
    { key: "l_enc_systems", section: "Doing the job day to day", text: "Our systems let the team do the job well rather than getting in the way." },
    { key: "l_enc_listen", section: "Doing the job day to day", text: "I would be comfortable listening back to any call we took this week." },

    { key: "l_dif_reach", section: "When it is difficult", text: "Complaints reach me reliably rather than by accident." },
    { key: "l_dif_method", section: "When it is difficult", text: "We have a method for handling a client who is unhappy with a result." },
    { key: "l_dif_record", section: "When it is difficult", text: "Every complaint is recorded somewhere I could review it." },
    { key: "l_dif_public", section: "When it is difficult", text: "We would handle a public complaint on social media well." },

    { key: "l_fol_after", section: "The client who is not in the room", text: "We follow up with every client after their treatment." },
    { key: "l_fol_recall", section: "The client who is not in the room", text: "We know which clients are due to return, and we act on it." },
    { key: "l_fol_dormant", section: "The client who is not in the room", text: "We systematically get back in touch with clients we have not seen in a while." },
    { key: "l_fol_revenue", section: "The client who is not in the room", text: "I know how much of our revenue comes from returning clients." },

    { key: "l_sys_measure", section: "How we know it is working", text: "We measure client experience in a way I actually trust." },
    { key: "l_sys_agenda", section: "How we know it is working", text: "Client experience is a standing item at our management meetings." },
    { key: "l_sys_audit", section: "How we know it is working", text: "Somebody independently checks how our enquiries are handled." },
    { key: "l_sys_owner", section: "How we know it is working", text: "One named person owns client experience at Belfiore." },
    { key: "l_sys_coach", section: "How we know it is working", text: "Managers coach the team on client handling, rather than only correcting mistakes." },
  ],
  categorical: [
    {
      key: "l_role",
      label: "Your role",
      options: [
        "Managing Director or Chief Executive",
        "Clinical lead",
        "Operations or practice manager",
        "Marketing lead",
        "Finance",
        "Other senior role",
      ],
    },
    {
      key: "l_headcount",
      label: "How many people deal with clients at the front desk or in bookings?",
      options: ["One", "Two", "Three", "Four or five", "More than five"],
    },
    {
      key: "l_weekly",
      label: "Roughly how many client enquiries does Belfiore receive in a week?",
      options: ["Fewer than 20", "20 to 50", "51 to 100", "More than 100", "We do not know"],
    },
    {
      key: "l_conversion",
      label: "Do you know your enquiry to booking conversion rate?",
      options: ["Yes, we measure it", "We estimate it", "No, we do not know it"],
    },
  ],
  multi: [],
  open: [
    { key: "l_o_worry", label: "What about the way clients are handled keeps you up at night?" },
    { key: "l_o_best", label: "Describe the best client experience Belfiore has delivered." },
    { key: "l_o_worst", label: "Describe the worst, and what it cost." },
    { key: "l_o_success", label: "Six months from now, what will tell you that this programme worked?" },
  ],
};

export const BELFIORE_SURVEYS: SurveyMeta[] = [team, client, enquirer, leadership];
