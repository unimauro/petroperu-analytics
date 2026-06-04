# PRD — Petroperú Analytics

## 1. Visión

Plataforma **pública y abierta** que permite a ciudadanía, periodistas, académicos y
fiscalizadores analizar la evolución **financiera, operativa y de gobierno corporativo**
de Petroperú desde 2005 hasta la actualidad, con calidad de presentación tipo terminal
financiera (Bloomberg/PowerBI) pero **gratuita y verificable**.

> **Principio rector (anti-overclaiming):** ningún número se presenta como oficial si no
> proviene de una fuente citable. Las cifras de demostración se marcan visiblemente como
> ilustrativas hasta su reemplazo por datos auditados (ver `data/PROVENANCE.md`).

## 2. Problema

La información financiera de Petroperú está dispersa en PDFs (Memorias, EE.FF.
auditados, SMV) difíciles de comparar entre años. No existe un tablero público que
permita ver tendencias de 20 años ni cruzar resultados con el ciclo político y de gobierno
corporativo (directorios, gerencias, ministros).

## 3. Usuarios y necesidades

| Persona | Necesidad principal |
|---|---|
| Ciudadano / contribuyente | Entender "¿cómo le va a la empresa del Estado?" sin jerga |
| Periodista de investigación | Series comparables, hitos, descarga de datos |
| Académico / estudiante | Indicadores estandarizados y fórmulas transparentes |
| Analista / fiscalizador | Liquidez, solvencia, apalancamiento, gobierno corporativo |

## 4. Alcance funcional (MVP)

- **5 dashboards**: Ejecutivo, Financiero, Inversión, Deuda, Gobierno corporativo.
- **16 indicadores** calculados con fórmulas abiertas (ver `formulas.md`).
- **Grafo de gobierno** (Presidentes, ministros, directorios, gerencias, empresas).
- **Asistente** financiero determinista (explica ratios, resume años, detecta anomalías).
- **Datos descargables** (JSON) y **procedencia explícita**.
- **Despliegue estático** en GitHub Pages (sin backend, sin costo).

### Fuera de alcance (MVP)
- Datos intradía o trimestrales (solo anual).
- Backend con base de datos en vivo.
- LLM en producción (queda el *hook* para conectarlo).

## 5. Requisitos no funcionales

- **Accesibilidad** WCAG 2.1 AA (contraste, navegación por teclado, `prefers-reduced-motion`).
- **Responsive** (escritorio y móvil).
- **Rendimiento**: carga de datos < 1 s (JSON estático).
- **Transparencia**: fórmulas, fuentes y estado de datos visibles en la propia UI.
- **Reproducibilidad**: ETL determinista versionado en el repo.

## 6. Historias de usuario (selección)

- **US-01** Como ciudadano quiero ver ingresos y resultado neto por año para entender la salud de la empresa. ✅ (Ejecutivo)
- **US-02** Como analista quiero ROA/ROE/liquidez/solvencia en serie histórica con sus fórmulas. ✅ (Financiero + formulas.md)
- **US-03** Como fiscalizador quiero ver el endeudamiento y la cobertura de intereses en el tiempo. ✅ (Deuda)
- **US-04** Como periodista quiero relacionar gestiones (directorios/ministros) con periodos. ✅ (Gobierno)
- **US-05** Como estudiante quiero preguntar "¿qué es el EBITDA?" o "resumen del 2022". ✅ (Asistente)
- **US-06** Como usuario quiero saber si un dato es oficial o de demostración. ✅ (badge de estado)
- **US-07** Como data scientist quiero proyectar ingresos/deuda a 3–5 años. ✅ (forecasting.py)
- **US-08** Como desarrollador quiero reemplazar las cifras semilla por datos auditados sin tocar el frontend. ✅ (CSV → ETL → JSON)

## 7. Backlog priorizado

| Prioridad | Ítem | Estado |
|---|---|---|
| P0 | ETL + indicadores + 5 dashboards + deploy Pages | ✅ MVP |
| P0 | Badge de procedencia y disclaimers | ✅ |
| P1 | Transcribir EE.FF. auditados reales 2005– (reemplazar seed) | ⏳ |
| P1 | Forecast embebido en el dashboard (leer `forecast.json`) | ⏳ |
| P2 | Datos trimestrales y operativos (producción de crudo, refinación) | ⏳ |
| P2 | Conexión opcional a LLM para el asistente | ⏳ |
| P3 | Exportación a CSV/PNG desde la UI; comparador multi-año | ⏳ |
| P3 | Materialización en Neo4j Aura para consultas Cypher públicas | ⏳ |

## 8. KPIs del producto

- **Cobertura de datos verificados** (% de celdas `verified` vs `illustrative`). Meta MVP→v1: 0% → 100% en EE.FF.
- **Años cubiertos** (meta: 2005–presente completos).
- **Tiempo de carga** del dashboard (< 1 s).
- **Indicadores publicados** (16 en MVP).
- **Accesibilidad** (auditoría Lighthouse ≥ 90 en Accessibility).
- **Uso**: visitas únicas y descargas de datos (vía analítica respetuosa de privacidad).
