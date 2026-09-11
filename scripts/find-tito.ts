import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { OR: [
      { name: { contains: "Ipinmoye", mode: "insensitive" } },
      { name: { contains: "Tito", mode: "insensitive" } },
      { email: { contains: "ipinmoye", mode: "insensitive" } },
      { email: { contains: "tito", mode: "insensitive" } },
    ] },
    select: { id: true, name: true, email: true, role: true },
  });
  console.log("USER matches:", JSON.stringify(users, null, 2));
  const contacts = await prisma.clientContact.findMany({
    where: { OR: [
      { name: { contains: "Ipinmoye", mode: "insensitive" } },
      { name: { contains: "Tito", mode: "insensitive" } },
    ] },
    select: { id: true, name: true, email: true, title: true },
  });
  console.log("CONTACT matches:", JSON.stringify(contacts, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
