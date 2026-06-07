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
  const hasIllustrative = statuses.includes("illustrative");
  const hasVerified = statuses.includes("verified");
  const mixed = hasIllustrative && hasVerified;

  const label = mixed
    ? "◑ Datos mixtos: 2023–2025 reales ⓘ"
    : hasIllustrative
      ? "⚠ Datos ilustrativos (demo) ⓘ"
      : "✓ Datos verificados ⓘ";
  const cls = hasVerified && !hasIllustrative
    ? "border-accent-green/40 text-accent-green bg-accent-green/10 hover:bg-accent-green/20"
    : mixed
      ? "border-accent-cyan/40 text-accent-cyan bg-accent-cyan/10 hover:bg-accent-cyan/20"
      : "border-accent-amber/40 text-accent-amber bg-accent-amber/10 hover:bg-accent-amber/20";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`text-xs px-2.5 py-1 rounded border transition-colors ${cls}`}
        title="Clic para entender el estado de los datos y cómo leer los gráficos"
      >
        {label}
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
              <strong className="text-accent-cyan">◑ Datos mixtos.</strong> Los ejercicios{" "}
              <strong className="text-accent-green">2023, 2024 y 2025 son REALES</strong>, tomados de los
              Estados Financieros auditados de Petroperú (publicados en su web de inversionistas y la SMV).
              Además, el <strong>1T 2026</strong> se muestra en el Resumen con cifras oficiales.
            </p>
            <p>
              Los años <strong className="text-accent-amber">2005–2022</strong> siguen siendo{" "}
              <strong>ilustrativos</strong> (demostración): imitan tendencias conocidas pero no son cifras
              oficiales. Por eso verás un salto entre 2022 y 2023 (de demo a real). El detalle de fuentes y
              URLs está en la pestaña <em>Metodología</em>.
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
