import { useData } from "../lib/store";
import PageState from "../components/PageState";
import KpiCard from "../components/KpiCard";
import ChartCard from "../components/ChartCard";
import EChart from "../components/EChart";
import { baseOption } from "../lib/echart-theme";
import { PALETTE, usdMillions, pct, ratio } from "../lib/format";
import { years, seriesM, series, latest, yoy } from "../lib/selectors";

export default function Executive() {
  const { financials } = useData();
  return (
    <PageState>
      {financials && <Content rows={financials.rows} />}
    </PageState>
  );
}

function Content({ rows }: { rows: import("../lib/data").FinancialRow[] }) {
  const last = latest(rows);
  const x = years(rows);

  const revVsNet = {
    ...baseOption(),
    color: [PALETTE.cyan, PALETTE.amber],
    legend: { ...baseOption().legend, data: ["Ingresos", "Resultado neto"] },
    xAxis: { ...baseOption().xAxis, data: x },
    yAxis: [
      { ...baseOption().yAxis, name: "US$ M", position: "left" },
    ],
    series: [
      { name: "Ingresos", type: "bar", data: seriesM(rows, "revenue"), itemStyle: { borderRadius: [2, 2, 0, 0] } },
      { name: "Resultado neto", type: "line", smooth: true, data: seriesM(rows, "net_income"), lineStyle: { width: 2 } },
    ],
  };

  const margins = {
    ...baseOption(),
    color: [PALETTE.green, PALETTE.violet],
    legend: { ...baseOption().legend, data: ["Margen EBITDA", "Margen neto"] },
    xAxis: { ...baseOption().xAxis, data: x },
    yAxis: { ...baseOption().yAxis, axisLabel: { color: "#94a3b8", formatter: "{value}%" } },
    series: [
      { name: "Margen EBITDA", type: "line", smooth: true, data: series(rows, "ebitda_margin").map((v) => (v === null ? null : +(v * 100).toFixed(1))) },
      { name: "Margen neto", type: "line", smooth: true, data: series(rows, "net_margin").map((v) => (v === null ? null : +(v * 100).toFixed(1))) },
    ],
  };

  const structure = {
    ...baseOption(),
    color: [PALETTE.slate, PALETTE.red, PALETTE.green],
    legend: { ...baseOption().legend, data: ["Activo total", "Pasivo total", "Patrimonio"] },
    xAxis: { ...baseOption().xAxis, data: x },
    yAxis: { ...baseOption().yAxis, name: "US$ M" },
    series: [
      { name: "Activo total", type: "line", areaStyle: { opacity: 0.08 }, data: seriesM(rows, "total_assets") },
      { name: "Pasivo total", type: "line", areaStyle: { opacity: 0.08 }, data: seriesM(rows, "total_liabilities") },
      { name: "Patrimonio", type: "line", data: seriesM(rows, "equity") },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Resumen ejecutivo</h1>
        <p className="text-sm text-slate-500">
          Ejercicio más reciente: {last.year} · {last.data_status === "illustrative" ? "cifras ilustrativas" : "cifras verificadas"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Ingresos" value={usdMillions(last.revenue)} delta={yoy(rows, "revenue")} />
        <KpiCard label="EBITDA" value={usdMillions(last.ebitda)} delta={yoy(rows, "ebitda")} tone={last.ebitda >= 0 ? "good" : "bad"} />
        <KpiCard label="Resultado neto" value={usdMillions(last.net_income)} delta={yoy(rows, "net_income")} tone={last.net_income >= 0 ? "good" : "bad"} />
        <KpiCard label="Margen neto" value={pct(last.net_margin)} tone={(last.net_margin ?? 0) >= 0 ? "good" : "bad"} />
        <KpiCard label="ROE" value={pct(last.roe)} hint="Con patrimonio negativo el ROE pierde sentido económico" tone={last.flag_negative_equity ? "warn" : "default"} />
        <KpiCard label="Liquidez corriente" value={ratio(last.current_ratio)} tone={(last.current_ratio ?? 0) >= 1 ? "good" : "bad"} />
      </div>

      {last.flag_negative_equity && (
        <div className="card border-accent-red/40 bg-accent-red/5 text-sm text-slate-300">
          <strong className="text-accent-red">Alerta de solvencia:</strong> el patrimonio del ejercicio {last.year} es negativo
          ({usdMillions(last.equity)}). Indicadores como ROE y Deuda/Patrimonio deben leerse con cautela.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Ingresos vs. resultado neto" subtitle="US$ millones por ejercicio">
          <EChart option={revVsNet} />
        </ChartCard>
        <ChartCard title="Márgenes" subtitle="EBITDA y neto sobre ingresos">
          <EChart option={margins} />
        </ChartCard>
        <ChartCard title="Estructura patrimonial" subtitle="Activo, pasivo y patrimonio" className="lg:col-span-2">
          <EChart option={structure} height={340} />
        </ChartCard>
      </div>
    </div>
  );
}
