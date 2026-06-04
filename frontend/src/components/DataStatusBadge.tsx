import { useState } from "react";

interface Props {
  statuses: string[];
}

/**
 * Aviso de procedencia/estado de datos (anti-overclaiming).
 * Ahora es clickeable: abre una explicación de qué significa y cómo interpretar los gráficos.
 */
export default function DataStatusBadge({ statuses }: Props) {
  const [open, setOpen] = useState(false);
  const illustrative = statuses.includes("illustrative");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`text-xs px-2.5 py-1 rounded border transition-colors ${
          illustrative
            ? "border-accent-amber/40 text-accent-amber bg-accent-amber/10 hover:bg-accent-amber/20"
            : "border-accent-green/40 text-accent-green bg-accent-green/10 hover:bg-accent-green/20"
        }`}
        title="Clic para entender el estado de los datos y cómo leer los gráficos"
      >
        {illustrative ? "⚠ Datos ilustrativos (demo) ⓘ" : "✓ Datos verificados ⓘ"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="card max-w-lg max-h-[85vh] overflow-y-auto text-sm text-slate-300 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-100">¿Qué significan los datos?</h3>

            <p>
              <strong className="text-accent-amber">⚠ Datos ilustrativos (demo):</strong> las cifras
              financieras de este dashboard son de <strong>demostración</strong>. Imitan las tendencias
              públicas conocidas de Petroperú (caída por la pandemia en 2020, pérdidas de 2022, capex de
              Talara), pero <strong>no son cifras oficiales</strong> ni deben citarse como tales.
            </p>
            <p>
              Para análisis real, se reemplazan por los <strong>Estados Financieros Auditados</strong> y las
              Memorias, marcándolas como <span className="text-accent-green">✓ verificadas</span>. Mientras
              tanto, este aviso permanece visible. Detalle de fuentes en la pestaña <em>Metodología</em>.
            </p>

            <hr className="border-ink-600" />
            <h4 className="text-sm font-semibold text-slate-100">Cómo interpretar los gráficos</h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong className="text-slate-200">Ingresos vs. resultado neto:</strong> barras = facturación; línea = ganancia/pérdida final. Línea bajo cero = pérdida.</li>
              <li><strong className="text-slate-200">EBITDA:</strong> caja operativa antes de intereses, impuestos y depreciación. Aproxima cuánto genera el negocio "puro".</li>
              <li><strong className="text-slate-200">Liquidez/cobertura &lt; 1.0x:</strong> señal de estrés — no alcanza para cubrir obligaciones de corto plazo o los intereses.</li>
              <li><strong className="text-slate-200">Patrimonio negativo:</strong> los pasivos superan a los activos; ratios como ROE y Deuda/Patrimonio pierden sentido económico (se marcan con ⚠).</li>
              <li><strong className="text-slate-200">Deuda neta / EBITDA:</strong> cuántos años de EBITDA harían falta para pagar la deuda; más alto = más riesgo.</li>
            </ul>

            <button
              onClick={() => setOpen(false)}
              className="mt-2 text-xs px-3 py-1.5 rounded-md border border-ink-600 text-slate-300 hover:text-slate-100"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
