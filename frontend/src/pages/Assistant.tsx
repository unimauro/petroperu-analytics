import { useState } from "react";
import { useData } from "../lib/store";
import PageState from "../components/PageState";
import { ask, SUGGESTIONS, type Answer } from "../lib/assistant";
import type { FinancialRow } from "../lib/data";

interface Msg { role: "user" | "bot"; text: string }

export default function Assistant() {
  const { financials } = useData();
  return <PageState>{financials && <Chat rows={financials.rows} />}</PageState>;
}

function renderMd(text: string) {
  // Render mínimo: **negritas** y saltos de línea.
  return text.split("\n").map((line, i) => (
    <p key={i} className="leading-relaxed"
       dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
  ));
}

function Chat({ rows }: { rows: FinancialRow[] }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Soy el analista financiero de Petroperú Analytics. Razono **solo sobre los indicadores calculados** — no invento cifras. Pregúntame por un ratio, un año o por anomalías." },
  ]);
  const [input, setInput] = useState("");

  function send(q: string) {
    const question = q.trim();
    if (!question) return;
    const a: Answer = ask(rows, question);
    setMsgs((m) => [...m, { role: "user", text: question }, { role: "bot", text: a.text }]);
    setInput("");
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Asistente financiero</h1>
        <p className="text-sm text-slate-500">
          Motor determinista offline (sin API). Conectable a un LLM vía <code>askLLM</code> para lenguaje natural.
        </p>
      </div>

      <div className="card h-[420px] overflow-y-auto flex flex-col gap-3">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] text-sm px-3 py-2 rounded-lg ${
            m.role === "user"
              ? "self-end bg-accent-cyan/15 text-slate-100"
              : "self-start bg-ink-700 text-slate-300"
          }`}>
            {renderMd(m.text)}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => send(s)}
            className="text-xs px-2.5 py-1 rounded border border-ink-600 text-slate-400 hover:text-slate-100 hover:border-accent-cyan/50 transition-colors">
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: explica el EBITDA, resumen del 2023, anomalías…"
          className="flex-1 bg-ink-800 border border-ink-600 rounded-md px-3 py-2 text-sm
                     text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-accent-cyan/60"
          aria-label="Pregunta al asistente"
        />
        <button type="submit" className="px-4 py-2 rounded-md bg-accent-cyan/20 text-accent-cyan
                     border border-accent-cyan/40 text-sm hover:bg-accent-cyan/30 transition-colors">
          Enviar
        </button>
      </form>
    </div>
  );
}
