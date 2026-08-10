# WF-053: BRIEF TÉCNICO DE ARQUITECTURA E IMPLEMENTACIÓN

**Workflow:** WF-053 — Completación Mecánica, Cómputos Métricos, Valuaciones y Cierre Contractual SGE  
**Documentos Base:** PDVSA PIC-03-01-09, PIC-03-01-16, PIC-03-01-19, PIC-03-01-13 y MCC-2024.  
**Estado:** `PERMITTED_FOR_FULL_DEVELOPMENT`  

---

## 1. ALCANZE TÉCNICO DE IMPLEMENTACIÓN

1. **Módulo de Libro de Obra Digital (`workLogService.ts`):**  
   Implementación de las 16 secciones foliadas exigidas por PDVSA PIC-03-01-16 y el Decreto N° 1.417.

2. **Motor de Cómputos Métricos y Valuaciones (`valuationsDomain.ts`):**  
   Control de valuaciones parciales y final, cálculo automático de retención del 5%, validación ACCC y registro de HES SAP.

3. **Gestor de Completación Mecánica (`mechanicalCompletionDomain.ts`):**  
   Control de Punch List Catálogo A y Catálogo B, emisión de Memorándum Anexo A, Acta Anexo B y Acta de Recepción Provisional Anexo C.

4. **Ratificación As-Built (`asBuiltService.ts`):**  
   Cotejo de planos modificados contra las Consultas de Ingeniería de Campo RFI (PIC-03-01-12) y aprobación del Líder de Ingeniería.

5. **Expediente Inmutable Databook PDF/A (`valuationsPdfExporter.ts`):**  
   Generación automática de paquete inmutable ISO 19005-1 indexado en `05.01_PERMISOS_DE_TRABAJO_PTW`.

---

## 2. ESPECIFICACIÓN TÉCNICA DE PREVISUALIZACIÓN Y MARCA DOCUMENTAL

1. **Servicio de Generación de Vista Previa (`valuationsPreviewRenderer.ts`):**  
   Renderizado HTML/CSS normalizado en tiempo real. Utiliza `DOMPurify` e inyecta dinámicamente el Kit de Marca (`BrandKitConfig`).

2. **Reglas de Visibilidad de Logos:**  
   - `operatorLogo`: Inyectado dinámicamente desde el perfil de la instalación de PDVSA (`visible: true`).
   - `contractorLogo`: `visible: false` por defecto en documentos PIC. Configurable mediante la bandera de contexto `allowContractorLogoInValuations`.

3. **Trazabilidad Visual y Hash de Renderizado:**  
   Cada vista previa genera un hash SHA-256 de la estructura HTML/CSS aprobada que se almacena en el registro de auditoría `visualVersionHash` antes de la firma.
