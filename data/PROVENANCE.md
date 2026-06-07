# Procedencia y estado de los datos

> **Aviso de integridad (anti-overclaiming).**
> Las cifras financieras anuales incluidas en `data/seed/petroperu_financials_seed.csv`
> están marcadas con `data_status = illustrative`. **Son valores de demostración**,
> construidos para que la plataforma funcione extremo a extremo y para mostrar órdenes
> de magnitud y tendencias plausibles. **No deben citarse como cifras oficiales.**
> Antes de cualquier uso analítico real deben reemplazarse por valores transcritos de
> los Estados Financieros Auditados y las Memorias Anuales, marcando entonces
> `data_status = verified` con su fuente y página.

## Fuentes oficiales para reemplazar las cifras semilla

| Fuente | Qué aporta | Acceso |
|---|---|---|
| **Memorias Anuales Petroperú** | Resultados, hitos operativos, gobierno corporativo | https://www.petroperu.com.pe/ (Relación con inversionistas) |
| **Estados Financieros Auditados** | Estado de resultados, balance, flujo de efectivo | PDF en Petroperú + SMV |
| **SMV — Superintendencia del Mercado de Valores** | EE.FF. y hechos de importancia (emisor de bonos) | https://www.smv.gob.pe/ |
| **MEF** | Aportes de capital, garantías del Tesoro, deuda pública | https://www.mef.gob.pe/ |
| **BCRP** | Tipo de cambio, precios de crudo/combustibles, macro | https://estadisticas.bcrp.gob.pe/ (API REST) |
| **FONAFE** | Gobierno corporativo, presupuesto, directorios de empresas del Estado | https://www.fonafe.gob.pe/ |
| **Datos Abiertos Perú** | Conjuntos diversos del Estado | https://www.datosabiertos.gob.pe/ |

## Estado por dataset

| Archivo | Estado | Notas |
|---|---|---|
| `seed/petroperu_financials_seed.csv` | `mixto` | **2023, 2024 y 2025 = REALES** (EE.FF. auditados). 2005–2022 = ilustrativos (pendiente transcribir) |

### Años verificados (fuente primaria)

| Año | Fuente | URL |
|---|---|---|
| 2024 y 2023 | EE.FF. auditados 2024-2023 (US$ miles) | https://inversionistas.petroperu.com.pe/wp-content/uploads/2025/07/estados-financieros-2024-2023.pdf |
| 2025 (4T, anual) | EE.FF. 2025 IV trimestre (US$ miles) | https://inversionistas.petroperu.com.pe/wp-content/uploads/2026/02/estados-financieros-2025-iv-trimestre.pdf |
| 1T 2026 (highlight) | Reporte financiero 1T 2026 | https://inversionistas.petroperu.com.pe/en/quarterly-earnings-releases/ |

**Validación cruzada:** el capital de trabajo 2025 calculado por el motor (≈ -US$1,558 M) coincide con el
reportado por Petroperú/prensa (-US$1,562 M), y el patrimonio 2025 (US$1,963 M), activo (US$9,807 M) y
pérdida neta (-US$468 M) coinciden con los reportes oficiales.

### Convención de EBITDA (importante)

El motor calcula `EBITDA = EBIT + D&A`. Para que el **EBITDA mostrado coincida con el EBITDA Ajustado que
reporta Petroperú** (que excluye deterioros y otros ingresos/gastos no operativos), en los años verificados
el campo `depreciation_amortization` se fija como `EBITDA_ajustado_reportado − utilidad_operativa` y `opex`
como el residual que hace cuadrar la utilidad operativa. Es decir: ingresos, costo de ventas, utilidad bruta,
utilidad operativa, EBITDA y resultado neto coinciden con las cifras oficiales; el campo D&A absorbe los
ajustes (no es depreciación pura). La depreciación contable real fue: 2024 ≈ US$260 M, 2023 ≈ US$231 M,
2025 (PPE) ≈ US$169 M.

> **Dato relevante:** a diferencia de las cifras ilustrativas previas, el **patrimonio real de Petroperú es
> POSITIVO** (US$1,963 M en 2025; US$2,432 M en 2024) gracias a los aportes de capital del Estado, pese a
> resultados acumulados negativos. La presión está en la **liquidez** (capital de trabajo negativo) y en una
> **cobertura de intereses < 1**, no en patrimonio negativo.

| (legacy) `seed` años 2005–2022 | `illustrative` | Reemplazar por EE.FF. auditados |
| `seed/governance_seed.csv` | `mixed` | Cargos del Estado (Presidentes/Ministros) son verificables; integrantes de directorio Petroperú van marcados `illustrative` donde no se confirmó |
| `processed/*.json` (BCRP) | `verified-live` | Generado por el ETL desde la API del BCRP cuando hay red |

## Anclas conocidas (contexto público, para guiar la transcripción)

Hechos de dominio público que el dataset definitivo debería reflejar (verificar montos exactos en la fuente):

- **PMRT — Modernización de la Refinería de Talara**: sobrecostos relevantes; capex que infló el activo total entre ~2014 y 2021.
- **2020**: caída de ingresos por pandemia y precios; resultado fuertemente negativo.
- **2022**: pérdida neta significativa; retraso en la presentación de EE.FF.; tensión con el auditor externo; pérdida del grado de inversión y rebajas de calificación (Fitch/Moody's/S&P).
- **2022–2024**: apoyos del Estado (aportes de capital / líneas de crédito) vía MEF/FONAFE.
- **2023–2024**: arranque/rampa de Talara con efecto en ingresos.

> Las cifras semilla imitan estas tendencias **cualitativamente**, pero los montos son aproximados de demostración.
