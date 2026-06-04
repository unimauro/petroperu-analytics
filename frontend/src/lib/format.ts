// Utilidades de formato numérico (es-PE) y paleta para gráficos.

export const PALETTE = {
  amber: "#f5a623",
  cyan: "#22d3ee",
  green: "#22c55e",
  red: "#ef4444",
  violet: "#a78bfa",
  slate: "#94a3b8",
};

const nf = (opts: Intl.NumberFormatOptions) => new Intl.NumberFormat("es-PE", opts);

/** USD miles -> millones con sufijo. Ej: 5040000 (miles) = US$ 5,040 M */
export function usdMillions(thousands: number | null | undefined): string {
  if (thousands === null || thousands === undefined) return "—";
  const millions = thousands / 1000;
  return `US$ ${nf({ maximumFractionDigits: 0 }).format(millions)} M`;
}

export function compact(thousands: number | null | undefined): string {
  if (thousands === null || thousands === undefined) return "—";
  return nf({ maximumFractionDigits: 0 }).format(thousands / 1000);
}

export function pct(ratio: number | null | undefined, digits = 1): string {
  if (ratio === null || ratio === undefined) return "—";
  return `${nf({ maximumFractionDigits: digits, minimumFractionDigits: digits }).format(ratio * 100)}%`;
}

export function ratio(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return "—";
  return `${nf({ maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)}x`;
}

export function num(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return "—";
  return nf({ maximumFractionDigits: digits }).format(value);
}

/** Color según signo (verde positivo / rojo negativo) para deltas. */
export function signColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return PALETTE.slate;
  return value >= 0 ? PALETTE.green : PALETTE.red;
}
