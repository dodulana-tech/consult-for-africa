import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

/**
 * Tests for environment variable validation logic.
 *
 * We cannot import lib/env.ts directly because it eagerly validates
 * process.env on import, and the test environment lacks the required
 * variables. Instead we replicate the schema and validateEnv pattern
 * to verify the validation behaviour.
 */

// Minimal schema mirroring the required fields from lib/env.ts
const testSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
});

function validateEnv(envVars: Record<string, string | undefined>) {
  const result = testSchema.safeParse(envVars);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => {
      const path = issue.path.join(".");
      return `${path}: ${issue.message}`;
    });
    throw new Error(`Environment validation failed:\n${missing.join("\n")}`);
  }
  return result.data;
}

describe("env validation", () => {
  it("succeeds when all required vars are present", () => {
    const result = validateEnv({
      DATABASE_URL: "postgresql://localhost:5432/test",
      NEXTAUTH_SECRET: "super-secret-key",
    });
    expect(result.DATABASE_URL).toBe("postgresql://localhost:5432/test");
    expect(result.NEXTAUTH_SECRET).toBe("super-secret-key");
  });

  it("throws when DATABASE_URL is missing", () => {
    expect(() =>
      validateEnv({
        NEXTAUTH_SECRET: "secret",
      })
    ).toThrow("Environment validation failed");
  });

  it("throws when NEXTAUTH_SECRET is missing", () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: "postgresql://localhost:5432/test",
      })
    ).toThrow("Environment validation failed");
  });

  it("throws when DATABASE_URL is empty string", () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: "",
        NEXTAUTH_SECRET: "secret",
      })
    ).toThrow("Environment validation failed");
  });

  it("allows optional NEXTAUTH_URL to be undefined", () => {
    const result = validateEnv({
      DATABASE_URL: "postgresql://localhost:5432/test",
      NEXTAUTH_SECRET: "secret",
    });
    expect(result.NEXTAUTH_URL).toBeUndefined();
  });

  it("validates NEXTAUTH_URL as a proper URL when provided", () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: "postgresql://localhost:5432/test",
        NEXTAUTH_SECRET: "secret",
        NEXTAUTH_URL: "not-a-url",
      })
    ).toThrow("Environment validation failed");
  });

  it("accepts valid NEXTAUTH_URL", () => {
    const result = validateEnv({
      DATABASE_URL: "postgresql://localhost:5432/test",
      NEXTAUTH_SECRET: "secret",
      NEXTAUTH_URL: "https://example.com",
    });
    expect(result.NEXTAUTH_URL).toBe("https://example.com");
  });

  it("defaults NODE_ENV to development when not provided", () => {
    const result = validateEnv({
      DATABASE_URL: "postgresql://localhost:5432/test",
      NEXTAUTH_SECRET: "secret",
    });
    expect(result.NODE_ENV).toBe("development");
  });

  it("rejects invalid NODE_ENV values", () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: "postgresql://localhost:5432/test",
        NEXTAUTH_SECRET: "secret",
        NODE_ENV: "staging",
      })
    ).toThrow("Environment validation failed");
  });

  it("error message includes the name of the missing variable", () => {
    try {
      validateEnv({});
      expect.fail("Should have thrown");
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toContain("DATABASE_URL");
      expect(message).toContain("NEXTAUTH_SECRET");
    }
  });
});
