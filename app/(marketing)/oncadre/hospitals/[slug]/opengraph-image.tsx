import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "edge";
export const alt = "Hospital Review - CadreHealth";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FACILITY_TYPE_LABELS: Record<string, string> = {
  PUBLIC_TERTIARY: "Public Tertiary",
  PUBLIC_SECONDARY: "Public Secondary",
  PUBLIC_PRIMARY: "Public Primary",
  PRIVATE_TERTIARY: "Private Tertiary",
  PRIVATE_SECONDARY: "Private Secondary",
  PRIVATE_CLINIC: "Private Clinic",
  FAITH_BASED: "Faith-Based",
  NGO: "NGO",
  MILITARY: "Military",
  INTERNATIONAL: "International",
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const facility = await prisma.cadreFacility.findUnique({
    where: { slug },
    select: {
      name: true,
      type: true,
      state: true,
      city: true,
      overallRating: true,
      totalReviews: true,
      wouldRecommendPct: true,
    },
  });

  if (!facility) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0F2744",
            color: "white",
            fontSize: "32px",
          }}
        >
          Hospital Not Found
        </div>
      ),
      { ...size }
    );
  }

  const rating = facility.overallRating
    ? Number(facility.overallRating).toFixed(1)
    : null;
  const typeLabel = FACILITY_TYPE_LABELS[facility.type] ?? facility.type;
  const recommendPct = facility.wouldRecommendPct
    ? Math.round(Number(facility.wouldRecommendPct))
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0F2744 0%, #0B3C5D 50%, #1a5a8a 100%)",
          position: "relative",
          padding: "60px 80px",
        }}
      >
        {/* Decorative */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-60px",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Top section */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "32px",
            }}
          >
            <span
              style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff" }}
            >
              Cadre
            </span>
            <span
              style={{ fontSize: "20px", fontWeight: 700, color: "#D4AF37" }}
            >
              Health
            </span>
            <div
              style={{
                width: "1px",
                height: "16px",
                background: "rgba(255,255,255,0.2)",
                marginLeft: "10px",
                marginRight: "10px",
              }}
            />
            <span
              style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)" }}
            >
              Hospital Reviews
            </span>
          </div>

          {/* Hospital name */}
          <span
            style={{
              fontSize: facility.name.length > 40 ? "38px" : "46px",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
              maxWidth: "800px",
            }}
          >
            {facility.name}
          </span>

          {/* Type + Location */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                color: "rgba(255,255,255,0.7)",
                background: "rgba(255,255,255,0.1)",
                padding: "4px 14px",
                borderRadius: "20px",
              }}
            >
              {typeLabel}
            </span>
            <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)" }}>
              {facility.city}, {facility.state}
            </span>
          </div>
        </div>

        {/* Bottom section - Rating */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "40px" }}>
          {rating ? (
            <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "56px",
                    fontWeight: 700,
                    color: "#D4AF37",
                    lineHeight: 1,
                  }}
                >
                  {rating}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.4)",
                    marginTop: "4px",
                  }}
                >
                  out of 5
                </span>
              </div>
              <div
                style={{
                  width: "1px",
                  height: "50px",
                  background: "rgba(255,255,255,0.15)",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  {facility.totalReviews}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  staff reviews
                </span>
              </div>
              {recommendPct !== null && (
                <>
                  <div
                    style={{
                      width: "1px",
                      height: "50px",
                      background: "rgba(255,255,255,0.15)",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "28px",
                        fontWeight: 700,
                        color: "#ffffff",
                      }}
                    >
                      {recommendPct}%
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      recommend
                    </span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#D4AF37",
                }}
              >
                No reviews yet
              </span>
              <span
                style={{
                  fontSize: "16px",
                  color: "rgba(255,255,255,0.45)",
                  marginTop: "4px",
                }}
              >
                Be the first to review this hospital
              </span>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
