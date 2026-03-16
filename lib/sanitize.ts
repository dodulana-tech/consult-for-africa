/**
 * Sanitize user input before including in AI prompts to mitigate prompt injection.
 * Strips known injection patterns and control sequences.
 */
export function sanitizeForPrompt(input: string): string {
  return input
    // Remove common prompt injection patterns
    .replace(/\[SYSTEM[:\]]/gi, "[filtered]")
    .replace(/\[INST[:\]]/gi, "[filtered]")
    .replace(/\bIGNORE\s+(ALL\s+)?PREVIOUS\s+INSTRUCTIONS?\b/gi, "[filtered]")
    .replace(/\bOVERRIDE\b/gi, "[filtered]")
    .replace(/\bFORGET\s+(ALL\s+)?(PREVIOUS|ABOVE)\b/gi, "[filtered]")
    .replace(/###\s*SYSTEM/gi, "### [filtered]")
    .replace(/<\|im_start\|>/gi, "")
    .replace(/<\|im_end\|>/gi, "")
    .replace(/\bYOU\s+ARE\s+NOW\b/gi, "[filtered]")
    .replace(/\bACT\s+AS\b/gi, "[filtered]")
    .replace(/\bNEW\s+INSTRUCTION[S]?\b/gi, "[filtered]")
    .trim();
}
