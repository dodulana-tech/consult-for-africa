import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { generateUploadUrl, buildKey, getPublicUrl } from "@/lib/r2";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic();

const CADRE_VALUES = [
  "MEDICINE",
  "DENTISTRY",
  "NURSING",
  "MIDWIFERY",
  "PHARMACY",
  "MEDICAL_LABORATORY_SCIENCE",
  "RADIOGRAPHY_IMAGING",
  "REHABILITATION_THERAPY",
  "OPTOMETRY",
  "COMMUNITY_HEALTH",
  "ENVIRONMENTAL_HEALTH",
  "NUTRITION_DIETETICS",
  "PSYCHOLOGY_SOCIAL_WORK",
  "PUBLIC_HEALTH",
  "HEALTH_RECORDS",
  "HOSPITAL_MANAGEMENT",
  "HEALTH_ADMINISTRATION",
  "BIOMEDICAL_ENGINEERING",
] as const;

const SYSTEM_PROMPT = `You are a professional CV data extraction specialist for CadreHealth, a Nigerian healthcare career platform. Extract structured professional information from the healthcare CV text provided.

Return ONLY valid JSON with the following structure (no markdown, no explanation):

{
  "fullName": "string or null",
  "firstName": "string or null",
  "lastName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "cadre": "one of: ${CADRE_VALUES.join(", ")}",
  "subSpecialty": "string or null",
  "yearsOfExperience": "number or null (estimate from work history dates if not stated)",
  "qualifications": [
    {
      "type": "PRIMARY_DEGREE | POSTGRADUATE | FELLOWSHIP | CERTIFICATION | INTERNATIONAL_EXAM",
      "name": "e.g. MBBS, BNSc, B.Pharm, MSc Public Health, FWACS, etc.",
      "institution": "string or null",
      "yearObtained": "number or null"
    }
  ],
  "workHistory": [
    {
      "facilityName": "string",
      "role": "string",
      "department": "string or null",
      "startDate": "YYYY-MM-DD or null (use first day of month/year if only month/year given)",
      "endDate": "YYYY-MM-DD or null",
      "isCurrent": "boolean"
    }
  ],
  "credentials": [
    {
      "type": "PRACTICING_LICENSE | FULL_REGISTRATION | COGS | SPECIALIST_REGISTRATION | ADDITIONAL_LICENSE",
      "regulatoryBody": "MDCN | NMCN | PCN | MLSCN | RRBN | MRTB | ODORBN | CHPRBN | EHORECON | ICNDN | COREN",
      "licenseNumber": "string or null"
    }
  ],
  "certifications": [
    {
      "name": "e.g. ACLS, BLS, IELTS, PLAB Part 1, etc.",
      "score": "string or null (e.g. IELTS band score)",
      "type": "CERTIFICATION | INTERNATIONAL_EXAM"
    }
  ],
  "summary": "Brief 1-2 sentence professional summary based on the CV"
}

Rules:
- Map the professional to the most appropriate cadre from the list above
- For Nigerian healthcare professionals, identify MDCN/NMCN/PCN numbers as credentials
- Distinguish between primary degrees (MBBS, BNSc, B.Pharm) and postgraduate qualifications
- IELTS, OET, PLAB, USMLE are INTERNATIONAL_EXAM type
- ACLS, BLS, ATLS are CERTIFICATION type
- If dates are ambiguous, make reasonable estimates
- Return null for fields you cannot determine
- Do not fabricate information not present in the CV`;

