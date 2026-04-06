import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`${name} environment variable is required`);
  return val;
}

const R2_ACCOUNT_ID = requireEnv("R2_ACCOUNT_ID");
const R2_ACCESS_KEY_ID = requireEnv("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = requireEnv("R2_SECRET_ACCESS_KEY");
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "cfa-uploads";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Build a structured storage key.
 * Example: "deliverables/2026/03/clxyz123-report.pdf"
 */
export function buildKey(folder: string, filename: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const safeName = filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `${folder}/${year}/${month}/${id}-${safeName}`;
}

/**
 * Generate a presigned PUT URL for direct browser upload.
 * If contentLength is provided, R2 will reject uploads that don't match the declared size.
 */
export async function generateUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 600, // 10 minutes
  contentLength?: number
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ...(contentLength ? { ContentLength: contentLength } : {}),
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generate a presigned GET URL for time-limited downloads.
 */
export async function generateDownloadUrl(
  key: string,
  expiresIn = 3600 // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Delete a file from R2.
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  await r2Client.send(command);
}

/**
 * Get the public URL for a file key.
 * Falls back to a presigned download URL if no public domain is configured.
 */
export async function getPublicUrl(key: string): Promise<string> {
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }
  // No public URL configured; generate a presigned download URL
  return generateDownloadUrl(key);
}
