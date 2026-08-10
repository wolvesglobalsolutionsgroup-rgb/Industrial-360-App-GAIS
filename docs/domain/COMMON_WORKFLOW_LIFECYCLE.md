# COMMON_WORKFLOW_LIFECYCLE.md — Ciclo de Vida Común de Instancias de Workflow (IC360-NEXUS)

*Estado:* **COMMON_LIFECYCLE_DEFINED**  
*Fecha:* 2026-08-10  
*Sprint:* F-OPS-REORDER-01  

---

## 1. Diagrama de Transiciones de Estado Canónico

```
[ DRAFT ]
   │
   ▼
[ IN_PROGRESS ] ──(Captura de Campo & Validación Zod)
   │
   ▼
[ SUBMITTED ] ──(Evaluación de Controles Advisory)
   │
   ▼
[ UNDER_REVIEW ] ◄────────────────────────┐ (Retrabajo)
   │                                     │
   ├──► [ CHANGES_REQUESTED ] ───────────┘
   │
   ▼
[ APPROVED ] ──(Recolección de Firmas & Sello)
   │
   ▼
[ ISSUED ] ──(Autorización Oficial de Emisión)
   │
   ▼
[ ARCHIVED ] ──(Catalogación en Databook / DossierDocument)
```

---

## 2. Descripción de Fases y Desacoplamiento de Responsabilidades

### 2.1 Fase 1: Captura de Datos y Archivos Primitivos (`DRAFT` / `IN_PROGRESS`)
- **Responsable:** Inspector de Campo / Operador.
- **Acción:** Recolección de evidencias crudas (`Evidence`: fotos, archivos borrador, lecturas de sensores).
- **Control:** Validación de esquema de datos en cliente (`Zod`). Sin reglas de negocio complejas bloqueantes.

### 2.2 Fase 2: Presentación y Evaluación de Controles (`SUBMITTED`)
- **Responsable:** Kernel Runner / Motor de Reglas.
- **Acción:** Transición de la instancia para evaluación automática de controles normativos.
- **Gobernanza:** Los controles normativos operan en modo **Advisory** (`blocking: false`, `humanOverrideAllowed: true`). Generan alertas y dictámenes (`PASS`, `FAIL`, `WARNING`), pero no impiden por código el avance si el especialista justifica una excepción.

### 2.3 Fase 3: Revisión Técnica y Retrabajo (`UNDER_REVIEW` / `CHANGES_REQUESTED`)
- **Responsable:** Ingeniero de Especialidad / Inspector Líder.
- **Acción:** Revisión técnica de la captura y las evidencias.
- **Retrabajo:** Si se detectan inconsistencias, la instancia pasa a `CHANGES_REQUESTED` con comentarios de hallazgos, retornando a `IN_PROGRESS` para corrección.

### 2.4 Fase 4: Firma y Aprobación (`APPROVED`)
- **Responsable:** Matriz de Firmantes (`signatories`: Contratista, Inspección, Cliente).
- **Acción:** Firma digital / electrónica del entregable (`Deliverable`). Transición del estado de firma de `PENDING` a `SIGNED`.

### 2.5 Fase 5: Autorización Oficial de Emisión (`ISSUED`)
- **Responsable:** Gerente de Proyecto / Representante Autorizado del Cliente.
- **Acción:** Generación de la `OfficialIssueAuthorization` con estampado de sello hash inmutable y asignación de código correlativo de documento final.

### 2.6 Fase 6: Catalogación y Archivo en Databook (`ARCHIVED`)
- **Responsable:** Document Controller / Databook Engine.
- **Acción:** Conversión del `Deliverable` emitido en un `DossierDocument` asignado a su respectivo `DossierChapter` dentro de la estructura inmutable del Databook del Proyecto (`projectId`, `workPackageId`).

---

## 3. Matriz de Estados del Ciclo Común

| Estado Canónico | Permite Edición de Datos | Requiere Justificación si Falla Control | Genera Entregable Formal | Integra en Databook |
|---|:---:|:---:|:---:|:---:|
| **DRAFT** | SÍ | NO | NO | NO |
| **IN_PROGRESS** | SÍ | NO | NO | NO |
| **SUBMITTED** | NO | SÍ | NO | NO |
| **UNDER_REVIEW** | NO | SÍ | SÍ (Borrador) | NO |
| **CHANGES_REQUESTED** | SÍ | SÍ | NO | NO |
| **APPROVED** | NO | SÍ | SÍ (Firmado) | NO |
| **ISSUED** | NO | N/A | SÍ (Oficial) | SÍ (Pendiente Indexación) |
| **ARCHIVED** | NO | N/A | SÍ (Inmutable) | SÍ (Catalogado) |
