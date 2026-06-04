import { useData } from "../lib/store";
import PageState from "../components/PageState";
import ChartCard from "../components/ChartCard";
import EChart from "../components/EChart";
import { baseOption } from "../lib/echart-theme";
import { PALETTE, pct, ratio, usdMillions } from "../lib/format";
import { years, series, latest } from "../lib/selectors";
import type { FinancialRow } from "../lib/data";

export default function Financial() {
  const { financials } = useData();
  return <PageState>{financials && <Content rows={financials.rows} />}</PageState>;
}

const r1 = (v: number | null) => (v === null ? null : +v.toFixed(2));
const p1 = (v: number | null) => (v === null ? null : +(v * 100).toFixed(1));

function Content({ rows }: { rows: FinancialRow[] }) {
  const x = years(rows);
  const last = latest(rows);

  const liquidity = {
    ...baseOption(),
    color: [PALETTE.cyan, PALETTE.violet],
    legend: { ...baseOption().legend, data: ["Liquidez corriente", "Prueba ácida"] },
    xAxis: { ...baseOption().xAxis, data: x },
    series: [
      { name: "Liquidez corriente", type: "line", smooth: true, data: series(rows, "current_ratio").map(r1),
        markLine: { silent: true, data: [{ yAxis: 1 }], lineStyle: { color: PALETTE.red, type: "dashed" }, label: { formatter: "1.0x" } } },
      { name: "Prueba ácida", type: "line", smooth: true, data: series(rows, "acid_test").map(r1) },
    ],
  };

  const profitability = {
    ...baseOption(),
    color: [PALETTE.green, PALETTE.amber],
    legend: { ...baseOption().legend, data: ["ROA", "ROE"] },
    xAxis: { ...baseOption().xAxis, data: x },
    yAxis: { ...baseOption().yAxis, axisLabel: { color: "#94a3b8", formatter: "{value}%" } },
    series: [
      { name: "ROA", type: "bar", data: series(rows, "roa").map(p1) },
      { name: "ROE", type: "line", smooth: true, data: series(rows, "roe").map(p1) },
    ],
  };

  const COLS: { key: keyof FinancialRow; label: string; fmt: (v: any) => string }[] = [
    { key: "revenue", label: "Ingresos", fmt: usdMillions },
    { key: "ebitda", label: "EBITDA", fmt: usdMillions },
    { key: "net_income", label: "Rdo. neto", fmt: usdMillions },
    { key: "roa", label: "ROA", fmt: (v) => pct(v) },
    { key: "roe", label: "ROE", fmt: (v) => pct(v) },
    { key: "current_ratio", label: "Liq. corr.", fmt: (v) => ratio(v) },
    { key: "acid_test", label: "Á. ácida", fmt: (v) => ratio(v) },
    { key: "debt_ratio", label: "Endeud.", fmt: (v) => pct(v) },
    { key: "debt_to_equity", label: "D/E", fmt: (v) => ratio(v) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-100">Dashboard financiero</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Liquidez" subtitle="Corriente y prueba ácida (umbral 1.0x)">
          <EChart option={liquidity} />
        </ChartCard>
        <ChartCard title="Rentabilidad" subtitle="ROA y ROE (%)">
          <EChart option={profitability} />
        </ChartCard>
      </div>

      <ChartCard title="Serie histórica de indicadores" subtitle={`${x[0]}–${x[x.length - 1]} · clic en encabezados para leer fórmulas en formulas.md`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs tabular">
            <thead>
              <tr className="text-slate-500 border-b border-ink-600">
                <th className="text-left py-2 pr-3 sticky left-0 bg-ink-800">Año</th>
                {COLS.map((c) => <th key={String(c.key)} className="text-right px-3 py-2 whitespace-nowrap">{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.year} className={`border-b border-ink-700/50 hover:bg-ink-700/40 ${row.year === last.year ? "text-slate-100" : "text-slate-400"}`}>
                  <td className="py-1.5 pr-3 sticky left-0 bg-ink-800 font-medium">{row.year}</td>
                  {COLS.map((c) => (
                    <td key={String(c.key)} className="text-right px-3 py-1.5 whitespace-nowrap">
                      {c.fmt(row[c.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
