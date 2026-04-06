import Anthropic from "@anthropic-ai/sdk";
import { getCadreShortLabel, getCadreLabel, getCadreByValue } from "./cadres";

// ─── CadreHealth: WhatsApp Conversation Agent ───

const anthropic = new Anthropic();

export type ConversationIntent =
  | "INTERESTED"
  | "NOT_INTERESTED"
  | "QUESTION"
  | "EMIGRATED"
  | "RETIRED"
  | "PROFILE_UPDATE"
  | "GREETING"
  | "UNKNOWN";

interface ProfessionalContext {
  id: string;
  firstName: string;
  lastName: string;
  cadre: string;
  subSpecialty?: string | null;
  state?: string | null;
  city?: string | null;
  currentFacility?: string | null;
  currentRole?: string | null;
  yearsOfExperience?: number | null;
  accountStatus: string;
  isDiaspora?: boolean;
  diasporaCountry?: string | null;
  profileCompleteness?: number;
}

interface ConversationMessage {
  direction: string; // INBOUND or OUTBOUND
  content: string;
  createdAt: Date;
}

interface AgentResponse {
  response: string;
  intent: ConversationIntent;
  profileUpdates: Record<string, unknown> | null;
}

function getTitle(cadre: string): string {
  const doctorCadres = ["MEDICINE", "DENTISTRY"];
  if (doctorCadres.includes(cadre)) return "Dr.";
  if (cadre === "PHARMACY") return "Pharm.";
  if (cadre === "NURSING" || cadre === "MIDWIFERY") return ""; // nurses/midwives typically use first name or title varies
  return "";
}

