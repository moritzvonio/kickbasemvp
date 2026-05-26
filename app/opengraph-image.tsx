import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "LigaBase — die smarteste Companion-App für deine Liga";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Ein weißer Balken im Logo-Mark */
function Bar({ left, top, height, opacity = 1 }: { left: number; top: number; height: number; opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 15,
        height,
        borderRadius: 5,
        background: "#ffffff",
        opacity,
      }}
    />
  );
}

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
        {/* Logo-Mark: aufsteigende Balken auf Grundlinie */}
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 60,
            width: 110,
            height: 110,
            borderRadius: 24,
            background: "linear-gradient(135deg, #10b981 0%, #059669 55%, #047857 100%)",
            display: "flex",
            boxShadow: "0 12px 40px -12px rgba(16, 185, 129, 0.5)",
          }}
        >
          <Bar left={26} top={55} height={24} opacity={0.72} />
          <Bar left={47} top={42} height={37} opacity={0.88} />
          <Bar left={68} top={26} height={53} />
          <div style={{ position: "absolute", left: 20, top: 79, width: 70, height: 10, borderRadius: 5, background: "#ffffff" }} />
        </div>

        <div
          style={{
            color: "#10b981",
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          LigaBase
        </div>
        <div
          style={{
            color: "#0f172a",
            fontSize: 96,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            display: "flex",
          }}
        >
          Deine Liga,{" "}
          <span style={{ color: "#10b981" }}>smarter gespielt.</span>
        </div>
        <div
          style={{
            color: "#64748b",
            fontSize: 32,
            marginTop: 28,
            maxWidth: 920,
          }}
        >
          Liga-Dashboard · Marktwert-Insights · Transfer-Coach
        </div>
      </div>
    ),
    size
  );
}
