// Capa de acceso a datos: carga los JSON estáticos generados por el ETL.

export interface FinancialRow {
  year: number;
  data_status: string;
  // Partidas crudas (USD miles)
  revenue: number;
  cogs: number;
  opex: number;
  depreciation_amortization: number;
  interest_expense: number;
  income_tax: number;
  net_income: number;
  cash: number;
  accounts_receivable: number;
  inventory: number;
  current_assets: number;
  total_assets: number;
  current_liabilities: number;
  short_term_debt: number;
  long_term_debt: number;
  total_liabilities: number;
  equity: number;
  // Macro (BCRP, puede ser null)
  fx_sol_usd: number | null;
  wti_usd_bbl: number | null;
  // Indicadores calculados por el motor
  gross_profit: number;
  ebit: number;
  ebitda: number;
  ebitda_margin: number | null;
  net_margin: number | null;
  total_debt: number;
  working_capital: number;
  roa: number | null;
  roe: number | null;
  current_ratio: number | null;
  acid_test: number | null;
  debt_ratio: number | null;
  debt_to_equity: number | null;
  net_debt_to_ebitda: number | null;
  interest_coverage: number | null;
  operating_cash_flow_proxy: number;
  balance_ok: boolean;
  flag_negative_equity: boolean;
}

export interface Financials {
  entity: string;
  currency: string;
  unit: string;
  data_status: string[];
  rows: FinancialRow[];
}

export interface GovRow {
  entity_type: string;
  person: string;
  role: string;
  organization: string;
  start_date: string;
  end_date: string;
  appointed_by: string;
  data_status: string;
}

export interface GraphData {
  nodes: { id: string; label: string; props: Record<string, unknown> }[];
  edges: { source: string; target: string; type: string }[];
}

export interface Meta {
  generated_by: string;
  macro_status: string;
  years: [number, number];
  n_indicators: number;
  disclaimer: string;
}

const base = import.meta.env.BASE_URL; // respeta el subpath de GitHub Pages

async function getJSON<T>(name: string): Promise<T> {
  const res = await fetch(`${base}data/${name}`);
  if (!res.ok) throw new Error(`No se pudo cargar ${name}: ${res.status}`);
  return res.json() as Promise<T>;
}

export const loadFinancials = () => getJSON<Financials>("financials.json");
export const loadGovernance = () => getJSON<{ rows: GovRow[] }>("governance.json");
export const loadGraph = () => getJSON<GraphData>("graph.json");
export const loadMeta = () => getJSON<Meta>("meta.json");
