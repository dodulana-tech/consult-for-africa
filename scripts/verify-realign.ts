import fs from "fs"; import path from "path"; import { PrismaClient } from "@prisma/client";
for (const f of [".env",".env.local"]){const p=path.resolve(process.cwd(),f);if(!fs.existsSync(p))continue;for(const line of fs.readFileSync(p,"utf8").split("\n")){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v;}}}
const prisma=new PrismaClient();
(async()=>{
  const now=new Date();
  const overdueMs = await prisma.milestone.findMany({ where:{ dueDate:{lt:now}, status:{notIn:["COMPLETED","SKIPPED"]} }, select:{ name:true, dueDate:true, engagement:{select:{name:true,status:true,client:{select:{name:true}}}} } });
  const overdueProjects = await prisma.engagement.findMany({ where:{ status:"ACTIVE", endDate:{lt:now} }, select:{name:true} });
  const endingSoon = await prisma.engagement.findMany({ where:{ status:"ACTIVE", endDate:{gte:now, lte:new Date(now.getTime()+14*864e5)} }, select:{name:true,endDate:true} });
  console.log("Overdue milestones (portfolio count):", overdueMs.length);
  for(const m of overdueMs) console.log("   -", m.engagement.client?.name, "/", m.engagement.name, "["+m.engagement.status+"]", "→", m.name, m.dueDate.toISOString().slice(0,10));
  console.log("Overdue ACTIVE projects:", overdueProjects.length, overdueProjects.map(p=>p.name));
  console.log("Ending-soon ACTIVE projects (<14d):", endingSoon.length, endingSoon.map(p=>p.name+" "+p.endDate?.toISOString().slice(0,10)));
  await prisma.$disconnect();
})();
