# PROJECT_OPERATING_MODEL.md — Modelo Operativo de Dominio (IC360-NEXUS)

*Estado:* **OPERATING_MODEL_DEFINED**  
*Fecha:* 2026-08-10  
*Sprint:* F-OPS-REORDER-01  

---

## 1. Misión y Principios Fundamentales del Modelo Operativo

El Modelo Operativo de Industrial Control 360 (IC360-NEXUS) reordena la arquitectura de la plataforma separando de forma estricta las plantillas normativas reutilizables (`WorkflowDefinition`) de los datos de proyectos reales (`Project`, `Contract`, `WorkPackage`, `WorkflowInstance`).

### Reglas Inviolables de Dominio:
1. **Separación Definición / Instancia:** `WorkflowDefinition` es inmutable y neutro a proyectos. No contiene campos de clientes, obras, contratos ni estados operativos.
2. **Jerarquía Operativa Obligatoria:** Toda `WorkflowInstance` pertenece obligatoriamente a un `projectId`, `contractId` y `workPackageId`. No existen instancias "huérfanas" ni globales.
3. **Distinción de Artefactos de Dominio:**
   - **`Evidence` ≠ `Deliverable`:** Una evidencia (foto, PDF, lectura de sensor) es una prueba cruda de ejecución de campo; no es un entregable contractual.
   - **`Deliverable` ≠ `DossierDocument`:** Un entregable es un documento formalizado con resumen y firmas; un `DossierDocument` es un registro catalogado y clasificado en la estructura de capítulos del Databook final de entrega.
4. **Clasificación en Databook:** Todo `DossierDocument` requiere explícitamente `projectId`, `workPackageId`, `workflowInstanceId` y `documentClassification`.

---

## 2. Contratos Entidad por Entidad (16 Entidades)

### 2.1 Project
```yaml
entityContract:
  id: Project
  purpose: Entidad raíz multi-tenant que agrupa todas las obras, contratos y ejecuciones operativas de una organización.
  requiredFields:
    - projectId
    - orgId
    - name
    - code
    - status
  relationships:
    - parent: Organization
    - children:
        - Contract
        - WorkPackage
        - WorkflowInstance
  lifecycle: CREATED -> ACTIVE -> SUSPENDED -> COMPLETED -> ARCHIVED
  owner: Project Manager / Gerente de Proyecto
  sourceOfTruth: Firestore (/organizations/{orgId}/projects/{projectId})
  auditRequirements: Registro inmutable de creación, cambio de estado y cierre.
  versioning: SemVer o timestamped metadata
  status: CONTRACT_DEFINED
```

### 2.2 Contract
```yaml
entityContract:
  id: Contract
  purpose: Vinculación jurídica y técnica entre la organización y un cliente o contratista.
  requiredFields:
    - contractId
    - projectId
    - orgId
    - contractNumber
    - clientName
  relationships:
    - parent: Project
    - children:
        - WorkPackage
  lifecycle: DRAFT -> SIGNED -> ACTIVE -> CLOSED -> TERMINATED
  owner: Administrador de Contrato
  sourceOfTruth: Firestore (/organizations/{orgId}/projects/{projectId}/contracts/{contractId})
  auditRequirements: Trazabilidad de adendas, montos y límites contractuales.
  versioning: Revision history
  status: CONTRACT_DEFINED
```

### 2.3 WorkPackage
```yaml
entityContract:
  id: WorkPackage
  purpose: Paquete de trabajo / WBS de construcción, ingeniería o QA/QC.
  requiredFields:
    - workPackageId
    - projectId
    - contractId
    - code
    - title
    - wbsCode
  relationships:
    - parent: Contract
    - children:
        - WorkflowInstance
  lifecycle: PLANNED -> RELEASED -> IN_EXECUTION -> CLOSED
  owner: Gerente de Construcción / Lead Engineer
  sourceOfTruth: Firestore (/organizations/{orgId}/projects/{projectId}/workPackages/{workPackageId})
  auditRequirements: Auditoría de asignación presupuestaria y física.
  versioning: WBS revision
  status: CONTRACT_DEFINED
```

### 2.4 TechnicalModule
```yaml
entityContract:
  id: TechnicalModule
  purpose: Categoría de especialidad técnica (SIHO-A, Construcción, QA/QC, Ingeniería, Precomisionado) que agrupa workflows.
  requiredFields:
    - moduleId
    - code
    - name
    - description
  relationships:
    - children:
        - WorkflowDefinition
  lifecycle: ACTIVE -> DEPRECATED
  owner: System Administrator / Domain Architect
  sourceOfTruth: System Registry (`MODULE_WORKFLOW_MAPPING.md`)
  auditRequirements: Control de versiones de arquitectura.
  versioning: Static Enum
  status: CONTRACT_DEFINED
```

