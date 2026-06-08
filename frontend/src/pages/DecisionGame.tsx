import { useMemo, useState } from "react";
import { useData } from "../lib/store";
import PageState from "../components/PageState";
import KpiCard from "../components/KpiCard";
import ChartCard from "../components/ChartCard";
import EChart from "../components/EChart";
import { baseOption } from "../lib/echart-theme";
import { PALETTE, usdMillions, ratio } from "../lib/format";
import { latest } from "../lib/selectors";
import ShareButtons from "../components/ShareButtons";
import type { FinancialRow, LatestQuarter } from "../lib/data";

export default function DecisionGame() {
  const { financials } = useData();
  return <PageState>{financials && <Game rows={financials.rows} />}</PageState>;
}

// Productos derivados del petróleo (efectos ILUSTRATIVOS, con fines de simulación).
// revUplift = puntos de crecimiento anual de EBITDA que agrega; margin = mejora de margen (pp);
// capex = inversión inicial requerida (US$ M).
const PRODUCTS = [
  { id: "glp", name: "GLP (gas licuado)", revUplift: 1.5, margin: 0.5, capex: 300 },
  { id: "asfalto", name: "Asfaltos", revUplift: 0.8, margin: 0.8, capex: 150 },
  { id: "lubricantes", name: "Lubricantes", revUplift: 1.2, margin: 1.0, capex: 250 },
  { id: "petroquimica", name: "Petroquímica (polímeros)", revUplift: 3.5, margin: 2.0, capex: 1200 },
  { id: "bunker", name: "Combustibles marinos", revUplift: 1.8, margin: 0.6, capex: 200 },
  { id: "bio", name: "Biocombustibles", revUplift: 1.4, margin: 0.7, capex: 400 },
];

interface Decisions {
  ebitdaGrowth: number; costCut: number; amortShare: number; horizon: number;
  extraCredit: number; refiCut: number; stateCapital: number;
  privateInvest: number; privateShare: number;
  products: Set<string>;
}

// Punto de partida del simulador (en miles de US$).
interface Base {
  label: string;       // etiqueta del escenario
  startYear: number;   // año del primer punto de la trayectoria
  ebitda: number;
  totalDebt: number;
  cash: number;
  revenue: number;
  da: number;
  equity: number;
  interestExpense: number;
}

type BaselineMode = "cierre" | "runrate";

const TARGET = 4; // deuda neta / EBITDA "manejable"

/** Construye el punto de partida real según el modo elegido. */
function buildBase(last: FinancialRow, lq: LatestQuarter | undefined, mode: BaselineMode): Base {
  if (mode === "runrate" && lq) {
    // Anualiza el último trimestre real (×4). lq viene en millones → ×1000 = miles.
    return {
      label: `${lq.period} anualizado (run-rate)`,
      startYear: last.year + 1,
      ebitda: lq.adj_ebitda * 4 * 1000,
      revenue: lq.revenue * 4 * 1000,
      totalDebt: last.total_debt,            // deuda a cierre 2025 (proxy)
      cash: last.cash,
      da: last.depreciation_amortization,
      equity: last.equity + lq.net_income * 1000,
      interestExpense: last.interest_expense,
    };
  }
  return {
    label: `Cierre ${last.year} (anual auditado)`,
    startYear: last.year,
    ebitda: last.ebitda,
    revenue: last.revenue,
    totalDebt: last.total_debt,
    cash: last.cash,
    da: last.depreciation_amortization,
    equity: last.equity,
    interestExpense: last.interest_expense,
  };
}

