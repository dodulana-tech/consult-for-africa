/** Read-only: status of the 10 resend targets. */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const EMAILS = [
  "elaigwu@yahoo.com", "frankeyeddy610@gmail.com", "femishonowo@gmail.com",
  "aliyusamuel81@gmail.com", "bolu.kusimo@gmail.com", "bfkq@yahoo.com",
  "dr_enyi@yahoo.co.uk", "beijehon51215@gmail.com", "bidornigie@gmail.com",
  "tihinmikalu@gmail.com",
];
async function main() {
  for (const email of EMAILS) {
    const u = await prisma.maarovaUser.findUnique({
      where: { email },
      select: { name: true, email: true, inviteEmailStatus: true, inviteEmailSentAt: true, invitedAt: true, lastLoginAt: true },
    });
    if (!u) { console.log(`  MISSING   ${email}`); continue; }
    const status = u.inviteEmailStatus ?? "—";
    const sentAt = u.inviteEmailSentAt ? u.inviteEmailSentAt.toISOString().slice(0, 16).replace("T", " ") : "—";
    console.log(`  ${status.padEnd(6)} sentAt=${sentAt}  invited=${u.invitedAt ? u.invitedAt.toISOString().slice(0, 16).replace("T", " ") : "—"}  ${u.email}`);
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
