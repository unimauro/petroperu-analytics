// Analista financiero determinista (offline). Razona sobre los indicadores ya
// calculados — NO inventa cifras. Pensado para GitHub Pages sin backend.
// Para respuestas en lenguaje natural más ricas, puede enchufarse un LLM
// (ver askLLM más abajo), pero el modo por defecto es 100% local y citable.

import type { FinancialRow } from "./data";
import { usdMillions, pct, ratio } from "./format";

const GLOSSARY: Record<string, { name: string; formula: string; reading: string }> = {
  ebitda: { name: "EBITDA", formula: "EBIT + Depreciación y amortización", reading: "Caja operativa antes de financiamiento, impuestos y D&A. Útil para comparar capacidad operativa entre años." },
  ebit: { name: "EBIT", formula: "Ingresos − COGS − OPEX − D&A", reading: "Resultado operativo: lo que genera el negocio antes de intereses e impuestos." },
  roa: { name: "ROA", formula: "Utilidad neta / Activo total", reading: "Eficiencia con que el activo genera resultado. Bajo o negativo = activos poco rentables." },
  roe: { name: "ROE", formula: "Utilidad neta / Patrimonio", reading: "Retorno para el accionista (el Estado). Con patrimonio negativo pierde sentido económico." },
  "liquidez": { name: "Liquidez corriente", formula: "Activo corriente / Pasivo corriente", reading: "Capacidad de cubrir obligaciones de corto plazo. <1.0x = tensión de liquidez." },
  "acida": { name: "Prueba ácida", formula: "(Activo corriente − Inventario) / Pasivo corriente", reading: "Liquidez sin depender de vender inventarios." },
  "endeudamiento": { name: "Razón de endeudamiento", formula: "Pasivo total / Activo total", reading: "Qué parte del activo está financiada con deuda/pasivos." },
  "deuda": { name: "Deuda/Patrimonio (D/E)", formula: "Pasivo total / Patrimonio", reading: "Apalancamiento. Muy alto o negativo señala fragilidad financiera." },
  "capital de trabajo": { name: "Capital de trabajo", formula: "Activo corriente − Pasivo corriente", reading: "Colchón operativo de corto plazo; negativo = posible estrés." },
  "cobertura": { name: "Cobertura de intereses", formula: "EBIT / Gasto financiero", reading: "Cuántas veces el resultado operativo cubre los intereses. <1.0x = no alcanza." },
};

export interface Answer {
  text: string;
  cites?: number[]; // años citados
}

function findYear(q: string): number | null {
  const m = q.match(/(19|20)\d{2}/);
  return m ? parseInt(m[0], 10) : null;
}

function summarizeYear(rows: FinancialRow[], year: number): Answer {
  const r = rows.find((x) => x.year === year);
  if (!r) return { text: `No tengo el ejercicio ${year} en el dataset (${rows[0].year}–${rows.at(-1)!.year}).` };
  const lines = [
    `**Ejercicio ${r.year}** (${r.data_status === "illustrative" ? "cifras ilustrativas" : "verificadas"}):`,
    `• Ingresos: ${usdMillions(r.revenue)} · EBITDA: ${usdMillions(r.ebitda)} · Resultado neto: ${usdMillions(r.net_income)}`,
    `• Margen neto: ${pct(r.net_margin)} · ROA: ${pct(r.roa)} · ROE: ${pct(r.roe)}`,
    `• Liquidez corriente: ${ratio(r.current_ratio)} · Deuda/Patrimonio: ${ratio(r.debt_to_equity)} · Cobertura intereses: ${ratio(r.interest_coverage)}`,
  ];
  if (r.flag_negative_equity) lines.push(`⚠ Patrimonio negativo (${usdMillions(r.equity)}): solvencia comprometida.`);
  if ((r.interest_coverage ?? 99) < 1) lines.push(`⚠ La cobertura de intereses < 1.0x: el resultado operativo no cubre el costo de la deuda.`);
  return { text: lines.join("\n"), cites: [year] };
}

function anomalies(rows: FinancialRow[]): Answer {
  const worst = [...rows].sort((a, b) => a.net_income - b.net_income).slice(0, 3);
  const negEq = rows.filter((r) => r.flag_negative_equity).map((r) => r.year);
  const lowCov = rows.filter((r) => (r.interest_coverage ?? 99) < 1).map((r) => r.year);
  const lines = [
    "**Anomalías y señales de alerta detectadas:**",
    `• Peores resultados netos: ${worst.map((r) => `${r.year} (${usdMillions(r.net_income)})`).join(", ")}.`,
  ];
  if (negEq.length) lines.push(`• Patrimonio negativo en: ${negEq.join(", ")}.`);
  if (lowCov.length) lines.push(`• Cobertura de intereses < 1.0x en: ${lowCov.join(", ")}.`);
  lines.push("Nota: detección por reglas sobre los indicadores; no sustituye análisis estadístico (ver notebooks).");
  return { text: lines.join("\n"), cites: [...new Set([...worst.map((r) => r.year), ...negEq, ...lowCov])] };
}

function trend(rows: FinancialRow[], key: keyof FinancialRow, label: string): Answer {
  const first = rows[0], last = rows.at(-1)!;
  const a = first[key] as number, b = last[key] as number;
  const chg = a !== 0 ? ((b - a) / Math.abs(a)) * 100 : 0;
  return {
    text: `**${label}** pasó de ${usdMillions(a)} en ${first.year} a ${usdMillions(b)} en ${last.year} ` +
          `(${chg >= 0 ? "+" : ""}${chg.toFixed(0)}% en el periodo).`,
    cites: [first.year, last.year],
  };
}

/** Punto de entrada determinista. Devuelve una respuesta citable sin red. */
export function ask(rows: FinancialRow[], question: string): Answer {
  const q = question.toLowerCase().trim();

  // 1) Glosario de ratios
  for (const [kw, def] of Object.entries(GLOSSARY)) {
    if ((q.includes("qué es") || q.includes("explica") || q.includes("explícame") || q.includes("define")) && q.includes(kw)) {
      return { text: `**${def.name}** = ${def.formula}.\n${def.reading}` };
    }
  }

  // 2) Resumen de un año
  const year = findYear(q);
  if (year && (q.includes("resum") || q.includes("cómo") || q.includes("qué pasó") || q.includes("año") || q.includes("ejercicio") || q.length < 12)) {
    return summarizeYear(rows, year);
  }

  // 3) Anomalías
  if (q.includes("anomal") || q.includes("alerta") || q.includes("riesgo") || q.includes("peor")) {
    return anomalies(rows);
  }

  // 4) Tendencias
  if (q.includes("ingreso") || q.includes("ventas")) return trend(rows, "revenue", "Los ingresos");
  if (q.includes("deuda")) return trend(rows, "total_debt", "La deuda total");
  if (q.includes("activo")) return trend(rows, "total_assets", "El activo total");
  if (q.includes("patrimonio")) return trend(rows, "equity", "El patrimonio");
  if (q.includes("ebitda")) return trend(rows, "ebitda", "El EBITDA");

  // 5) Por defecto: resumen del último ejercicio
  return summarizeYear(rows, rows.at(-1)!.year);
}

export const SUGGESTIONS = [
  "Explica el ROE",
  "Resumen del 2022",
  "¿Qué anomalías hay?",
  "Tendencia de la deuda",
  "¿Qué es la cobertura de intereses?",
  "Resumen del 2020",
];
