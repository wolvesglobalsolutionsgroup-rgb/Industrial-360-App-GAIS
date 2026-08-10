# Matriz de Dependencias Documentales y Especificación Operativa Completa: `wf-043`

**ID Workflow**: `wf-043-aprobacion-ptw`  
**Nombre Operativo**: Permiso de Trabajo Seguro "En Frío o En Caliente" (PDVSA SIHO-A / IR-S-04)  
**Fuente Primaria**: Norma Técnica `PDVSA IR-S-04` (Manual de Ingeniería de Riesgos - Sistema de Permisos de Trabajo, Rev. 4, Agosto 2013, Páginas 1 a 69)  
**Estatus de la Especificación**: `PARTIAL` (Extracción Primaria Verificada / Pendiente Conciliación de Fuentes Dependientes)  
**Autorización de Implementación en Código**: `NO_AUTORIZADA` (Solo Documentación Técnica)

---

## 1. Matriz de Fuentes Primarias y Dependencias Documentales

| Documento Referenciado | Fuente / Tipo | Páginas Citadas | Propósito en `wf-043` | Estatus de Extracción |
|---|---|---|---|---|
| **`PDVSA IR-S-04`** | PDF Oficial PDVSA | Págs. 1-69 (Anexos A-L) | Norma Marco, Renglones 1-23 del Permiso Base (Anexo A), Procedimientos de Otorgamiento, Prórroga, Cancelación y Cierre. | `VERIFIED` |
| **`PDVSA IR-S-17`** | PDF Oficial PDVSA | Citada Págs. 6, 13, 33, 34 | Análisis de Riesgos del Trabajo (ART). Matriz de identificación de peligros y medidas preventivas (Renglón 6). | `PENDING_EXTRACTION` |
| **`PDVSA SI-S-20`** | PDF Oficial PDVSA | Citada Págs. 7, 13, 33, 34 | Procedimientos de Trabajo Seguro. Secuencia de tareas técnicas (Renglón 7). | `PENDING_EXTRACTION` |
| **`PDVSA SI-S-28`** | PDF Oficial PDVSA | Citada Págs. 7, 17, 26, 33 | Control de Fuentes de Energía (Aislamiento, Bloqueo, Tarjeta y Prueba de Energía Cero LOTO - Renglón 11.a). | `PENDING_EXTRACTION` |
| **`PDVSA HO-H-06`** | PDF Oficial PDVSA | Citada Págs. 7, 23 | Guía de Higiene y Seguridad en Espacios Confinados (Anexo B). | `PENDING_EXTRACTION` |
| **`PDVSA PI-15-02-01`** | PDF Oficial PDVSA | Citada Págs. 7, 24 | Requisitos de Seguridad en Izamiento de Cargas (Anexo C / ASME B30.5). | `PENDING_EXTRACTION` |
| **`PDVSA SI-S-27` / `SI-S-31`** | PDF Oficial PDVSA | Citada Págs. 7, 31 | Requisitos de Seguridad en Andamios y Trabajos en Altura (Anexo J). | `PENDING_EXTRACTION` |
| **`PDVSA SI-S-29` / `SI-S-32`** | PDF Oficial PDVSA | Citada Págs. 7, 28 | Seguridad en Sistemas Eléctricos de Alta y Baja Tensión (Anexo F). | `PENDING_EXTRACTION` |
| **`COVENIN 2247`** | Norma COVENIN | Citada Págs. 6, 26 | Excavaciones a Cielo Abierto y Subterráneas (Anexo E). | `PENDING_EXTRACTION` |
| **`PDVSA IR-E-01`** | PDF Oficial PDVSA | Citada Págs. 7, 16, 33 | Clasificación Eléctrica de Áreas Restringidas (Renglón 11.b). | `PENDING_EXTRACTION` |
| **`Certificados de Calibración`** | Documentación de Taller | Citada Págs. 18, 33, 35 | Registro de calibración vigente de explosímetros y multigas (Renglón 12). | `PENDING_EXTRACTION` |
| **Anexos B al L (`IR-S-04`)** | PDF Oficial PDVSA | Págs. 36-69 | Formatos oficiales de Certificados para Trabajos Especiales. | `VERIFIED` (Estructura) / `PENDING_EXTRACTION` (Integración) |

---

## 2. Ingesta Completa de los 23 Renglones del Anexo A (`PDVSA IR-S-04`, Págs. 33, 34, 35)

