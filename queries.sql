-- Query 1: Find all papers that 'IMPROVE_ON' the concept '3D Gaussian Splatting'
SELECT 
    source.label AS paper_title,
    json_extract(edge.properties, '$.aspect') AS improvement_aspect
FROM edges edge
JOIN nodes source ON edge.source_id = source.id
JOIN nodes target ON edge.target_id = target.id
WHERE 
    edge.relation_type = 'IMPROVES_ON'
    AND target.label = '3D Gaussian Splatting'
    AND source.type = 'PAPER';

-- Query 2: Find a chain of improvements (Paper A -> improves -> Paper B -> improves -> Paper C)
WITH RECURSIVE improvement_chain AS (
    -- Base case: Direct improvements
    SELECT 
        source.label AS paper_a,
        target.label AS paper_b,
        1 AS depth,
        source.label || '->' || target.label AS path
    FROM edges e
    JOIN nodes source ON e.source_id = source.id
    JOIN nodes target ON e.target_id = target.id
    WHERE e.relation_type = 'IMPROVES_ON' AND source.type = 'PAPER' AND target.type = 'PAPER'

    UNION ALL

    -- Recursive step
    SELECT 
        ic.paper_a,
        next_target.label AS paper_b,
        ic.depth + 1,
        ic.path || '->' || next_target.label
    FROM improvement_chain ic
    JOIN nodes current_node ON ic.paper_b = current_node.label
    JOIN edges e ON current_node.id = e.source_id
    JOIN nodes next_target ON e.target_id = next_target.id
    WHERE e.relation_type = 'IMPROVES_ON' AND next_target.type = 'PAPER'
    AND instr(ic.path, next_target.label) = 0 -- Prevent cycles (simple string check for PoC)
)
SELECT * FROM improvement_chain WHERE depth >= 2;

-- Query 3: Count the most popular methods used across all papers
SELECT 
    target.label AS method_name,
    COUNT(*) AS usage_count
FROM edges e
JOIN nodes target ON e.target_id = target.id
WHERE 
    e.relation_type = 'USES'
    AND target.type = 'METHOD'
GROUP BY target.label
ORDER BY usage_count DESC
LIMIT 10;
