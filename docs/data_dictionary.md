# Diccionario de datos

Unidad monetaria base: **USD miles** (moneda funcional de Petroperú). Periodicidad: **anual**.

## `data/seed/petroperu_financials_seed.csv`

| Campo | Tipo | Descripción |
|---|---|---|
| `year` | int | Ejercicio fiscal |
| `currency` | str | Moneda (USD) |
| `unit` | str | Unidad (thousands) |
| `revenue` | num | Ingresos por ventas / facturación |
| `cogs` | num | Costo de ventas |
| `opex` | num | Gastos operativos (admin. + ventas), **sin** D&A |
| `depreciation_amortization` | num | Depreciación y amortización del ejercicio |
| `interest_expense` | num | Gasto financiero (intereses) |
| `income_tax` | num | Impuesto a la renta |
| `net_income` | num | Resultado neto del ejercicio (puede ser negativo) |
| `cash` | num | Efectivo y equivalentes |
| `accounts_receivable` | num | Cuentas por cobrar comerciales |
| `inventory` | num | Existencias / inventarios |
| `current_assets` | num | Activo corriente total |
| `total_assets` | num | Activo total |
| `current_liabilities` | num | Pasivo corriente total |
| `short_term_debt` | num | Deuda financiera de corto plazo |
| `long_term_debt` | num | Deuda financiera de largo plazo |
| `total_liabilities` | num | Pasivo total |
| `equity` | num | Patrimonio neto (puede ser negativo) |
| `data_status` | enum | `illustrative` \| `verified` — ver `data/PROVENANCE.md` |

**Invariante validada por el ETL:** `total_assets ≈ total_liabilities + equity` (tolerancia 1%).

## Campos derivados (los agrega el ETL al JSON, no están en el CSV)

| Campo | Origen |
|---|---|
| `fx_sol_usd`, `wti_usd_bbl` | BCRP (promedio anual); `null` si no hubo red |
| `gross_profit`, `ebit`, `ebitda`, `ebitda_margin`, `net_margin` | `indicators_engine.py` |
| `total_debt`, `working_capital`, `roa`, `roe` | `indicators_engine.py` |
| `current_ratio`, `acid_test`, `debt_ratio`, `debt_to_equity` | `indicators_engine.py` |
| `net_debt_to_ebitda`, `interest_coverage`, `operating_cash_flow_proxy` | `indicators_engine.py` |
| `balance_ok`, `balance_diff` | Validación de balance |
| `flag_negative_equity` | `equity < 0` |

## `data/seed/governance_seed.csv`

| Campo | Tipo | Descripción |
|---|---|---|
| `entity_type` | enum | `PRESIDENT_PERU` \| `MINISTER` \| `BOARD_CHAIR` \| `GENERAL_MANAGER` \| `COMPANY` |
| `person` | str | Nombre o etiqueta del cargo |
| `role` | str | Cargo |
| `organization` | str | Organización (Perú, MINEM, MEF, Petroperú, FONAFE…) |
| `start_date` | date | Inicio (YYYY-MM-DD) |
| `end_date` | date | Fin (vacío = actualidad) |
| `appointed_by` | str | Quién designó (alimenta la relación `APPOINTED`) |
| `data_status` | enum | `verified` \| `illustrative` |

## Salidas del ETL (`frontend/public/data/`)

| Archivo | Contenido |
|---|---|
| `financials.json` | Filas crudas + indicadores + macro |
| `governance.json` | Filas de gobierno |
| `graph.json` | `{nodes, edges}` para Cytoscape / Neo4j |
| `meta.json` | Metadatos, estado del macro, disclaimer |
| `forecast.json` | (opcional) salida de `forecasting.py` |
