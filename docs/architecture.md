# Arquitectura — Petroperú Analytics

Plataforma **100% estática** (sin backend): el procesamiento ocurre *offline*/en CI y el
resultado es JSON servido por GitHub Pages. Esto la hace gratuita, reproducible y fácil de auditar.

## Vista de alto nivel

```mermaid
flowchart LR
  subgraph Fuentes["Fuentes públicas"]
    M[Memorias / EE.FF. auditados]
    S[SMV]
    MEF[MEF]
    BCRP[(BCRP API)]
    F[FONAFE]
    DA[Datos Abiertos]
  end

  subgraph ETL["ETL (Python)"]
    SEED[seed CSV<br/>illustrative/verified]
    PIPE[etl_pipeline.py]
    ENG[indicators_engine.py]
    FC[forecasting.py]
  end

  subgraph Static["Datos estáticos"]
    J1[financials.json]
    J2[governance.json]
    J3[graph.json]
    J4[meta.json]
  end

  subgraph FE["Frontend (React/Vite)"]
    UI[Dashboards + Grafo + Asistente]
  end

  M & S & MEF & F & DA -.transcripción.-> SEED
  BCRP -->|API| PIPE
  SEED --> PIPE --> ENG --> J1
  PIPE --> J2 & J3 & J4
  FC -. opcional .-> J1
  J1 & J2 & J3 & J4 --> UI
  UI -->|GitHub Pages| User((Usuario))
```

## Flujo de datos (ETL)

```mermaid
flowchart TD
  A[Leer seed CSV] --> B[Tipar partidas]
  B --> C{Balance cuadra?<br/>Activo = Pasivo + Patrimonio}
  C -->|sí| D[Calcular 16 indicadores]
  C -->|no| W[Marcar balance_ok=false<br/>+ log de advertencia]
  W --> D
  D --> E[Adjuntar macro BCRP<br/>si hay red]
  E --> F[Construir grafo de gobierno]
  F --> G[Escribir JSON a frontend/public/data]
```

## Modelo ER (datos financieros)

```mermaid
erDiagram
  ENTITY ||--o{ FISCAL_YEAR : reporta
  FISCAL_YEAR ||--|| INCOME_STATEMENT : contiene
  FISCAL_YEAR ||--|| BALANCE_SHEET : contiene
  FISCAL_YEAR ||--o{ INDICATOR : deriva
  FISCAL_YEAR ||--o{ MACRO : "enriquece (BCRP)"

  ENTITY {
    string name
    string currency
    string unit
  }
  FISCAL_YEAR {
    int year PK
    string data_status
    bool balance_ok
  }
  INCOME_STATEMENT {
    num revenue
    num cogs
    num opex
    num depreciation_amortization
    num interest_expense
    num income_tax
    num net_income
  }
  BALANCE_SHEET {
    num current_assets
    num total_assets
    num current_liabilities
    num short_term_debt
    num long_term_debt
    num total_liabilities
    num equity
  }
  INDICATOR {
    string name
    num value
  }
  MACRO {
    num fx_sol_usd
    num wti_usd_bbl
  }
```

## Modelo de grafo (gobierno corporativo)

```mermaid
graph LR
  P[PresidentePeru] -->|APPOINTED| MIN[Ministro]
  P -->|APPOINTED| DIR[Directorio]
  MIN -->|APPOINTED| DIR
  DIR -->|MANAGED| EMP[Empresa: Petroperú]
  GER[Gerente] -->|REPORTED_TO| EMP
  GER -->|MANAGED| EMP
  DIR2[Directorio siguiente] -->|REPLACED| DIR
  FON[FONAFE] -->|APPOINTED| DIR
```

Nodos: `PresidentePeru`, `Ministro`, `Directorio`, `Gerente`, `Empresa`.
Relaciones: `APPOINTED`, `REPORTED_TO`, `MANAGED`, `REPLACED`.
Materialización en Neo4j: ver `graph/model.cypher` y consultas en `graph/queries.cypher`.

## Componentes del frontend

```mermaid
flowchart TD
  main[main.tsx<br/>HashRouter] --> DP[DataProvider<br/>carga JSON una vez]
  DP --> L[Layout<br/>sidebar + header + badge]
  L --> EX[Executive]
  L --> FI[Financial]
  L --> IN[Investment]
  L --> DE[Debt]
  L --> GO[Governance]
  L --> AS[Assistant]
  EX & FI & IN & DE --> EC[EChart wrapper]
  GO --> CY[Cytoscape]
  AS --> ASE[assistant.ts<br/>motor determinista]
```

## Decisiones de diseño

- **Sin backend**: máximo alcance público, costo cero, fácil auditoría. El precio es que los
  datos se regeneran por ETL, no en vivo.
- **HashRouter**: evita configuración de *rewrites* en GitHub Pages.
- **Separación cruda/derivada**: el CSV solo guarda partidas; los indicadores se calculan, así
  reemplazar datos no rompe la lógica.
- **Estado de datos como ciudadano de primera clase**: `data_status` viaja hasta la UI.
