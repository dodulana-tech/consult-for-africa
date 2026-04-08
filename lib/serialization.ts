import { Decimal } from "@prisma/client/runtime/library";

// Recursively convert Prisma types for JSON serialization
export function serialise<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString() as unknown as T;
  if (obj instanceof Decimal) return obj.toNumber() as unknown as T;
  if (Array.isArray(obj)) return obj.map(serialise) as unknown as T;
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serialise(value);
    }
    return result as T;
  }
  return obj;
}
