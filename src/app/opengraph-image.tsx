import { ImageResponse } from "next/og";

export const alt = "Reflexología Holística — bienestar desde la base";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          alignItems: "center",
          padding: 72,
          overflow: "hidden",
          background:
            "radial-gradient(circle at 76% 42%, #8355a8 0%, #321a48 28%, #171020 58%, #0b0712 100%)",
          color: "#fff8fb",
        }}
      >
        <svg
          width="480"
          height="560"
          viewBox="0 0 420 560"
          style={{ position: "absolute", right: 18, top: 30, opacity: 0.74 }}
        >
          <path
            d="M205 523 C142 486 124 420 148 347 C169 282 210 247 202 178 C197 134 206 83 241 56 C267 36 296 45 306 69 C318 97 290 126 287 156 C283 204 340 239 344 308 C348 385 295 483 205 523 Z"
            fill="rgba(255,248,251,.11)"
            stroke="#efd6e4"
            strokeWidth="3"
          />
          {[[244,50,22],[282,34,18],[317,44,15],[344,65,13],[364,90,11]].map(([cx,cy,r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="rgba(255,248,251,.11)" stroke="#cbb5dd" strokeWidth="2" />
          ))}
          <circle cx="205" cy="476" r="15" fill="#f2e8f4" />
          <circle cx="264" cy="270" r="11" fill="#aa89c8" />
          <circle cx="226" cy="142" r="8" fill="#efd6e4" />
          <path d="M205 476 C258 424 235 344 264 270 C285 218 244 184 226 142" fill="none" stroke="#fff8fb" strokeWidth="2" strokeDasharray="5 8" />
        </svg>

        <div style={{ display: "flex", width: 700, flexDirection: "column" }}>
          <div style={{ display: "flex", marginBottom: 28, fontSize: 19, fontWeight: 700, letterSpacing: "0.24em", color: "#efd6e4" }}>
            BIENESTAR QUE COMIENZA DESDE LA BASE
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "serif", fontSize: 88, lineHeight: 0.82, letterSpacing: "-0.05em" }}>
            <span>REFLEXOLOGÍA</span>
            <span style={{ color: "#cbb5dd" }}>HOLÍSTICA</span>
          </div>
          <div style={{ display: "flex", maxWidth: 620, marginTop: 34, fontSize: 25, lineHeight: 1.35, color: "#f2e8f4" }}>
            Pies, manos y rostro en una experiencia de presencia, cuidado y conexión.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
