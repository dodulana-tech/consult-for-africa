import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "36px",
          background: "linear-gradient(135deg, #0B3C5D, #0F2744)",
        }}
      >
        <span
          style={{
            fontSize: "100px",
            fontWeight: 800,
            color: "#D4AF37",
            lineHeight: 1,
          }}
        >
          C
        </span>
      </div>
    ),
    { ...size }
  );
}
