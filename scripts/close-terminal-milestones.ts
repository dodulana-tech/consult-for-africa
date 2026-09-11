import fs from "fs"; import path from "path"; import { PrismaClient } from "@prisma/client";
for (const f of [".env",".env.local"]){const p=path.resolve(process.cwd(),f);if(!fs.existsSync(p))continue;for(const line of fs.readFileSync(p,"utf8").split("\n")){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v;}}}
const prisma=new PrismaClient();
(async()=>{
  // Incomplete milestones sitting on CANCELLED/COMPLETED engagements pollute the
  // "overdue milestones" portfolio count. Close them (SKIPPED) so they drop out.
  const targets = await prisma.milestone.findMany({
    where: { status:{notIn:["COMPLETED","SKIPPED"]}, engagement:{ status:{in:["CANCELLED","COMPLETED"]} } },
    select:{ id:true, name:true, status:true, engagement:{select:{name:true,status:true}} },
  });
  console.log("Closing", targets.length, "incomplete milestone(s) on terminal engagements:");
  for(const t of targets) console.log("   -", t.engagement.name, "["+t.engagement.status+"] →", t.name, "("+t.status+" -> SKIPPED)");
  fs.writeFileSync(path.resolve(process.cwd(),"close-terminal-milestones-backup.json"), JSON.stringify(targets,null,2));
  await prisma.$transaction(targets.map(t=>prisma.milestone.update({where:{id:t.id},data:{status:"SKIPPED"}})));
  console.log("✓ Done.");
  await prisma.$disconnect();
})();
