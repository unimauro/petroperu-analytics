/// <reference types="vite/client" />

declare module "react-cytoscapejs" {
  import type { ComponentType, CSSProperties } from "react";
  import type { ElementDefinition, Stylesheet, LayoutOptions, Core } from "cytoscape";
  interface CytoscapeComponentProps {
    elements: ElementDefinition[];
    stylesheet?: Stylesheet[];
    layout?: LayoutOptions | Record<string, unknown>;
    style?: CSSProperties;
    cy?: (cy: Core) => void;
    className?: string;
  }
  const CytoscapeComponent: ComponentType<CytoscapeComponentProps>;
  export default CytoscapeComponent;
}
