# Estrategia de Migración por Olas (Migration Waves) — Industrial Control 360

*Fecha de Creación:* 2026-08-06  
*Sprint:* F-D2 — Primera Ola de Migración Módulos Legados  
*Patrón:* Plugin-Kernel / WorkflowRegistry  

---

## 1. Misión y Criterios de Selección

El objetivo de la migración por olas es desacoplar progresivamente los módulos monolíticos ubicados en `src/pages/` convirtiéndolos en **Workflows Kernel-compliant** registrados de manera inmutable en `src/lib/workflows/registry.ts`.

### Criterios de Selección para Olas de Migración:
1. **Alto Uso y Valor Operativo:** Prioridad a módulos de alta frecuencia en campo (inspección, seguridad SIHO-A, calidad NDT, ensayos de suelos).
2. **Auto-contenidos:** Lógica modular con contratos claros de entrada, esquemas de validación Zod y reglas de negocio identificables.
3. **Cero Dependencias Circulares:** Ausencia de importaciones directas de librerías de renderizado o generación PDF/DOCX/XLSX desde la lógica de negocio.
4. **Respeto a Rutas Existentes:** Transición transparente utilizando alias y wrappers `<WorkflowRunnerPage overrideWorkflowId="..." />` para garantizar retrocompatibilidad.

---

