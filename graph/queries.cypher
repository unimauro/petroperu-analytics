// ===========================================================================
// Consultas Cypher de ejemplo — gobierno corporativo de Petroperú
// ===========================================================================

// 1) Línea de sucesión de presidentes del Perú (cadena REPLACED)
MATCH path = (:PresidentePeru)-[:REPLACED*]->(:PresidentePeru)
RETURN path
ORDER BY length(path) DESC
LIMIT 1;

// 2) ¿Quién designó a cada miembro del directorio de Petroperú?
MATCH (appointer)-[:APPOINTED]->(d:Directorio)
RETURN appointer.name AS designado_por, d.name AS directorio, d.start_date AS desde
ORDER BY d.start_date;

// 3) Todos los actores que "gestionaron" Petroperú (directorio + gerencia)
MATCH (p:Person)-[:MANAGED]->(c:Company {name: 'Petroperú'})
RETURN p.name AS actor, p.entity_type AS tipo, p.start_date AS desde, p.end_date AS hasta
ORDER BY p.start_date;

// 4) Cadena de mando: del Presidente del Perú a la empresa
MATCH path = (pr:PresidentePeru)-[:APPOINTED*1..3]->(x)-[:MANAGED]->(c:Company {name: 'Petroperú'})
RETURN pr.name AS presidente, [n IN nodes(path) | n.name] AS cadena;

// 5) Cargos vigentes (sin fecha de fin)
MATCH (p:Person)
WHERE p.end_date IS NULL OR p.end_date = ''
RETURN p.name AS persona, p.role AS cargo, p.organization AS organizacion;

// 6) Datos por verificar (gobernanza marcada como ilustrativa)
MATCH (p:Person {data_status: 'illustrative'})
RETURN p.entity_type AS tipo, p.name AS etiqueta, p.organization AS organizacion
ORDER BY tipo;

// 7) Grado de cada nodo (centralidad simple por conteo de relaciones)
MATCH (n)
RETURN labels(n) AS etiquetas, n.name AS nombre,
       size([(n)--() | 1]) AS grado
ORDER BY grado DESC
LIMIT 15;