export const POST = handler(async function POST(req: NextRequest) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are accepted" },
        { status: 415 }
      );
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 10MB" },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const isPdf = file.type === "application/pdf";

    // PDFs go to Claude as documents rather than being parsed here. pdf-parse
    // v2 runs pdfjs underneath and pdfjs wants the browser's DOMMatrix, which
    // the Node runtime does not define, so every PDF upload died on
    // "DOMMatrix is not defined". The same conclusion was already reached in
    // lib/maarovaCircleScreening.ts.
    let docxText = "";
    if (!isPdf) {
      // DOCX is a zip archive. The previous code read it as UTF-8 and stripped
      // angle brackets, which yields binary noise, not text, and the noise was
      // long enough to clear the length check and reach the model. mammoth was
      // already a dependency and does this properly.
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        docxText = result.value.replace(/\s+/g, " ").trim();
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        console.error("[cv-upload] DOCX extraction failed:", reason);
        return NextResponse.json(
          { error: `Could not read the file: ${reason}` },
          { status: 422 }
        );
      }

      if (docxText.length < 50) {
        return NextResponse.json(
          { error: "Could not extract sufficient text from the file. Please ensure the document contains readable text." },
          { status: 422 }
        );
      }

      // Say so rather than silently cutting the CV in half.
      if (docxText.length > 200_000) {
        return NextResponse.json(
          { error: "That document is too long to read in one pass. Please upload a CV rather than a portfolio." },
          { status: 413 }
        );
      }
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[cv-upload] ANTHROPIC_API_KEY not set in runtime env");
      return NextResponse.json(
        { error: "CV extraction service not configured (ANTHROPIC_API_KEY missing)" },
        { status: 500 }
      );
    }

    let responseText = "";
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: isPdf
              ? [
                  {
                    type: "document" as const,
                    source: {
                      type: "base64" as const,
                      media_type: "application/pdf" as const,
                      data: buffer.toString("base64"),
                    },
                  },
                  { type: "text" as const, text: "Extract structured data from this healthcare CV." },
                ]
              : `Extract structured data from this healthcare CV:\n\n${docxText}`,
          },
        ],
      });
      responseText =
        message.content[0]?.type === "text" ? message.content[0].text : "";
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      console.error("[cv-upload] Anthropic call failed:", reason);
      return NextResponse.json(
        { error: `AI extraction failed: ${reason}` },
        { status: 502 }
      );
    }

    // Parse JSON from response (handle potential markdown wrapping)
    let parsed;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      console.error("[cv-upload] JSON parse failed. Raw response head:", responseText.slice(0, 500));
      return NextResponse.json(
        { error: `Could not parse extracted data: ${reason}` },
        { status: 500 }
      );
    }

    // Upload the original file to R2 for admin access
    let cvFileUrl: string | null = null;
    try {
      const key = buildKey("cvs", file.name);
      const contentType = file.type || "application/pdf";
      const uploadUrl = await generateUploadUrl(key, contentType, 600, buffer.length);
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: buffer,
      });
      if (putRes.ok) {
        cvFileUrl = await getPublicUrl(key);
      }
    } catch (e) {
      console.error("[cv-upload] R2 upload failed, continuing without file storage:", e);
    }

    // Save cvFileUrl and AI summary to the professional record
    try {
      const updateData: Record<string, unknown> = {};
      if (cvFileUrl) updateData.cvFileUrl = cvFileUrl;
      if (parsed.summary) updateData.summary = parsed.summary;
      if (Object.keys(updateData).length > 0) {
        await prisma.cadreProfessional.update({
          where: { id: session.sub },
          data: updateData,
        });
      }
    } catch (e) {
      console.error("[cv-upload] Failed to save cvFileUrl/summary:", e);
    }

    // Recalculate profile completeness after CV extraction
    try {
      const prof = await prisma.cadreProfessional.findUnique({
        where: { id: session.sub },
        select: {
          phone: true,
          cadre: true,
          yearsOfExperience: true,
          state: true,
          openTo: true,
          monthlySalary: true,
          salaryReportedAt: true,
          _count: {
            select: {
              credentials: true,
              qualifications: true,
              workHistory: true,
            },
          },
        },
      });

      if (prof) {
        let completeness = 20; // base
        if (prof.phone) completeness += 5;
        if (prof.cadre) completeness += 5;
        if (prof.yearsOfExperience != null) completeness += 5;
        if (prof.state) completeness += 5;
        if (prof.openTo && prof.openTo.length > 0) completeness += 5;
        if (prof._count.credentials > 0) completeness += 10;
        if (prof._count.qualifications > 0) completeness += 10;
        if (prof._count.workHistory > 0) completeness += 10;
        if (prof.monthlySalary != null || prof.salaryReportedAt != null) completeness += 5;
        if (completeness > 100) completeness = 100;

        await prisma.cadreProfessional.update({
          where: { id: session.sub },
          data: { profileCompleteness: completeness },
        });
      }
    } catch (e) {
      console.error("Profile completeness recalculation error:", e);
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error("CV upload error:", error);
    return NextResponse.json(
      { error: `Failed to process CV: ${reason}` },
      { status: 500 }
    );
  }
});