```yaml
inputSchemaAnexoA:
  renglon_01_tipoTrabajo:
    fieldId: workType
    label: "Tipo de Permiso"
    type: enum
    allowedValues: ["EN_FRIO", "EN_CALIENTE"]
    required: true
    sourcePage: 33
    instructivoPage: 34
    captureMethod: "Selección en casilla (Renglón 1)"
    description: "Determina si las actividades generan o son capaces de generar calor/chispa (En Caliente) o no (En Frío)."

  renglon_02_ordenSap:
    fieldId: sapOrderNumber
    label: "Orden SAP N°"
    type: string
    required: false
    sourcePage: 33
    instructivoPage: 34
    captureMethod: "Texto libre (Renglón 2)"

  renglon_03_numeroPermiso:
    fieldId: ptwCode
    label: "Permiso N°"
    type: string
    required: true
    sourcePage: 33
    instructivoPage: 34
    captureMethod: "Número correlativo consecutivo no repetido (Renglón 3)"

  renglon_04_ubicacion:
    fieldId: facilityLocation
    label: "Instalación / Área / Unidad y Equipo"
    type: object
    requiredFields: ["instalacion", "area", "unidad", "equipo"]
    sourcePage: 33
    instructivoPage: 34
    captureMethod: "Estructura jerárquica de lo general a lo específico (Renglón 4)"

  renglon_05_descripcion:
    fieldId: workDescription
    label: "Descripción de los Trabajos y Fuente de Ignición"
    type: string
    required: true
    sourcePage: 33
    instructivoPage: 34
    captureMethod: "Texto descriptivo especificando la labor y fuente de ignición en caso de Trabajo en Caliente (Renglón 5)"

  renglon_06_art:
    fieldId: artNumber
    label: "Análisis de Riesgos N° (PDVSA IR-S-17)"
    type: string
    required: true
    sourcePage: 33
    instructivoPage: 34
    evidenceRequired: "Documento ART de soporte adjunto"

  renglon_07_procedimiento:
    fieldId: procedureNumber
    label: "Procedimiento de Trabajo N° (PDVSA SI-S-20)"
    type: string
    required: true
    sourcePage: 33
    instructivoPage: 34

  renglon_08_ejecutor:
    fieldId: executorInfo
    label: "Ejecutor del Trabajo y Número de Personas"
    type: object
    properties:
      type: ["PDVSA", "CONTRATISTA"]
      companyName: string
      workerCount: integer
    required: true
    sourcePage: 33
    instructivoPage: 34

  renglon_09_certificadosEspeciales:
    fieldId: specialCertificates
    label: "Certificados Especiales Requeridos"
    type: array
    allowedValues:
      - "ESPACIOS_CONFINADOS_ANEXO_B"
      - "IZAMIENTO_CARGAS_ANEXO_C"
      - "RADIACIONES_IONIZANTES_ANEXO_D"
      - "EXCAVACION_ANEXO_E"
      - "SISTEMA_ELECTRICO_ANEXO_F"
      - "SUBACUATICOS_ANEXO_G"
      - "HOT_TAPPING_ANEXO_H"
      - "AREAS_COMPARTIDAS_ANEXO_I"
      - "ALTURA_ANEXO_J"
      - "FUMIGACION_ANEXO_K"
      - "SOLDADURA_ANEXO_L"
      - "NO_APLICA"
    sourcePage: 33
    instructivoPage: 34

  renglon_10_preparacionEquipos:
    fieldId: equipmentPreparation
    label: "Preparación de Recipientes, Equipos y Tuberías"
    type: object
    properties:
      lavados: { applied: boolean, solvent: string }
      purgados: { applied: boolean, agent: string }
      inertizados: { applied: boolean, agent: string }
      despresurizados: { applied: boolean, pressureReading: string, gaugeLocation: string }
      drenados: { applied: boolean, drainPointLocation: string, drainedProduct: string }
      aislados: { applied: boolean }
      noAplica: boolean
    sourcePage: 33
    instructivoPage: 34

  renglon_11_condicionesVerificar:
    fieldId: verificationConditions
    label: "14 Condiciones Mínimas a Verificar (11.a al 11.n)"
    type: object
    properties:
      a_fuentesEnergiaAisladasLOTO: { status: ["SI", "N/A"], listAttached: boolean }
      b_clasificacionElectricaAdecuada: { status: ["SI", "N/A"] }
      c_certificadosElaboradosRevisadosDivulgados: { status: ["SI", "N/A"] }
      d_presenciaSustanciasPiroforicas: { status: ["SI", "N/A"], mitigationsTaken: boolean }
      e_artElaboradoRevisadoDivulgado: { status: ["SI", "N/A"] }
      f_eppRequeridoDisponibleYBuenasCondiciones: { status: ["SI", "N/A"] }
      g_equiposContraIncendioEnSitio: { status: ["SI", "N/A"] }
      h_peligrosAdyacentesControlados: { status: ["SI", "N/A"] }
      i_factoresClimaticosPermitidos: { status: ["SI", "N/A"] }
      j_areaDemarcadaYViasEvacuacionSeñaladas: { status: ["SI", "N/A"] }
      k_trabajadoresNotificadosRiesgos: { status: ["SI", "N/A"] }
      l_certificacionAutorizacionEmisorReceptorVigente: { status: ["SI", "N/A"] }
      m_otraCondicionVerificar: { description: string }
      n_autorizacionDesvioProtecciones: { status: ["SI", "N/A"], tagNo: string, reason: ["REPARACION", "PRUEBA", "CALIBRACION"] }
    sourcePage: 33
    instructivoPage: 34

  renglon_12_pruebaGasesCompleta:
    fieldId: gasTestMatrix
    label: "Registro Completo de Prueba de Gases"
    type: object
    properties:
      testType: ["CONTINUA", "PERIODICA", "NO_APLICA"]
      periodicityFrequencyHours: number
      readings:
        type: array
        items:
          readingIndex: integer # 1da, 2da, 3ra, 4ta, 5ta
          time: string # HH:MM AM/PM
          explosivityLelPercent: number # Ref: 0% LEL
          oxygenPercent: number # Ref: 19.5% - 23.5%
          toxicH2sPpm: number # Ref: <= 10 ppm
          toxicSo2Ppm: number # Ref: <= 2 ppm
          toxicAmoniacoPpm: number # Ref: <= 35 ppm
          toxicCoPpm: number # Ref: <= 25 ppm
          toxicCo2Ppm: number # Ref: <= 5000 ppm
          toxicBencenoPpm: number # Ref: <= 0.5 ppm
      measurementEquipment: string
      lastCalibrationExpirationDate: string
      evaluator: { fullName: string, nationalId: string, signature: string }
    sourcePage: 33
    instructivoPage: 35

  renglon_13_14_15_vigencia:
    fieldId: permitValidity
    label: "Fechas y Horas de Vigencia"
    type: object
    properties:
      issueDate: string # D/M/A
      startTime: string # AM/PM (Debe coincidir con hora de prueba de gas)
      validUntilTime: string # AM/PM (Máximo 8 horas estándar / 12 horas en paradas)
    sourcePage: 33
    instructivoPage: 35

  renglon_16_manejoDelCambio:
    fieldId: managementOfChange
    label: "Manejo del Cambio (MDC)"
    type: object
    properties:
      applied: boolean
      mdcNumber: string
      changeType: ["TEMPORAL", "PERMANENTE", "DE_EMERGENCIA"]
      approvedBy: string
    sourcePage: 33
    instructivoPage: 35

  renglon_17_18_19_firmasOtorgamiento:
    fieldId: issuanceSignatures
    label: "Firmas Tripartitas de Otorgamiento en Sitio"
    type: object
    properties:
      emisor: { fullName: string, nationalId: string, signature: string, sourcePage: 33 }
      receptor: { fullName: string, nationalId: string, signature: string, sourcePage: 33 }
      ejecutor: { fullName: string, nationalId: string, signature: string, sourcePage: 33 }
    instructivoPage: 35

  renglon_20_prorroga:
    fieldId: permitExtension
    label: "Prórroga del Permiso (Máximo 1 única prórroga por 2 horas)"
    type: object
    properties:
      applied: boolean
      validUntilTime: string
      gasTest: { explosivityLel: number, oxygenPercent: number, toxicPpm: number }
      emisorSignature: string
      receptorSignature: string
      ejecutorSignature: string
    sourcePage: 33
    instructivoPage: 35

  renglon_21_cancelacion:
    fieldId: permitCancellation
    label: "Cancelación del Permiso de Trabajo"
    type: object
    properties:
      cancelled: boolean
      reason: string
      dateTime: string
      actionTakenByRole: ["EMISOR", "RECEPTOR", "INSPECTOR_SIHO"]
      fullName: string
      nationalId: string
      signature: string
    sourcePage: 33
    instructivoPage: 35

  renglon_22_cierre:
    fieldId: permitClosure
    label: "Cierre del Permiso de Trabajo al Finalizar Labor"
    type: object
    properties:
      closedTime: string # AM/PM
      emisorSignature: { fullName: string, nationalId: string, signature: string }
      receptorSignature: { fullName: string, nationalId: string, signature: string }
      ejecutorSignature: { fullName: string, nationalId: string, signature: string }
    sourcePage: 33
    instructivoPage: 35

  renglon_23_observaciones:
    fieldId: closureObservations
    label: "Observaciones del Área y Custodios Afectados"
    type: string
    sourcePage: 33
    instructivoPage: 35
```

