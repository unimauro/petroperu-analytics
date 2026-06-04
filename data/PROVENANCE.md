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
| `seed/petroperu_financials_seed.csv` | `illustrative` | Reemplazar por EE.FF. auditados 2005–presente |
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
