// Base de tema oscuro para ECharts (estilo terminal financiera).
import type { EChartsOption } from "echarts";

export const AXIS_LINE = "#2b3543";
export const TEXT = "#94a3b8";

/** Devuelve una option base que cada gráfico extiende con merge superficial. */
export function baseOption(): EChartsOption {
  return {
    backgroundColor: "transparent",
    textStyle: { fontFamily: "IBM Plex Mono, monospace", color: TEXT },
    grid: { left: 56, right: 24, top: 36, bottom: 40, containLabel: true },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#0f141c",
      borderColor: "#2b3543",
      textStyle: { color: "#e2e8f0", fontFamily: "IBM Plex Mono, monospace" },
    },
    legend: { textStyle: { color: TEXT }, top: 0, icon: "roundRect" },
    xAxis: {
      type: "category",
      axisLine: { lineStyle: { color: AXIS_LINE } },
      axisLabel: { color: TEXT },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: AXIS_LINE, type: "dashed" } },
      axisLabel: { color: TEXT },
    },
  };
}
