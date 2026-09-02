import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 42,
          background: "radial-gradient(circle at 45% 32%, #8355a8, #211230 58%, #0b0712)",
        }}
      >
        <svg width="118" height="142" viewBox="0 0 118 142">
          <path d="M54 132 C25 116 20 87 30 61 C39 40 57 32 55 16 C54 6 64 1 73 6 C82 11 77 24 78 32 C80 49 98 59 96 82 C94 105 78 125 54 132 Z" fill="rgba(255,248,251,.16)" stroke="#efd6e4" strokeWidth="4" />
          <circle cx="59" cy="108" r="7" fill="#fff8fb" />
          <circle cx="70" cy="66" r="6" fill="#cbb5dd" />
          <circle cx="70" cy="11" r="8" fill="#fff8fb" />
        </svg>
      </div>
    ),
    size,
  );
}
