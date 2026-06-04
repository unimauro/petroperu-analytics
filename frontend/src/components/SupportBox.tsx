import { useState } from "react";

// Datos de apoyo reutilizados de SalariosPerú (mismo autor).
const BMC = "https://buymeacoffee.com/unimauro";
const YAPE_QR = "https://unimauro.github.io/salariosperu/yape.png";
const WHATSAPP = "https://wa.me/51940584307?text=" +
  encodeURIComponent("Hola, tengo una sugerencia de mejora para el dashboard Petroperú Analytics: ");

/** Bloque de apoyo (café + Yape) y sugerencia de mejora por WhatsApp. */
export default function SupportBox() {
  const [yapeOpen, setYapeOpen] = useState(false);
  return (
    <div className="space-y-2">
      <a
        href={BMC}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 text-xs font-medium px-2.5 py-1.5 rounded-md
                   bg-accent-amber/90 text-ink-900 hover:bg-accent-amber transition-colors"
      >
        ☕ Invítame un café
      </a>

      <button
        onClick={() => setYapeOpen(true)}
        className="w-full flex items-center justify-center gap-2 text-xs px-2.5 py-1.5 rounded-md
                   border border-accent-violet/50 text-accent-violet hover:bg-accent-violet/10 transition-colors"
      >
        💜 Yápeame
      </button>

      <a
        href={WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 text-xs px-2.5 py-1.5 rounded-md
                   border border-accent-green/50 text-accent-green hover:bg-accent-green/10 transition-colors"
      >
        💬 Sugerir una mejora
      </a>

      {yapeOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setYapeOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="card max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-slate-100 mb-2">Yápeame 💜</h3>
            <img src={YAPE_QR} alt="Código QR de Yape" className="w-56 h-56 mx-auto rounded-lg bg-white p-2" />
            <p className="text-xs text-slate-500 mt-3">Escanea el QR con tu app Yape. ¡Gracias por el apoyo!</p>
            <button
              onClick={() => setYapeOpen(false)}
              className="mt-3 text-xs px-3 py-1.5 rounded-md border border-ink-600 text-slate-300 hover:text-slate-100"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
