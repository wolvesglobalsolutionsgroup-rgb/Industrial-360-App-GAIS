# WF-043: CHECKLIST DE IMPLEMENTACIÓN Y ANÁLISIS DE CÓDIGO GITHUB

**Repositorio:** `wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS`  
**Objetivo:** Guiar el desarrollo inmediato de WF-043 por Google AI Studio.

---

## 1. REVISIÓN DE CÓDIGO EXISTENTE (`src/pages/SihoPtw.tsx`)

| Elemento en Repo | Diagnóstico | Acción Requerida |
|---|---|---|
| **Formulario Monolítico `SihoPtw.tsx`** | Contiene campos de texto planos sin validaciones normativas de validez (8h/12h), prórroga ni firma tripartita. | **REEMPLAZAR** por componente modular asistido `SihoPtwWizardView.tsx`. |
| **Lista de Certificados Especiales** | Muestra checkboxes estáticos sin desplegar sub-formularios de Anexos B-L. | **CORREGIR** para que seleccionar un Anexo (B al L) instancie dinámicamente el componente del anexo correspondiente. |
| **Prueba de Gas en UI** | Entrada de texto libre sin validación de $0\\% \\text{ LEL}$ ni horario de coincidencia. | **CORREGIR** conectando reglas `HARD_BLOCK` de `ptwDomain.ts`. |
| **Captura de Firmas** | Botón genérico único de aprobación. | **REEMPLAZAR** por componente de firma tripartita (Emisor, Receptor, Ejecutor). |
| **Persistencia Firestore / Databook** | Colección genérica de solicitudes. | **CONECTAR** con servicio `ptwDataService.ts` indexando en `05.01_PERMISOS_DE_TRABAJO_PTW`. |

---

## 2. CHECKLIST PASO A PASO PARA EL DESARROLLADOR

- [ ] **Paso 1:** Crear `src/domain/ptw/ptwTypes.ts` definiendo las interfaces TypeScript de Anexo A y Anexos B a L.
- [ ] **Paso 2:** Crear `src/domain/ptw/ptwDomain.ts` con la lógica pura de validaciones `HARD_BLOCK` (8h/12h, prórroga <=2h, hora gas test = hora inicio, 0% LEL, estatus APTA).
- [ ] **Paso 3:** Crear componentes modulares para cada Anexo B al L en `src/components/ptw/annexes/` (`AnexoBForm.tsx`, `AnexoCForm.tsx`, ..., `AnexoLForm.tsx`).
- [ ] **Paso 4:** Implementar el asistente multi-paso `SihoPtwWizardView.tsx` cubriendo las 9 capas (`ContractorEligibility` → `Databook`).
- [ ] **Paso 5:** Conectar la exportación de entregable inmutable PDF/A en `ptwPdfExporter.ts`.
- [ ] **Paso 6:** Implementar pruebas unitarias de dominio en `src/domain/ptw/__tests__/ptwDomain.test.ts`.
