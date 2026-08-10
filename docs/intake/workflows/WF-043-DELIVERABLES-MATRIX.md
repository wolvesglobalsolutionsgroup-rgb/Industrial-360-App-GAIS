# Matriz de Entregables y Asignación al Databook: `wf-043`

**ID Workflow**: `wf-043-aprobacion-ptw`  
**Estatus**: `PROPOSED_SPECIFICATION`

---

## 1. Definición del Entregable Oficial (`DeliverableDefinition`)

```yaml
deliverableDefinition:
  deliverableId: DEL-PTW-ANEXO-A
  officialTitle: "PERMISO DE TRABAJO SEGURO EN FRÍO O EN CALIENTE"
  documentClass: PERMISO_DE_TRABAJO_OFICIAL
  officialFormat: "PDVSA IR-S-04 ANEXO A (Pág. 33)"
  allowedFormats: ["PDF", "XLSX", "JSON"]

  coBrandingRule:
    headerLeft: "Logo y Membrete Oficial del Cliente / Operador (ej. PDVSA Petróleo S.A.)"
    headerRight: "Logo y Membrete Oficial de la Empresa Contratista (ej. PROINTECA C.A.)"
    securityFeatures:
      - "Hash criptográfico de archivo fuente (sourceHash)"
      - "Código QR con URL de verificación de autenticidad en servidor"
      - "Sello de tiempo inviolable de firma electrónica"

  requiredSignatures:
    - role: EMISOR
      title: "Custodio de la Instalación PDVSA"
      requiredPage: 33
      requiredRenglón: 17
    - role: RECEPTOR
      title: "Supervisor Responsable"
      requiredPage: 33
      requiredRenglón: 18
    - role: EJECUTOR
      title: "Responsable de la Ejecución de Obra"
      requiredPage: 33
      requiredRenglón: 19
```

---

## 2. Asignación y Compilación Automática en el Databook

Cuando la `WorkflowInstance` de `wf-043` alcanza el estado **`ISSUED`** o **`CLOSED`**, el **Compilador del Databook** procesa los metadatos obligatorios y archiva el documento automáticamente:

```text
PROYECTO: Reemplazo y Reparación Propanoducto 6" Cardón - Amuay
 └── CAPÍTULO 02: SEGURIDAD INDUSTRIAL, HIGIENE Y AMBIENTE (SIHO-A)
      └── SECCIÓN 2.1: PERMISOS DE TRABAJO Y CERTIFICADOS ESPECIALES
           ├── [ISSUED] PTW-2026-00412_AnexoA_Caliente.pdf  (Hash: e8a91...)
           ├── [ISSUED] ART-2026-0891_AnalisisRiesgos.pdf    (Hash: b4c01...)
           └── [ISSUED] PTS-MEC-2026-014_Procedimiento.pdf   (Hash: 7f3d2...)
```

### Contrato de Indexación en Databook (`DossierDocument`)

```yaml
dossierDocumentContract:
  chapterId: "CH-02-SIHO-A"
  sectionId: "SEC-2.1-PERMISOS-Y-CERTIFICADOS"
  documentClass: PERMISO_DE_TRABAJO_OFICIAL
  requiredMetadata:
    - projectId
    - contractId
    - workPackageId
    - workflowInstanceId
    - ptwCode
    - workType
    - issueDate
    - emisorNationalId
    - receptorNationalId
    - sourceHash
  retentionPolicyMonths: 3 # Retención mínima de 3 meses en archivo físico/digital (IR-S-04 Secc. 8.7.2)
```
