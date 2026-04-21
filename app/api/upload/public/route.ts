import { NextRequest } from "next/server";
import { generateUploadUrl, buildKey, getPublicUrl } from "@/lib/r2";
import { handler } from "@/lib/api-handler";

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/x-msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

/** Map file extensions to canonical MIME types for reliable detection */
const EXT_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
};

const PUBLIC_FOLDERS = ["cvs", "documents"] as const;
type PublicFolder = (typeof PUBLIC_FOLDERS)[number];

const MAX_FILE_SIZE_MB = 10;

// Simple in-memory rate limiter (per IP, 10 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Periodically clean up stale entries to prevent memory leaks
  if (rateLimitMap.size > 10_000) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

/**
 * POST: Generate a presigned upload URL for public users (no auth).
 * Restricted to CVs and documents, max 10MB, rate-limited.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 }
    );
  }

  let body: { filename?: string; contentType?: string; folder?: string; fileSize?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { filename, contentType, folder, fileSize } = body;

  if (!filename || !contentType || !folder) {
    return Response.json(
      { error: "filename, contentType, and folder are required" },
      { status: 400 }
    );
  }

  if (typeof fileSize !== "number" || fileSize <= 0) {
    return Response.json(
      { error: "fileSize is required and must be a positive number" },
      { status: 400 }
    );
  }

  const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
  if (fileSize > maxBytes) {
    return Response.json(
      { error: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` },
      { status: 413 }
    );
  }

  if (!PUBLIC_FOLDERS.includes(folder as PublicFolder)) {
    return Response.json(
      { error: `Invalid folder. Allowed: ${PUBLIC_FOLDERS.join(", ")}` },
      { status: 400 }
    );
  }

  // Resolve content type: trust allowlist first, fall back to extension-based detection
  let resolvedContentType = contentType;
  if (!ALLOWED_CONTENT_TYPES[contentType]) {
    const ext = `.${filename.split(".").pop()?.toLowerCase()}`;
    const extMime = EXT_TO_MIME[ext];
    if (extMime) {
      resolvedContentType = extMime;
    } else {
      return Response.json(
        { error: "File type not allowed. Accepted: PDF, DOC, DOCX, TXT" },
        { status: 415 }
      );
    }
  }

  const key = buildKey(folder, filename);

  try {
    const uploadUrl = await generateUploadUrl(key, resolvedContentType, 600, typeof fileSize === "number" ? fileSize : undefined);
    const publicUrl = await getPublicUrl(key);

    return Response.json({
      uploadUrl,
      key,
      publicUrl,
      contentType: resolvedContentType,
      maxSizeMB: MAX_FILE_SIZE_MB,
    });
  } catch (err) {
    console.error("[upload/public] Failed to generate presigned URL", err);
    return Response.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
});