function simulate(base: Base, d: Decisions) {
  const K = 1000; // millones -> miles
  const ebitda0 = base.ebitda;
  const grossDebt0 = base.totalDebt;
  const netDebt0 = grossDebt0 - base.cash;
  const revenue0 = base.revenue;
  const da = base.da;
  const rate0 = grossDebt0 > 0 ? base.interestExpense / grossDebt0 : 0.06;

  const prods = PRODUCTS.filter((p) => d.products.has(p.id));
  const capex = prods.reduce((s, p) => s + p.capex, 0) * K;
  const prodGrowth = prods.reduce((s, p) => s + p.revUplift, 0);
  const prodMargin = prods.reduce((s, p) => s + p.margin, 0);
  const marginBoost = revenue0 * (d.costCut + prodMargin) / 100; // recurrente (k)

  const injections = (d.stateCapital + d.privateInvest) * K;
  let grossDebt = Math.max(0, grossDebt0 + d.extraCredit * K);
  let netDebt = Math.max(0, netDebt0 + capex - injections - d.extraCredit * K);
  let equity = base.equity + injections;
  const rate = Math.max(0.005, rate0 - d.refiCut / 100);
  const g = (d.ebitdaGrowth + prodGrowth) / 100;

  const path = [{ year: base.startYear, ebitda: ebitda0, netDebt, equity, leverage: ebitda0 > 0 ? netDebt / ebitda0 : null }];
  let cumState = 0, cumPriv = 0;

  for (let t = 1; t <= d.horizon; t++) {
    const ebitda = ebitda0 * Math.pow(1 + g, t) + marginBoost * Math.min(1, t / 2);
    const interest = grossDebt * rate;
    const ffo = ebitda - interest;
    const amort = Math.max(0, ffo * d.amortShare / 100);
    grossDebt = Math.max(0, grossDebt - amort);
    netDebt = Math.max(0, netDebt - amort);
    const netIncome = ebitda - da - interest;
    const priv = d.privateInvest > 0 && netIncome > 0 ? netIncome * d.privateShare / 100 : 0;
    cumPriv += priv; cumState += netIncome - priv;
    equity += netIncome;
    path.push({ year: base.startYear + t, ebitda, netDebt, equity, leverage: ebitda > 0 ? netDebt / ebitda : null });
  }

  const success = path.find((p, i) => i > 0 && p.equity > 0 && p.leverage !== null && p.leverage <= TARGET);
  const start = path[0];
  return {
    path, capex, success, cumState, cumPriv,
    startLeverage: start.leverage, startEbitda: ebitda0, startNetDebt: netDebt0, startEquity: base.equity,
    finalEquity: path[path.length - 1].equity, finalLeverage: path[path.length - 1].leverage,
  };
}

