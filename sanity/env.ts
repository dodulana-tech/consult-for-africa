// sanity/env.ts
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;

// keep stable; you can change later if you want
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01";

// optional sanity check
if (!projectId || !dataset) {
  // don’t throw in build if you prefer, but during setup it’s helpful
  // eslint-disable-next-line no-console
  console.warn(
    "Missing Sanity env vars. Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET in .env.local"
  );
}
