import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  loadFinancials, loadGovernance, loadGraph, loadMeta, loadForecast,
  type Financials, type GovRow, type GraphData, type Meta, type Forecast,
} from "./data";

interface Store {
  financials: Financials | null;
  governance: GovRow[];
  graph: GraphData | null;
  meta: Meta | null;
  forecast: Forecast | null;
  loading: boolean;
  error: string | null;
}

const Ctx = createContext<Store | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Store>({
    financials: null, governance: [], graph: null, meta: null, forecast: null, loading: true, error: null,
  });

  useEffect(() => {
    Promise.all([loadFinancials(), loadGovernance(), loadGraph(), loadMeta(), loadForecast()])
      .then(([financials, gov, graph, meta, forecast]) =>
        setState({ financials, governance: gov.rows, graph, meta, forecast, loading: false, error: null }))
      .catch((e: Error) =>
        setState((s) => ({ ...s, loading: false, error: e.message })));
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useData(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}
