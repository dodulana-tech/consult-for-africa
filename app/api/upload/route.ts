import { auth } from "@/auth";
import { NextRequest } from "next/server";
import { generateUploadUrl, generateDownloadUrl, buildKey, getPublicUrl } from "@/lib/r2";

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "text/csv": "csv",
  "text/plain": "txt",
  "application/zip": "zip",
  "video/webm": "webm",
  "video/mp4": "mp4",
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
};

const ALLOWED_FOLDERS = ["deliverables", "cvs", "knowledge", "avatars", "documents", "assessments", "founder-docs"] as const;
type Folder = (typeof ALLOWED_FOLDERS)[number];

const MAX_FILE_SIZE_MB = 50;

/**
 * POST: Generate a presigned upload URL for authenticated users.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { filename?: string; contentType?: string; folder?: string; fileSize?: number };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { filename, contentType, folder, fileSize } = body;

  if (!filename || !contentType || !folder) {
    return Response.json(
      { error: "filename, contentType, and folder are required" },
      { status: 400 }
    );
  }

  if (fileSize && fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return Response.json(
      { error: `File exceeds maximum size of ${MAX_FILE_SIZE_MB}MB` },
      { status: 413 }
    );
  }

  if (!ALLOWED_FOLDERS.includes(folder as Folder)) {
    return Response.json(
      { error: `Invalid folder. Allowed: ${ALLOWED_FOLDERS.join(", ")}` },
      { status: 400 }
    );
  }

  if (!ALLOWED_CONTENT_TYPES[contentType]) {
    return Response.json(
      { error: "File type not allowed" },
      { status: 415 }
    );
  }

  const key = buildKey(folder, filename);

  try {
    const uploadUrl = await generateUploadUrl(key, contentType, 600, typeof fileSize === "number" ? fileSize : undefined);
    const publicUrl = await getPublicUrl(key);

    return Response.json({
      uploadUrl,
      key,
      publicUrl,
      maxSizeMB: MAX_FILE_SIZE_MB,
    });
  } catch (err) {
    console.error("[upload] Failed to generate presigned URL", err);
    return Response.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

/**
 * GET: Generate a presigned download URL for authenticated users.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return Response.json({ error: "key query parameter is required" }, { status: 400 });
  }

  // Validate the key starts with an allowed folder
  const folder = key.split("/")[0];
  if (!ALLOWED_FOLDERS.includes(folder as Folder)) {
    return Response.json({ error: "Invalid file key" }, { status: 400 });
  }

  try {
    const downloadUrl = await generateDownloadUrl(key);
    return Response.json({ downloadUrl });
  } catch (err) {
    console.error("[upload] Failed to generate download URL", err);
    return Response.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