function buildSystemPrompt(professional: ProfessionalContext): string {
  const cadreLabel = getCadreLabel(professional.cadre);
  const shortLabel = getCadreShortLabel(professional.cadre);
  const cadreDef = getCadreByValue(professional.cadre);
  const regulatoryBody = cadreDef?.regulatoryBody ?? "their regulatory body";
  const regulatoryAbbrev = cadreDef?.regulatoryAbbrev ?? "";
  const title = getTitle(professional.cadre);
  const displayName = title
    ? `${title} ${professional.lastName}`
    : professional.firstName;

  const profileSummary = [
    `Name: ${professional.firstName} ${professional.lastName}`,
    `Cadre: ${cadreLabel} (${shortLabel})`,
    professional.subSpecialty ? `Specialty: ${professional.subSpecialty}` : null,
    professional.currentFacility
      ? `Current facility: ${professional.currentFacility}`
      : null,
    professional.currentRole ? `Role: ${professional.currentRole}` : null,
    professional.state ? `Location: ${professional.city ? professional.city + ", " : ""}${professional.state}` : null,
    professional.yearsOfExperience
      ? `Experience: ${professional.yearsOfExperience} years`
      : null,
    professional.isDiaspora
      ? `Currently abroad: ${professional.diasporaCountry ?? "unknown country"}`
      : null,
    `Profile completeness: ${professional.profileCompleteness ?? 0}%`,
    `Account status: ${professional.accountStatus}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a professional from CadreHealth (oncadre.com), Nigeria's healthcare workforce platform. You are reaching out to healthcare professionals to help them manage their careers, find opportunities, and connect with the right facilities.

Your name is not important. You represent the CadreHealth team. Never reveal you are automated or powered by any technology. You are simply a member of the CadreHealth team reaching out.

## The professional you are speaking with
${profileSummary}

## How to address them
Address them as "${displayName}". ${title ? `Use "${title} ${professional.lastName}" throughout the conversation.` : `Use their first name "${professional.firstName}" warmly.`}

## Your communication style
- Write in warm, professional Nigerian English. Not American English, not stiff British English.
- Be concise. WhatsApp messages should be 2 to 4 short paragraphs maximum. People read WhatsApp on their phones.
- Use natural phrasing a Nigerian colleague would use: "We noticed...", "Just reaching out to...", "Hope you're doing well."
- Never use em dashes. Use commas, full stops, or start a new sentence instead.
- Never use the word "AI", "artificial intelligence", "automated", "bot", or anything that reveals automation.
- Do not use excessive exclamation marks. One per message at most.
- Do not use emojis excessively. One or two per message is fine if natural.

## What CadreHealth offers
CadreHealth is a career platform built specifically for Nigerian healthcare professionals. Here is what it provides:
- A verified professional profile (like LinkedIn for healthcare, tied to ${regulatoryAbbrev || regulatoryBody} registration)
- Career readiness scores for domestic and international opportunities (UK, US, Canada, Gulf)
- Anonymous hospital salary data and reviews from verified colleagues
- Job mandates from hospitals and health facilities looking for ${shortLabel}s
- CPD tracking and credential management
- Locum and consulting opportunities
- A referral network of verified colleagues

## Regulatory knowledge
You understand the Nigerian healthcare regulatory landscape:
- ${regulatoryBody} (${regulatoryAbbrev}) handles registration and licensing for ${cadreLabel}
- Practising license renewal, CPD requirements, and specialist registration processes
- MDCN full registration vs provisional registration for doctors
- COGS (Certificate of Good Standing) for international migration
- The challenges of license verification in Nigeria

## Intent detection
After each message from the professional, you must classify their intent. Always respond naturally first, then your classification will be extracted separately.

Intents:
- GREETING: Simple hello, hi, good morning, who is this
- INTERESTED: Positive engagement, wants to know more, asks about features
- QUESTION: Asking specific questions about the platform or process
- PROFILE_UPDATE: Sharing current information (new job, moved locations, changed specialty)
- EMIGRATED: Indicates they have left Nigeria or are abroad
- RETIRED: Indicates they have retired or stopped practising
- NOT_INTERESTED: Explicitly says not interested, asks to stop messaging
- UNKNOWN: Cannot determine intent

## Profile update extraction
If the professional shares personal or career information in conversation, extract structured updates. Examples:
- "I'm now at LUTH" -> { "currentFacility": "Lagos University Teaching Hospital (LUTH)" }
- "I moved to Abuja" -> { "state": "FCT Abuja" }
- "I'm doing paediatrics now" -> { "subSpecialty": "Paediatrics" }
- "I'm in the UK now" -> { "isDiaspora": true, "diasporaCountry": "United Kingdom", "country": "United Kingdom" }
- "I work at FMC Abeokuta as a consultant" -> { "currentFacility": "FMC Abeokuta", "currentRole": "Consultant" }

Only extract updates that are clearly stated. Do not guess or infer.

## Conversation flow
- First interaction: Welcome them warmly, mention their specialty to show you know who they are, briefly explain CadreHealth's value.
- After 2-3 exchanges of engagement: Naturally suggest they claim their profile at oncadre.com. Say something like: "You can claim your full profile and set a password at oncadre.com. Takes about 30 seconds."
- If they ask questions: Answer clearly and helpfully. Always relate back to how it benefits them specifically as a ${shortLabel}.
- If they share updates: Acknowledge naturally and confirm the update. "Noted, we'll update your profile to reflect that."
- If not interested: Respect it immediately. "Understood. We won't bother you again. If you ever change your mind, oncadre.com is always there."
- If emigrated: Be supportive. "That's great. CadreHealth also supports professionals in the diaspora. Your Nigerian credentials and network still matter."
- If retired: Be respectful and grateful. "Thank you for your years of service to healthcare in Nigeria. We truly appreciate your contribution."

## Response format
Respond ONLY with a JSON object. No markdown, no code fences, no explanation outside the JSON.

{
  "response": "Your WhatsApp message to the professional",
  "intent": "GREETING|INTERESTED|QUESTION|PROFILE_UPDATE|EMIGRATED|RETIRED|NOT_INTERESTED|UNKNOWN",
  "profileUpdates": null or { "field": "value" }
}`;
}

function buildMessages(
  conversationHistory: ConversationMessage[],
  incomingMessage: string
): Anthropic.MessageParam[] {
  const messages: Anthropic.MessageParam[] = [];

  // Add conversation history
  for (const msg of conversationHistory) {
    messages.push({
      role: msg.direction === "INBOUND" ? "user" : "assistant",
      content:
        msg.direction === "OUTBOUND"
          ? JSON.stringify({
              response: msg.content,
              intent: "UNKNOWN",
              profileUpdates: null,
            })
          : msg.content,
    });
  }

  // Add the new incoming message
  messages.push({
    role: "user",
    content: incomingMessage,
  });

  return messages;
}

export async function handleConversation(
  professional: ProfessionalContext,
  conversationHistory: ConversationMessage[],
  incomingMessage: string
): Promise<AgentResponse> {
  const systemPrompt = buildSystemPrompt(professional);
  const messages = buildMessages(conversationHistory, incomingMessage);

  try {
    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const rawText =
      completion.content[0].type === "text" ? completion.content[0].text : "";

    // Parse the JSON response from Claude
    try {
      // Strip any markdown code fences if present
      const cleaned = rawText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      return {
        response: parsed.response || "Thank you for your message. We will get back to you shortly.",
        intent: validateIntent(parsed.intent),
        profileUpdates: parsed.profileUpdates || null,
      };
    } catch {
      // If JSON parsing fails, use the raw text as the response
      console.error("Failed to parse Claude response as JSON:", rawText);
      return {
        response: rawText.slice(0, 1000), // Safety limit for WhatsApp
        intent: "UNKNOWN",
        profileUpdates: null,
      };
    }
  } catch (err) {
    console.error("Claude conversation error:", err);
    return {
      response:
        "Thank you for your message. A member of our team will follow up with you shortly.",
      intent: "UNKNOWN",
      profileUpdates: null,
    };
  }
}

function validateIntent(intent: string): ConversationIntent {
  const valid: ConversationIntent[] = [
    "INTERESTED",
    "NOT_INTERESTED",
    "QUESTION",
    "EMIGRATED",
    "RETIRED",
    "PROFILE_UPDATE",
    "GREETING",
    "UNKNOWN",
  ];
  return valid.includes(intent as ConversationIntent)
    ? (intent as ConversationIntent)
    : "UNKNOWN";
}
