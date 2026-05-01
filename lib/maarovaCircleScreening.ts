import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface CircleScreeningInput {
  firstName: string;
  lastName: string;
  currentRole: string;
  currentEmployer: string;
  yearsInRole?: number;
  city?: string;
  country?: string;
  linkedinUrl: string;
  cvText?: string | null;
}

export interface CircleScreeningResult {
  score: number; // 0-100
  recommendation: "AUTO_APPROVE" | "REVIEW" | "AUTO_DECLINE";
  summary: string;
  strengths: string[];
  concerns: string[];
  breakdown: {
    healthcareAlignment: number;
    leadershipScope: number;
    africaContext: number;
    careerSeniority: number;
    profileQuality: number;
  };
  declineReason?: string;
}

const SYSTEM_PROMPT = `You are screening applications for the Maarova Founding Circle, a programme that gives 50 free leadership assessments to senior healthcare operators across Africa.

Eligibility:
- Must work in healthcare or healthcare-adjacent (clinical, hospital admin, public health, healthtech, healthcare investment, healthcare consulting)
- Must have current leadership scope (managing teams, departments, or programmes) OR be a senior individual contributor with significant healthcare experience
- Should be Africa-based or working substantively on African healthcare
- Operators with 5+ years in healthcare leadership preferred but not required

Score each dimension 0 to 20:
- healthcareAlignment: How clearly is this person in healthcare?
- leadershipScope: Do they have current leadership responsibility?
- africaContext: Are they in Africa or working on African healthcare?
- careerSeniority: How senior is their current role?
- profileQuality: Is the application complete and credible?

Total score = sum of all five dimensions (max 100).

Recommendations:
- AUTO_APPROVE if total score >= 75
- REVIEW if total score 40 to 74
- AUTO_DECLINE if total score < 40

Return strict JSON only, with this exact shape:
{
  "score": number,
  "recommendation": "AUTO_APPROVE" | "REVIEW" | "AUTO_DECLINE",
  "summary": "1-2 sentence assessment",
  "strengths": ["bullet 1", "bullet 2", "bullet 3"],
  "concerns": ["bullet 1", "bullet 2"],
  "breakdown": {
    "healthcareAlignment": number,
    "leadershipScope": number,
    "africaContext": number,
    "careerSeniority": number,
    "profileQuality": number
  },
  "declineReason": "short reason if AUTO_DECLINE, otherwise empty string"
}

Do not include any text outside the JSON.`;

function sanitise(text: string): string {
  return text.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, " ").trim();
}

export async function screenCircleApplication(
  input: CircleScreeningInput,
): Promise<CircleScreeningResult | null> {
  try {
    const cv = input.cvText ? sanitise(input.cvText).substring(0, 12000) : "(no CV text extracted)";

    const userPrompt = `Application to screen:

Name: ${input.firstName} ${input.lastName}
Current role: ${input.currentRole}
Current employer: ${input.currentEmployer}
Years in current role: ${input.yearsInRole ?? "not provided"}
Location: ${input.city ?? "not provided"}, ${input.country ?? "not provided"}
LinkedIn: ${input.linkedinUrl}

CV text:
${cv}

Screen this application against the Founding Circle eligibility criteria and return strict JSON.`;

    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = res.content[0].type === "text" ? res.content[0].text : "";
    if (!text) return null;

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return null;

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as CircleScreeningResult;
    return parsed;
  } catch (err) {
    console.error("[maarovaCircleScreening] error:", err);
    return null;
  }
}
