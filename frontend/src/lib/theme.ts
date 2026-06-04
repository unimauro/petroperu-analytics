// Gestión de tema día/noche. Oscuro por defecto (identidad "terminal financiera").
// El modo claro se activa añadiendo la clase `light` al <html> (ver index.css).

export type Theme = "dark" | "light";

const KEY = "ppa-theme";

export function getStoredTheme(): Theme {
  try {
    return (localStorage.getItem(KEY) as Theme) || "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* almacenamiento no disponible: el tema sigue funcionando en memoria */
  }
}

export function toggleTheme(current: Theme): Theme {
  const next: Theme = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