---

## 3. Evaluadores Normativos (Advisory Controls - Non Blocking)

Conforme a las directrices de arquitectura, los controles automatizados de la aplicación **no realizan bloqueos duros rígidos** ni sustituyen el juicio técnico humano. Registran advertencias y exigen justificación o revisión explícita en caso de desviaciones (`humanDecisionRequiredOnException: true`, `blocking: false`):

```yaml
normativeEvaluationsAdvisory:
  - controlId: EVAL_ATMOSPHERIC_GAS_LIMITS
    name: "Evaluación de Atmósfera Segura (PDVSA IR-S-04 Secc. 8.3)"
    sourcePage: 19
    blocking: false
    humanOverrideAllowed: true
    humanDecisionRequiredOnException: true
    evaluatorLogic: >
      Si explosivityLel > 0.0% o oxygenPercent < 19.5% o oxygenPercent > 23.5% o h2sPpm > 10.0 ppm:
      Registra resultado 'WARNING_ATMOSPHERE_OUT_OF_RANGE'
      Notifica al Emisor/Receptor y exige justificación técnica o firma de excepción en el permiso.

  - controlId: EVAL_PERMIT_DURATION_MAX
    name: "Control de Duración Máxima y Prórroga (PDVSA IR-S-04 Secc. 8.4 y 8.5)"
    sourcePage: 19
    blocking: false
    humanOverrideAllowed: true
    humanDecisionRequiredOnException: true
    evaluatorLogic: >
      Si durationHours > 8 (o > 12 en paradas de planta) o prorrogaHours > 2:
      Registra resultado 'WARNING_PERMIT_EXPIRED_OR_EXCEEDED'
      Requiere revalidación de firmas en Renglón 20 o emisión de nuevo permiso.
```

