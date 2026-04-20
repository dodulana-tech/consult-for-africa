import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const alt = "Job on CadreHealth";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const job = await prisma.cadreMandate.findUnique({
    where: { id },
    select: {
      title: true,
      facilityName: true,
      facility: { select: { name: true } },
      locationState: true,
      locationCity: true,
      cadre: true,
      type: true,
      salaryRangeMin: true,
      salaryRangeMax: true,
      salaryCurrency: true,
    },
  });

  if (!job) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            background: "#0B3C5D",
            color: "white",
            fontSize: 48,
          }}
        >
          CadreHealth
        </div>
      ),
      { ...size }
    );
  }

  const facility =
    job.facility?.name || job.facilityName || "CadreHealth Partner";
  const location =
    [job.locationCity, job.locationState].filter(Boolean).join(", ") ||
    "Nigeria";
  const salary =
    job.salaryRangeMin || job.salaryRangeMax
      ? `${job.salaryCurrency || "NGN"} ${job.salaryRangeMin ? (Number(job.salaryRangeMin) / 1000000).toFixed(1) + "M" : ""} ${job.salaryRangeMin && job.salaryRangeMax ? "-" : ""} ${job.salaryRangeMax ? (Number(job.salaryRangeMax) / 1000000).toFixed(1) + "M" : ""}`.trim()
      : null;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0B3C5D 0%, #071e2e 100%)",
          padding: "60px 80px",
          fontFamily: "system-ui",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "auto",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: "white" }}>
            Cadre
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#D4AF37" }}>
            Health
          </div>
          <div
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.4)",
              marginLeft: 12,
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 20,
              padding: "4px 14px",
            }}
          >
            Now Hiring
          </div>
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: "white",
              lineHeight: 1.1,
              maxWidth: "90%",
            }}
          >
            {job.title}
          </div>
          <div style={{ fontSize: 26, color: "rgba(255,255,255,0.6)" }}>
            {facility}
          </div>
          <div style={{ display: "flex", gap: "24px", marginTop: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: 20,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              <span>📍</span> {location}
            </div>
            {salary && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: 20,
                  color: "#D4AF37",
                  fontWeight: 600,
                }}
              >
                {salary}/mo
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
          }}
        >
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.3)" }}>
            consultforafrica.com/oncadre/jobs
          </div>
          <div
            style={{
              background: "#D4AF37",
              color: "#06090f",
              fontSize: 18,
              fontWeight: 700,
              padding: "12px 32px",
              borderRadius: 12,
            }}
          >
            Apply Now
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
