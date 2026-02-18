import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();

  const message = `
New Consult For Africa Brief Submission

Organization: ${data.organization}
Country: ${data.country}
Role: ${data.role}
Email: ${data.email}

Project Type: ${data.projectType}

Brief:
${data.message}
`;

  console.log(message); // visible in Vercel logs

  return NextResponse.json({ success: true });
}
