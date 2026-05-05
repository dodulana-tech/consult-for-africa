/**
 * Next.js server boot hook.
 *
 * Runs once when the Node.js runtime starts, before any request is
 * served. We use it to validate environment variables -- this would have
 * caught the CADRE_PORTAL_SECRET incident at deploy time instead of
 * letting it bleed for 24 hours via 500 errors at the per-request level.
 *
 * Edge runtime invocations (middleware, edge routes) do NOT trigger this
 * hook, so anything that runs only at the edge needs its own check.
 *
 * IMPORTANT: must NEVER throw. If lib/env throws on missing/invalid env,
 * the unhandled rejection during Vercel's lambda cold start kills the
 * whole runtime and every request -- including /api/health -- returns
 * 500 with no diagnostic. The validator's job is to log loudly so
 * /api/health stays reachable and can list what's missing.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    await import("./lib/env");
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(
      "\n========================================\n" +
        " ENV VALIDATION FAILED AT BOOT (non-fatal)\n" +
        " Runtime continued so /api/health is reachable.\n" +
        " Hit GET /api/health to see which envs are missing.\n" +
        "========================================\n" +
        reason +
        "\n========================================\n",
    );
  }
}