---

## 4. Ciclo de Vida Operativo Completo (Máquina de 10 Estados)

```text
[ DRAFT ] ──▶ [ IN_PROGRESS ] ──▶ [ SUBMITTED ] ──▶ [ UNDER_REVIEW ] ──▶ [ CHANGES_REQUESTED ]
                                                                                   │
                                                                                   ▼
[ ARCHIVED ] ◀── [ CLOSED ] ◀── [ SUSPENDED ] ◀── [ ISSUED ] ◀─────────── [ APPROVED ]
```

### Definición de Estados
1. **`DRAFT`**: Borrador inicial pre-llenado a partir de la WBS y el ART (`IR-S-17`).
2. **`IN_PROGRESS`**: Completado de los 23 renglones por el Receptor / Ejecutor en campo.
3. **`SUBMITTED`**: Permiso enviado para inspección del sitio de trabajo.
4. **`UNDER_REVIEW`**: Inspección conjunta en sitio por el Emisor (Custodio) y comprobación de condiciones (Renglón 11).
5. **`CHANGES_REQUESTED`**: Solicitud de adecuación o corrección técnica (ej. acordonar área o colocar extintor adicional).
6. **`APPROVED`**: Prueba de gases satisfactoria (Renglón 12) y Firmas Tripartitas de Otorgamiento estampadas (Renglones 17, 18, 19).
7. **`ISSUED`**: Copia entregada y activa en el sitio de trabajo.
8. **`SUSPENDED`**: Permiso pausado por variación de condiciones climáticas o interrupción $>1\text{ hora}$.
9. **`CLOSED`**: Cierre formal en sitio al culminar la labor con inspección de orden/limpieza y firmas de Cierre (Renglón 22).
10. **`ARCHIVED`**: Indexado automático en el **Capítulo 02 del Databook** del proyecto (Custodia mínima por 3 meses, Secc. 8.7.2).

---

## 5. Declaración de Alcance y Trazabilidad Operativa

* **Trazabilidad Documental**: Esta especificación mejora la trazabilidad operativa y el orden del proceso de permisoría. No afirma ni garantiza automáticamente validez legal ni cumplimiento jurídico sin la firma física/criptográfica de las autoridades humanas autorizadas en sitio.
* **Siguiente Pasos**:
  1. Recibir los PDFs dependientes faltantes (`PDVSA IR-S-17` ART, `SI-S-28` LOTO, etc.) para completar la extracción de sus contenidos específicos.
  2. Mantener `wf-066` y `wf-076` bloqueados.
  3. Presentar este informe consolidado para la revisión del Orquestador.
