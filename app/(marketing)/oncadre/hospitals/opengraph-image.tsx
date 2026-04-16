import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Nigerian Hospital Reviews - Honest Staff Reviews & Salary Data | CadreHealth";
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
          background:
            "linear-gradient(135deg, #0F2744 0%, #0B3C5D 50%, #1a5a8a 100%)",
          position: "relative",
          padding: "60px 80px",
        }}
      >
        {/* Decorative blobs */}
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
        <div
          style={{
            position: "absolute",
            bottom: "-40px",
            left: "-30px",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(26,157,217,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Top badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
            }}
          >
            <span
              style={{ fontSize: "24px", fontWeight: 700, color: "#ffffff" }}
            >
              Cadre
            </span>
            <span
              style={{ fontSize: "24px", fontWeight: 700, color: "#D4AF37" }}
            >
              Health
            </span>
          </div>
          <div
            style={{
              width: "1px",
              height: "20px",
              background: "rgba(255,255,255,0.2)",
              marginLeft: "12px",
              marginRight: "12px",
            }}
          />
          <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)" }}>
            Hospital Reviews
          </span>
        </div>

        {/* Main headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontSize: "52px",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.15,
            }}
          >
            Your hospital.
          </span>
          <span
            style={{
              fontSize: "52px",
              fontWeight: 700,
              color: "#D4AF37",
              lineHeight: 1.15,
            }}
          >
            Your truth.
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "22px",
            color: "rgba(255,255,255,0.6)",
            marginTop: "20px",
            maxWidth: "700px",
            lineHeight: 1.5,
          }}
        >
          Anonymous, verified reviews from healthcare workers across Nigeria.
          Pay. Equipment. Management. Safety. No filters.
        </p>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            marginTop: "36px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{ fontSize: "28px", fontWeight: 700, color: "#D4AF37" }}
            >
              500+
            </span>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
              Hospitals
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{ fontSize: "28px", fontWeight: 700, color: "#ffffff" }}
            >
              36 + FCT
            </span>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
              States
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{ fontSize: "28px", fontWeight: 700, color: "#ffffff" }}
            >
              100%
            </span>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
              Anonymous
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "80px",
            fontSize: "14px",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          consultforafrica.com/oncadre/hospitals
        </div>
      </div>
    ),
    { ...size }
  );
}
