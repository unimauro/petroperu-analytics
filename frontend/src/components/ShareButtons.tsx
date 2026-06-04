import { useState } from "react";

const URL = "https://unimauro.github.io/petroperu-analytics/";
const MSG =
  "Petroperú Analytics: 20 años de finanzas, operaciones y gobierno corporativo de Petroperú en tableros interactivos. Incluye 'Juega a ser director' para intentar reflotar la empresa 👇";

const links = {
  whatsapp: `https://wa.me/?text=${encodeURIComponent(MSG + " " + URL)}`,
  linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(URL)}`,
  x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(MSG)}&url=${encodeURIComponent(URL)}`,
};

/** Botones de difusión en redes. `compact` para la barra lateral. */
export default function ShareButtons({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard no disponible */
    }
  };

  const base = "flex items-center justify-center gap-1.5 rounded-md border transition-colors";
  const size = compact ? "text-xs px-2 py-1.5 flex-1" : "text-sm px-3 py-2";

  return (
    <div className="space-y-2">
      {!compact && <div className="text-xs uppercase tracking-wider text-slate-500">Comparte el dashboard</div>}
      <div className="flex gap-2">
        <a href={links.whatsapp} target="_blank" rel="noopener noreferrer"
           className={`${base} ${size} border-accent-green/50 text-accent-green hover:bg-accent-green/10`} title="Compartir por WhatsApp">
          <span>WhatsApp</span>
        </a>
        <a href={links.linkedin} target="_blank" rel="noopener noreferrer"
           className={`${base} ${size} border-accent-cyan/50 text-accent-cyan hover:bg-accent-cyan/10`} title="Compartir en LinkedIn">
          <span>LinkedIn</span>
        </a>
        <a href={links.x} target="_blank" rel="noopener noreferrer"
           className={`${base} ${size} border-ink-500 text-slate-300 hover:bg-ink-700`} title="Compartir en X">
          <span>X</span>
        </a>
        <button onClick={copy}
           className={`${base} ${size} border-ink-500 text-slate-300 hover:bg-ink-700`} title="Copiar enlace">
          <span>{copied ? "¡Copiado!" : "Copiar"}</span>
        </button>
      </div>
    </div>
  );
}
