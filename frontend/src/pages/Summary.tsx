import { Link } from "react-router-dom";
import { useData } from "../lib/store";
import PageState from "../components/PageState";
import KpiCard from "../components/KpiCard";
import ChartCard from "../components/ChartCard";
import EChart from "../components/EChart";
import { baseOption } from "../lib/echart-theme";
import { PALETTE, usdMillions, pct, ratio } from "../lib/format";
import { years, seriesM, latest } from "../lib/selectors";
import type { FinancialRow } from "../lib/data";

export default function Summary() {
  const { financials } = useData();
  return <PageState>{financials && <Content rows={financials.rows} />}</PageState>;
}

function Content({ rows }: { rows: FinancialRow[] }) {
  const { meta } = useData();
  const lq = meta?.latest_quarter;
  const last = latest(rows);
  const netDebtEbitda = last.ebitda > 0 ? (last.total_debt - last.cash) / last.ebitda : null;
  const lossYears = rows.filter((r) => r.net_income < 0).map((r) => r.year);
  const coverageBad = (last.interest_coverage ?? 0) < 1;

  // Semáforo de situación
  const critical = last.flag_negative_equity || coverageBad;
  const verdict = critical
    ? "Situación financiera delicada"
    : "Situación financiera en recuperación";

  const x = years(rows);
  const netIncomeOpt = {
    ...baseOption(),
    color: [PALETTE.amber],
    xAxis: { ...baseOption().xAxis, data: x },
    yAxis: { ...baseOption().yAxis, name: "US$ M" },
    series: [{
      name: "Resultado neto", type: "bar",
      data: seriesM(rows, "net_income"),
      itemStyle: { color: (p: any) => (p.value >= 0 ? PALETTE.green : PALETTE.red) },
    }],
  };
  const equityOpt = {
    ...baseOption(),
    color: [PALETTE.cyan],
    xAxis: { ...baseOption().xAxis, data: x },
    yAxis: { ...baseOption().yAxis, name: "US$ M" },
    series: [{
      name: "Patrimonio", type: "line", smooth: true, areaStyle: { opacity: 0.1 },
      data: seriesM(rows, "equity"),
      markLine: { silent: true, data: [{ yAxis: 0 }], lineStyle: { color: PALETTE.red, type: "dashed" } },
    }],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Resumen estratégico — estado actual</h1>
        <p className="text-sm text-slate-500 max-w-3xl">
          Diagnóstico de cómo está Petroperú hoy (último ejercicio: {last.year}), leído directamente de los
          indicadores. Cifras ilustrativas — ver el badge de la barra superior.
        </p>
      </div>

      {/* Veredicto */}
      <div className={`card ${critical ? "border-accent-red/40 bg-accent-red/5" : "border-accent-green/40 bg-accent-green/5"}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{critical ? "🔴" : "🟢"}</span>
          <div>
            <div className={`font-semibold ${critical ? "text-accent-red" : "text-accent-green"}`}>{verdict}</div>
            <div className="text-sm text-slate-300">
              {critical
                ? `El patrimonio ${last.flag_negative_equity ? "es negativo" : "está bajo presión"} y el resultado operativo ${coverageBad ? "no alcanza a cubrir los intereses de la deuda" : "es ajustado"}. La empresa depende de su accionista (el Estado) y de refinanciamiento.`
                : "Los indicadores muestran recuperación, aunque conviene seguir la evolución de deuda y márgenes."}
            </div>
          </div>
        </div>
      </div>

      {/* Highlight del último trimestre (dato más reciente, verificado) */}
      {lq && (
        <div className="card border-accent-green/40 bg-accent-green/5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🟢</span>
            <div className="flex-1">
              <div className="font-semibold text-accent-green">Lo más reciente · {lq.period} ({lq.as_of})</div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-300 mt-1">
                <span>Utilidad neta: <strong className="text-accent-green">+US$ {lq.net_income} M</strong></span>
                <span>EBITDA ajustado: <strong className="text-accent-green">+US$ {lq.adj_ebitda} M</strong></span>
                <span>Utilidad bruta: <strong>+US$ {lq.gross_profit} M</strong></span>
                <span>Ingresos: US$ {lq.revenue} M</span>
              </div>
              <div className="text-xs text-slate-500 mt-1.5">{lq.note} · Fuente: {lq.source}</div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs del estado actual */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Ingresos" value={usdMillions(last.revenue)} />
        <KpiCard label="EBITDA" value={usdMillions(last.ebitda)} tone={last.ebitda >= 0 ? "good" : "bad"} />
        <KpiCard label="Resultado neto" value={usdMillions(last.net_income)} tone={last.net_income >= 0 ? "good" : "bad"} />
        <KpiCard label="Deuda neta / EBITDA" value={netDebtEbitda ? ratio(netDebtEbitda) : "n/d"} tone="warn" />
        <KpiCard label="Cobertura intereses" value={ratio(last.interest_coverage)} tone={coverageBad ? "bad" : "good"} />
        <KpiCard label="Patrimonio" value={usdMillions(last.equity)} tone={last.equity >= 0 ? "good" : "bad"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="¿Cómo está hoy? — lectura rápida">
          <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5">
            <li><strong>Rentabilidad:</strong> margen neto de {pct(last.net_margin)}; {lossYears.length} de {rows.length} ejercicios del periodo cerraron en pérdida ({lossYears.join(", ") || "—"}).</li>
            <li><strong>Solvencia:</strong> {last.flag_negative_equity ? `patrimonio negativo (${usdMillions(last.equity)}) — los pasivos superan a los activos.` : `patrimonio de ${usdMillions(last.equity)}.`}</li>
            <li><strong>Deuda:</strong> deuda total {usdMillions(last.total_debt)}; razón de endeudamiento {pct(last.debt_ratio)} del activo.</li>
            <li><strong>Liquidez:</strong> corriente {ratio(last.current_ratio)} {(last.current_ratio ?? 0) < 1 ? "(bajo 1.0x: tensión de corto plazo)" : ""}.</li>
            <li><strong>Costo financiero:</strong> intereses {usdMillions(last.interest_expense)}/año; cobertura {ratio(last.interest_coverage)}.</li>
          </ul>
        </ChartCard>

        <ChartCard title="Riesgos y dependencias">
          <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5">
            <li><strong>Apoyo estatal:</strong> con patrimonio negativo, la continuidad depende de aportes/garantías del MEF.</li>
            <li><strong>Refinanciamiento:</strong> vencimientos y costo de la deuda en un entorno de calificación deteriorada.</li>
            <li><strong>Operación Talara (PMRT):</strong> la rentabilidad futura depende de que la refinería opere a plena capacidad y con buenos márgenes.</li>
            <li><strong>Precios y tipo de cambio:</strong> WTI y S//US$ mueven ingresos y costos.</li>
            <li><strong>Gobernanza:</strong> estabilidad de directorio y gerencia (ver pestaña Gobierno).</li>
          </ul>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Resultado neto por año" subtitle="Verde = utilidad · Rojo = pérdida">
          <EChart option={netIncomeOpt} />
        </ChartCard>
        <ChartCard title="Patrimonio en el tiempo" subtitle="Cruce de 0 = patrimonio negativo">
          <EChart option={equityOpt} />
        </ChartCard>
      </div>

      {/* CTA al juego de decisiones */}
      <div className="card border-accent-violet/40 bg-accent-violet/5 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-slate-300">
          <strong className="text-accent-violet">¿Se puede reflotar Petroperú?</strong> Pon a prueba estrategias
          (nuevos productos, crédito, inversión privada, capitalización…) en un simulador interactivo.
        </div>
        <Link to="/decisions" className="text-sm px-4 py-2 rounded-md bg-accent-violet/20 text-accent-violet border border-accent-violet/40 hover:bg-accent-violet/30 transition-colors whitespace-nowrap">
          🎮 Juega a ser director →
        </Link>
      </div>
    </div>
  );
}
