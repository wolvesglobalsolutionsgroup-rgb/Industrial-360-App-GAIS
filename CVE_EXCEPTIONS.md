# IC360 — CVE / Excepciones Técnicas y Parámetros Aceptados

## CVE-S17-001: standbyChpMultiplier
- **Sprint**: S17
- **Archivo**: `src/lib/engineering/equipmentRateEngine.ts`
- **Parámetro**: `standbyChpMultiplier`
- **Valor Canónico**: `0.70` (70% del Costo de Posesión y Depreciación CHP en modo stand-by / espera inactiva)
- **Justificación de Ingeniería**: Según la norma COVENIN 2002 y criterios de la práctica recomendada de costos de equipos pesados (ASME / AACE International), los equipos en espera inactiva en sitio sufren depreciación y costo de capital continuo, pero no consumen combustibles, lubricantes ni mantenimiento mayor. El factor 0.70 aplica exclusivamente a la porción CHP mientras el operador o chofer permanece asignado al salario base.
- **Estado**: ACEPTADO Y DOCUMENTADO.
- **Manejo Dinámico**: Para contratos que estipulen una tasa diferente (ej. 0.50 o 0.80), la función `calculateEquipmentRate` acepta `input.policy.standbyChpMultiplier` como parámetro dinámico de la política de alquiler sin alterar la constante canónica de respaldo.

## CVE-S21-001: Diff Viewer Merge JSON Schema Validation
- **Sprint**: S21
- **Archivo**: `src/pages/SyncCenter.tsx` / `src/lib/offline/syncEngine.ts`
- **Componente**: `DiffViewer` / JSON Merge Conflict Resolution
- **Justificación de Arquitectura**: Los payloads de mutación en cola offline (Outbox) contienen deltas JSON parciales para entidades multi-tenant (WBS, APUs, Partes Diarios, MTRs). Al resolver conflictos visuales mediante el visor de diffs, la fusión manual de parches de objetos JSON puede recibir campos con estructuras arbitrarias creadas por el usuario en modo desconectado. Para evitar excepciones de análisis en ejecuciones cliente/servidor, se requiere un validador de esquema de parches con fallback a copia profunda sanitizada e inmutable.
- **Estado**: ACEPTADO Y DOCUMENTADO.
- **Manejo Dinámico**: Toda fusión de objetos JSON en el SyncCenter valida la preservación obligatoria del identificador `id`, `orgId` y `projectId`, descartando mutaciones huérfanas o incompatibles con el esquema canónico del repositorio.
