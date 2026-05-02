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
  /** PDF or DOCX buffer. If null, screens on form data alone. */
  cvBuffer?: Buffer | null;
  cvMimeType?: string | null;
  /** Pre-extracted CV text. Used as a fallback when no buffer is supplied. */
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
  /** CV text Claude extracted from the document - useful for storing on the application. */
  extractedCvText?: string;
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
  "declineReason": "short reason if AUTO_DECLINE, otherwise empty string",
  "extractedCvText": "full plain text content extracted from the attached CV. Include all sections: experience, education, qualifications, achievements. If no CV was attached, use empty string."
}

Do not include any text outside the JSON.`;

function sanitise(text: string): string {
  return text.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, " ").trim();
}

export async function screenCircleApplication(
  input: CircleScreeningInput,
): Promise<CircleScreeningResult | null> {
  try {
    const profileText = `Application to screen:

Name: ${input.firstName} ${input.lastName}
Current role: ${input.currentRole}
Current employer: ${input.currentEmployer}
Years in current role: ${input.yearsInRole ?? "not provided"}
Location: ${input.city ?? "not provided"}, ${input.country ?? "not provided"}
LinkedIn: ${input.linkedinUrl}

Screen this application against the Founding Circle eligibility criteria. The CV is ${input.cvBuffer ? "attached as a document" : input.cvText ? "provided as plain text below" : "not available"}. Extract the full CV text into extractedCvText so we can save it.${
      !input.cvBuffer && input.cvText
        ? `\n\nCV text:\n${sanitise(input.cvText).substring(0, 12000)}`
        : ""
    }

Return strict JSON.`;

    const userContent: Anthropic.Messages.MessageParam["content"] = [];

    // Attach PDF as a document if we have one. Claude reads PDFs natively
    // (as of Sonnet 3.5 and Haiku 4.5+), so we can skip pdf-parse entirely.
    if (input.cvBuffer) {
      const isPdf = (input.cvMimeType ?? "").includes("pdf");
      if (isPdf) {
        userContent.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: input.cvBuffer.toString("base64"),
          },
        });
      } else {
        // For DOCX or other formats: extract whatever text we can with a basic
        // approach and inject as text. Claude only reads PDFs natively today.
        const text = input.cvBuffer
          .toString("utf-8")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .substring(0, 12000);
        if (text.length > 50) {
          userContent.push({
            type: "text",
            text: `CV text (extracted from non-PDF document):\n\n${text}`,
          });
        }
      }
    }

    userContent.push({ type: "text", text: profileText });

    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const text = res.content[0].type === "text" ? res.content[0].text : "";
    if (!text) return null;

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return null;

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as CircleScreeningResult;
    return parsed;
  } catch (err) {
    console.error("[maarovaCircleScreening] error:", err instanceof Error ? err.message : err);
    if (err instanceof Error && err.stack) console.error(err.stack);
    return null;
  }
}
