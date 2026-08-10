# WF-043: BRIEF TÉCNICO DE ARQUITECTURA E IMPLEMENTACIÓN

**Workflow:** WF-043 — Sistema de Permisos de Trabajo  
**Documento Base:** PDVSA IR-S-04 Rev. 4 (Agosto 2013)  
**Estado:** `PERMITTED_WITH_PENDING_EXTERNAL_PARAMS`  

> [!NOTE]
> **ESTADO DE CONSTRUCCIÓN Y DESARROLLO PERMITIDO:**  
> Todos los Anexos B al L (Certificados Especiales) están completamente disponibles en la norma primaria `PDVSA IR-S-04 Rev 4` (Págs. 36 a 69). Se **PERMITE** el modelado de datos, la construcción de componentes UX/UI, la lógica de formularios, la trazabilidad y la generación de entregables para todos los Anexos B al L. Las normas externas no localizadas únicamente condicionan el ajuste fino de parámetros especializados (`PENDING_EXTERNAL_PARAMETER`).

---

## 1. ANÁLISIS DE CÓDIGO GITHUB EXISTENTE Y REFACTORIZACIÓN

| Elemento en Repo GitHub | Diagnóstico Técnico | Acción Requerida |
|---|---|---|
| `src/pages/SihoPtw.tsx` | Formulario extenso monolítico sin validación de validez (8h/12h), prórroga ni firmas tripartitas. | **REEMPLAZAR** por asistente multi-paso `SihoPtwWizardView.tsx`. |
| `src/lib/domain/` | Tipos TypeScript parciales de PTW. | **EXPANDIR** en `src/domain/ptw/ptwTypes.ts` agregando estructuras de Anexo A y Anexos B al L. |
| `src/lib/factories/` | Ausencia de factories para instanciar certificados especiales. | **CREAR** `ptwAnnexFactory.ts` para instanciar sub-formularios B al L. |
| `Componentes de Firma` | Botón único de aprobación. | **REEMPLAZAR** por pad de firma digital tripartita (Emisor, Receptor, Ejecutor). |
| `Exportación Databook` | Generación básica de PDF. | **CONECTAR** con `ptwPdfExporter.ts` produciendo expediente PDF/A inmutable ISO 19005-1. |
