import { getAgentSession } from "@/lib/agentPortalAuth";
import { generateUploadUrl, buildKey, getPublicUrl } from "@/lib/r2";
import { NextRequest } from "next/server";

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_FILE_SIZE_MB = 20;

export async function POST(req: NextRequest) {
  const session = await getAgentSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  let body: { filename?: string; contentType?: string; folder?: string; fileSize?: number };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { filename, contentType, folder, fileSize } = body;

  if (!filename || !contentType) {
    return Response.json(
      { error: "filename and contentType are required" },
      { status: 400 },
    );
  }

  if (fileSize && fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return Response.json(
      { error: `File exceeds maximum size of ${MAX_FILE_SIZE_MB}MB` },
      { status: 413 },
    );
  }

  if (!ALLOWED_CONTENT_TYPES[contentType]) {
    return Response.json(
      { error: "File type not allowed. Accepted: PDF, DOC, DOCX, JPG, PNG, WebP" },
      { status: 415 },
    );
  }

  const storageFolder = folder || "documents";
  const key = buildKey(storageFolder, filename);

  try {
    const uploadUrl = await generateUploadUrl(
      key,
      contentType,
      600,
      typeof fileSize === "number" ? fileSize : undefined,
    );
    const publicUrl = await getPublicUrl(key);

    return Response.json({
      uploadUrl,
      key,
      publicUrl,
      maxSizeMB: MAX_FILE_SIZE_MB,
    });
  } catch (err) {
    console.error("[agent-upload] Failed to generate presigned URL", err);
    return Response.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
