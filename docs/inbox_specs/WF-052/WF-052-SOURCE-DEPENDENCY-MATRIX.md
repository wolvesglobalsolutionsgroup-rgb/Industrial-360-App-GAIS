# Matriz de Dependencias Documentales: WF-052 (Instrumentación y Lazos P&ID)

**ID Workflow**: wf-052-instrumentacion-lazos-pid  
**Nombre Operativo**: Control, Calibración de Instrumentos y Prueba de Lazos P&ID  
**Módulo Asignado**: QA/QC, NDT e Integridad de Activos  
**Estado de Análisis**: PROPOSED_SPECIFICATION  
**Nivel de Confianza**: HIGH

---

## 1. Fuentes Documentales Confirmadas y Referenciadas

| ID Documento | Título Oficial / Referencia | Fuente | Estatus de Extracción | Ámbito en WF-052 |
|---|---|---|---|---|
| **ISA 5.1** | Instrumentation Symbols and Identification | Norma Internacional ISA | CONFIRMED_SPECIFICATION | Nomenclatura de Tags (PT, TT, FT, LT, PSV, CV) y diagramas de lazos. |
| **ISA 20** | Instrument Specification Forms | Norma Internacional ISA | CONFIRMED_SPECIFICATION | Hojas de datos e inspección técnica de instrumentos de proceso (Prueba 5 Puntos). |
| **ASME B31.3** | Process Piping - Instrumentation Piping | Código ASME | CONFIRMED_SPECIFICATION | Tolerancias de presión e integridad de tubings/conexiones de instrumentación. |
| **PDVSA IR-E-01** | Clasificación de Áreas | PDF Oficial PDVSA (Julio 1995) | VERIFIED (Págs. 1-41) | Verificación de áreas Clase I Div 1/2, Grupos A-D, Temp T1-T6 y sellos Ex-d/Ex-i. |
| **PDVSA IR-S-04** | Sistema de Permisos de Trabajo | PDF Oficial PDVSA (Agosto 2013) | VERIFIED (Págs. 1-69) | Permiso de trabajo base para calibración y desvío de instrumentación (Renglón 11.n). |
| **PDVSA SI-S-20** | Procedimientos de Trabajo | PDF Oficial PDVSA (Nov. 2006) | VERIFIED (Págs. 1-12) | Estructura de procedimientos de calibración y pruebas de campo (15 Secciones). |

---

## 2. Matriz de Conflictos y Desviaciones Identificadas

| Conflicto / Desviación | Fuente 1 (Estándar Industrial) | Código Previo en Repo | Resolución Adoptada |
|---|---|---|---|
| **Puntos de Calibración** | ISA 5.1 / ISA 20 exige 5 puntos (0%, 25%, 50%, 75%, 100% de escala) subiendo y bajando. | Se usaban 3 puntos simples sin histéresis. | RESOLVED_SPEC: Extendido a 5 puntos con verificación de histéresis ascendente/descendente. |
| **Evaluación de Tolerancia** | Cálculo estricto de error %FS (Fondo de Escala). | Bloqueo automático sin opción de recalibración en sitio. | RESOLVED_ADVISORY: blocking: false, exige recalibración o justificación firmada de excepción. |
