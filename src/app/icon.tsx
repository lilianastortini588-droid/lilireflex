import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          background: "radial-gradient(circle at 45% 32%, #8355a8, #211230 58%, #0b0712)",
        }}
      >
        <svg width="42" height="50" viewBox="0 0 42 50">
          <path d="M19 46 C9 40 7 30 11 21 C14 14 20 11 19 5 C19 2 22 0 25 2 C28 4 26 8 26 11 C27 17 34 21 33 29 C32 37 27 44 19 46 Z" fill="rgba(255,248,251,.18)" stroke="#efd6e4" strokeWidth="1.4" />
          <circle cx="21" cy="38" r="2.4" fill="#fff8fb" />
          <circle cx="25" cy="23" r="2" fill="#cbb5dd" />
          <circle cx="24" cy="4" r="2.6" fill="#fff8fb" />
        </svg>
      </div>
    ),
    size,
  );
}
