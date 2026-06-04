import type { ReactNode } from "react";
import { useData } from "../lib/store";
import ChartCard from "../components/ChartCard";
import EChart from "../components/EChart";
import { baseOption } from "../lib/echart-theme";
import { PALETTE } from "../lib/format";

const MODEL_LABEL: Record<string, string> = {
  prophet: "Prophet (serie temporal aditiva)",
  xgboost: "XGBoost (regresión con rezagos)",
  ols_linear_fallback: "Regresión lineal OLS (fallback sin dependencias)",
};

export default function Methodology() {
  const { forecast } = useData();

  let chart = null;
  if (forecast) {
    const histYears = forecast.history.years.map(String);
    const futYears = forecast.future_years.map(String);
    const x = [...histYears, ...futYears];
    const hist = forecast.history.values.map((v) => +(v / 1000).toFixed(0));
    const pad = new Array(histYears.length).fill(null);
    const fc = [...pad, ...forecast.forecast.map((v) => +(v / 1000).toFixed(0))];
    // conectar el último histórico con el primer pronóstico
    fc[histYears.length - 1] = hist[hist.length - 1];
    const band = [...new Array(histYears.length).fill(null),
      ...forecast.lower.map((lo, i) => [+(lo / 1000).toFixed(0), +(forecast.upper[i] / 1000).toFixed(0)])];

    chart = {
      ...baseOption(),
      color: [PALETTE.slate, PALETTE.amber],
      legend: { ...baseOption().legend, data: ["Histórico", "Pronóstico"] },
      xAxis: { ...baseOption().xAxis, data: x },
      yAxis: { ...baseOption().yAxis, name: "US$ M" },
      series: [
        { name: "Histórico", type: "line", data: hist },
        { name: "Pronóstico", type: "line", lineStyle: { type: "dashed" }, data: fc },
        // banda de confianza dibujada como dos líneas tenues
        { name: "lim", type: "line", data: band.map((b) => (Array.isArray(b) ? b[0] : null)), lineStyle: { opacity: 0.25 }, symbol: "none", silent: true },
        { name: "lim", type: "line", data: band.map((b) => (Array.isArray(b) ? b[1] : null)), lineStyle: { opacity: 0.25 }, symbol: "none", silent: true },
      ],
    };
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Metodología y preguntas frecuentes</h1>
        <p className="text-sm text-slate-500">Cómo se calcula y se proyecta. Transparencia total: nada es una caja negra.</p>
      </div>

      {chart && (
        <ChartCard
          title={`Ejemplo de pronóstico — ${forecast!.metric}`}
          subtitle={`Modelo en uso: ${MODEL_LABEL[forecast!.model] ?? forecast!.model}`}
        >
          <EChart option={chart} height={320} />
          <p className="text-xs text-slate-500 mt-2">
            Generado por <code>analytics/forecasting.py</code>. Sobre datos ilustrativos el resultado es solo demostrativo del método.
          </p>
        </ChartCard>
      )}

      <Faq q="¿Cómo se hace el forecasting?">
        El script <code>analytics/forecasting.py</code> intenta tres modelos en orden de preferencia y usa el primero disponible:
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li><strong>Prophet</strong> — modelo aditivo de series temporales (tendencia + estacionalidad). Da banda de confianza (yhat_lower/upper).</li>
          <li><strong>XGBoost</strong> — regresión de árboles con la serie rezagada (lags) como variables; predice paso a paso.</li>
          <li><strong>OLS lineal</strong> — regresión por mínimos cuadrados, solo con librería estándar. <em>Siempre</em> disponible (es el fallback que corre en GitHub Pages, donde no se instalan librerías científicas).</li>
        </ol>
        El horizonte (años a futuro) es configurable. La banda del OLS se estima con el error estándar residual (±1.96σ).
      </Faq>

      <Faq q="¿Por qué el ejemplo usa el modelo OLS y no Prophet?">
        Porque el sitio se construye en CI sin instalar Prophet/XGBoost (son pesados). El código los usaría
        automáticamente si están presentes; localmente basta <code>pip install prophet xgboost pandas scikit-learn</code>
        y volver a correr el script.
      </Faq>

      <Faq q="¿Qué diferencia hay entre el “Resumen estratégico” y el forecasting?">
        El <strong>forecasting</strong> proyecta una serie a partir de su propio historial (es estadístico).
        El <strong>Resumen estratégico</strong> NO extrapola tendencias: es un <em>modelo de escenarios con supuestos
        explícitos</em> (tú fijas crecimiento de EBITDA y disciplina de amortización) para razonar qué condiciones
        permitirían recuperar la inversión. Son herramientas complementarias y ambas declaran sus límites.
      </Faq>

      <Faq q="¿Los números son oficiales?">
        No todavía. El dataset incluido está marcado como <strong>ilustrativo</strong> (demostración) e imita
        tendencias públicas conocidas, pero no son cifras auditadas. Para análisis real deben reemplazarse por los
        Estados Financieros Auditados / Memorias y marcarse como <code>verified</code>. Ver <code>data/PROVENANCE.md</code>.
        El estado de los datos se muestra siempre en la barra superior.
      </Faq>

      <Faq q="¿De dónde salen los indicadores?">
        Se calculan con <code>analytics/indicators_engine.py</code> a partir de las partidas crudas (estado de
        resultados + balance). Las 16 fórmulas están documentadas y abiertas en <code>analytics/formulas.md</code>.
        El ETL valida además que el balance cuadre (Activo ≈ Pasivo + Patrimonio).
      </Faq>

      <Faq q="¿Qué datos en vivo se usan?">
        El ETL puede consultar la <strong>API del BCRP</strong> para tipo de cambio y precio del crudo (WTI) y
        adjuntarlos como contexto macro. Es opcional y tolerante a fallos: si no hay red, la plataforma funciona igual.
      </Faq>

      <Faq q="¿Cómo reemplazo las cifras por datos reales?">
        Edita <code>data/seed/petroperu_financials_seed.csv</code>, cambia <code>data_status</code> a
        <code> verified</code> en las filas corregidas y corre <code>python etl/etl_pipeline.py</code>. El frontend no
        requiere cambios.
      </Faq>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <section className="card">
      <h3 className="text-sm font-semibold text-accent-cyan mb-1">{q}</h3>
      <div className="text-sm text-slate-300 leading-relaxed">{children}</div>
    </section>
  );
}
