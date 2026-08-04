# Modelo de Dominio de Expediente Compartido — Contratista-Operador (Sprint E1)

## 1. Visión General
El **Dominio de Expediente Compartido** (`SharedServiceRecord Domain`) modela la interacción formal, técnica y contractual entre la **Empresa Operadora** (`ownerOrgId`, ej. PDVSA) y la **Empresa Contratista** (`contractorOrgId`, ej. SEMAX), así como participantes externos acreditados (`ExternalParticipant`, ej. Inspectores CWI o Auditores de Calidad/SIHO).

Este modelo corrige el error detectado en auditorías anteriores donde se concedía membership global de tenant a usuarios externos. Bajo este nuevo paradigma, el acceso externo se acota estrictamente a nivel de **Contrato / Servicio / Orden de Trabajo**, garantizando aislamiento multi-tenant sin comprometer la colaboración en campo.

---

## 2. Entidades Principales

| Entidad | Campos Clave | Creado Por | Transicionado Por | Aprobado Por |
|---|---|---|---|---|
| **Contract** | `id`, `ownerOrgId`, `contractorOrgId`, `code`, `title`, `scope`, `status`, `startDate`, `endDate`, `budgetAmount`, `normativeRefs` | Operador (`operador_gerente`) | Operador (`operador_gerente`) | Operador / Representante del Contratante |
| **Service** | `id`, `contractId`, `ownerOrgId`, `contractorOrgId`, `code`, `title`, `operatorLeadUid`, `contractorLeadUid` | Operador o Contratista Lider | Lideres de Proyecto | Representante Técnico |
| **WorkOrder** | `id`, `serviceId`, `contractId`, `frontName`, `crewName`, `startDate`, `dueDate`, `status`, `ptwRequired`, `ptwId` | Supervisor / Residente | Responsables de Campo | Inspector Operador / SIHO |
| **SharedServiceRecord** | `id`, `contractId`, `serviceId`, `workOrderId`, `ownerOrgId`, `contractorOrgId`, `status`, `participants`, `latestApprovalId` | Contratista / Inspector | Máquina de Estados Autorizada | Inspector CWI / Gerente Operador |
| **ExternalParticipant** | `id`, `email`, `fullName`, `externalOrgId`, `targetOrgId`, `contractId`, `serviceId`, `workOrderId`, `role`, `expiresAt`, `revoked` | Gerente Operador | Administrador | Gerente Operador |
| **Approval** | `id`, `recordId`, `fromStatus`, `toStatus`, `actorUid`, `actorOrgId`, `actorRole`, `approved`, `motive`, `evidenceReference` | Actor Autorizado en Transición | N/A | Generado autom. |
| **AuditEvent** | `id`, `entityType`, `entityId`, `contractId`, `ownerOrgId`, `contractorOrgId`, `actorUid`, `effectiveRole`, `action`, `motive`, `timestamp` | Motor Server-Side | N/A (Inmutable) | Registrado autom. |

---

## 3. Máquina de Estados del Expediente Compartido

```
[ draft ] ──(1)──> [ planned ] ──(2)──> [ active ] ──(3)──> [ under_review ] ──(4)──> [ accepted ] ──(5)──> [ closed ]
    │                      │                     │                    │                      │
    └──(Cancel)────────────┴───(Cancel)──────────┴───(Cancel)─────────┼──(Rechazo/Corrección)┘
                                                                      └──(Cancel)──────────────> [ cancelled ]
```

### Tabla de Transiciones de Estado

| Transición | Roles Autorizados | Organización Representada | Evidencia Mínima Requerida | Prueba Asociada (Vitest) |
|---|---|---|---|---|
| `draft` → `planned` | `operador_gerente`, `operador_inspector`, `contratista_gerente`, `contratista_supervisor` | Operador o Contratista | Plan de Trabajo / Cronograma de Ejecución (motivo ≥ 5 chars) | `Ejecuta exitosamente la transición de draft -> planned` |
| `planned` → `active` | `operador_gerente`, `operador_inspector`, `contratista_gerente`, `contratista_supervisor` | Operador o Contratista | Referencia a Permiso de Trabajo (PTW) o Aval SIHO | `Falla si no se adjunta evidencia mínima al activar` |
| `active` → `under_review` | `contratista_gerente`, `contratista_supervisor`, `inspector_externo`, `operador_inspector` | Contratista o Inspector | Enlace/Referencia a Dossier de Calidad, Reporte de Campo o Valuación | `isTransitionAllowed('active', 'under_review')` |
| `under_review` → `accepted` | `operador_gerente`, `operador_inspector`, `operador_cwi` | **SOLO OPERADOR** *(Contratista rechazado)* | Enlace o Referencia a Certificate de Conformidad / Reporte NDT + Dictamen ≥ 10 chars | `RECHAZA que la Contratista auto-acepte` & `PERMITE que Operador acepte` |
| `under_review` → `active` | `operador_gerente`, `operador_inspector`, `operador_cwi` | **SOLO OPERADOR** | Informe de No Conformidad / Observaciones de corrección (motivo ≥ 10 chars) | `isTransitionAllowed('under_review', 'active')` |
| `accepted` → `closed` | `operador_gerente` | **SOLO OPERADOR GERENTE** | Acta de Cierre / Finiquito de Servicio | `isRoleAuthorizedForTransition('accepted', 'closed')` |
| Any → `cancelled` | `operador_gerente` (o `contratista_gerente` en `draft`/`planned`) | Operador o Contratista | Justificación detallada de cancelación (motivo ≥ 10 chars) | `validateTransitionEvidence(..., 'cancelled')` |

---

## 4. Control de Acceso Exterminado Acotado (ExternalParticipant)

1. **Aislamiento Multi-Tenant Estricto:** Un usuario perteneciente a `externalOrgId` (ej. empresa de inspección o contratista) recibe una acreditación `ExternalParticipant`.
2. **Sin Membership de Tenant:** El participante externo **NUNCA** es agregado a `/organizations/{ownerOrgId}/memberships/{uid}` ni recibe claims globales de la organización operadora.
3. **Validación Criptográfica y Temporal de Alcance:**
   - **Contract Scope:** Solo puede leer/interactuar con el `contractId` asignado. Intentar leer otro contrato genera error `SCOPE_MISMATCH`.
   - **Tenant Scope:** Intentar acceder a otra organización genera error `TENANT_MISMATCH`.
   - **Expiración Temporal:** Si `now >= expiresAt`, el acceso retorna `EXPIRED`.
   - **Revocación Inmediata:** Si `revoked === true`, el acceso retorna `REVOKED`.

---

## 5. Auditoría Inmutable (AuditEvent)
Toda mutación sensible (creación de contrato, transición de estado, concesión o revocación de participante externo) produce obligatoriamente un documento `AuditEvent` con:
- `actorUid` & `actorEmail`: Identidad verificada.
- `actorOrgId`: Organización representada en la transacción.
- `effectiveRole`: Rol efectivo en la operación.
- `action`: Tipo de acción (`TRANSITION_STATUS`, `GRANT_EXTERNAL_ACCESS`, `REVOKE_EXTERNAL_ACCESS`).
- `previousStatus` & `newStatus`: Trazabilidad de cambio de estado.
- `motive`: Motivo justificativo.
- `timestamp`: Marca de tiempo ISO inmutable.
