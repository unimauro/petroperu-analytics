import type { FinancialRow } from "./data";

export const years = (rows: FinancialRow[]) => rows.map((r) => String(r.year));

export const series = (rows: FinancialRow[], key: keyof FinancialRow): (number | null)[] =>
  rows.map((r) => {
    const v = r[key];
    return typeof v === "number" ? v : null;
  });

/** Serie en millones (las partidas crudas están en miles). */
export const seriesM = (rows: FinancialRow[], key: keyof FinancialRow): (number | null)[] =>
  series(rows, key).map((v) => (v === null ? null : Math.round((v / 1000) * 10) / 10));

export const latest = (rows: FinancialRow[]) => rows[rows.length - 1];
export const previous = (rows: FinancialRow[]) => rows[rows.length - 2];

/** Variación interanual de una partida (fracción). */
export function yoy(rows: FinancialRow[], key: keyof FinancialRow): number | null {
  const a = latest(rows)?.[key];
  const b = previous(rows)?.[key];
  if (typeof a !== "number" || typeof b !== "number" || b === 0) return null;
  return (a - b) / Math.abs(b);
}
