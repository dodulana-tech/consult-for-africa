import { z } from "zod";

/**
 * Server-side environment variable validation.
 *
 * Import `env` wherever you need a typed, validated env var.
 * On startup the schema is parsed once; missing or malformed
 * values surface immediately with a clear error message.
 */

const serverSchema = z.object({
  // ── Database ────────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),

  // ── Auth ────────────────────────────────────────────────────────────────────
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),

  // ── AI / LLM ───────────────────────────────────────────────────────────────
  ANTHROPIC_API_KEY: z.string().min(1),

  // ── SMTP (Zoho) ────────────────────────────────────────────────────────────
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().optional().default("465"),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().optional(),

  // ── Cloudflare R2 ──────────────────────────────────────────────────────────
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().optional(),

  // ── Paystack ───────────────────────────────────────────────────────────────
  PAYSTACK_SECRET_KEY: z.string().min(1),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),

  // ── Cron ───────────────────────────────────────────────────────────────────
  CRON_SECRET: z.string().min(1),

  // ── Portal secrets ─────────────────────────────────────────────────────────
  MAAROVA_PORTAL_SECRET: z.string().min(1),
  MAAROVA_COACH_SECRET: z.string().optional(),
  CLIENT_PORTAL_SECRET: z.string().min(1),
  PARTNER_PORTAL_SECRET: z.string().min(1),
  CADRE_PORTAL_SECRET: z.string().min(1),
  CADRE_EMPLOYER_SECRET: z.string().optional(),

  // ── Google (Calendar / Meet) ───────────────────────────────────────────────
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  GOOGLE_CALENDAR_IMPERSONATE_EMAIL: z.string().email().optional(),

  // ── Deepgram (transcription) ───────────────────────────────────────────────
  DEEPGRAM_API_KEY: z.string().optional(),

  // ── Chrome (Nuru bot) ──────────────────────────────────────────────────────
  CHROME_EXECUTABLE_PATH: z.string().optional(),

  // ── Resend (optional email provider) ───────────────────────────────────────
  RESEND_API_KEY: z.string().optional(),
  CONTACT_EMAIL: z.string().email().optional(),

  // ── CadreHealth extras ─────────────────────────────────────────────────────
  CADRE_SMTP_FROM: z.string().optional(),
  CADRE_WHATSAPP_TOKEN: z.string().optional(),
  CADRE_WHATSAPP_PHONE_ID: z.string().optional(),
  CADRE_WHATSAPP_APP_SECRET: z.string().optional(),
  CADRE_WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  TERMII_API_KEY: z.string().optional(),
  TERMII_SENDER_ID: z.string().optional(),

  // ── Sanity CMS ─────────────────────────────────────────────────────────────
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_SANITY_DATASET: z.string().optional(),
  NEXT_PUBLIC_SANITY_API_VERSION: z.string().optional(),

  // ── Analytics ──────────────────────────────────────────────────────────────
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),

  // ── Misc ───────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  VERCEL_URL: z.string().optional(),
  BASE_URL: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),

  // ── Third-party (scripts / enrichment) ─────────────────────────────────────
  ZEROBOUNCE_API_KEY: z.string().optional(),

  // ── AWS (NDA signing) ──────────────────────────────────────────────────────
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),

  // ── Upstash Redis (rate limiting) ─────────────────────────────────────────
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof serverSchema>;

function validateEnv(): Env {
  const result = serverSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return `  - ${path}: ${issue.message}`;
    });

    console.error(
      "\n========================================\n" +
        " MISSING / INVALID ENVIRONMENT VARIABLES\n" +
        "========================================\n" +
        missing.join("\n") +
        "\n========================================\n"
    );

    throw new Error(`Environment validation failed:\n${missing.join("\n")}`);
  }

  return result.data;
}

export const env = validateEnv();
