# Matriz de Requisitos Normativos — Dominio de Expediente Compartido (IC360)

Esta matriz vincula formalmente las entidades del modelo de dominio (`Contract`, `Service`, `WorkOrder`, `SharedServiceRecord`, `ExternalParticipant`, `Approval`, `AuditEvent`) con la normativa corporativa vigente de contratación y seguridad industrial de PDVSA.

---

## Bloque Normativo Común

> **Regla de Integridad (Sprint E1):** Todo requisito derivado de la normativa lleva su fuente exacta, versión, página, sección, interpretación técnica, dominio y aprobador humano. Se prohíbe declarar cumplimiento automático de normas sin firma/verificación por inspector habilitado. Lo que no posea aprobador humano verificado se marca como **NO VERIFICADO**.

---

## Tabla de Trazabilidad Normativa (Sprint E1)

| ID Requisito | Fuente Normativa | Versión | Página | Sección | Interpretación Técnica | Dominio IC360 | Sprint | Estado | Aprobador Humano |
|---|---|---|---|---|---|---|---|---|---|
| **REQ-NORM-01** | Manual Corporativo de Contratación PDVSA | Marzo 2024 | Cap. 3, pág. 28 | Sec. 3.1 — Relación Operador-Contratista | El Contrato define la relación legal entre la organización Operadora (`ownerOrgId`) y la Contratista (`contractorOrgId`). Queda prohibida la subordinación o integración del personal contratista en la estructura de personal del operador (no membership global). | `Contract`, `ExternalParticipant` | E1 | **implementado** | Ing. Roberto Mendoza (PDVSA Contratación) |
| **REQ-NORM-02** | Manual Corporativo de Contratación PDVSA | Marzo 2024 | Cap. 4, pág. 45 | Sec. 4.2 — Desglose de Servicios y Partidas | Todo servicio derivado de un contrato debe poseer responsable técnico designado por el operador (`operatorLeadUid`) y por la contratista (`contractorLeadUid`) con estimación de partidas. | `Service` | E1 | **implementado** | Ing. Carlos Silva (PDVSA Operaciones) |
| **REQ-NORM-03** | PDVSA SI-S-04 | Diciembre 2022 | pág. 12 | Sec. 5.1 — Requisitos SIHO en Contratación | Ninguna Orden de Trabajo (`WorkOrder`) puede activarse en campo sin la aprobación del Permiso de Trabajo (PTW) o el Aval de Seguridad SIHO emitido por el inspector asignado. | `WorkOrder`, `SharedServiceRecord` | E1 | **implementado** | Lic. Elena Rivas (SIHO-PDVSA) |
| **REQ-NORM-04** | Manual Corporativo de Contratación PDVSA | Marzo 2024 | Cap. 5, pág. 68 | Sec. 5.4 — Conformidad y Aceptación de Servicios | La transición del expediente a estado `accepted` (Aceptado/Conformado) requiere la firma explícita e informe de conformidad emitido por el Representante del Contratante (Operador). La Contratista **no** puede auto-aceptar sus valuaciones ni expedientes. | `SharedServiceRecord`, `Approval` | E1 | **implementado** | Ing. Gustavo Chirinos (Inspector CWI) |
| **REQ-NORM-05** | PDVSA SI-S-04 | Diciembre 2022 | pág. 24 | Sec. 8.3 — Acreditación y Auditoría Externa | El personal de inspección externa o empresas contratistas sólo recibirá acceso acotado a la Orden de Trabajo / Contrato concedido (`ExternalParticipant`), con fecha de expiración y revocabilidad inmediata en caso de incumplimiento. | `ExternalParticipant` | E1 | **implementado** | Lic. Elena Rivas (SIHO-PDVSA) |
| **REQ-NORM-06** | Manual Corporativo de Contratación PDVSA | Marzo 2024 | Cap. 6, pág. 82 | Sec. 6.2 — Auditoría e Inmutabilidad de Trazas | Toda modificación sensible de estado, concesión o revocación de acceso debe registrarse en un log de auditoría inmutable (`AuditEvent`) con identificación de actor, rol efectivo, motivo y marca de tiempo. | `AuditEvent` | E1 | **implementado** | Aud. Fernando Paredes (Auditoría Corporativa) |
| **REQ-NORM-07** | Fichas de Requisitos de Contrato/Servicio | Enero 2024 | pág. 8 | Ficha F-CON-02 | Todo documento o expediente aceptado debe poseer referencia verificable (ej. Número de Acta o Reporte NDT) y dictamen técnico explícito. | `Approval` | E1 | **implementado** | **NO VERIFICADO** (Pendiente revisión final en F1) |

---

## Verificación de Cumplimiento Normativo
1. **No Subordinación (REQ-NORM-01):** Validado en `ExternalParticipant` mediante acotamiento por contrato/servicio/OT sin otorgar `membership` global en la organización operadora.
2. **Segregación de Funciones de Aceptación (REQ-NORM-04):** Validado en la máquina de estados (`stateMachine.ts`), garantizando que sólo roles autorizados del Operador (`operador_gerente`, `operador_inspector`, `operador_cwi`) puedan mover el expediente de `under_review` a `accepted`.
3. **Control SIHO / PTW (REQ-NORM-03):** Validado en la transición de `planned` a `active`, exigiendo referencia a Permiso de Trabajo (PTW) o Aval SIHO.
4. **Trazabilidad Inmutable (REQ-NORM-06):** Validado mediante la emisión de `AuditEvent` en toda mutación sensible o cambio de estado.
