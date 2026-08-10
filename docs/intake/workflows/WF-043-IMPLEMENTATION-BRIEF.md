# Implementation Brief — WF-043: Permiso de Trabajo Seguro PTW (PDVSA IR-S-04)

## 1. Architectural Strategy & Refactoring Plan

- **Goal**: Transition from existing flat PTW implementation to 9-layer constructible specification driven engine.
- **Refactoring Target**: Refactor `src/pages/SihoPtw.tsx` into modular step-by-step wizard components backed by domain validators in `src/domain/ptw/ptwDomain.ts`.

## 2. Hard Blocks vs Advisory Control Mapping

- `RULE-HARD-01`: Max duration continuous <= 8 hours.
- `RULE-HARD-02`: Plant shutdown max duration <= 12 hours.
- `RULE-HARD-03`: Single extension max <= 2 hours.
- `RULE-HARD-04`: Gas test execution time MUST equal PTW start time.
- `RULE-HARD-05`: Hot work in tested area requires EXACTLY 0% LEL.
- `RULE-HARD-06`: Mandatory tri-party signatures (Emisor, Receptor, Ejecutor).
- `RULE-HARD-07`: Contractor status MUST be "APTA" and SIHOA Plan approved.

---

## 3. ESPECIFICACIÓN TÉCNICA DE PREVISUALIZACIÓN Y MARCA DOCUMENTAL

1. **Servicio de Generación de Vista Previa (`ptwPreviewRenderer.ts`):**  
   Renderizado HTML/CSS normalizado en tiempo real. Utiliza `DOMPurify` e inyecta dinámicamente el Kit de Marca (`BrandKitConfig`).

2. **Reglas de Visibilidad de Logos:**  
   - `operatorLogo`: Inyectado dinámicamente desde el perfil de la instalación de PDVSA (`visible: true`).
   - `contractorLogo`: `visible: false` por defecto en Anexo A (IR-S-04). Configurable mediante la bandera de contexto `allowContractorLogoInPtw`.

3. **Trazabilidad Visual y Hash de Renderizado:**  
   Cada vista previa genera un hash SHA-256 de la estructura HTML/CSS aprobada que se almacena en el registro de auditoría `visualVersionHash` antes de la firma.