## 2. Mapa de Olas de Migración

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MATRIZ DE OLAS IC360                             │
├─────────────────┬───────────────────────────────────┬────────┬──────────────┤
│ Ola             │ Módulos / Workflows               │ Fase   │ Estado       │
├─────────────────┼───────────────────────────────────┼────────┼──────────────┤
│ Ola 0 (Pilotos) │ wf-042-inspeccion-izaje           │ Fase 4 │ COMPLETADO   │
│                 │ wf-043-aprobacion-ptw             │ Fase 2 │ COMPLETADO   │
│                 │ wf-044-reporte-tabular            │ Fase 5 │ COMPLETADO   │
├─────────────────┼───────────────────────────────────┼────────┼──────────────┤
│ Ola 1 (F-D2)    │ wf-048-gestion-ambiental-siho     │ Fase 4 │ COMPLETADO   │
│                 │ wf-050-ensayos-civiles-suelos     │ Fase 4 │ COMPLETADO   │
│                 │ wf-051-control-aislamiento-loto   │ Fase 4 │ COMPLETADO   │
├─────────────────┼───────────────────────────────────┼────────┼──────────────┤
│ Ola 2 (F-D2+)   │ wf-052-instrumentacion-lazos-pid  │ Fase 3 │ EVIDENCE_READY │
│                 │ wf-053-registro-personal-qr       │ Fase 4 │ EVIDENCE_READY │
│                 │ wf-054-flota-equipos-pesados      │ Fase 4 │ EVIDENCE_READY │
├─────────────────┼───────────────────────────────────┼────────┼──────────────┤
│ Ola 3 (F-D2++)  │ wf-073-medicion-avance-ingenieria │ Fase 2 │ EVIDENCE_READY │
│                 │ wf-075-libro-de-obra              │ Fase 4 │ EVIDENCE_READY │
│                 │ wf-065-gis-alignment-sheets-kp    │ Fase 5 │ EVIDENCE_READY │
├─────────────────┼───────────────────────────────────┼────────┼──────────────┤
│ Ola 4 (F-D2+4)  │ wf-077-supervision-ingenieria     │ Fase 2 │ PLANIFICADO  │
│                 │ wf-066-bim3d-integridad-soldadura │ Fase 5 │ PLANIFICADO  │
│                 │ wf-074-completacion-mecanica      │ Fase 7 │ PLANIFICADO  │
├─────────────────┼───────────────────────────────────┼────────┼──────────────┤
│ Ola 5 (Reserv)  │ wf-076-terminacion-construccion   │ Fase 7 │ RESERVADO    │
└─────────────────┴───────────────────────────────────┴────────┴──────────────┘
```

---

## 3. Detalle de Workflows Migrados en la Ola 1 (Sprint F-D2)

### 3.1 `wf-048-gestion-ambiental-siho`
- **Origen Legado:** `src/pages/EnvironmentalManagement.tsx`
- **Fase FEL/GPG:** 4 (Ejecución & Campo)
- **Propósito:** Gestión de Aspectos e Impactos Ambientales (PGA PDVSA MA-01) y Manifiestos de Traza de Desechos Peligrosos RASDA.
- **Hard Gates:**
  1. `gate-rasda-disposal-site`: Verifica sitio de disposición final certificado RASDA para desechos peligrosos.
  2. `gate-pga-mitigation`: Garantiza medidas de mitigación en aspectos de significancia Alta.
- **Entregable:** `DocumentViewModel` — Manifiesto y Certificado Ambiental RASDA.

### 3.2 `wf-050-ensayos-civiles-suelos`
- **Origen Legado:** `src/pages/CivilEngineeringRegistry.tsx`
- **Fase FEL/GPG:** 4 (Ejecución & Campo)
- **Propósito:** Ensayos de laboratorio y campo para mecánica de suelos (Cono de Arena / Densidad) y resistencia de probetas de concreto.
- **Normativas:** COVENIN 2000-92, ASTM D1556, ACI 318, COVENIN 1753.
- **Hard Gates:**
  1. `gate-compaction-95`: Exige grado de compactación mínimo (≥ 95% o 98% Proctor).
  2. `gate-concrete-strength`: Verifica porcentaje de resistencia $f'c$ alcanzado a edad de prueba (7, 14 o 28 días).
- **Entregable:** `DocumentViewModel` — Informe Técnico Certificado de Ensayos Civiles.

### 3.3 `wf-051-control-aislamiento-loto`
- **Origen Legado:** `src/pages/LotoIsolation.tsx`
- **Fase FEL/GPG:** 4 (Ejecución & Campo)
- **Propósito:** Registro y control de puntos de aislamiento de energías peligrosas (Eléctrica, Mecánica, Hidráulica, Química) y tarjetas/candados LOTO.
- **Normativa:** PDVSA SI-S-28 (Bloqueo, Etiquetado y Prueba de Energía Cero).
- **Hard Gates:**
  1. `gate-loto-zero-energy`: Exige comprobación de Prueba de Energía Cero (0 PSI, 0 Volts, 0 PPM toxicidad) antes de autorizar el aislamiento.
  2. `gate-loto-physical-lock`: Verifica instalación física de candado y pinza múltiple.
- **Entregable:** `DocumentViewModel` — Certificado de Aislamiento y Prueba de Energía Cero LOTO.

---

## 4. Guía de Retrocompatibilidad de Rutas

Para asegurar que los usuarios y enlaces existentes no sufran roturas de navegación, las rutas tradicionales en `src/App.tsx` continúan funcionando transparentemente invocando el runner dinámico:

```tsx
// Ejemplo de preservación de ruta legada
<Route path="environmental-management" element={
  <WorkflowRunnerPage overrideWorkflowId="wf-048-gestion-ambiental-siho" />
} />
<Route path="civil-engineering" element={
  <WorkflowRunnerPage overrideWorkflowId="wf-050-ensayos-civiles-suelos" />
} />
<Route path="loto-isolation" element={
  <WorkflowRunnerPage overrideWorkflowId="wf-051-control-aislamiento-loto" />
} />
```

Ambas URLs (`/environmental-management` y `/workflows/wf-048-gestion-ambiental-siho/inst-001`) convergen en el mismo Kernel con idéntica seguridad, validación Zod y trazabilidad.

---

## 5. Planificación Oficial de Ola 4 y Reserva de Ola 5

### 5.1 Tabla Oficial de Asignación de Ola 4 y Ola 5

| Ola | Workflow | Fase | Estado | Motivo | Dependencias |
|---|---|---:|---|---|---|
| Ola 4 | `wf-077-supervision-ingenieria` | 2 | PLANIFICADO | Certificación ORC de ingeniería de detalle; compuerta FEL-2 crítica para validar entregables técnicos antes de la ejecución física. | Paquetes de ingeniería de detalle, memorias de cálculo de especialidad. |
| Ola 4 | `wf-066-bim3d-integridad-soldadura` | 5 | PLANIFICADO | Control NDT de spools BIM 3D, doblado en frío PDVSA H-221 y navegabilidad ILI PIG en Fase 5 de inspección y calidad. | Contrato Spooling 3D, registros NDT de soldadura. |
| Ola 4 | `wf-074-completacion-mecanica` | 7 | PLANIFICADO | Certificación de Completación Mecánica y Punchlist Cat A (0 ítems abiertos); requisito previo indispensable para precomisionado y transferencia. | Hitos de montaje mecánico, dossier Databook, certificados de pruebas hidrostáticas. |
| Ola 5 | `wf-076-terminacion-construccion` | 7 | RESERVADO | Transferencia formal de custodia a Operaciones PDVSA. Reservado para la Ola 5 al depender lógicamente de la certificación de Completación Mecánica (`wf-074`). | Requiere `wf-074` certificado, calibración PSV vigente, caminata de entrega y planos As-Built aprobados. |

### 5.2 Criterio de Priorización y Justificación
1. **Límite de Gobernanza**: La política de migración restringe estrictamente cada ola a un máximo de 3 workflows para garantizar una revisión exhaustiva de hard gates, aislamiento tenant y presupuesto de bundle.
2. **Secuencia Logica GPG/FEL Pipeline**:
   - `wf-077` (Fase 2) valida el cierre de la ingeniería de detalle y la emisión de certificados ORC.
   - `wf-066` (Fase 5) asegura la integridad física de spools y la libre navegabilidad para inspección inteligente PIG durante la fase de calidad.
   - `wf-074` (Fase 7) liquida la completación mecánica del montaje y la eliminación de pendientes críticos (Punchlist Cat A).
   - `wf-076` (Fase 7) constituye el **acto final de entrega y transferencia de custodia operativa**. En el ciclo de vida del activo, no es técnicamente válido otorgar el acta de transferencia de custodia (`wf-076`) sin haber verificado y cerrado previamente el acta de completación mecánica (`wf-074`). Por lo tanto, `wf-076` queda reservado de forma determinista para la Ola 5.
