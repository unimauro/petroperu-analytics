import { NavLink, Outlet } from "react-router-dom";
import { useData } from "../lib/store";
import DataStatusBadge from "./DataStatusBadge";
import ThemeToggle from "./ThemeToggle";
import SupportBox from "./SupportBox";
import ShareButtons from "./ShareButtons";

const NAV = [
  { to: "/", label: "Resumen", icon: "★", end: true },
  { to: "/executive", label: "Ejecutivo", icon: "▣" },
  { to: "/financial", label: "Financiero", icon: "₪" },
  { to: "/investment", label: "Inversión", icon: "◔" },
  { to: "/debt", label: "Deuda", icon: "≣" },
  { to: "/governance", label: "Gobierno", icon: "⌂" },
  { to: "/assistant", label: "Asistente", icon: "✦" },
  { to: "/methodology", label: "Metodología", icon: "?" },
  { to: "/decisions", label: "🎮 Juega a ser director", icon: "" },
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
        <div className="p-3 border-t border-ink-600 space-y-3">
          <ShareButtons compact />
          <div className="text-[11px] text-slate-600 leading-relaxed">
            Macro: {meta?.macro_status ?? "—"} (BCRP) · sin fines de lucro
            <br />
            Hecho por{" "}
            <a href="https://github.com/unimauro" target="_blank" rel="noopener noreferrer"
               className="text-slate-500 hover:text-accent-amber">Carlos Cárdenas Fernández</a>{" "}
            <span className="text-slate-700">·</span>{" "}
            <a href="https://github.com/unimauro" target="_blank" rel="noopener noreferrer"
               className="text-slate-500 hover:text-accent-amber">@unimauro</a>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 bg-ink-900/80 backdrop-blur border-b border-ink-600
                           flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="text-sm text-slate-400 truncate hidden md:block">
            Evolución financiera, operativa y de gobierno corporativo
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SupportBox compact />
            <span className="w-px h-6 bg-ink-600" />
            <ThemeToggle />
            {financials && <DataStatusBadge statuses={financials.data_status} />}
          </div>
        </header>
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
