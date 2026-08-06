# Arquitectura del Kernel de Workflows (Plugin-Kernel / WorkflowRegistry) — Industrial Control 360

*Fecha de Creación:* 2026-08-06  
*Sprint:* F-D — Plugin-Kernel / WorkflowRegistry  

---

## 1. Visión General y Objetivo de Arquitectura

El **Plugin-Kernel / WorkflowRegistry** es el patrón de arquitectura extensible de IC360 diseñado para escalar de los 41 módulos iniciales a **más de 100+ workflows industriales** sin reescribir ni modificar la infraestructura central ni las páginas existentes (`src/pages/`).

### Principios Fundamentales:
1. **Desacoplamiento Total del Runner:** El motor de ejecución (`WorkflowRunner`) no contiene JSX ni dependencias de React. Ejecuta reglas de negocio, esquemas Zod, Hard Gates y transiciones en TypeScript puro.
2. **Contrato de Calidad Unificado:** Todo workflow expone un esquema de validación Zod, al menos un Hard Gate de seguridad o calidad, y una fábrica que genera un `DocumentViewModel` normalizado.
3. **Cero Exportadores Propios:** Ningún workflow importa librerías de renderizado o generación de documentos (`jsPDF`, `docx`, `xlsx`, `pptx`). Todo entregable se emite como un `DocumentViewModel` consumido por el motor de exportación global.
4. **Ruteo Dinámico Inviolable:** Todas las instancias de workflows se resuelven a través de la ruta estable `/workflows/:workflowId/:instanceId`.

---

## 2. Contrato `WorkflowDefinition` Completo

Ubicación del contrato: `src/lib/workflows/contracts.ts`

```typescript
export interface WorkflowDefinition<T = any> {
  id: string; // ID único e inmutable (ej. 'wf-045-inspeccion-recubrimientos')
  title: string; // Título descriptivo oficial
  description?: string; // Breve descripción técnica o normativa
  phase: WorkflowPhase; // Número de Fase (1 a 7 de FEL / GPG IC360)
  rolesAllowed: WorkflowRole[]; // Roles autorizados ('superadmin', 'gerente', 'supervisor', 'inspector', 'campo', etc.)
  captureComponent: React.ComponentType<WorkflowComponentProps<T>>; // Componente React de captura de datos
  schema: z.ZodType<T>; // Esquema Zod de validación de campos
  hardGates: HardGate<T>[]; // Reglas duras de seguridad/calidad
  deliverable?: WorkflowDeliverable<T>; // Fábrica de DocumentViewModel
  permissions?: Record<string, WorkflowRole[]>; // Matriz de permisos finos por acción
  stateTransitions?: WorkflowTransition[]; // Transiciones permitidas en la máquina de estados
  initialState?: WorkflowState; // Estado inicial (default: 'draft')
}
```

---

## 3. Procedimiento para Añadir el Workflow #4 (sin modificar código existente)

Para agregar un nuevo workflow (ej. `wf-045-inspeccion-recubrimientos`) a la plataforma, se siguen exactamente 3 pasos aislados:

### Paso 1: Crear la carpeta y archivos del workflow en `src/workflows/`

Cree el directorio `src/workflows/wf-045-inspeccion-recubrimientos/`:

1. `components/CoatingInspectionCapture.tsx`: Componente de interfaz de captura.
2. `definition.ts`: Definición que exporta `wf045Definition` cumpliendo la interfaz `WorkflowDefinition`.

### Paso 2: Registrar el workflow en `src/workflows/index.ts`

Añada una sola línea de importación y llamada en `src/workflows/index.ts`:

```typescript
import { wf045Definition } from './wf-045-inspeccion-recubrimientos/definition';

export function ensureWorkflowsRegistered(): void {
  // ...
  registerWorkflow(wf045Definition);
}
```

### Paso 3: Navegar al workflow

El workflow queda automáticamente expuesto y accesible en la ruta dinámica sin tocar `App.tsx`:
```text
https://app.ic360.io/workflows/wf-045-inspeccion-recubrimientos/inst-001
```

---

## 4. Ejemplos de los 3 Pilotos Implementados

### 4.1 Piloto 1: `wf-042-inspeccion-izaje` (Captura Simple + Hard Gate ASME B30.5)
- **Propósito:** Inspección pre-operativa de grúas móviles y elementos de maniobra de izaje.
- **Fase:** 4 (Inspección / Supervisión).
- **Hard Gate:** `gate-hook-latch` — Verifica que el pestillo de seguridad del gancho esté intacto. Si está defectuoso, bloquea la maniobra.
- **Entregable:** Certificado Técnico de Inspección de Izaje (`DocumentViewModel`).

### 4.2 Piloto 2: `wf-043-aprobacion-ptw` (Aprobación Secuencial + Hard Gate Atmosférico)
- **Propósito:** Emisión y autorización de Permisos de Trabajo Seguro (PTW SIHO-A).
- **Fase:** 2 (Seguridad & SIHO-A).
- **Transiciones:** `draft` → `submitted` → `safety_approved` | `rejected`.
- **Hard Gate:** `gate-atmospheric-test` — Exige 0.0% LEL, Oxígeno entre 19.5% y 23.5%, y 0 PPM de H2S.
- **Entregable:** Permiso de Trabajo Seguro Certificado (`DocumentViewModel`).

### 4.3 Piloto 3: `wf-044-reporte-tabular` (Documento Tabular + Tablas Estructuradas)
- **Propósito:** Registro masivo de juntas soldadas y ensayo por Ultrasonido (UT) de pared.
- **Fase:** 5 (Control de Calidad NDT).
- **Hard Gate:** `gate-min-joints` — Garantiza tabla no vacía con espesores medidos ≥ 1.0 mm.
- **Entregable:** Informe Tabular Certificado NDT con headers `["Junta N°", "Ubicación / KP", "Espesor UT (mm)", "Dictamen NDT"]` y fila de resumen con tasa de aprobación.

---

## 5. Matriz de Componentes del Kernel

| Módulo | Archivo | Responsabilidad |
|---|---|---|
| Contratos Zod & Tipos | `src/lib/workflows/contracts.ts` | Define `WorkflowDefinition`, `WorkflowPhase`, `HardGate`, `WorkflowDeliverable`, etc. |
| Registro Inmutable | `src/lib/workflows/registry.ts` | Mantiene el Map privado con prevención de IDs duplicados y bloqueo inmutable |
| Motor de Reglas | `src/lib/workflows/runner.ts` | TypeScript puro: evalúa gates, valida esquemas Zod, comprueba roles y genera deliverables |
| Contenedor de Ruta | `src/pages/WorkflowRunnerPage.tsx` | Componente de página que resuelve dinámicamente `/workflows/:workflowId/:instanceId` |
