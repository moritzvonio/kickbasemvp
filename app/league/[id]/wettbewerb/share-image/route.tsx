import { ImageResponse } from "next/og";
import { getSession } from "@/lib/session";
import { getAccess } from "@/lib/entitlement";
import { assembleCompetitionStats } from "@/lib/competition-data";
import { formatEUR } from "@/lib/utils";

// Node-Runtime nötig: Session-Entschlüsselung nutzt node:crypto (nicht Edge-fähig).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 1080;
const H = 1350;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leagueId } = await params;

  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const access = await getAccess(session.userId);
  if (!access.pro && !access.trial) return new Response("Forbidden", { status: 403 });

  const data = await assembleCompetitionStats(session.token, leagueId, session.userId);
  if (!data) return new Response("No data", { status: 404 });

  const top = [...data.stats]
    .sort((a, b) => b.netTeamValue - a.netTeamValue)
    .slice(0, 10);
  const rest = data.stats.length - top.length;
  const leagueName = data.leagueName ?? "Deine Liga";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #ffffff 0%, #ecfdf5 60%, #ffffff 100%)",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Kopf: Logo-Mark + Wortmarke */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
              display: "flex",
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", left: 17, top: 36, width: 10, height: 16, borderRadius: 4, background: "#ffffff", opacity: 0.72 }} />
            <div style={{ position: "absolute", left: 31, top: 27, width: 10, height: 25, borderRadius: 4, background: "#ffffff", opacity: 0.88 }} />
            <div style={{ position: "absolute", left: 45, top: 17, width: 10, height: 35, borderRadius: 4, background: "#ffffff" }} />
            <div style={{ position: "absolute", left: 13, top: 52, width: 46, height: 7, borderRadius: 3, background: "#ffffff" }} />
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: "#0f172a" }}>
            Liga<span style={{ color: "#10b981" }}>base</span>
          </div>
        </div>

        {/* Titel */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
          <div style={{ fontSize: 30, color: "#64748b", fontWeight: 600 }}>Wettbewerb</div>
          <div style={{ fontSize: 56, color: "#0f172a", fontWeight: 800, lineHeight: 1.1 }}>
            {leagueName}
          </div>
          <div style={{ fontSize: 26, color: "#10b981", marginTop: 8, fontWeight: 600 }}>
            Netto-Teamwert · Max-Gebot aller Manager
          </div>
        </div>

        {/* Liste */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 36, gap: 10 }}>
          {top.map((s, i) => (
            <div
              key={s.userId}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px 22px",
                borderRadius: 16,
                background: i === 0 ? "#d1fae5" : "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", width: 48, fontSize: 30, fontWeight: 800, color: i === 0 ? "#047857" : "#94a3b8" }}>
                {i + 1}
              </div>
              <div style={{ display: "flex", flex: 1, fontSize: 32, fontWeight: 700, color: "#0f172a", overflow: "hidden" }}>
                {s.name.length > 20 ? s.name.slice(0, 19) + "…" : s.name}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a" }}>
                  {formatEUR(s.netTeamValue, { compact: true })}
                </div>
                <div style={{ fontSize: 22, color: "#64748b" }}>
                  {`max ${formatEUR(s.maxBidSingleSell, { compact: true })}`}
                </div>
              </div>
            </div>
          ))}
          {rest > 0 && (
            <div style={{ display: "flex", fontSize: 24, color: "#94a3b8", paddingLeft: 22, marginTop: 4 }}>
              + {rest} weitere Manager
            </div>
          )}
        </div>

        {/* Fuß */}
        <div style={{ display: "flex", marginTop: "auto", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "#10b981" }}>ligabase.de</div>
          <div style={{ display: "flex", fontSize: 20, color: "#94a3b8" }}>
            Schätzung · nicht offiziell mit Kickbase verbunden
          </div>
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}
