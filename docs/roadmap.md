# Roadmap — Petroperú Analytics

## Fase 0 — MVP (✅ entregado)
- Estructura del repo + control de versiones.
- ETL determinista (seed CSV → JSON) + ingesta BCRP opcional.
- Motor de 16 indicadores financieros con fórmulas abiertas.
- 5 dashboards (Ejecutivo, Financiero, Inversión, Deuda, Gobierno).
- Asistente financiero determinista offline.
- Grafo de gobierno (Cytoscape) + modelo Neo4j (Cypher).
- CI/CD a GitHub Pages.
- Badges de procedencia y disclaimers (anti-overclaiming).

## Fase 1 — Datos reales (próximo hito crítico)
- [ ] Transcribir EE.FF. auditados 2005–presente desde Petroperú/SMV.
- [ ] Marcar `data_status = verified` con fuente y página por celda.
- [ ] Verificar invariante de balance contra los PDFs oficiales.
- [ ] Cargar nombres y fechas reales de directorios y gerencias (FONAFE).
- **KPI de cierre:** 100% de celdas financieras `verified`.

## Fase 2 — Profundidad analítica
- [ ] Datos operativos: producción, refinación (PMRT/Talara), ventas físicas.
- [ ] Forecast embebido en UI (`forecast.json`) con Prophet/XGBoost.
- [ ] Correlaciones macro (WTI, TC) vs resultados.
- [ ] Comparador multi-año y exportación CSV/PNG.

## Fase 3 — Inteligencia y escala
- [ ] Asistente con LLM (vía proxy/API) manteniendo el modo determinista por defecto.
- [ ] Neo4j Aura público para consultas Cypher de gobierno corporativo.
- [ ] Datos trimestrales y alertas de hechos de importancia (SMV).
- [ ] Internacionalización (ES/EN) y dominio propio vía Cloudflare.

## Hitos transversales
- Auditoría de accesibilidad (Lighthouse ≥ 90).
- Pruebas automáticas del ETL e indicadores en CI.
- Documentación viva (este repo) y guía de contribución abierta.
