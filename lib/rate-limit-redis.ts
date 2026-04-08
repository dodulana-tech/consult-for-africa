import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Falls back to in-memory if Redis not configured (dev mode)
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

function createLimiter(requests: number, window: string) {
  if (!redis) {
    // Fallback to simple in-memory for dev
    const { isRateLimited } = require("./rate-limit");
    return {
      limit: async (key: string) => {
        const windowMs = parseDuration(window);
        const limited = isRateLimited(key, "redis-fallback", { windowMs, max: requests });
        return { success: !limited, limit: requests, remaining: limited ? 0 : 1, reset: 0 };
      },
    };
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics: true,
  });
}

function parseDuration(window: string): number {
  const match = window.match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match) return 60000;
  const [, n, unit] = match;
  const ms = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] ?? 60000;
  return parseInt(n) * ms;
}

// Pre-configured limiters for common use cases
export const authLimiter = createLimiter(10, "1 h");
export const apiLimiter = createLimiter(60, "1 m");
export const contactLimiter = createLimiter(5, "1 h");
export const uploadLimiter = createLimiter(10, "1 m");
export const chatLimiter = createLimiter(10, "1 m");
