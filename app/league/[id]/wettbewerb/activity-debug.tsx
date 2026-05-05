import type { KbActivity } from "@/lib/kickbase/types";
import { formatEUR } from "@/lib/utils";

interface TypeStats {
  t: number;
  count: number;
  withData: number;
  withU: number;
  numericFields: Map<string, { count: number; sum: number; min: number; max: number }>;
  sampleDataKeys: Set<string>;
  exampleData: Record<string, unknown> | null;
}

/**
 * Group activities by t-code, sum any numeric data fields, identify all
 * unique field names. Helps us spot bonus types we currently don't catch.
 */
export function groupActivities(activities: KbActivity[]): TypeStats[] {
  const map = new Map<number, TypeStats>();

  for (const a of activities) {
    const t = a.t;
    let s = map.get(t);
    if (!s) {
      s = {
        t,
        count: 0,
        withData: 0,
        withU: 0,
        numericFields: new Map(),
        sampleDataKeys: new Set(),
        exampleData: null,
      };
      map.set(t, s);
    }
    s.count++;
    if (a.u?.i) s.withU++;
    const data = (a.data ?? a.d ?? {}) as Record<string, unknown>;
    if (Object.keys(data).length > 0) {
      s.withData++;
      if (!s.exampleData) s.exampleData = data;
      for (const [k, v] of Object.entries(data)) {
        s.sampleDataKeys.add(k);
        if (typeof v === "number" && !isNaN(v)) {
          let nf = s.numericFields.get(k);
          if (!nf) {
            nf = { count: 0, sum: 0, min: Infinity, max: -Infinity };
            s.numericFields.set(k, nf);
          }
          nf.count++;
          nf.sum += v;
          if (v < nf.min) nf.min = v;
          if (v > nf.max) nf.max = v;
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function ActivityTypeDebug({ activities }: { activities: KbActivity[] }) {
  const stats = groupActivities(activities);
  const totalActivities = activities.length;

  return (
    <details className="mt-4 text-[11px] tabular">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-semibold">
        🔬 Alle Activity-Types in deinem Feed ({stats.length} verschiedene aus{" "}
        {totalActivities} Events)
      </summary>
      <div className="mt-2 overflow-auto max-h-96">
        <table className="w-full text-[10px] tabular border-collapse">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-1.5">t</th>
              <th className="text-right p-1.5">Anzahl</th>
              <th className="text-right p-1.5">w/data</th>
              <th className="text-right p-1.5">w/u</th>
              <th className="text-left p-1.5">Numerische Felder Σ</th>
              <th className="text-left p-1.5">Field-Keys</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((s) => {
              const numericSummary = Array.from(s.numericFields.entries())
                .map(([k, n]) => {
                  const isMonetary = n.max > 1000;
                  return `${k}=${n.count}× Σ${
                    isMonetary
                      ? formatEUR(n.sum, { compact: true })
                      : n.sum.toLocaleString("de-DE")
                  } (min ${n.min}, max ${n.max})`;
                })
                .join(" · ");
              const isInteresting = s.numericFields.size > 0 && Array.from(s.numericFields.values()).some((n) => n.max > 10000);
              return (
                <tr
                  key={s.t}
                  className={
                    "border-b border-border/40 " +
                    (isInteresting ? "bg-amber-50/60 font-semibold" : "")
                  }
                >
                  <td className="p-1.5 font-mono">{s.t}</td>
                  <td className="text-right p-1.5">{s.count}</td>
                  <td className="text-right p-1.5">{s.withData}</td>
                  <td className="text-right p-1.5">{s.withU}</td>
                  <td className="p-1.5 font-mono text-[9px]">
                    {numericSummary || <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-1.5 font-mono text-[9px]">
                    {Array.from(s.sampleDataKeys).join(", ") || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        🎯 Goldene Zeilen haben monetäre Felder (max &gt; 10k €) — Kandidaten für Boni
        die wir aktuell nicht catchen. Wir filtern aktuell nur auf{" "}
        <code className="font-mono">data.bn</code>. Wenn ein Type auch{" "}
        <code className="font-mono">amount</code>, <code className="font-mono">val</code>,{" "}
        <code className="font-mono">prc</code>, <code className="font-mono">payout</code>{" "}
        oder ähnliches hat, müssen wir den Filter erweitern.
      </p>
    </details>
  );
}
