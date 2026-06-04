import { useMemo, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type { ElementDefinition, Core } from "cytoscape";
import { useData } from "../lib/store";
import PageState from "../components/PageState";
import ChartCard from "../components/ChartCard";
import { PALETTE } from "../lib/format";
import type { GraphData, GovRow } from "../lib/data";

const NODE_COLOR: Record<string, string> = {
  PresidentePeru: PALETTE.amber,
  Ministro: PALETTE.violet,
  Directorio: PALETTE.cyan,
  Gerente: PALETTE.green,
  Empresa: PALETTE.red,
  Persona: PALETTE.slate,
};
const EDGE_COLOR: Record<string, string> = {
  APPOINTED: PALETTE.amber, REPORTED_TO: PALETTE.cyan, MANAGED: PALETTE.green, REPLACED: PALETTE.slate,
};
const TYPES = ["PresidentePeru", "Ministro", "Directorio", "Gerente", "Empresa"];
const LAYOUTS = [
  { id: "cose", label: "Orgánico" },
  { id: "breadthfirst", label: "Jerárquico" },
  { id: "concentric", label: "Concéntrico" },
  { id: "circle", label: "Circular" },
];

export default function Governance() {
  const { financials } = useData();
  return <PageState>{financials && <Content />}</PageState>;
}

function Content() {
  const { graph, governance } = useData();
  const [visible, setVisible] = useState<Set<string>>(new Set(TYPES));
  const [layout, setLayout] = useState("cose");
  const [selected, setSelected] = useState<string | null>(null);

  const allElements = useMemo(() => toElements(graph!), [graph]);
  const elements = useMemo(
    () => filterElements(allElements, visible),
    [allElements, visible]
  );
  // Remonta el grafo (re-ejecuta layout) cuando cambian filtros o layout.
  const key = `${[...visible].sort().join(",")}|${layout}`;

  const toggle = (t: string) => {
    const next = new Set(visible);
    next.has(t) ? next.delete(t) : next.add(t);
    setVisible(next);
  };
  const preset = (types: string[]) => setVisible(new Set(types));

  const stylesheet: any[] = [
    {
      selector: "node",
      style: {
        label: "data(label)", color: "#94a3b8", "font-size": 9,
        "font-family": "IBM Plex Mono, monospace", "text-valign": "bottom", "text-margin-y": 4,
        width: 26, height: 26, "background-color": "data(color)", "border-width": 1, "border-color": "#0a0e14",
      },
    },
    { selector: "node.sel", style: { "border-width": 3, "border-color": "#fff", width: 34, height: 34 } },
    { selector: ".faded", style: { opacity: 0.12 } },
    {
      selector: "edge",
      style: {
        width: 1.4, "line-color": "data(color)", "target-arrow-color": "data(color)",
        "target-arrow-shape": "triangle", "curve-style": "bezier", "arrow-scale": 0.8, opacity: 0.75,
        label: "data(type)", "font-size": 7, color: "#64748b", "text-rotation": "autorotate",
      },
    },
  ];

  const onCy = (cy: Core) => {
    cy.off("tap");
    cy.on("tap", "node", (e) => {
      const node = e.target;
      setSelected(node.id());
      cy.elements().addClass("faded");
      node.removeClass("faded");
      node.neighborhood().removeClass("faded");
      cy.nodes().removeClass("sel");
      node.addClass("sel");
    });
    cy.on("tap", (e) => {
      if (e.target === cy) { cy.elements().removeClass("faded"); cy.nodes().removeClass("sel"); setSelected(null); }
    });
  };

  const sel = selected ? graph!.nodes.find((n) => n.id === selected) : null;
  const selConns = selected
    ? graph!.edges.filter((e) => e.source === selected || e.target === selected)
        .map((e) => (e.source === selected ? `→ ${e.type} → ${e.target}` : `← ${e.type} ← ${e.source}`))
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-100">Gobierno corporativo</h1>
      <p className="text-sm text-slate-500 max-w-3xl">
        Grafo interactivo de actores y relaciones (APPOINTED, REPORTED_TO, MANAGED, REPLACED). Filtra por tipo,
        cambia el layout y <strong>haz clic en un nodo</strong> para ver su detalle y resaltar su red. Mismo modelo
        en Neo4j (<code>graph/model.cypher</code>).
      </p>

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 mr-1">Ver:</span>
        {TYPES.map((t) => (
          <button key={t} onClick={() => toggle(t)}
            className={`text-xs px-2 py-1 rounded border transition-colors flex items-center gap-1.5 ${
              visible.has(t) ? "border-ink-500 text-slate-200 bg-ink-700" : "border-ink-600 text-slate-600"
            }`}>
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: NODE_COLOR[t], opacity: visible.has(t) ? 1 : 0.3 }} />
            {t}
          </button>
        ))}
        <span className="mx-1 text-ink-500">|</span>
        <button onClick={() => preset(TYPES)} className="btn-chip">Todo</button>
        <button onClick={() => preset(["Directorio", "Gerente", "Empresa"])} className="btn-chip">Directorio y gerencia</button>
        <button onClick={() => preset(["PresidentePeru", "Ministro"])} className="btn-chip">Cadena política</button>
        <span className="mx-1 text-ink-500">|</span>
        <span className="text-xs text-slate-500">Layout:</span>
        {LAYOUTS.map((l) => (
          <button key={l.id} onClick={() => setLayout(l.id)}
            className={`text-xs px-2 py-1 rounded border ${layout === l.id ? "border-accent-cyan/60 text-accent-cyan" : "border-ink-600 text-slate-500"}`}>
            {l.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Red de gobierno" subtitle="Clic en un nodo · arrastra · zoom con rueda" className="lg:col-span-2">
          <div className="h-[460px] rounded bg-ink-900 border border-ink-700">
            <CytoscapeComponent
              key={key}
              elements={elements}
              stylesheet={stylesheet}
              layout={{ name: layout, animate: false, padding: 30, nodeRepulsion: () => 12000, spacingFactor: 1.3 } as any}
              style={{ width: "100%", height: "100%" }}
              cy={onCy}
            />
          </div>
        </ChartCard>

        {/* Panel de detalle */}
        <ChartCard title="Detalle" subtitle={sel ? "Nodo seleccionado" : "Selecciona un nodo"}>
          {!sel && <p className="text-sm text-slate-500">Haz clic en cualquier nodo del grafo para ver su cargo, fechas y relaciones.</p>}
          {sel && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: NODE_COLOR[sel.label] ?? PALETTE.slate }} />
                <span className="font-semibold text-slate-100">{sel.id}</span>
              </div>
              <Row k="Tipo" v={sel.label} />
              <Row k="Cargo" v={String(sel.props.role ?? "—")} />
              <Row k="Organización" v={String(sel.props.organization ?? "—")} />
              <Row k="Desde" v={String(sel.props.start_date ?? "—")} />
              <Row k="Hasta" v={String(sel.props.end_date ?? "actualidad")} />
              <Row k="Estado dato" v={String(sel.props.data_status ?? "—")} />
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 mt-2 mb-1">Relaciones ({selConns.length})</div>
                <ul className="text-xs text-slate-400 space-y-0.5 max-h-40 overflow-y-auto">
                  {selConns.map((c, i) => <li key={i} className="tabular">{c}</li>)}
                </ul>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Línea de tiempo de cargos" subtitle="Cargos del Estado verificados · directorio/gerencia ilustrativos">
        <div className="overflow-x-auto">
          <table className="w-full text-xs tabular">
            <thead>
              <tr className="text-slate-500 border-b border-ink-600">
                <th className="text-left py-2 pr-3">Tipo</th><th className="text-left px-3">Persona / cargo</th>
                <th className="text-left px-3">Organización</th><th className="text-left px-3">Desde</th>
                <th className="text-left px-3">Hasta</th><th className="text-left px-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {governance.map((g: GovRow, i) => (
                <tr key={i} className="border-b border-ink-700/50 hover:bg-ink-700/40 text-slate-400">
                  <td className="py-1.5 pr-3 whitespace-nowrap">{g.entity_type}</td>
                  <td className="px-3 text-slate-200">{g.person}</td>
                  <td className="px-3">{g.organization}</td>
                  <td className="px-3 whitespace-nowrap">{g.start_date || "—"}</td>
                  <td className="px-3 whitespace-nowrap">{g.end_date || "actualidad"}</td>
                  <td className="px-3"><span className={g.data_status === "verified" ? "text-accent-green" : "text-accent-amber"}>{g.data_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-ink-700/40 py-1">
      <span className="text-slate-500">{k}</span>
      <span className="text-slate-200 text-right">{v}</span>
    </div>
  );
}

function toElements(graph: GraphData): ElementDefinition[] {
  const nodes: ElementDefinition[] = graph.nodes.map((n) => ({
    data: { id: n.id, label: n.id, type: n.label, color: NODE_COLOR[n.label] ?? PALETTE.slate },
  }));
  const ids = new Set(graph.nodes.map((n) => n.id));
  const edges: ElementDefinition[] = graph.edges
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e, i) => ({ data: { id: `e${i}`, source: e.source, target: e.target, type: e.type, color: EDGE_COLOR[e.type] ?? PALETTE.slate } }));
  return [...nodes, ...edges];
}

function filterElements(els: ElementDefinition[], visible: Set<string>): ElementDefinition[] {
  const d = (e: ElementDefinition) => e.data as any;
  const nodes = els.filter((e) => !d(e).source && (visible.has(String(d(e).type)) || d(e).type === "Persona"));
  const ids = new Set(nodes.map((n) => d(n).id));
  const edges = els.filter((e) => d(e).source && ids.has(String(d(e).source)) && ids.has(String(d(e).target)));
  return [...nodes, ...edges];
}
