import { useState } from "react";
import { useData } from "../lib/store";
import PageState from "../components/PageState";
import { ask, SUGGESTION_GROUPS, type Answer } from "../lib/assistant";
import type { FinancialRow } from "../lib/data";

interface Msg { role: "user" | "bot"; text: string }

export default function Assistant() {
  const { financials } = useData();
  return <PageState>{financials && <Chat rows={financials.rows} />}</PageState>;
}

function renderMd(text: string) {
  return text.split("\n").map((line, i) => (
    <p key={i} className="leading-relaxed"
       dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
  ));
}

function Chat({ rows }: { rows: FinancialRow[] }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Soy el analista de Petroperú Analytics. Razono **solo sobre los indicadores calculados** — no invento cifras. Elige una pregunta de abajo 👇" },
  ]);

  function send(question: string) {
    const a: Answer = ask(rows, question);
    setMsgs((m) => [...m, { role: "user", text: question }, { role: "bot", text: a.text }]);
    // desplaza al final tras renderizar
    setTimeout(() => {
      const el = document.getElementById("chat-log");
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Asistente financiero</h1>
        <p className="text-sm text-slate-500">
          Respuestas guiadas por botones (sin texto libre): cada respuesta es citable y se apoya en los datos del motor.
        </p>
      </div>

      <div id="chat-log" className="card h-[360px] overflow-y-auto flex flex-col gap-3">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[88%] text-sm px-3 py-2 rounded-lg ${
            m.role === "user"
              ? "self-end bg-accent-cyan/15 text-slate-100"
              : "self-start bg-ink-700 text-slate-300"
          }`}>
            {renderMd(m.text)}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {SUGGESTION_GROUPS.map((g) => (
          <div key={g.group}>
            <div className="text-xs uppercase tracking-wider text-slate-500 mb-1.5">{g.group}</div>
            <div className="flex flex-wrap gap-2">
              {g.items.map((s) => (
                <button key={s} onClick={() => send(s)} className="btn-chip">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600">
        ¿Echas de menos una pregunta? Sugiérela por WhatsApp con el botón <em>"Sugerir una mejora"</em> de la barra lateral.
      </p>
    </div>
  );
}
