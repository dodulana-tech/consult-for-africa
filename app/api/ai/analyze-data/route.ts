export const runtime = "nodejs";

import { auth } from "@/auth";
import { sanitizeForPrompt } from "@/lib/sanitize";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as XLSX from "xlsx";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_ROWS_PER_SHEET = 200;

type SheetData = unknown[][];

interface AnalysisResult {
  summary: string;
  keyMetrics: {
    name: string;
    value: string;
    benchmark?: string;
    status: "good" | "warning" | "critical";
  }[];
  findings: {
    title: string;
    detail: string;
    severity: "high" | "medium" | "low";
  }[];
  recommendations: {
    title: string;
    description: string;
    impact: string;
    priority: "immediate" | "short_term" | "long_term";
  }[];
  dataQuality: {
    score: number;
    issues: string[];
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return new Response("Invalid form data", { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const analysisType = (formData.get("analysisType") as string) || "general";
  const instructions = (formData.get("instructions") as string) || "";

  if (!file) {
    return new Response("No file provided", { status: 400 });
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return new Response("File exceeds 5MB limit", { status: 400 });
  }

  // Check file type
  const fileName = file.name.toLowerCase();
  const isXlsx = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
  const isCsv = fileName.endsWith(".csv");
  if (!isXlsx && !isCsv) {
    return new Response("Only .xlsx, .xls, and .csv files are supported", { status: 400 });
  }

  // Parse file
  const buffer = await file.arrayBuffer();

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return new Response("Could not parse file. Ensure it is a valid Excel or CSV file.", { status: 400 });
  }

  const sheets: Record<string, SheetData> = {};
  const sheetNames = workbook.SheetNames.slice(0, 3);
  const rowCounts: Record<string, number> = {};

  for (const name of sheetNames) {
    const raw: SheetData = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
      header: 1,
      defval: "",
    });
    // Truncate to first 200 rows
    sheets[name] = raw.slice(0, MAX_ROWS_PER_SHEET);
    rowCounts[name] = raw.length;
  }

  const systemPrompt = `You are a senior healthcare management consultant specializing in Nigerian hospitals and health facilities.
You have deep expertise in:
- Nigerian hospital revenue cycles (NHIS, HMOs, private pay, government billing)
- Hospital operations benchmarks for West Africa
- Healthcare finance in naira-denominated environments
- NHIS claim processing, MDCN regulations, accreditation standards

Analyze the provided data and give actionable recommendations with specific Nigerian context.
Never use em dashes in your output. Use commas or colons instead.
Return ONLY valid JSON, no markdown, no code fences, no other text.`;

  const userPrompt = `Analyze this hospital/healthcare data.

Analysis Type: ${analysisType}
${instructions ? `Additional Context: ${sanitizeForPrompt(instructions)}` : ""}

DATA:
${JSON.stringify(sheets, null, 1).slice(0, 30000)}

Provide a comprehensive analysis as JSON with this exact structure:
{
  "summary": "2-3 sentence executive summary",
  "keyMetrics": [
    { "name": "metric name", "value": "formatted value", "benchmark": "Nigerian benchmark if known", "status": "good|warning|critical" }
  ],
  "findings": [
    { "title": "finding title", "detail": "specific detail with numbers", "severity": "high|medium|low" }
  ],
  "recommendations": [
    { "title": "action title", "description": "specific steps", "impact": "estimated impact in naira or %", "priority": "immediate|short_term|long_term" }
  ],
  "dataQuality": { "score": 0-100, "issues": ["issue 1"] }
}`;

  let analysis: AnalysisResult;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = (message.content[0] as { text: string }).text;

    // Extract JSON: find first { to last }
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON found in response");
    const jsonStr = raw.slice(start, end + 1);
    analysis = JSON.parse(jsonStr) as AnalysisResult;
  } catch (err) {
    console.error("Claude data analysis error:", err);
    return new Response("Analysis failed. Please try again.", { status: 500 });
  }

  return Response.json({
    ...analysis,
    sheetNames,
    rowCounts,
    analysisType,
    analyzedAt: new Date().toISOString(),
  });
}
