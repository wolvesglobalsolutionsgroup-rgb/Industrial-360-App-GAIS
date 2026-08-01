# IC360 — CVE / Excepciones Técnicas y Parámetros Aceptados

## CVE-S17-001: standbyChpMultiplier
- **Sprint**: S17
- **Archivo**: `src/lib/engineering/equipmentRateEngine.ts`
- **Parámetro**: `standbyChpMultiplier`
- **Valor Canónico**: `0.70` (70% del Costo de Posesión y Depreciación CHP en modo stand-by / espera inactiva)
- **Justificación de Ingeniería**: Según la norma COVENIN 2002 y criterios de la práctica recomendada de costos de equipos pesados (ASME / AACE International), los equipos en espera inactiva en sitio sufren depreciación y costo de capital continuo, pero no consumen combustibles, lubricantes ni mantenimiento mayor. El factor 0.70 aplica exclusivamente a la porción CHP mientras el operador o chofer permanece asignado al salario base.
- **Estado**: ACEPTADO Y DOCUMENTADO.
- **Manejo Dinámico**: Para contratos que estipulen una tasa diferente (ej. 0.50 o 0.80), la función `calculateEquipmentRate` acepta `input.policy.standbyChpMultiplier` como parámetro dinámico de la política de alquiler sin alterar la constante canónica de respaldo.
