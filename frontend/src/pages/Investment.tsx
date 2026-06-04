import { useData } from "../lib/store";
import PageState from "../components/PageState";
import ChartCard from "../components/ChartCard";
import KpiCard from "../components/KpiCard";
import EChart from "../components/EChart";
import { baseOption } from "../lib/echart-theme";
import { PALETTE, usdMillions } from "../lib/format";
import { years, seriesM, latest, yoy } from "../lib/selectors";
import type { FinancialRow } from "../lib/data";

export default function Investment() {
  const { financials } = useData();
  return <PageState>{financials && <Content rows={financials.rows} />}</PageState>;
}

function Content({ rows }: { rows: FinancialRow[] }) {
  const x = years(rows);
  const last = latest(rows);

  // Inversión inferida ≈ variación del activo total (proxy; el dato fino viene del flujo de caja auditado).
  const capexProxy = rows.map((r, i) =>
    i === 0 ? null : Math.round(((r.total_assets - rows[i - 1].total_assets) / 1000) * 10) / 10);

  const assetsVsCapex = {
    ...baseOption(),
    color: [PALETTE.slate, PALETTE.amber],
    legend: { ...baseOption().legend, data: ["Activo total", "Inversión inferida (Δactivo)"] },
    xAxis: { ...baseOption().xAxis, data: x },
    yAxis: { ...baseOption().yAxis, name: "US$ M" },
    series: [
      { name: "Activo total", type: "line", areaStyle: { opacity: 0.08 }, smooth: true, data: seriesM(rows, "total_assets") },
      { name: "Inversión inferida (Δactivo)", type: "bar", data: capexProxy },
    ],
  };

  const cashGen = {
    ...baseOption(),
    color: [PALETTE.green, PALETTE.cyan],
    legend: { ...baseOption().legend, data: ["FFO proxy (Rdo+D&A)", "D&A"] },
    xAxis: { ...baseOption().xAxis, data: x },
    yAxis: { ...baseOption().yAxis, name: "US$ M" },
    series: [
      { name: "FFO proxy (Rdo+D&A)", type: "bar", data: seriesM(rows, "operating_cash_flow_proxy") },
      { name: "D&A", type: "line", smooth: true, data: seriesM(rows, "depreciation_amortization") },
    ],
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-100">Dashboard de inversión</h1>
      <p className="text-sm text-slate-500 max-w-3xl">
        Aproximaciones a la inversión de capital. El gran salto del activo entre ~2014 y 2021 refleja el ciclo de
        capex del Proyecto de Modernización de la Refinería de Talara (PMRT). La inversión fina debe leerse del
        Estado de Flujos de Efectivo auditado.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Activo total" value={usdMillions(last.total_assets)} delta={yoy(rows, "total_assets")} />
        <KpiCard label="Inversión inferida" value={usdMillions(last.total_assets - (rows.at(-2)?.total_assets ?? last.total_assets))} hint="Δ del activo total a/a (proxy)" />
        <KpiCard label="D&A del ejercicio" value={usdMillions(last.depreciation_amortization)} delta={yoy(rows, "depreciation_amortization")} />
        <KpiCard label="FFO proxy" value={usdMillions(last.operating_cash_flow_proxy)} tone={last.operating_cash_flow_proxy >= 0 ? "good" : "bad"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Activo e inversión inferida" subtitle="PMRT visible en el crecimiento del activo">
          <EChart option={assetsVsCapex} />
        </ChartCard>
        <ChartCard title="Generación de caja (proxy)" subtitle="FFO ≈ resultado + depreciación">
          <EChart option={cashGen} />
        </ChartCard>
      </div>
    </div>
  );
}
