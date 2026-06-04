import { NavLink, Outlet } from "react-router-dom";
import { useData } from "../lib/store";
import DataStatusBadge from "./DataStatusBadge";

const NAV = [
  { to: "/", label: "Resumen", icon: "★", end: true },
  { to: "/executive", label: "Ejecutivo", icon: "▣" },
  { to: "/financial", label: "Financiero", icon: "₪" },
  { to: "/investment", label: "Inversión", icon: "◔" },
  { to: "/debt", label: "Deuda", icon: "≣" },
  { to: "/governance", label: "Gobierno", icon: "⌂" },
  { to: "/assistant", label: "Asistente IA", icon: "✦" },
  { to: "/methodology", label: "Metodología", icon: "?" },
];

export default function Layout() {
  const { financials, meta } = useData();
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-ink-800 border-r border-ink-600 flex flex-col">
        <div className="px-4 py-5 border-b border-ink-600">
          <div className="text-lg font-bold text-slate-100 leading-tight">
            Petroperú<span className="text-accent-amber"> Analytics</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {meta ? `${meta.years[0]}–${meta.years[1]}` : "histórico"} · datos públicos
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              <span className="w-4 text-center opacity-70">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-ink-600 text-[11px] text-slate-600 leading-relaxed">
          Macro: {meta?.macro_status ?? "—"} (BCRP)
          <br />
          Plataforma abierta · sin fines de lucro
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 bg-ink-900/80 backdrop-blur border-b border-ink-600
                           flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="text-sm text-slate-400">
            Evolución financiera, operativa y de gobierno corporativo
          </div>
          {financials && <DataStatusBadge statuses={financials.data_status} />}
        </header>
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
