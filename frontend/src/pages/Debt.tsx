import { useData } from "../lib/store";
import PageState from "../components/PageState";
import ChartCard from "../components/ChartCard";
import KpiCard from "../components/KpiCard";
import EChart from "../components/EChart";
import { baseOption } from "../lib/echart-theme";
import { PALETTE, usdMillions, pct, ratio } from "../lib/format";
import { years, seriesM, series, latest, yoy } from "../lib/selectors";
import type { FinancialRow } from "../lib/data";

export default function Debt() {
  const { financials } = useData();
  return <PageState>{financials && <Content rows={financials.rows} />}</PageState>;
}

const r1 = (v: number | null) => (v === null ? null : +v.toFixed(2));

function Content({ rows }: { rows: FinancialRow[] }) {
  const x = years(rows);
  const last = latest(rows);

  const composition = {
    ...baseOption(),
    color: [PALETTE.amber, PALETTE.red, PALETTE.cyan],
    legend: { ...baseOption().legend, data: ["Deuda corto plazo", "Deuda largo plazo", "Caja"] },
    xAxis: { ...baseOption().xAxis, data: x },
    yAxis: { ...baseOption().yAxis, name: "US$ M" },
    series: [
      { name: "Deuda corto plazo", type: "bar", stack: "deuda", data: seriesM(rows, "short_term_debt") },
      { name: "Deuda largo plazo", type: "bar", stack: "deuda", data: seriesM(rows, "long_term_debt") },
      { name: "Caja", type: "line", smooth: true, data: seriesM(rows, "cash") },
    ],
  };

  const leverage = {
    ...baseOption(),
    color: [PALETTE.violet, PALETTE.green],
    legend: { ...baseOption().legend, data: ["Deuda neta / EBITDA", "Cobertura intereses"] },
    xAxis: { ...baseOption().xAxis, data: x },
    series: [
      { name: "Deuda neta / EBITDA", type: "line", smooth: true, data: series(rows, "net_debt_to_ebitda").map(r1) },
      { name: "Cobertura intereses", type: "line", smooth: true, data: series(rows, "interest_coverage").map(r1),
        markLine: { silent: true, data: [{ yAxis: 1 }], lineStyle: { color: PALETTE.red, type: "dashed" }, label: { formatter: "1.0x" } } },
    ],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-100">Dashboard de deuda</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Deuda total" value={usdMillions(last.total_debt)} delta={yoy(rows, "total_debt")} tone="warn" />
        <KpiCard label="Razón endeudamiento" value={pct(last.debt_ratio)} hint="Pasivo / Activo" />
        <KpiCard label="Deuda / Patrimonio" value={ratio(last.debt_to_equity)} tone={last.flag_negative_equity ? "warn" : "default"} hint={last.flag_negative_equity ? "Patrimonio negativo: ratio sin sentido económico" : undefined} />
        <KpiCard label="Cobertura intereses" value={ratio(last.interest_coverage)} tone={(last.interest_coverage ?? 0) >= 1 ? "good" : "bad"} hint="EBIT / gasto financiero" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Composición de la deuda y caja" subtitle="Corto vs largo plazo (US$ M)">
          <EChart option={composition} />
        </ChartCard>
        <ChartCard title="Apalancamiento y cobertura" subtitle="Veces (x)">
          <EChart option={leverage} />
        </ChartCard>
      </div>

      <div className="card text-sm text-slate-400">
        El gasto financiero pasó de ~{usdMillions(rows[0].interest_expense)} en {rows[0].year} a
        ~{usdMillions(last.interest_expense)} en {last.year}, en línea con el endeudamiento del ciclo PMRT.
        Una cobertura de intereses por debajo de 1.0x indica que el resultado operativo no alcanza a cubrir el costo de la deuda.
      </div>
    </div>
  );
}
