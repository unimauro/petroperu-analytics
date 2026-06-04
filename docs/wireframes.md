# Wireframes — dashboards (Agentes 4 BI + 8 UX)

Estilo **terminal financiera** (Bloomberg-like): dark-first, tipografía monoespaciada para
cifras (tabular-nums), acentos ámbar/cian, densidad alta de información. Layout: sidebar fija
(izquierda) + header con badge de procedencia + área de contenido en grilla.

## Marco general

```
┌──────────────┬─────────────────────────────────────────────────────────┐
│ PETROPERÚ    │  Evolución financiera/operativa/gobierno   [⚠ Datos demo]│
│ ANALYTICS    ├─────────────────────────────────────────────────────────┤
│ 2005–2024    │                                                          │
│              │   (contenido del dashboard activo)                       │
│ ▣ Ejecutivo  │                                                          │
│ ₪ Financiero │                                                          │
│ ◔ Inversión  │                                                          │
│ ≣ Deuda      │                                                          │
│ ⌂ Gobierno   │                                                          │
│ ✦ Asistente  │                                                          │
│              │                                                          │
│ Macro: BCRP  │                                                          │
└──────────────┴─────────────────────────────────────────────────────────┘
```

## 1. Ejecutivo

```
Resumen ejecutivo · Ejercicio 2024
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│Ingresos │ EBITDA  │ Rdo neto│ M. neto │  ROE    │ Liq.corr│   ← 6 KPI cards con Δ a/a
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
[ ⚠ Alerta de solvencia: patrimonio negativo ... ]
┌───────────────────────────┐ ┌───────────────────────────┐
│ Ingresos vs resultado neto │ │ Márgenes (EBITDA / neto %) │
│ (barras + línea)           │ │ (líneas)                   │
└───────────────────────────┘ └───────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Estructura patrimonial: Activo / Pasivo / Patrimonio     │
└─────────────────────────────────────────────────────────┘
```

## 2. Financiero

```
┌───────────────────────────┐ ┌───────────────────────────┐
│ Liquidez (corr. + ácida)   │ │ Rentabilidad (ROA bar/ROE) │
│ línea umbral 1.0x          │ │                            │
└───────────────────────────┘ └───────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Tabla histórica: Año | Ingresos | EBITDA | Rdo | ROA |…  │  ← scroll, fila actual resaltada
└─────────────────────────────────────────────────────────┘
```

## 3. Inversión

```
[Activo total] [Inversión inferida] [D&A] [FFO proxy]   ← 4 KPIs
┌───────────────────────────┐ ┌───────────────────────────┐
│ Activo + inversión (PMRT)  │ │ Generación de caja (proxy) │
└───────────────────────────┘ └───────────────────────────┘
```

## 4. Deuda

```
[Deuda total] [Endeud. %] [D/E] [Cobertura int.]   ← 4 KPIs
┌───────────────────────────┐ ┌───────────────────────────┐
│ Composición CP/LP + caja   │ │ Deuda neta/EBITDA + cobert.│
│ (barras apiladas + línea)  │ │ (líneas, umbral 1.0x)      │
└───────────────────────────┘ └───────────────────────────┘
[ Nota interpretativa sobre gasto financiero y cobertura ]
```

## 5. Gobierno corporativo

```
[Leyenda de tipos de nodo: Presidente/Ministro/Directorio/Gerente/Empresa]
┌─────────────────────────────────────────────────────────┐
│  Grafo interactivo (Cytoscape) — arrastrar / zoom        │
│        (P)──APPOINTED──▶(Directorio)──MANAGED──▶(Empresa) │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│ Tabla línea de tiempo: Tipo | Persona | Org | Desde |Hasta│
└─────────────────────────────────────────────────────────┘
```

## 6. Asistente

```
┌─────────────────────────────────────────────────────────┐
│  💬 historial de conversación (burbujas)                 │
└─────────────────────────────────────────────────────────┘
[Explica el ROE][Resumen 2022][Anomalías][Tendencia deuda] ← sugerencias
[ input ____________________________________ ] [Enviar]
```

## Lineamientos de accesibilidad (WCAG 2.1 AA)

- Contraste ≥ 4.5:1 para texto; acentos solo como refuerzo, nunca único portador de información.
- Navegación por teclado en nav, inputs y botones; `aria-label` en gráficos y formularios.
- `prefers-reduced-motion`: se desactivan animaciones/transiciones.
- Cifras con `font-variant-numeric: tabular-nums` para lectura en columnas.
- Estado de datos comunicado por **texto + ícono** (no solo color).
```
