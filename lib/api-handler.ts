import { NextRequest } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */
type RouteHandler = (
  req: any,
  ctx: any,
) => Promise<Response> | Response;

/**
 * Wraps a Next.js API route handler with global error catching.
 * Prevents raw 500 HTML pages from leaking to clients on unhandled errors.
 *
 * Usage:
 *   export const GET = handler(async (req) => { ... });
 *   export const POST = handler(async (req) => { ... });
 */
export function handler(fn: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      const method = req.method ?? "UNKNOWN";
      const url = req.nextUrl?.pathname ?? req.url ?? "";
      console.error(`[API ${method} ${url}] Unhandled error:`, err);
      return Response.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }
  };
}
