# WF-043: BRIEF TÉCNICO DE ARQUITECTURA E IMPLEMENTACIÓN

**Workflow:** WF-043 — Sistema de Permisos de Trabajo  
**Documento Base:** PDVSA IR-S-04 Rev. 4 (Agosto 2013)  
**Estado:** `PERMITTED_WITH_PENDING_EXTERNAL_PARAMS`  

> [!NOTE]
> **ESTADO DE CONSTRUCCIÓN Y DESARROLLO PERMITIDO:**  
> Todos los Anexos B al L (Certificados Especiales) están completamente disponibles en la norma primaria `PDVSA IR-S-04 Rev 4` (Págs. 36 a 69). Se **PERMITE** el modelado de datos, la construcción de componentes UX/UI, la lógica de formularios, la trazabilidad y la generación de entregables para todos los Anexos B al L. Las normas externas no localizadas únicamente condicionan el ajuste fino de parámetros especializados (`PENDING_EXTERNAL_PARAMETER`).

---

## 1. CLASIFICACIÓN DE CONSTRUCCIÓN E IMPLEMENTACIÓN

### A. ANEXOS DISPONIBLES EN NORMA PRIMARIA (`AVAILABLE_IN_PRIMARY_STANDARD`)
* **Anexo A (Permiso Principal Frío/Caliente):** Renglones 1 al 23 (Págs. 33-35).
* **Anexo B (Espacios Confinados):** Formato y checklist normado (Págs. 36-38).
* **Anexo C (Izamiento de Cargas):** Formato y cálculo de riggers/grúas (Págs. 39-42).
* **Anexo D (Radiaciones Ionizantes):** Formato y controles de fuentes (Págs. 43-45).
* **Anexo E (Excavaciones):** Formato y firmas de servicios públicos (Págs. 46-48).
* **Anexo F (Sistema Eléctrico):** Formato y desenergización LOTO (Págs. 49-52).
* **Anexo G (Subacuáticos):** Formato y buceo en pareja (Págs. 53-55).
* **Anexo H (Hot-Tapping):** Formato y datos de línea/válvula (Págs. 56-58).
* **Anexo I (Áreas Compartidas):** Formato y notificación a custodios (Págs. 59-60).
* **Anexo J (Trabajos en Altura):** Formato y andamios/arnés (Págs. 61-63).
* **Anexo K (Fumigación):** Formato y producto/MSDS (Págs. 64-66).
* **Anexo L (Soldadura):** Formato y calificación EPS/soldador (Págs. 67-69).

### B. REGLAS CONTENIDAS EN IR-S-04 (`HARD_BLOCK` & `ADVISORY`)
* Duración máxima (8h continuo / 12h paradas).
* Prórroga única por máximo 2h.
* Coincidencia exacta de hora de inicio con hora de gas test.
* Límite de 0% LEL en caliente.
* Firma tripartita obligatoria (Emisor, Receptor, Ejecutor).
* Prerrequisito de Contratista Calificado APTA y Plan SIHOA (PDVSA SI-S-04).
* Notificación de Riesgos por puesto de trabajo (PDVSA HO-H-16 - **CONFIRMADO PDF**).
* Requisitos de Transporte Radiológico (PDVSA PR-H-08 - **CONFIRMADO PDF**).

### C. PARÁMETROS EXTERNOS PENDIENTES (`PENDING_EXTERNAL_PARAMETER`)
* Tiempos de ventilación forzada específicos y límites de toxicidad secundarios (`PDVSA HO-H-06`).
* Factores de carga estructural de andamios específicos (`PDVSA SI-S-27/31`).
* Ángulo exacto de talud por tipo de suelo en excavaciones (`COVENIN 2247`).
* Distancias mínimas de arco eléctrico por nivel de kilovoltios (`PDVSA SI-S-29/32`).

---

## 2. ESTRUCTURA DE COMPONENTES DE SOFTWARE PERMITIDA

```text
src/
 ├── domain/
 │    └── ptw/
 │         ├── ptwDomain.ts            # Reglas de negocio de Anexo A y Anexos B-L
 │         ├── ptwTypes.ts             # Tipos TypeScript para Anexo A y Anexos B-L
 │         └── ptwAdvisoryRules.ts     # Reglas Advisory y Hard Blocks
 ├── pages/
 │    └── SihoPtwWizardView.tsx        # Vista asistida multi-paso para Anexo A + Anexos B-L
 └── services/
      └── ptw/
           ├── ptwDataService.ts       # Persistencia Firestore / Indexación Databook
           └── ptwPdfExporter.ts       # Generación de entregables PDF/A ISO 19005-1
```
