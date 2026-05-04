import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BetterBase — die smarteste Kickbase-Companion-App";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a0608 50%, #0a0a0a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 60,
            width: 100,
            height: 100,
            borderRadius: 16,
            background: "#d20515",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 64,
            fontWeight: 800,
          }}
        >
          B
        </div>
        <div
          style={{
            color: "#a1a1aa",
            fontSize: 28,
            fontWeight: 600,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          BetterBase
        </div>
        <div
          style={{
            color: "#ededed",
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          Kickbase,{" "}
          <span style={{ color: "#d20515" }}>aber besser.</span>
        </div>
        <div
          style={{
            color: "#a1a1aa",
            fontSize: 32,
            marginTop: 28,
            maxWidth: 920,
          }}
        >
          Liga-Sozial-Layer · AI-Transfer-Coach · Push-Alerts
        </div>
      </div>
    ),
    size
  );
}
