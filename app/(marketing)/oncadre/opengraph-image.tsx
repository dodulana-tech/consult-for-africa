import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CadreHealth - The Career Platform for Nigerian Healthcare Professionals";
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
        {/* Gold accent circle */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-40px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(11,60,93,0.3) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginBottom: "24px",
          }}
        >
          <span style={{ fontSize: "64px", fontWeight: 700, color: "#ffffff" }}>
            Cadre
          </span>
          <span style={{ fontSize: "64px", fontWeight: 700, color: "#D4AF37" }}>
            Health
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.65)",
            maxWidth: "700px",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          The Career Platform for Nigerian Healthcare Professionals
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
