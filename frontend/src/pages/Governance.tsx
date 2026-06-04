import { useMemo } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type { ElementDefinition } from "cytoscape";
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
  APPOINTED: PALETTE.amber,
  REPORTED_TO: PALETTE.cyan,
  MANAGED: PALETTE.green,
  REPLACED: PALETTE.slate,
};

export default function Governance() {
  const { financials } = useData();
  return <PageState>{financials && <Content />}</PageState>;
}

function Content() {
  const { graph, governance } = useData();
  const elements = useMemo(() => toElements(graph!), [graph]);

  // Tipado laxo: las claves de estilo de Cytoscape no encajan 1:1 con sus tipos.
  const stylesheet: any[] = [
    {
      selector: "node",
      style: {
        label: "data(label)",
        color: "#cbd5e1",
        "font-size": 9,
        "font-family": "IBM Plex Mono, monospace",
        "text-valign": "bottom",
        "text-margin-y": 4,
        width: 24,
        height: 24,
        "background-color": "data(color)",
        "border-width": 1,
        "border-color": "#0a0e14",
      },
    },
    {
      selector: "edge",
      style: {
        width: 1.2,
        "line-color": "data(color)",
        "target-arrow-color": "data(color)",
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        "arrow-scale": 0.8,
        opacity: 0.7,
        label: "data(type)",
        "font-size": 7,
        color: "#64748b",
        "text-rotation": "autorotate",
      },
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-100">Gobierno corporativo</h1>
      <p className="text-sm text-slate-500 max-w-3xl">
        Grafo de actores y relaciones (APPOINTED, REPORTED_TO, MANAGED, REPLACED). El mismo modelo se
        materializa en Neo4j (<code>graph/model.cypher</code>). Cargos del Estado verificados; directorio/gerencia
        de Petroperú marcados como ilustrativos hasta transcribir nombres y fechas oficiales.
      </p>

      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(NODE_COLOR).filter(([k]) => k !== "Persona").map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5 text-slate-400">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: c }} /> {k}
          </span>
        ))}
      </div>

      <ChartCard title="Red de gobierno" subtitle="Arrastra los nodos · zoom con rueda">
        <div className="h-[440px] rounded bg-ink-900 border border-ink-700">
          <CytoscapeComponent
            elements={elements}
            stylesheet={stylesheet}
            layout={{ name: "cose", animate: false, padding: 30, nodeRepulsion: () => 9000 } as any}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </ChartCard>

      <ChartCard title="Línea de tiempo de cargos" subtitle="Fuente: cargos del Estado (verificados) + seed Petroperú">
        <div className="overflow-x-auto">
          <table className="w-full text-xs tabular">
            <thead>
              <tr className="text-slate-500 border-b border-ink-600">
                <th className="text-left py-2 pr-3">Tipo</th>
                <th className="text-left px-3">Persona / cargo</th>
                <th className="text-left px-3">Organización</th>
                <th className="text-left px-3">Desde</th>
                <th className="text-left px-3">Hasta</th>
                <th className="text-left px-3">Estado</th>
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
                  <td className="px-3">
                    <span className={g.data_status === "verified" ? "text-accent-green" : "text-accent-amber"}>
                      {g.data_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function toElements(graph: GraphData): ElementDefinition[] {
  const nodes: ElementDefinition[] = graph.nodes.map((n) => ({
    data: { id: n.id, label: n.id, color: NODE_COLOR[n.label] ?? PALETTE.slate },
  }));
  const ids = new Set(graph.nodes.map((n) => n.id));
  const edges: ElementDefinition[] = graph.edges
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e, i) => ({
      data: { id: `e${i}`, source: e.source, target: e.target, type: e.type, color: EDGE_COLOR[e.type] ?? PALETTE.slate },
    }));
  return [...nodes, ...edges];
}
