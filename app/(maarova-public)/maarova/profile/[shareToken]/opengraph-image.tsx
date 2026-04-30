import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const alt = "Maarova Leadership Profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0F2744";
const NAVY_DEEP = "#0B1E36";
const GOLD = "#D4A574";

interface SignatureStrength {
  dimension?: string;
  title?: string;
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const report = await prisma.maarovaReport.findUnique({
    where: { shareToken },
    select: {
      shareEnabledAt: true,
      leadershipArchetype: true,
      signatureStrengths: true,
      user: {
        select: {
          name: true,
          title: true,
          organisation: { select: { name: true } },
        },
      },
    },
  });

  if (!report || !report.shareEnabledAt) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: NAVY,
            color: "white",
            fontSize: 36,
          }}
        >
          Maarova Leadership Profile
        </div>
      ),
      { ...size }
    );
  }

  const archetype = report.leadershipArchetype ?? "Leadership Profile";
  const name = report.user.name;
  const subline = [report.user.title, report.user.organisation?.name]
    .filter(Boolean)
    .join(" · ");

  const strengths = (report.signatureStrengths as SignatureStrength[] | null) ?? [];
  const strengthTitles = strengths
    .slice(0, 3)
    .map((s) => s.title ?? s.dimension)
    .filter(Boolean) as string[];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(135deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`,
          padding: "60px 80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(212,165,116,0.18) 0%, transparent 70%)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 40,
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>
              Maarova
            </span>
            <span
              style={{
                width: 1,
                height: 18,
                background: "rgba(255,255,255,0.25)",
              }}
            />
            <span
              style={{
                fontSize: 13,
                color: GOLD,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              Verified Leadership Profile
            </span>
          </div>

          <span
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Leadership Archetype
          </span>
          <span
            style={{
              fontSize: archetype.length > 28 ? 56 : 68,
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.1,
              maxWidth: 980,
            }}
          >
            {archetype}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {strengthTitles.length > 0 && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {strengthTitles.map((s, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 16,
                    color: "#fff",
                    background: "rgba(212,165,116,0.18)",
                    border: "1px solid rgba(212,165,116,0.4)",
                    padding: "8px 18px",
                    borderRadius: 999,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>
                {name}
              </span>
              {subline && (
                <span
                  style={{
                    fontSize: 18,
                    color: "rgba(255,255,255,0.65)",
                    marginTop: 4,
                  }}
                >
                  {subline}
                </span>
              )}
            </div>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
              maarova.com
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
