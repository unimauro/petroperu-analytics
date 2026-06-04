# Fórmulas de indicadores financieros

> Implementadas en `analytics/indicators_engine.py`. Unidad base: **USD miles**.
> Partidas crudas en `data/seed/petroperu_financials_seed.csv`.

## Magnitudes derivadas

| Indicador | Fórmula | Notas |
|---|---|---|
| **Utilidad bruta** | `Ingresos − COGS` | |
| **EBIT** | `Ingresos − COGS − OPEX − D&A` | OPEX aquí excluye D&A (se resta aparte) |
| **EBITDA** | `EBIT + D&A` | Proxy de caja operativa |
| **Deuda total** | `Deuda CP + Deuda LP` | Solo deuda financiera |
| **Capital de trabajo** | `Activo corriente − Pasivo corriente` | |

## Rentabilidad

| Indicador | Fórmula |
|---|---|
| **ROA** | `Utilidad neta / Activo total` |
| **ROE** | `Utilidad neta / Patrimonio` |
| **Margen EBITDA** | `EBITDA / Ingresos` |
| **Margen neto** | `Utilidad neta / Ingresos` |

## Liquidez

| Indicador | Fórmula |
|---|---|
| **Liquidez corriente** | `Activo corriente / Pasivo corriente` |
| **Prueba ácida** | `(Activo corriente − Inventario) / Pasivo corriente` |

## Apalancamiento / solvencia

| Indicador | Fórmula |
|---|---|
| **Razón de endeudamiento** | `Pasivo total / Activo total` |
| **Deuda / Patrimonio (D/E)** | `Pasivo total / Patrimonio` |
| **Deuda neta / EBITDA** | `(Deuda total − Caja) / EBITDA` |
| **Cobertura de intereses** | `EBIT / Gasto financiero` |

## Flujo de caja

| Indicador | Fórmula | Notas |
|---|---|---|
| **FFO proxy** | `Utilidad neta + D&A` | Aproximación; reemplazar por el Estado de Flujos de Efectivo auditado |

## Advertencias de interpretación

- **Patrimonio negativo** (caso de varios ejercicios recientes): ROE y D/E pierden sentido económico.
  El motor marca `flag_negative_equity = true` y los dashboards lo señalan.
- **División por cero / dato faltante**: las funciones devuelven `null` en lugar de error.
- Toda comparación interanual asume la misma base contable (NIIF) y moneda funcional (USD).
