# WF-053: MATRIZ DE ENTREGABLES Y EVIDENCIAS

**Fuentes Base:** PDVSA PIC-03-01-09, PIC-03-01-16, PIC-03-01-19, PIC-03-01-13 y MCC-2024.

---

## 1. ENTREGABLES FÍSICOS Y DIGITALES NORMATIVOS

| Entregable / Evidencia | Formato / Soporte | Responsable Emisión | Custodia / Destino | Ref. Normativa |
|---|---|---|---|---|
| **Libro de Obra Folio Diario (16 Secciones)** | Digital foliado / Impreso encuadernado | Residente / Inspector | Archivo ORP / Sistema IC360 | PIC-03-01-16 Anexo B |
| **Planilla de Cómputos Métricos & Valuación** | Formato Excel / PDF firmado | Residente / Inspector | Administración de Contratos ORP | PIC-03-01-19 §6.5, 6.8 |
| **Hoja de Entrada de Servicios (HES SAP)** | Documento generado en SAP | Administrador Contratos | Sistema SAP / Expediente Contrato | PIC-03-01-19 §7.1 |
| **Memorándum Notificación Completación (Anexo A)** | Documento formal escrito | Líder de Implantación | Gerencia Custodia / Arranque | PIC-03-01-09 Anexo A |
| **Acta Verificación Completación Mecánica (Anexo B)** | Formato impreso firmado | Supervisión ORP / Custodio | ORP / Custodio | PIC-03-01-09 Anexo B |
| **Acta de Recepción Provisional (Anexo C)** | Formato impreso firmado | Inspector / Custodio / Contratista | Expediente Legal Contrato | PIC-03-01-09 Anexo C |
| **Planos Como Construidos (As-Built)** | Digital CAD/PDF + 2 Juegos Papel | Contratista / Lider Ingeniería | Sala Técnica / Custodio | PIC-03-01-13 §6.9 |
| **Evaluación de Actuación de Contratista** | Formato de evaluación PDVSA | Inspector de Construcción | Registro Nacional de Contratistas | PIC-03-01-19 §6.14 |
| **Databook Inmutable (3 Libros Gate)** | Expediente PDF/A ISO 19005-1 | Sistema IC360-NEXUS | `05.01_PERMISOS_DE_TRABAJO_PTW` | MCC-2024 / IC360 |

---

## 2. POLÍTICA DE MARCA, LOGOS Y PREVISUALIZACIÓN DOCUMENTAL

### 2.1 Requisitos Generales de Previsualización
- **Previsualización Previa Obligatoria:** Todo entregable de Valuación de Obra, HES SAP, Completación Mecánica (Actas A, B, C), Libro de Obra Digital y Planos As-Built debe contar con una vista previa interactiva en tiempo real previa a su firma e inmutabilización en PDF/A.
- **Vista Previa Compartida (WYSIWYG):** La previsualización es compartida en tiempo real e idéntica entre el **Ingeniero Residente**, el **Ingeniero Inspector PDVSA**, el **Inspector ACCC** y el **Custodio de la Instalación**.

### 2.2 Reglas de Marca e Identidad Visual (Brand Kit)
- **Logo del Operador (Custodio PDVSA / Petrolera):** **VISIBLE POR DEFECTO** en el extremo superior izquierdo de todos los documentos y actas oficiales.
- **Logo del Contratista (Empresa Ejecutora):** **OCULTO POR DEFECTO** en los formularios estándar PDVSA PIC. Habilitable mediante configuración explícita `showContractorLogo` solo si el contrato o la gerencia contratante lo estipula.
- **Partes Fijas vs. Parametrizables:**
  - **Estructura Fija (Normativa Inalterable):** Estructura legal de 16 Secciones del Libro de Obra (PIC-03-01-16), campos de Acta A, B y C de Completación Mecánica (PIC-03-01-09), y resumen de deducciones del 5% de retención legal (PIC-03-01-19).
  - **Estructura Parametrizable (Kit de Marca CSS):** Variables `:root` de CSS (`--brand-primary`, `--brand-secondary`, `--brand-bg-header`, `--brand-text`), URL del logo del Operador, y bandera de visibilidad del logo del Contratista.
