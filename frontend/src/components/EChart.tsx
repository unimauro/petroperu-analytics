import ReactECharts from "echarts-for-react";

interface Props {
  // Las options se construyen como literales y se validan en runtime por ECharts.
  // Tipamos laxo aquí para no pelear con las uniones discriminadas de EChartsOption.
  option: Record<string, unknown>;
  height?: number | string;
}

/** Wrapper fino sobre echarts-for-react con altura y reflow por defecto. */
export default function EChart({ option, height = 300 }: Props) {
  return (
    <ReactECharts
      option={option as never}
      style={{ height, width: "100%" }}
      notMerge
      lazyUpdate
      opts={{ renderer: "canvas" }}
    />
  );
}
