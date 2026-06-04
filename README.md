# Petroperú Analytics

**Plataforma pública y abierta** para analizar la evolución **financiera, operativa y de
gobierno corporativo de Petroperú (2005–presente)**, con presentación tipo terminal
financiera (Bloomberg/PowerBI) pero gratuita, estática y verificable. Se despliega en
**GitHub Pages** sin backend.

> ### ⚠️ Aviso de integridad de datos
> El dataset incluido (`data/seed/`) está marcado como **`illustrative`**: son cifras de
> **demostración** para que la plataforma funcione extremo a extremo. **No son cifras
> oficiales** y no deben citarse como tales. Antes de cualquier uso analítico real,
> reemplázalas por los Estados Financieros Auditados / Memorias (ver
> [`data/PROVENANCE.md`](data/PROVENANCE.md)). Esta advertencia también aparece en la propia UI.

## ¿Qué incluye?

- **5 dashboards**: Ejecutivo · Financiero · Inversión · Deuda · Gobierno corporativo.
- **16 indicadores** financieros con fórmulas abiertas ([`analytics/formulas.md`](analytics/formulas.md)).
- **Grafo de gobierno** (Cytoscape en la UI; modelo Neo4j en [`graph/`](graph/)).
- **Asistente financiero** determinista (explica ratios, resume años, detecta anomalías) — sin API.
- **ETL reproducible** con ingesta opcional del BCRP.
- **Pronóstico** (Prophet/XGBoost con fallback OLS) y análisis exploratorio.

## Arquitectura (resumen)

```
Fuentes públicas ─▶ seed CSV ─▶ ETL (Python) ─▶ JSON estático ─▶ Frontend React/Vite ─▶ GitHub Pages
                                  │                                     │
                          indicators_engine                    ECharts + Cytoscape
```

Detalle, diagramas Mermaid, modelo ER y modelo de grafo en
[`docs/architecture.md`](docs/architecture.md).

## Estructura del repo

```
petroperu-analytics/
├── data/            # seed CSV (illustrative) + PROVENANCE.md
├── etl/             # etl_pipeline.py + fuentes (BCRP)
├── analytics/       # indicators_engine.py, formulas.md, forecasting.py, notebooks/
├── graph/           # model.cypher + queries.cypher (Neo4j)
├── frontend/        # React + TS + Vite + Tailwind + ECharts + Cytoscape
├── docs/            # PRD, roadmap, data_dictionary, architecture, wireframes, deployment
└── .github/workflows/deploy.yml
```

## Inicio rápido

```bash
# 1) Generar datos estáticos
python etl/etl_pipeline.py            # usa BCRP si hay red; o --offline

# 2) Frontend
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Despliegue completo en [`docs/deployment_manual.md`](docs/deployment_manual.md).

## Stack

`Python` (ETL, indicadores, forecasting) · `React + TypeScript + Vite` · `TailwindCSS` ·
`ECharts` · `Cytoscape` · `Neo4j (Cypher)` · `GitHub Actions` + `Pages`.

## Cómo reemplazar las cifras semilla por datos reales

1. Transcribe las partidas de los EE.FF. auditados a `data/seed/petroperu_financials_seed.csv`.
2. Cambia `data_status` de `illustrative` a `verified` en cada fila corregida.
3. Corre `python etl/etl_pipeline.py`. El frontend no requiere cambios.
4. Verifica que el balance cuadre (el ETL lo reporta) y revisa los dashboards.

## Licencia y propósito

Proyecto cívico, sin fines de lucro, orientado a la transparencia sobre una empresa del
Estado peruano. Datos de fuentes públicas. Las conclusiones son responsabilidad de quien
las publique; esta herramienta facilita el análisis, no lo certifica.
