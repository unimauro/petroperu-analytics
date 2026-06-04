import { PALETTE } from "../lib/format";

interface Props {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null; // variación interanual (fracción)
  hint?: string;
  tone?: "default" | "good" | "bad" | "warn";
}

const toneColor: Record<NonNullable<Props["tone"]>, string> = {
  default: PALETTE.cyan,
  good: PALETTE.green,
  bad: PALETTE.red,
  warn: PALETTE.amber,
};

export default function KpiCard({ label, value, sub, delta, hint, tone = "default" }: Props) {
  return (
    <div className="card flex flex-col gap-1" title={hint}>
      <span className="text-xs uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-2xl tabular font-semibold" style={{ color: toneColor[tone] }}>
        {value}
      </span>
      <div className="flex items-center gap-2 text-xs">
        {sub && <span className="text-slate-500">{sub}</span>}
        {delta !== undefined && delta !== null && (
          <span style={{ color: delta >= 0 ? PALETTE.green : PALETTE.red }}>
            {delta >= 0 ? "▲" : "▼"} {(Math.abs(delta) * 100).toFixed(1)}% a/a
          </span>
        )}
      </div>
    </div>
  );
}
