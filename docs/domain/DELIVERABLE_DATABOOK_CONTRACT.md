# DELIVERABLE_DATABOOK_CONTRACT.md — Contrato de Entregables y Estructura de Databook (IC360-NEXUS)

*Estado:* **DATABOOK_CONTRACT_DEFINED**  
*Fecha:* 2026-08-10  
*Sprint:* F-OPS-REORDER-01  

---

## 1. Definición de Artefactos de Entrada, Salida y Catalogación

```
[ InputDefinition / EvidenceDefinition ]
                   │
                   ▼ (Procesamiento & Validación Zod)
        [ WorkflowInstance ]
                   │
                   ▼ (Evaluación de Controles Advisory)
        [ DeliverableDefinition ]
                   │
                   ▼ (Firmas & Autorización)
     [ OfficialIssueAuthorization ]
                   │
                   ▼ (Catalogación de Entrega)
[ DossierDocument ] ──► Ubicado en [ DossierChapter ] dentro del Databook de Proyecto
```

---

## 2. Contratos de Estructura de Datos (7 Definiciones)

### 2.1 InputDefinition
```yaml
entityContract:
  id: InputDefinition
  purpose: Especificación del formulario, campos y esquema Zod de entrada requeridos para capturar datos en un paso.
  requiredFields:
    - inputId
    - workflowId
    - stepKey
    - jsonSchema
  relationships:
    - parent: WorkflowDefinition
```

### 2.2 EvidenceDefinition
```yaml
entityContract:
  id: EvidenceDefinition
  purpose: Criterio de aceptación para archivos adjuntos y evidencias crudas (fotografías, certificados de trazabilidad, lecturas).
  requiredFields:
    - evidenceDefId
    - workflowId
    - mediaType
    - required
    - maxSizeBytes
  relationships:
    - parent: WorkflowDefinition
```

### 2.3 DeliverableDefinition
```yaml
entityContract:
  id: DeliverableDefinition
  purpose: Modelo de vista y exportación (`DocumentViewModel`) que define el documento contractual generado por el workflow.
  requiredFields:
    - deliverableDefId
    - workflowId
    - title
    - documentType
    - exportFormats
  relationships:
    - parent: WorkflowDefinition
```

### 2.4 ApprovalPolicy
```yaml
entityContract:
  id: ApprovalPolicy
  purpose: Matriz de firmas y políticas de aprobación requeridas para validar formalmente el entregable.
  requiredFields:
    - policyId
    - workflowId
    - requiredSignatories
  relationships:
    - parent: WorkflowDefinition
```

### 2.5 OfficialIssueAuthorization
```yaml
entityContract:
  id: OfficialIssueAuthorization
  purpose: Registro de la emisión oficial del entregable firmado con sello hash inmutable.
  requiredFields:
    - authorizationId
    - deliverableId
    - authorizedBy
    - authorizedAt
    - sealHash
  relationships:
    - parent: Deliverable
```

### 2.6 DossierDocument
```yaml
entityContract:
  id: DossierDocument
  purpose: Documento final registrado y clasificado dentro de la estructura de capítulos del Databook.
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
```

### 2.7 DossierChapter
```yaml
entityContract:
  id: DossierChapter
  purpose: Sección estructurada del Databook de obra organizada según las especificaciones del cliente o norma del proyecto.
  requiredFields:
    - chapterId
    - projectId
    - code
    - title
    - orderIndex
  relationships:
    - parent: Project
```

---

## 3. Estructura Estándar para Evaluación de Controles Normativos (Advisory)

Cualquier regla de ingeniería, control normativo o validación técnica de campo debe evaluarse con la siguiente estructura estandarizada no bloqueante:

```yaml
controlEvaluation:
  controlId: gate-sample-control-id
  result:
    - PASS
    - FAIL
    - WARNING
    - NOT_EVALUATED
  evidence:
    summary: Resumen del resultado de evaluación de la norma
    technicalReference: ASME B31.3 / API 1163 / ISO 9001
  evaluatedAt: 2026-08-10T10:00:00Z
  evaluatedBy: KernelRulesEngine
  blocking: false
  humanOverrideAllowed: true
```

### Reglas de Gobernanza sobre Controles:
- **`blocking: false`:** Los controles normativos reportan hallazgos pero **no bloquean mecánicamente** el progreso de la captura ni la generación de borradores.
- **`humanOverrideAllowed: true`:** El especialista de ingeniería o inspector autorizado puede proceder con la firma o emisión adjuntando una nota de justificación técnica.
