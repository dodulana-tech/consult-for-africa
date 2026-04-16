import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #0B3C5D, #0F2744)",
        }}
      >
        <span
          style={{
            fontSize: "18px",
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