### 2.5 WorkflowDefinition
```yaml
entityContract:
  id: WorkflowDefinition
  purpose: Plantilla canónica de proceso que define pasos, esquemas Zod, controles normativos y entregables.
  requiredFields:
    - workflowId
    - name
    - phase
    - version
    - schema
  relationships:
    - parent: TechnicalModule
    - children:
        - WorkflowInstance
  lifecycle: DRAFT -> ACTIVE -> DEPRECATED
  owner: Domain Architect
  sourceOfTruth: Codebase (`src/workflows/*/definition.ts`)
  auditRequirements: Firma hash del archivo de definición.
  versioning: SemVer
  status: CONTRACT_DEFINED
```

### 2.6 WorkflowInstance
```yaml
entityContract:
  id: WorkflowInstance
  purpose: Ejecución real de un workflow en el contexto de un proyecto, contrato y paquete de trabajo.
  requiredFields:
    - instanceId
    - workflowId
    - projectId
    - contractId
    - workPackageId
    - status
    - currentStep
  relationships:
    - parent:
        - WorkflowDefinition
        - WorkPackage
    - children:
        - ActivityInstance
        - Evidence
        - Deliverable
  lifecycle: DRAFT -> IN_PROGRESS -> SUBMITTED -> UNDER_REVIEW -> CHANGES_REQUESTED -> APPROVED -> ISSUED -> ARCHIVED
  owner: Inspector de Campo / Responsables de Flujo
  sourceOfTruth: Firestore (/organizations/{orgId}/projects/{projectId}/workflowInstances/{instanceId})
  auditRequirements: Historial inmutable de transiciones de estado y firmas.
  versioning: Step sequence log
  status: CONTRACT_DEFINED
```

### 2.7 ActivityDefinition
```yaml
entityContract:
  id: ActivityDefinition
  purpose: Definición de una actividad o paso individual dentro de un WorkflowDefinition.
  requiredFields:
    - activityId
    - workflowId
    - title
    - stepNumber
  relationships:
    - parent: WorkflowDefinition
    - children:
        - ActivityInstance
  lifecycle: DEFINED
  owner: Domain Architect
  sourceOfTruth: Codebase (`definition.ts`)
  auditRequirements: N/A (Estático)
  versioning: Inherited from WorkflowDefinition
  status: CONTRACT_DEFINED
```

### 2.8 ActivityInstance
```yaml
entityContract:
  id: ActivityInstance
  purpose: Estado de ejecución de una actividad específica dentro de una WorkflowInstance.
  requiredFields:
    - activityInstanceId
    - instanceId
    - activityId
    - status
  relationships:
    - parent: WorkflowInstance
    - children:
        - Evidence
  lifecycle: PENDING -> IN_PROGRESS -> COMPLETED -> SKIPPED
  owner: Operador / Inspector
  sourceOfTruth: Firestore (/organizations/{orgId}/projects/{projectId}/workflowInstances/{instanceId})
  auditRequirements: Timestamps de inicio y finalización.
  versioning: N/A
  status: CONTRACT_DEFINED
```

### 2.9 Evidence
```yaml
entityContract:
  id: Evidence
  purpose: Prueba primaria no procesada (fotografía, lectura de calibración, archivo borrador) recolectada en campo.
  requiredFields:
    - evidenceId
    - instanceId
    - projectId
    - type
    - storagePath
    - capturedAt
    - capturedBy
  relationships:
    - parent:
        - WorkflowInstance
        - ActivityInstance
    - children:
        - Deliverable
  lifecycle: CAPTURED -> VALIDATED -> REJECTED -> ATTACHED
  owner: Inspector de Campo
  sourceOfTruth: Cloud Storage + Firestore metadata
  auditRequirements: Hash SHA-256 de archivo y geolocalización/timestamp.
  versioning: Immutable raw file
  status: CONTRACT_DEFINED
```

### 2.10 DeliverableDefinition
```yaml
entityContract:
  id: DeliverableDefinition
  purpose: Especificación del entregable contractual (ej. Acta, Certificado, Reporte Tabular) que genera una WorkflowDefinition.
  requiredFields:
    - deliverableDefId
    - workflowId
    - documentType
    - templateFormat
  relationships:
    - parent: WorkflowDefinition
    - children:
        - Deliverable
  lifecycle: DEFINED
  owner: Domain Architect
  sourceOfTruth: Codebase (`definition.ts -> DocumentViewModel`)
  auditRequirements: N/A
  versioning: Inherited
  status: CONTRACT_DEFINED
```

### 2.11 Deliverable
```yaml
entityContract:
  id: Deliverable
  purpose: Documento formal consolidado producido por la ejecución de un workflow, apto para firma y revisión.
  requiredFields:
    - deliverableId
    - instanceId
    - projectId
    - workPackageId
    - documentNumber
    - format
    - status
  relationships:
    - parent: WorkflowInstance
    - children:
        - OfficialIssueAuthorization
        - DossierDocument
  lifecycle: DRAFT -> GENERATED -> SIGNED -> ISSUED
  owner: Ingeniero Residente / QA Leader
  sourceOfTruth: Firestore + Storage (`/exports/`)
  auditRequirements: Control de versión y trazabilidad de firmas PENDING/SIGNED.
  versioning: Revision letter (Rev 0, Rev A, etc.)
  status: CONTRACT_DEFINED
```

### 2.12 ApprovalPolicy
```yaml
entityContract:
  id: ApprovalPolicy
  purpose: Reglas de gobernanza que rigen quiénes deben firmar un Deliverable y bajo qué matriz de roles.
  requiredFields:
    - policyId
    - workflowId
    - requiredRoles
    - minSignatures
  relationships:
    - parent: WorkflowDefinition
    - children:
        - OfficialIssueAuthorization
  lifecycle: ACTIVE
  owner: Quality Assurance Manager
  sourceOfTruth: Codebase (`definition.ts -> signatories`)
  auditRequirements: Verificación estricta en backend.
  versioning: Inherited
  status: CONTRACT_DEFINED
```

### 2.13 OfficialIssueAuthorization
```yaml
entityContract:
  id: OfficialIssueAuthorization
  purpose: Autorización explícita y sellado formal para la emisión oficial de un Deliverable.
  requiredFields:
    - authorizationId
    - deliverableId
    - authorizedBy
    - authorizedAt
    - sealHash
  relationships:
    - parent: Deliverable
    - children:
        - DossierDocument
  lifecycle: PENDING -> GRANTED -> REVOKED
  owner: Representante de la Inspección / Cliente
  sourceOfTruth: Firestore audit log
  auditRequirements: Certificado digital / hash inmutable de autorización.
  versioning: Single instance
  status: CONTRACT_DEFINED
```

### 2.14 DossierDocument
```yaml
entityContract:
  id: DossierDocument
  purpose: Documento final registrado y catalogado en la estructura de Databook de entrega al cliente.
  requiredFields:
    - dossierDocId
    - projectId
    - workPackageId
    - workflowInstanceId
    - deliverableId
    - documentClassification
    - chapterId
  relationships:
    - parent: Deliverable
    - memberOf: DossierChapter
  lifecycle: CATALOGED -> VERIFIED -> INDEXED -> BUNDLED
  owner: Document Controller / Databook Manager
  sourceOfTruth: Firestore (/organizations/{orgId}/projects/{projectId}/dossiers/{dossierDocId})
  auditRequirements: Índice contractual y matriz de completitud.
  versioning: Final Version Tag
  status: CONTRACT_DEFINED
```

### 2.15 DossierChapter
```yaml
entityContract:
  id: DossierChapter
  purpose: Capítulo o sección estructurada del Databook de obra (ej. Cap. 04 — QA/QC Soldadura, Cap. 07 — Handover).
  requiredFields:
    - chapterId
    - projectId
    - code
    - title
    - orderIndex
  relationships:
    - parent: Project
    - children:
        - DossierDocument
  lifecycle: CREATED -> IN_ASSEMBLY -> APPROVED -> FROZEN
  owner: Lead Document Controller
  sourceOfTruth: Firestore
  auditRequirements: Árbol estructural inmutable al cierre.
  versioning: Structure Revision
  status: CONTRACT_DEFINED
```

### 2.16 AuditEvent
```yaml
entityContract:
  id: AuditEvent
  purpose: Registro inmutable de auditoría para cualquier evento de cambio de estado, evaluación de control o firma.
  requiredFields:
    - eventId
    - orgId
    - projectId
    - entityType
    - entityId
    - action
    - performedBy
    - timestamp
  relationships:
    - targets: Any Domain Entity
  lifecycle: APPEND_ONLY
  owner: Security Officer / System Auditor
  sourceOfTruth: Firestore `/auditLogs` (Append-Only)
  auditRequirements: Cero modificación / cero borrado.
  versioning: Immutable Event Log
  status: CONTRACT_DEFINED
```
