# Notebooks / análisis (Agente 5 — Data Scientist)

Los análisis se entregan como **scripts ejecutables** (corren en CI sin Jupyter) y son
fácilmente convertibles a notebook.

| Archivo | Qué hace | Modelos |
|---|---|---|
| `analysis.py` | Tendencias (CAGR), correlaciones (Pearson), anomalías (z-score) | stdlib |
| `../forecasting.py` | Pronóstico de series (ingresos, deuda…) a N años | Prophet → XGBoost → OLS (fallback) |

## Ejecutar

```bash
python analytics/notebooks/analysis.py
python analytics/forecasting.py --metric revenue --horizon 3
```

## Convertir a notebook

```bash
pip install jupytext
jupytext --to notebook analysis.py     # genera analysis.ipynb
```

## Hallazgos esperables (con datos reales verificados)

- **Correlación activo–deuda alta**: el ciclo de capex de Talara (PMRT) se financió con deuda.
- **Anomalías** en 2020 (pandemia) y 2022 (pérdida y tensión con el auditor).
- **CAGR de deuda > CAGR de ingresos**: presión creciente de solvencia.

> Recordatorio: con el dataset semilla estos resultados son **ilustrativos**. Reemplazar por
> EE.FF. auditados antes de publicar conclusiones (ver `data/PROVENANCE.md`).
