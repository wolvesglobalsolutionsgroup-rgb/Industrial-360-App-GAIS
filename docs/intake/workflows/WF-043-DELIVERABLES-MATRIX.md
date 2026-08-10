# Deliverables Matrix — WF-043: Permiso de Trabajo Seguro PTW (PDVSA IR-S-04)

## 1. Document Deliverable Structure

| Deliverable ID | Deliverable Title | Format | Storage Location | Signature Pattern |
|---|---|---|---|---|
| `deliv-043-ptw-ir-s-04` | Permiso de Trabajo Seguro e Integrado Databook (PDVSA IR-S-04) | DocumentViewModel (PDF / Databook) | Firestore (`/organizations/{orgId}/projects/{projId}/ptw/`) | Tripartita (Emisor, Receptor, Ejecutor) |

## 2. Deliverable Content Sections

1. **Sección 1: Identificación y Elegibilidad del Trabajo**
   - Código PTW, Orden SAP N°, Instalación / Área / Unidad, Equipo Intervenido, Descripción del Trabajo, Clasificación (Frío/Caliente), Datos de Contratista (RIF, Nombre, Estatus APTA, Plan SIHOA).
2. **Sección 2: Prerrequisitos SIHOA y Normas Aplicables**
   - Análisis de Riesgos del Trabajo (ART PDVSA IR-S-17), Procedimiento de Trabajo (PDVSA SI-S-20), Plan de Respuesta a Emergencia, Anexos Especiales Requeridos.
3. **Sección 3: Prueba de Gases y Evaluación Atmosférica**
   - Hora de la Prueba, Evaluador de Atmósfera (C.I., Certificado), Equipo de Medición y Calibración, LEL %, O2 %, H2S PPM, CO PPM, SO2 PPM, Frecuencia de Monitoreo.
4. **Sección 4: Preparación del Equipo y Condiciones Verificadas**
   - Checklist de Aislamiento (Lavado, Aislado, Purgado, Venteado, Inertizado, Despresurizado, Drenado), LOTO, Verificación Eléctrica, Contra Incendio, Demarcación.
5. **Sección 5: Prórroga, Cierre y Trazabilidad Databook**
   - Prórroga Solicitada (Hasta hora, Horas max), Fecha y Hora de Cierre, Orden y Limpieza, Retiro de Bloqueos, Trazabilidad de Firmas y Metadatos.

---

## 3. POLÍTICA DE MARCA, LOGOS Y PREVISUALIZACIÓN DOCUMENTAL (ANEXO A AL L)

### 3.1 Requisitos Generales de Previsualización
- **Previsualización Previa Obligatoria:** Todo entregable documental de Permiso de Trabajo (Anexo A) y Certificados Especiales (Anexos B a L) debe contar con una vista previa interactiva en tiempo real antes de la firma digital e inmutabilización en PDF/A.
- **Vía Previa Compartida (WYSIWYG):** La previsualización es compartida en tiempo real e idéntica entre el **Emisor** (Custodio PDVSA/Operador), **Receptor**, **Ejecutor** y el **Auditor SIHOA/ACCC**.

### 3.2 Reglas de Marca e Identidad Visual (Brand Kit)
- **Logo del Operador (Custodio PDVSA / Petrolera):** **VISIBLE POR DEFECTO** en el extremo superior izquierdo de la vista previa y PDF emitido.
- **Logo del Contratista (Empresa Ejecutora):** **OCULTO POR DEFECTO** en el Anexo A de PDVSA IR-S-04. Solo se mostrará si la propiedad de configuración explícita `showContractorLogo` se activa manualmente en un workflow derivado o contrato específico.
- **Control de Logos por Documento:** La visibilidad de logos se gestiona a nivel de plantilla documental y es configurable por tipo de anexo y rol.
- **Partes Fijas vs. Parametrizables:**
  - **Estructura Fija (Normativa Inalterable):** Encabezados de renglones 1 a 23 de Anexo A, matriz de 14 condiciones a verificar, tabla de pruebas de gases con límites de tóxicos (CAP PPT, CAP LEB, CAP T, IPVS), pie de página con cita literal *IR-S-04 "Sistema de Permisos de Trabajo" Rev.4 – Ago. 13, Pág. 33*, y bloques de firmas tripartitas.
  - **Estructura Parametrizable (Kit de Marca CSS):** Variables `:root` de CSS (`--brand-primary`, `--brand-secondary`, `--brand-bg-header`, `--brand-text`), URL del logo del Operador, y selector condicional de visibilidad del logo del Contratista.
