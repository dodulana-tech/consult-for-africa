import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type AuditAction =
  | "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE"
  | "SUBMIT" | "APPROVE" | "REJECT" | "ENROLL"
  | "ASSIGN" | "UPLOAD" | "DOWNLOAD" | "LOGIN" | "AI_GENERATE";

interface AuditParams {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName?: string;
  engagementId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function logAudit(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName ?? null,
        engagementId: params.engagementId ?? null,
        details: params.details ? (params.details as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (err) {
    // Never let audit logging break the main flow
    console.error("[audit] Failed to log:", err);
  }
}
