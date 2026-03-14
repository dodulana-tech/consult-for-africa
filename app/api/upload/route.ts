import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return new Response("No file", { status: 400 });

  const MAX_BYTES = 50 * 1024 * 1024;
  if (file.size > MAX_BYTES) return new Response("File too large (max 50MB)", { status: 413 });

  const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png"];
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(ext)) return new Response("File type not allowed", { status: 415 });

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, uniqueName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  return Response.json({ url: `/uploads/${uniqueName}` });
}
