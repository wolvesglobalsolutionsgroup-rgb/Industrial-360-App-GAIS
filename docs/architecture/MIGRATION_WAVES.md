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
│ Ola 1 (F-D2)    │ wf-048-gestion-ambiental-siho     │ Fase 4 │ EN EJECUCIÓN │
│                 │ wf-050-ensayos-civiles-suelos     │ Fase 4 │ EN EJECUCIÓN │
│                 │ wf-051-control-aislamiento-loto   │ Fase 4 │ EN EJECUCIÓN │
├─────────────────┼───────────────────────────────────┼────────┼──────────────┤
│ Ola 2 (F-D2+)   │ wf-052-instrumentacion-lazos-pid  │ Fase 3 │ EVIDENCE_READY │
│                 │ wf-053-registro-personal-qr       │ Fase 4 │ EVIDENCE_READY │
│                 │ wf-054-flota-equipos-pesados      │ Fase 4 │ EVIDENCE_READY │
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
