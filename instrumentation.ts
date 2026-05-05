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
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Importing lib/env triggers Zod validation at module load. If any
    // required env is missing, the import throws and Next surfaces the
    // error in the build / startup log. The deploy will fail visibly
    // rather than serving 500s.
    await import("./lib/env");
  }
}
