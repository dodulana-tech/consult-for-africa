import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CadreHealth Career Readiness Assessment";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0B3C5D 0%, #0A3350 40%, #06090f 100%)",
          position: "relative",
        }}
      >
        {/* Accent circles */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-60px",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginBottom: "16px",
          }}
        >
          <span style={{ fontSize: "48px", fontWeight: 700, color: "#ffffff" }}>
            Cadre
          </span>
          <span style={{ fontSize: "48px", fontWeight: 700, color: "#D4AF37" }}>
            Health
          </span>
        </div>

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(212,175,55,0.15)",
            borderRadius: "24px",
            padding: "8px 20px",
            marginBottom: "32px",
          }}
        >
          <span style={{ fontSize: "16px", fontWeight: 600, color: "#D4AF37" }}>
            Career Readiness Assessment
          </span>
        </div>

        {/* Main text */}
        <p
          style={{
            fontSize: "36px",
            fontWeight: 700,
            color: "#ffffff",
            maxWidth: "800px",
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          How ready are you to practice in Nigeria, the UK, US, Canada, or the Gulf?
        </p>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "20px",
            color: "rgba(255,255,255,0.5)",
            marginTop: "16px",
          }}
        >
          Free. Takes 2 minutes. Get your score instantly.
        </p>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.3)" }}>
            by Consult For Africa
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
