import { useMemo, useState } from "react";
import { useData } from "../lib/store";
import PageState from "../components/PageState";
import KpiCard from "../components/KpiCard";
import ChartCard from "../components/ChartCard";
import EChart from "../components/EChart";
import { baseOption } from "../lib/echart-theme";
import { PALETTE, usdMillions, ratio } from "../lib/format";
import { latest } from "../lib/selectors";
import type { FinancialRow } from "../lib/data";

export default function Summary() {
  const { financials } = useData();
  return <PageState>{financials && <Content rows={financials.rows} />}</PageState>;
}

interface Assumptions {
  ebitdaGrowth: number; // %/año
  amortShare: number;   // % del FFO destinado a amortizar deuda
  horizon: number;      // años
}

interface YearPoint {
  year: number;
  ebitda: number;
  netDebt: number;
  equity: number;
  leverage: number | null; // deuda neta / EBITDA
}

/**
 * Modelo de mediano plazo con SUPUESTOS EXPLÍCITOS (no es un pronóstico de tendencia).
 * Parte del último ejercicio y proyecta año a año aplicando las palancas elegidas.
 */
function project(last: FinancialRow, a: Assumptions): YearPoint[] {
  const rate = last.total_debt > 0 ? last.interest_expense / last.total_debt : 0.06;
  const da = last.depreciation_amortization;
  let ebitda = last.ebitda;
  let netDebt = last.total_debt - last.cash;
  let equity = last.equity;

  const out: YearPoint[] = [{
    year: last.year, ebitda, netDebt, equity,
    leverage: ebitda > 0 ? netDebt / ebitda : null,
  }];

  for (let i = 1; i <= a.horizon; i++) {
    ebitda = ebitda * (1 + a.ebitdaGrowth / 100);
    const interest = netDebt * rate;
    const ffo = ebitda - interest;               // flujo de fondos operativo aprox. (pre-impuestos)
    const amort = Math.max(0, ffo * (a.amortShare / 100));
    netDebt = Math.max(0, netDebt - amort);
    const netIncome = ebitda - da - interest;     // resultado neto aprox.
    equity = equity + netIncome;
    out.push({
      year: last.year + i, ebitda, netDebt, equity,
      leverage: ebitda > 0 ? netDebt / ebitda : null,
    });
  }
  return out;
}

const LEVERAGE_TARGET = 4; // umbral de "apalancamiento manejable" (deuda neta / EBITDA)