function Game({ rows }: { rows: FinancialRow[] }) {
  const { meta } = useData();
  const last = latest(rows);
  const lq = meta?.latest_quarter;

  const [mode, setMode] = useState<BaselineMode>(lq ? "runrate" : "cierre");
  const [d, setD] = useState<Decisions>({
    ebitdaGrowth: 4, costCut: 1, amortShare: 40, horizon: 7,
    extraCredit: 0, refiCut: 0, stateCapital: 0, privateInvest: 0, privateShare: 30,
    products: new Set(),
  });

  const base = useMemo(() => buildBase(last, lq, mode), [last, lq, mode]);
  const sim = useMemo(() => simulate(base, d), [base, d]);

  const set = (patch: Partial<Decisions>) => setD({ ...d, ...patch });
  const toggleProduct = (id: string) => {
    const next = new Set(d.products);
    next.has(id) ? next.delete(id) : next.add(id);
    set({ products: next });
  };
  const reset = () => setD({
    ebitdaGrowth: 4, costCut: 1, amortShare: 40, horizon: 7,
    extraCredit: 0, refiCut: 0, stateCapital: 0, privateInvest: 0, privateShare: 30, products: new Set(),
  });

  const x = sim.path.map((p) => String(p.year));
  const leverageOpt = {
    ...baseOption(), color: [PALETTE.violet],
    xAxis: { ...baseOption().xAxis, data: x },
    yAxis: { ...baseOption().yAxis, name: "Deuda neta / EBITDA (x)" },
    series: [{
      name: "Apalancamiento", type: "line", smooth: true,
      data: sim.path.map((p) => (p.leverage === null ? null : +p.leverage.toFixed(2))),
      markLine: { silent: true, data: [{ yAxis: TARGET }], lineStyle: { color: PALETTE.green, type: "dashed" }, label: { formatter: `meta ${TARGET}x` } },
    }],
  };
  const equityOpt = {
    ...baseOption(), color: [PALETTE.cyan],
    xAxis: { ...baseOption().xAxis, data: x },
    yAxis: { ...baseOption().yAxis, name: "Patrimonio (US$ M)" },
    series: [{
      name: "Patrimonio", type: "line", smooth: true, areaStyle: { opacity: 0.1 },
      data: sim.path.map((p) => +(p.equity / 1000).toFixed(0)),
      markLine: { silent: true, data: [{ yAxis: 0 }], lineStyle: { color: PALETTE.red, type: "dashed" } },
    }],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">🎮 Juega a ser director — ¿puedes reflotar Petroperú?</h1>
        <p className="text-sm text-slate-500 max-w-3xl">
          Toma decisiones de gerencia y observa si Petroperú vuelve a ser solvente. <strong>Objetivo:</strong> patrimonio
          positivo y deuda neta/EBITDA ≤ {TARGET}x dentro del horizonte. Parte de <strong>cifras reales auditadas</strong>;
          los efectos de cada palanca son ilustrativos (no es una proyección oficial).
        </p>
      </div>

      {/* Punto de partida (escenario) */}
      <ChartCard title="Punto de partida" subtitle="Desde qué realidad arrancas la gestión">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button onClick={() => setMode("cierre")}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${mode === "cierre" ? "border-accent-amber/60 text-accent-amber bg-accent-amber/10" : "border-ink-600 text-slate-400"}`}>
            Cierre {last.year} (modo difícil)
          </button>
          <button onClick={() => setMode("runrate")} disabled={!lq}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${mode === "runrate" ? "border-accent-green/60 text-accent-green bg-accent-green/10" : "border-ink-600 text-slate-400"} ${!lq ? "opacity-40" : ""}`}>
            1T 2026 anualizado (momentum real)
          </button>
          <button onClick={reset} className="text-xs px-3 py-1.5 rounded border border-ink-600 text-slate-500 hover:text-slate-200 ml-auto">
            ↺ Reiniciar decisiones
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="EBITDA de partida" value={usdMillions(sim.startEbitda)} tone={sim.startEbitda >= 0 ? "good" : "bad"} hint={base.label} />
          <KpiCard label="Deuda neta de partida" value={usdMillions(sim.startNetDebt)} tone="warn" />
          <KpiCard label="Apalancamiento inicial" value={sim.startLeverage && sim.startLeverage > 0 ? ratio(sim.startLeverage) : "n/d"} tone={(sim.startLeverage ?? 99) <= TARGET ? "good" : "bad"} hint="Deuda neta / EBITDA al inicio" />
          <KpiCard label="Patrimonio de partida" value={usdMillions(sim.startEquity)} tone={sim.startEquity >= 0 ? "good" : "bad"} />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {mode === "runrate"
            ? "Run-rate: anualiza el 1T 2026 real (EBITDA ×4). Refleja el momentum de la recuperación, pero asume que ese ritmo se sostiene todo el año."
            : `Cierre ${last.year}: EBITDA anual casi nulo → apalancamiento de partida altísimo. El reto está en hacer despegar el EBITDA.`}
        </p>
      </ChartCard>

      {/* Veredicto del juego */}
      <div className={`card ${sim.success ? "border-accent-green/50 bg-accent-green/5" : "border-accent-amber/40 bg-accent-amber/5"}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{sim.success ? "🏆" : "🛠️"}</span>
          <div className="text-sm text-slate-300">
            {sim.success
              ? <><strong className="text-accent-green">¡Reflotada!</strong> Con estas decisiones Petroperú alcanza solvencia hacia <strong>{sim.success.year}</strong> (patrimonio positivo y apalancamiento ≤ {TARGET}x).</>
              : <><strong className="text-accent-amber">Aún no reflota.</strong> Con estas decisiones no se logra patrimonio positivo y ≤ {TARGET}x dentro de {d.horizon} años. Prueba con más EBITDA, nuevos productos, capitalización o inversión privada.</>}
          </div>
        </div>
      </div>

      <div className="card flex items-center justify-between gap-4 flex-wrap">
        <span className="text-sm text-slate-400">¿Lograste reflotarla? Reta a alguien a hacerlo mejor 👇</span>
        <ShareButtons />
      </div>

      {/* Resultados */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Año de reflote" value={sim.success ? String(sim.success.year) : "—"} tone={sim.success ? "good" : "warn"} />
        <KpiCard label="Apalancamiento final" value={sim.finalLeverage && sim.finalLeverage > 0 ? ratio(sim.finalLeverage) : "n/d"} tone={(sim.finalLeverage ?? 99) <= TARGET ? "good" : "bad"} />
        <KpiCard label="Patrimonio final" value={usdMillions(sim.finalEquity)} tone={sim.finalEquity >= 0 ? "good" : "bad"} />
        <KpiCard label="Inversión requerida" value={usdMillions(sim.capex)} hint="Capex de los nuevos productos seleccionados" />
        <KpiCard label="Utilidades a privados" value={usdMillions(sim.cumPriv)} hint="Lo que se cede a la inversión privada (acumulado)" tone="warn" />
      </div>

      {/* Controles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="🏭 Operación" subtitle="Eficiencia y disciplina financiera">
          <div className="grid grid-cols-2 gap-4">
            <Slider label="Crecimiento EBITDA" value={d.ebitdaGrowth} min={-5} max={20} step={1} unit="%" onChange={(v) => set({ ebitdaGrowth: v })} />
            <Slider label="Recorte de costos (margen)" value={d.costCut} min={0} max={8} step={0.5} unit=" pp" onChange={(v) => set({ costCut: v })} />
            <Slider label="% del FFO a amortizar" value={d.amortShare} min={0} max={100} step={5} unit="%" onChange={(v) => set({ amortShare: v })} />
            <Slider label="Horizonte" value={d.horizon} min={3} max={12} step={1} unit=" años" onChange={(v) => set({ horizon: v })} />
          </div>
        </ChartCard>

        <ChartCard title="💰 Financiamiento" subtitle="De dónde sale el dinero (y a qué costo)">
          <div className="grid grid-cols-2 gap-4">
            <Slider label="Tomar más crédito" value={d.extraCredit} min={0} max={3000} step={100} unit=" M$" onChange={(v) => set({ extraCredit: v })} />
            <Slider label="Refinanciar (baja de tasa)" value={d.refiCut} min={0} max={5} step={0.5} unit=" pp" onChange={(v) => set({ refiCut: v })} />
            <Slider label="Capitalización del Estado" value={d.stateCapital} min={0} max={4000} step={100} unit=" M$" onChange={(v) => set({ stateCapital: v })} />
            <Slider label="Inversión privada" value={d.privateInvest} min={0} max={4000} step={100} unit=" M$" onChange={(v) => set({ privateInvest: v })} />
            {d.privateInvest > 0 && (
              <Slider label="% utilidades a privados" value={d.privateShare} min={0} max={60} step={5} unit="%" onChange={(v) => set({ privateShare: v })} />
            )}
          </div>
        </ChartCard>
      </div>

      {/* Nuevos productos */}
      <ChartCard title="🛢️ Nuevos productos / derivados" subtitle="Diversificar la cartera: cada uno suma ingresos y margen pero exige inversión (capex)">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRODUCTS.map((p) => {
            const on = d.products.has(p.id);
            return (
              <button key={p.id} onClick={() => toggleProduct(p.id)}
                className={`text-left text-xs p-3 rounded-lg border transition-colors ${
                  on ? "border-accent-green/60 bg-accent-green/10" : "border-ink-600 bg-ink-800 hover:border-ink-500"
                }`}>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${on ? "text-accent-green" : "text-slate-200"}`}>{p.name}</span>
                  <span>{on ? "✓" : "+"}</span>
                </div>
                <div className="text-slate-500 mt-1">
                  +{p.revUplift}pp crec · +{p.margin}pp margen · capex US$ {p.capex} M
                </div>
              </button>
            );
          })}
        </div>
      </ChartCard>

      {/* Trayectorias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Desapalancamiento" subtitle={`Deuda neta / EBITDA hacia la meta (${TARGET}x)`}>
          <EChart option={leverageOpt} />
        </ChartCard>
        <ChartCard title="Recuperación patrimonial" subtitle="Cuándo el patrimonio vuelve a ser positivo">
          <EChart option={equityOpt} />
        </ChartCard>
      </div>

      <div className="card text-xs text-slate-500">
        ⚠️ Modelo educativo simplificado. Parte de cifras <strong>reales auditadas</strong> (cierre {last.year} o run-rate
        1T 2026), pero los efectos de cada producto/decisión son ilustrativos. Sirve para razonar trade-offs
        (crédito vs. dilución, capex vs. solvencia), no para predecir.
        Utilidades cedidas a privados acumuladas: <span className="text-accent-amber">{usdMillions(sim.cumPriv)}</span> ·
        retenidas por el Estado: <span className="text-accent-green">{usdMillions(sim.cumState)}</span>.
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className="tabular text-base text-accent-amber font-semibold">{value}{unit}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="accent-accent-amber" aria-label={label} />
    </label>
  );
}
