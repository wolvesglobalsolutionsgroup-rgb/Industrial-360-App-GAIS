# WF-053: CHECKLIST DE IMPLEMENTACIÓN PARA DESARROLLADORES

**Objetivo:** Guía clara paso a paso para implementar WF-053 en `Industrial-360-App-GAIS`.

---

## 1. PASOS DE DESARROLLO DE CÓDIGO

- [ ] **Paso 1:** Crear `src/domain/valuations/valuationsTypes.ts` definiendo las interfaces TypeScript de Libro de Obra, Valuaciones, HES SAP, Completación Mecánica y Actas A, B, C.
- [ ] **Paso 2:** Crear `src/domain/valuations/valuationsDomain.ts` con la lógica pura de reglas `HARD_BLOCK` (bloqueo sin Libro de Obra al día, retención legal del 5%, validación ACCC, Punch List Cero Catálogo A).
- [ ] **Paso 3:** Implementar `workLogService.ts` gestionando las 16 secciones foliadas exigidas por PDVSA PIC-03-01-16.
- [ ] **Paso 4:** Crear componentes modulares en `src/components/valuations/` (`ValuationsWizardView.tsx`, `MechanicalCompletionForm.tsx`, `AsBuiltViewer.tsx`).
- [ ] **Paso 5:** Implementar el generador de PDF/A ISO 19005-1 `valuationsPdfExporter.ts` compilando los 3 Libros del Databook.
- [ ] **Paso 6:** Escribir pruebas unitarias de dominio en `src/domain/valuations/__tests__/valuationsDomain.test.ts`.
