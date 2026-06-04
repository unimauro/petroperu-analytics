import type { ReactNode } from "react";
import { useData } from "../lib/store";

/** Renderiza children solo cuando los datos cargaron; si no, muestra estado. */
export default function PageState({ children }: { children: ReactNode }) {
  const { loading, error, financials } = useData();
  if (loading) return <p className="text-slate-500 text-sm">Cargando datos…</p>;
  if (error) return <p className="text-accent-red text-sm">Error al cargar datos: {error}</p>;
  if (!financials) return <p className="text-slate-500 text-sm">Sin datos.</p>;
  return <>{children}</>;
}
