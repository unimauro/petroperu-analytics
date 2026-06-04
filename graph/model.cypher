// ===========================================================================
// Modelo de grafo de gobierno corporativo — Petroperú Analytics (Agente 6)
// Compatible con Neo4j 5.x. Carga desde data/seed/governance_seed.csv.
// ===========================================================================

// --- Restricciones de unicidad ---------------------------------------------
CREATE CONSTRAINT person_name IF NOT EXISTS
FOR (p:Person) REQUIRE p.name IS UNIQUE;

CREATE CONSTRAINT company_name IF NOT EXISTS
FOR (c:Company) REQUIRE c.name IS UNIQUE;

// --- Carga de nodos desde el CSV -------------------------------------------
// Colocar governance_seed.csv en el directorio import/ de Neo4j (o usar URL).
LOAD CSV WITH HEADERS FROM 'file:///governance_seed.csv' AS row

// Empresas como :Company; el resto como :Person con etiqueta secundaria por tipo.
FOREACH (_ IN CASE WHEN row.entity_type = 'COMPANY' THEN [1] ELSE [] END |
  MERGE (c:Company {name: row.person})
  SET c.role = row.role,
      c.organization = row.organization,
      c.start_date = row.start_date,
      c.data_status = row.data_status
)
FOREACH (_ IN CASE WHEN row.entity_type <> 'COMPANY' THEN [1] ELSE [] END |
  MERGE (p:Person {name: row.person})
  SET p.role = row.role,
      p.organization = row.organization,
      p.start_date = row.start_date,
      p.end_date = row.end_date,
      p.entity_type = row.entity_type,
      p.data_status = row.data_status
);

// Etiquetas secundarias por tipo (facilitan filtrar en consultas)
MATCH (p:Person {entity_type: 'PRESIDENT_PERU'})   SET p:PresidentePeru;
MATCH (p:Person {entity_type: 'MINISTER'})         SET p:Ministro;
MATCH (p:Person {entity_type: 'BOARD_CHAIR'})      SET p:Directorio;
MATCH (p:Person {entity_type: 'GENERAL_MANAGER'})  SET p:Gerente;

// --- Relaciones ------------------------------------------------------------

// APPOINTED: quien designó -> designado
LOAD CSV WITH HEADERS FROM 'file:///governance_seed.csv' AS row
WITH row WHERE row.appointed_by IS NOT NULL AND row.appointed_by <> ''
MATCH (target {name: row.person})
MERGE (appointer {name: row.appointed_by})
MERGE (appointer)-[:APPOINTED {since: row.start_date}]->(target);

// MANAGED / REPORTED_TO: directorios y gerencias respecto a Petroperú
MATCH (p:Person), (c:Company {name: 'Petroperú'})
WHERE p.entity_type IN ['BOARD_CHAIR', 'GENERAL_MANAGER']
MERGE (p)-[:MANAGED]->(c);

MATCH (g:Gerente), (c:Company {name: 'Petroperú'})
MERGE (g)-[:REPORTED_TO]->(c);

// REPLACED: sucesión temporal dentro del mismo tipo de cargo y organización
MATCH (a:Person), (b:Person)
WHERE a.entity_type = b.entity_type
  AND a.organization = b.organization
  AND a.start_date > b.start_date
  AND a.start_date IS NOT NULL AND b.start_date IS NOT NULL
WITH a, b ORDER BY b.start_date
WITH a, collect(b)[-1] AS prev
WHERE prev IS NOT NULL AND prev.start_date < a.start_date
MERGE (a)-[:REPLACED]->(prev);
