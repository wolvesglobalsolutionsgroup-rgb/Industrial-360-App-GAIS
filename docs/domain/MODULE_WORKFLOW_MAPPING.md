# MODULE_WORKFLOW_MAPPING.md — Mapeo Propuesto de Módulos Técnicos y Workflows (IC360-NEXUS)

*Estado:* **MODULE_MAPPING_PROPOSED**  
*Fecha:* 2026-08-10  
*Sprint:* F-OPS-REORDER-01  

---

## 1. Directrices de Navegación y Trazabilidad

1. **Invariante de Trazabilidad Técnica (`wf-*`):** Los IDs canónicos `wf-*` se mantienen intactos en el código fuente (`src/workflows/`), en el registro Kernel (`WorkflowRegistry`), runner, logs de auditoría e identificadores de backend.
2. **Navegación Primaria por Módulos:** La interfaz de usuario del cliente y del inspector organiza el acceso por **Módulos Técnicos** y **Paquetes de Trabajo (Work Packages)**, desacoplando la experiencia de usuario de la codificación interna del sistema.
3. **Carácter Propuesto:** Todos los asignamientos presentados en este documento tienen estado `PROPOSED` y confianza `LOW`, sujetos a reconciliación normativa y revisión con el equipo de dominio.

---

## 2. Módulos Técnicos Propuestos y Asignación de Workflows (16 Workflows)

### 2.1 Módulo 1: SIHO-A (Seguridad Industrial, Higiene Ocupacional y Ambiente)

#### 2.1.1 `wf-043-aprobacion-ptw`
```yaml
moduleAssignment:
  workflowId: wf-043-aprobacion-ptw
  module: SIHO-A
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

#### 2.1.2 `wf-048-gestion-ambiental-siho`
```yaml
moduleAssignment:
  workflowId: wf-048-gestion-ambiental-siho
  module: SIHO-A
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

#### 2.1.3 `wf-051-control-aislamiento-loto`
```yaml
moduleAssignment:
  workflowId: wf-051-control-aislamiento-loto
  module: SIHO-A
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

---

### 2.2 Módulo 2: Construcción y Obras Civiles

#### 2.2.1 `wf-042-inspeccion-izaje`
```yaml
moduleAssignment:
  workflowId: wf-042-inspeccion-izaje
  module: Construcción y Obras Civiles
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

#### 2.2.2 `wf-050-ensayos-civiles-suelos`
```yaml
moduleAssignment:
  workflowId: wf-050-ensayos-civiles-suelos
  module: Construcción y Obras Civiles
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

#### 2.2.3 `wf-053-registro-personal-qr`
```yaml
moduleAssignment:
  workflowId: wf-053-registro-personal-qr
  module: Construcción y Obras Civiles
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

#### 2.2.4 `wf-054-flota-equipos-pesados`
```yaml
moduleAssignment:
  workflowId: wf-054-flota-equipos-pesados
  module: Construcción y Obras Civiles
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

#### 2.2.5 `wf-075-libro-de-obra`
```yaml
moduleAssignment:
  workflowId: wf-075-libro-de-obra
  module: Construcción y Obras Civiles
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

---

### 2.3 Módulo 3: QA/QC y NDT

#### 2.3.1 `wf-044-reporte-tabular`
```yaml
moduleAssignment:
  workflowId: wf-044-reporte-tabular
  module: QA/QC y NDT
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

#### 2.3.2 `wf-052-instrumentacion-lazos-pid`
```yaml
moduleAssignment:
  workflowId: wf-052-instrumentacion-lazos-pid
  module: QA/QC y NDT
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

#### 2.3.3 `wf-066-bim3d-integridad-soldadura`
```yaml
moduleAssignment:
  workflowId: wf-066-bim3d-integridad-soldadura
  module: QA/QC y NDT
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

---

### 2.4 Módulo 4: Ingeniería y GIS

#### 2.4.1 `wf-065-gis-alignment-sheets-kp`
```yaml
moduleAssignment:
  workflowId: wf-065-gis-alignment-sheets-kp
  module: Ingeniería y GIS
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

#### 2.4.2 `wf-073-medicion-avance-ingenieria`
```yaml
moduleAssignment:
  workflowId: wf-073-medicion-avance-ingenieria
  module: Ingeniería y GIS
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

#### 2.4.3 `wf-077-supervision-ingenieria`
```yaml
moduleAssignment:
  workflowId: wf-077-supervision-ingenieria
  module: Ingeniería y GIS
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

---

### 2.5 Módulo 5: Precomisionado y Handover

#### 2.5.1 `wf-074-completacion-mecanica`
```yaml
moduleAssignment:
  workflowId: wf-074-completacion-mecanica
  module: Precomisionado y Handover
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

#### 2.5.2 `wf-076-terminacion-construccion`
```yaml
moduleAssignment:
  workflowId: wf-076-terminacion-construccion
  module: Precomisionado y Handover
  status: PROPOSED
  confidence: LOW
  requiresReconciliation: true
```

---

## 3. Matriz Resumen de Cobertura por Módulo

| Módulo Técnico | Workflows Asociados | Cantidad | Estado del Mapeo |
|---|---|---:|---|
| **SIHO-A** | `wf-043`, `wf-048`, `wf-051` | 3 | PROPOSED / LOW CONFIDENCE |
| **Construcción y Obras Civiles** | `wf-042`, `wf-050`, `wf-053`, `wf-054`, `wf-075` | 5 | PROPOSED / LOW CONFIDENCE |
| **QA/QC y NDT** | `wf-044`, `wf-052`, `wf-066` | 3 | PROPOSED / LOW CONFIDENCE |
| **Ingeniería y GIS** | `wf-065`, `wf-073`, `wf-077` | 3 | PROPOSED / LOW CONFIDENCE |
| **Precomisionado y Handover** | `wf-074`, `wf-076` | 2 | PROPOSED / LOW CONFIDENCE |
| **Total General** | **16 Workflows Registrados** | **16** | **PROPOSED** |