function Content({ rows }: { rows: FinancialRow[] }) {
  const last = latest(rows);
  const [a, setA] = useState<Assumptions>({ ebitdaGrowth: 8, amortShare: 40, horizon: 6 });
  const path = useMemo(() => project(last, a), [last, a]);

  const yearLeverageOk = path.find((p) => p.leverage !== null && p.leverage <= LEVERAGE_TARGET && p.year > last.year);
  const yearEquityPos = path.find((p) => p.equity > 0 && p.year > last.year);

  const x = path.map((p) => String(p.year));
  const leverageOpt = {
    ...baseOption(),
    color: [PALETTE.violet],
    xAxis: { ...baseOption().xAxis, data: x },
    yAxis: { ...baseOption().yAxis, name: "Deuda neta / EBITDA (x)" },
    series: [{
      name: "Apalancamiento", type: "line", smooth: true,
      data: path.map((p) => (p.leverage === null ? null : +p.leverage.toFixed(2))),
      markLine: { silent: true, data: [{ yAxis: LEVERAGE_TARGET }], lineStyle: { color: PALETTE.green, type: "dashed" }, label: { formatter: `objetivo ${LEVERAGE_TARGET}x` } },
    }],
  };
  const equityOpt = {
    ...baseOption(),
    color: [PALETTE.cyan],
    xAxis: { ...baseOption().xAxis, data: x },
    yAxis: { ...baseOption().yAxis, name: "Patrimonio (US$ M)" },
    series: [{
      name: "Patrimonio", type: "line", smooth: true, areaStyle: { opacity: 0.1 },
      data: path.map((p) => +(p.equity / 1000).toFixed(0)),
      markLine: { silent: true, data: [{ yAxis: 0 }], lineStyle: { color: PALETTE.red, type: "dashed" }, label: { formatter: "patrimonio = 0" } },
    }],
  };

  const verdict = yearLeverageOk
    ? `Con estos supuestos, el apalancamiento bajaría a ≤${LEVERAGE_TARGET}x hacia ${yearLeverageOk.year}` +
      (yearEquityPos ? ` y el patrimonio volvería a ser positivo hacia ${yearEquityPos.year}.` : ", aunque el patrimonio seguiría negativo en el horizonte.")
    : `Con estos supuestos, el apalancamiento NO baja a ≤${LEVERAGE_TARGET}x dentro de ${a.horizon} años: la recuperación exigiría medidas adicionales (capitalización, refinanciamiento, mayor EBITDA).`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Resumen estratégico</h1>
        <p className="text-sm text-slate-500 max-w-3xl">
          ¿Es posible <strong>retornar la inversión</strong> en el mediano plazo? Esta página no extrapola
          tendencias: parte del último ejercicio ({last.year}) y proyecta con <strong>palancas que tú defines</strong>
          (crecimiento de EBITDA, disciplina de amortización). Cada supuesto es visible y editable.
        </p>
      </div>

      <div className="card border-accent-amber/30 bg-accent-amber/5 text-sm text-slate-300">
        <strong className="text-accent-amber">Cómo leer esto:</strong> es un <em>modelo de escenarios</em> con
        supuestos explícitos, no un pronóstico. Las cifras de partida son ilustrativas (ver Metodología). Sirve para
        razonar "qué tendría que pasar para…", no para predecir.
      </div>

      {/* Diagnóstico actual (datos del motor) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="EBITDA actual" value={usdMillions(last.ebitda)} tone={last.ebitda >= 0 ? "good" : "bad"} />
        <KpiCard label="Deuda neta / EBITDA" value={last.ebitda > 0 ? ratio((last.total_debt - last.cash) / last.ebitda) : "n/d"} tone="warn" hint="Veces; cuanto más alto, más años de EBITDA para pagar la deuda" />
        <KpiCard label="Cobertura intereses" value={ratio(last.interest_coverage)} tone={(last.interest_coverage ?? 0) >= 1 ? "good" : "bad"} />
        <KpiCard label="Patrimonio" value={usdMillions(last.equity)} tone={last.equity >= 0 ? "good" : "bad"} />
      </div>

      {/* Palancas de la estrategia */}
      <ChartCard title="Palancas de la estrategia de mediano plazo" subtitle="Ajusta los supuestos y observa la trayectoria">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Slider label="Crecimiento anual de EBITDA" value={a.ebitdaGrowth} min={-5} max={20} step={1} unit="%"
            onChange={(v) => setA({ ...a, ebitdaGrowth: v })} />
          <Slider label="% del FFO a amortizar deuda" value={a.amortShare} min={0} max={100} step={5} unit="%"
            onChange={(v) => setA({ ...a, amortShare: v })} />
          <Slider label="Horizonte" value={a.horizon} min={3} max={10} step={1} unit=" años"
            onChange={(v) => setA({ ...a, horizon: v })} />
        </div>
      </ChartCard>

      <div className={`card text-sm ${yearLeverageOk ? "border-accent-green/40 bg-accent-green/5" : "border-accent-red/40 bg-accent-red/5"}`}>
        <strong className={yearLeverageOk ? "text-accent-green" : "text-accent-red"}>Lectura del escenario:</strong> {verdict}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Desapalancamiento" subtitle={`Trayectoria de deuda neta / EBITDA hacia el objetivo (${LEVERAGE_TARGET}x)`}>
          <EChart option={leverageOpt} />
        </ChartCard>
        <ChartCard title="Recuperación patrimonial" subtitle="Trayectoria del patrimonio (cruce de 0)">
          <EChart option={equityOpt} />
        </ChartCard>
      </div>

      {/* Palancas cualitativas */}
      <ChartCard title="Palancas reales del retorno (cualitativo)" subtitle="Qué tendría que ejecutarse, más allá del modelo">
        <ul className="text-sm text-slate-300 space-y-2 list-disc pl-5">
          <li><strong>EBITDA:</strong> maduración de Talara (PMRT), márgenes de refinación, eficiencia operativa y comercial.</li>
          <li><strong>Estructura de capital:</strong> refinanciamiento de deuda cara, eventual capitalización del accionista (Estado/MEF).</li>
          <li><strong>Capital de trabajo:</strong> gestión de inventarios y cuentas por cobrar para liberar caja.</li>
          <li><strong>Gobierno corporativo:</strong> estabilidad de directorio/gerencia y disciplina financiera (ver pestaña Gobierno).</li>
          <li><strong>Riesgo:</strong> precios de crudo (WTI), tipo de cambio y costo de financiamiento condicionan todo lo anterior.</li>
        </ul>
      </ChartCard>
    </div>
  );
}

function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="tabular text-lg text-accent-amber font-semibold">{value}{unit}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent-amber" aria-label={label} />
    </label>
  );
}
