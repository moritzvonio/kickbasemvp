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
          background: "linear-gradient(135deg, #ffffff 0%, #ecfdf5 50%, #ffffff 100%)",
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
            borderRadius: 20,
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 64,
            fontWeight: 800,
            boxShadow: "0 12px 40px -12px rgba(16, 185, 129, 0.5)",
          }}
        >
          B
        </div>
        <div
          style={{
            color: "#10b981",
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          BetterBase
        </div>
        <div
          style={{
            color: "#0f172a",
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          Kickbase,{" "}
          <span style={{ color: "#10b981" }}>aber besser.</span>
        </div>
        <div
          style={{
            color: "#64748b",
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
