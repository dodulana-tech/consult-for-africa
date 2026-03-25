/**
 * Simple in-memory rate limiter keyed by bucket + IP.
 * Suitable for single-instance deployments. On serverless cold starts the
 * map resets, which is acceptable -- it still throttles hot-path abuse.
 */
const store = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(
  ip: string,
  bucket: string,
  { windowMs = 3_600_000, max = 5 }: { windowMs?: number; max?: number } = {}
): boolean {
  const now = Date.now();
  const key = `${bucket}:${ip}`;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > max;
}
