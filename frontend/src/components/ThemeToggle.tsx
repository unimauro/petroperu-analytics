import { useEffect, useState } from "react";
import { getStoredTheme, toggleTheme, type Theme } from "../lib/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => setTheme(getStoredTheme()), []);

  return (
    <button
      onClick={() => setTheme(toggleTheme(theme))}
      className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md border border-ink-600
                 text-slate-400 hover:text-slate-100 hover:border-accent-amber/50 bg-ink-800 transition-colors"
      aria-label={theme === "dark" ? "Cambiar a modo día" : "Cambiar a modo noche"}
      title={theme === "dark" ? "Modo día" : "Modo noche"}
    >
      <span>{theme === "dark" ? "☀" : "☾"}</span>
      <span>{theme === "dark" ? "Día" : "Noche"}</span>
    </button>
  );
}
