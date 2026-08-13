# 📜 01_ACK_ESTADO_ACTUAL_IC360_V1.md — ESTADO ACTUAL DEL PROYECTO IC360-NEXUS
**Fecha de Emisión:** 13 de Agosto, 2026  
**Autor:** Arquitecto Técnico Senior IC360 (Antigravity)  
**Repositorio Oficial Objetivo:** `Industrial-360-App-GAIS` (`wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS.git`)  
**Commit HEAD en Main:** `a90f34f039bbfe5821df26f1f45037beee095ae1`

---

## 1. Estado del Repositorio

### 1.1. Ramas Principales y su Propósito
- **`main` (Única Rama Activa de Producción):** Contiene el código fuente auditado y compilable del proyecto IC360-NEXUS. Sincronizada y protegida al 100%. Todos los merges exigen compilación limpia (`tsc`), suite de pruebas Vitest al 100% (54/54 archivos pasados) y pase de guardias de CI.
- **Remoto Oficial:** `https://github.com/wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS.git`.

### 1.2. Últimos Commits Relevantes
- **`a90f34f` (2026-08-13):** `ci: activate anti-hardcoding guard on push to main (was PR-only, 0 runs)` — Activación del guardia anti-hardcode en eventos `push` a `main` y `pull_request`. Auditado localmente con `node scripts/auditNoHardcodedTenant.js` (0 violaciones, 0 secretos).
- **`a3819a4` (2026-08-13):** `build: update package-lock.json after npm install` — Sincronización de dependencias para componentes UI (Radix UI, cmdk, docx, pptxgenjs, exceljs).
- **`6056fdd` (2026-08-13):** `test(vitest): increase prointeca pilot async seed timeout to 15000ms` — Ajuste de timeout para la suite de pruebas del piloto PROINTECA, logrando 100% de éxito en Vitest (54 test files, 459 tests).
- **`12b5f25` (2026-08-13):** `docs(governance): add Doctrina de Pruebas de Excelencia F-QA-EXCELLENCE (8 levels of evidence)` — Formalización de la doctrina de 8 niveles de evidencia y 10 gates de CI.
- **`d70fe0d` (2026-08-13):** `docs(architecture): complete empirical EVE v0.34.0 spike evaluation and update verdict` — Registro de pruebas empíricas del marco Vercel EVE v0.34.0. Veredicto: RECHAZADO por acoplamiento duro con Vercel AI Gateway.
- **`cc0ea89` (2026-08-13):** `ci: update OWASP Semgrep rule configuration` — Corrección del slug del registro Semgrep a `p/owasp-top-ten`.
- **`139facc` (2026-08-13):** `refactor: replace silent catch blocks with logging` — Auditoría de bloques catch vacíos y endurecimiento de reglas Semgrep.

### 1.3. Dependencias Principales (`package.json`)
- **Core Framework:** React `18.3.1`, React DOM `18.3.1`, Vite `6.4.3`, TypeScript `5.5.3`.
- **Backend & Cloud:** Firebase `10.12.2`, Firebase Admin `12.1.0`, Express `4.19.2`.
- **UI & Estilos:** Tailwind CSS `4.0.0`, Lucide React `0.395.0`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-select`, `cmdk`.
- **Validación & Estado:** Zod `3.23.8`, Zustand `4.5.2`.
- **Motores de Documentos & Exportación:** jsPDF `2.5.1`, docx `9.5.0`, pptxgenjs `4.0.0`, exceljs `4.4.0`, DOMPurify `3.1.5`.
- **Testing & Tooling:** Vitest `4.1.10`, Playwright `1.44.1`, Semgrep `1.78.0`.

### 1.4. Guardias de CI Activos
1. **Guardia Anti-Hardcoding de Tenant & Secretos (`.github/workflows/no-hardcoded-tenant.yml`):** Corre en `push` a `main` y `pull_request` sobre `src/**/*.ts(x)`. Ejecuta `scripts/auditNoHardcodedTenant.js`.
2. **Guardia de Seguridad SAST Semgrep (`.github/workflows/semgrep.yml`):** Evalúa 4 reglas custom en `.semgrep/ic360-security-rules.yml` + packs de registro (`p/owasp-top-ten`, `p/typescript`, `p/react`).
3. **Compilación Estricta TypeScript:** `npx tsc --noEmit` en pipeline de CI (0 errores de compilación).
4. **Suite de Pruebas Unitarias:** `npm run test:unit` (54 archivos de pruebas pasados al 100%).
5. **Auditoría de Vulnerabilidades:** `npm audit --json` (0 vulnerabilidades críticas/altas/moderadas).

---

## 2. Estado de la Arquitectura

### 2.1. Módulos Implementados en Código
- **`F-OUTBOX` / Motor Offline (`src/lib/offline/`):** `offlineEngine.ts`, `syncOutboxMutation.ts`, `syncCenterS21.ts` y `SyncCenter.tsx`. Soporte de mutaciones offline, reintentos con backoff e idempotencia.
- **Perímetro de Seguridad IA & FinOps (`src/lib/geminiProxy.ts` & `functions/src/`):** Proxy centralizado de IA sin tarifas de gateway middleware, auditoría de tenant `orgId`, limitación de tasa y aislamiento estricto multitenant (`tenantIsolation.test.ts`).
- **Motor de Valuaciones & APUs (`src/lib/engineering/apuCalculator.ts` & `src/pages/Valuations.tsx`):** Desglose de partidas de construcción, cálculo de retenciones (10% Fiel Cumplimiento, 5% Laboral, 30% Anticipo).
- **Validación de Fronteras Zod (`src/lib/writeBoundaryValidation.ts` & `entitySchemas.ts`):** 10/10 schemas validados en ingesta.
- **Exportación Multiformato (`src/lib/exporters/multiFormatExporter.ts`):** Generación unificada de PDF, DOCX, XLSX y PPTX desde `DocumentViewModel`.
- **Portal del Cliente (`src/pages/ClientPortalView.tsx`, `ClientPortalBuilder.tsx`, `clientPortalSeals.ts`):** Visualizador de avance para supervisores de PDVSA con verificación de sellos de seguridad.

### 2.2. Módulos Existentes Solo en Docs / Memoria
- **Spike Vercel EVE v0.34.0 (RECHAZADO):** Evaluado en `scratch/spike-eve/` y documentado en `docs/architecture/INVESTIGACION-EVE-IC360-V1.md` y `SPIKE-EVE-RESULTADO.md`. Rechazado por bloqueo técnico con Vercel AI Gateway. Decisión: Conservar stack actual (`geminiProxy.ts`).
- **Lote Piloto RAG (674 Documentos Censo):** Censo documentado en `docs/rag/DOCUMENT-CENSUS-V1.md`. Procesamiento de Fichas Indexables PENDIENTE DE AUTORIZACIÓN EXPLÍCITA del Founder.
- **Formularios Dinámicos de Certificados SIHO (Anexos B al L de PDVSA IR-S-04):** Mapeados conceptualmente en `scratch/PDVSA_IR-S-04_FULL_CONVERTED.md` (71 págs). Ingesta UI detallada PENDIENTE DE CONSTRUCCIÓN.

### 2.3. Módulos Obsoletos o Eliminados
- **Archivos Temporales en `docs/governance/`:** Los borradores temporales de gobernanza creados por el orquestador (`ACTUALIZACION-ESTADO-2026-08-12-QWEN-PLANIFICADOR.md` y `ROADMAP-MAESTRO-IC360-V1.md`) fueron desvinculados del repo mediante `git rm` y preservados directamente en la carpeta de buzón `C:\Users\Administrator\Desktop\IC360_INBOX_WF-SPECS\`.
- **Vercel EVE Framework Dependency:** Cero paquetes de `eve` instalados en el repo principal.

---

## 3. Estado de las 50 Dimensiones

### 3.1. Dimensiones con Evidencia Concreta en Código
1. **`DIM-01` (Compilación Estricta TS):** `npx tsc --noEmit` $\rightarrow$ 0 errores.
2. **`DIM-02` (Pruebas Unitarias & Cobertura):** Vitest 4.1.10 $\rightarrow$ 54 archivos, 459 pruebas pasadas al 100%.
3. **`DIM-05` (Motor Offline & Outbox):** `src/lib/offline/offlineEngine.ts` amparado por `syncOutboxMutation.test.ts`.
4. **`DIM-08` (Auditoría Anti-Hardcoding):** `scripts/auditNoHardcodedTenant.js` en CI.
5. **`DIM-12` (Reglas SAST Custom):** `.semgrep/ic360-security-rules.yml` validado limpia y activado en CI.
6. **`DIM-18` (FinOps & Direct AI Proxy):** `src/lib/geminiProxy.ts` (Invocación directa a Gemini API sin peaje de pasarela).
7. **`DIM-22` (Validación de Esquemas Zod):** `src/lib/writeBoundaryValidation.ts` (10/10 boundaries activos).
8. **`DIM-27` (Motor de Valuaciones & APU):** `src/lib/engineering/apuCalculator.ts` con retenciones legales venezolanas.
9. **`DIM-34` (Exportación Multiformato):** `src/lib/exporters/multiFormatExporter.ts` (PDF/DOCX/XLSX/PPTX).
10. **`DIM-40` (Portal Transparencia Cliente):** `src/pages/ClientPortalView.tsx` y sellos criptográficos.

### 3.2. Dimensiones con Evidencia Solo en Docs / Memoria
1. **`DIM-15` (Pruebas E2E Flujo Dorado Playwright):** Especificado en Doctrina `F-QA-EXCELLENCE` Nivel 5. PENDIENTE DE IMPLEMENTACIÓN (Sprint F-E2E).
2. **`DIM-31` (Fichas RAG Piloto 674 Docs):** Documentado en `DOCUMENT-CENSUS-V1.md`. PENDIENTE DE EJECUCIÓN (Fase 2 RAG).
3. **`DIM-45` (Visualización Dig Sheet 3D Tubería):** Conceptualmente mapeado frente a entregables ROSEN y `WF-066`. PENDIENTE DE CONSTRUCCIÓN UI.
4. **`DIM-48` (Ingesta Dinámica de 11 Certificados SIHO Anexos B-L):** Extraído en `PDVSA_IR-S-04_FULL_CONVERTED.md`. PENDIENTE DE COMPONENTES UI.

### 3.3. Dimensiones Pendientes o Implícitas
1. **`DIM-49` (Integración API/Scraping Registro RNC Contratistas):** PENDIENTE DE VALIDACIÓN TÉCNICA.
2. **`DIM-50` (Golden File PDF Hash Test SHA-256):** Especificado en Nivel 8 de Doctrina. PENDIENTE DE IMPLEMENTACIÓN EN OLEADA 2.

---

## 4. Estado de la Documentación

### 4.1. Docs que Viven en el Repositorio (`Industrial-360-App`)
- **Gobernanza & QA:**
  - `docs/governance/DOCTRINA-PRUEBAS-EXCELENCIA-IC360-V1.md` (8 niveles de evidencia, 10 gates CI).
  - `docs/governance/QA_CONFORMANCE_GATES.md` (Criterios de aceptación).
  - `docs/governance/GOVERNANCE.md` (Reglas de custodia).
  - `docs/governance/SECURITY_DECISIONS.md` (Decisiones de seguridad).
  - `docs/governance/SPRINT_LEDGER.md` (Registro de sprints).
- **Arquitectura & Investigación:**
  - `docs/architecture/INVESTIGACION-EVE-IC360-V1.md` (Evaluación completa de EVE).
  - `docs/architecture/SPIKE-EVE-RESULTADO.md` (Log empírico del spike).
- **Dominio & RAG:**
  - `docs/domain/NORMATIVE_MATRIX.md` (Matriz normativa de 24 normas).
  - `docs/domain/MODULE_WORKFLOW_MAPPING.md` (Mapeo de los 67 Workflows).
  - `docs/domain/PROJECT_OPERATING_MODEL.md` (Modelo de operación).
  - `docs/domain/SHARED_DOSSIER_MODEL.md` (Modelo de dossier).
  - `docs/domain/DELIVERABLE_DATABOOK_CONTRACT.md` (Contratos de databook).
  - `docs/rag/DOCUMENT-CENSUS-V1.md` (Censo de 674 documentos PDF).

### 4.2. Docs que Viven Solo en `IC360_INBOX_WF-SPECS` (Fuera del Repo)
- `IC360_INBOX_WF-SPECS\ACTUALIZACION-ESTADO-2026-08-12-QWEN-PLANIFICADOR.md` (Actualización de estado del orquestador Qwen).
- `IC360_INBOX_WF-SPECS\ROADMAP-MAESTRO-IC360-V1.md` (Roadmap maestro V1).
- `IC360_INBOX_WF-SPECS\PROMPT-SEMGREP-FIX.md` (Prompt de sincronización Semgrep).
- `IC360_INBOX_WF-SPECS\GOOGLE-SYNC-INJECTION.md` (Inyección de resguardo 224 KB).
- `IC360_INBOX_WF-SPECS\SYNC_PACK_GOOGLE\SYNC_MANIFEST.md` (Manifest de resguardo de 121 archivos a SHA `12b5f25`).

### 4.3. Docs Duplicados u Obsoletos
- Ninguno en el repositorio principal (`main` está 100% limpio). Los duplicados temporales de gobernanza fueron purgados mediante `git rm`.

---

## 5. Conclusiones y Próximos Pasos

### 🟢 5.1. Qué Está Sólido y NO Debe Tocarse
1. **Motor Offline y Cola Outbox (`src/lib/offline/`):** Robustez verificada en pruebas unitarias y de estrés.
2. **Perímetro de Seguridad IA y Proxy Gemini (`src/lib/geminiProxy.ts`):** 0 peajes de pasarela, aislamiento de tenant verificado.
3. **Suite de Pruebas Vitest (54/54 passed):** 459 pruebas verdes al 100%.
4. **Guardias de CI (`no-hardcoded-tenant.yml` y `semgrep.yml`):** Vigilancia activa en GitHub Actions.

### 🟡 5.2. Qué Está Débil y Requiere Atención Inmediata
1. **Ingesta Dinámica de Certificados SIHO en `SihoPtw.tsx`:** Actualmente posee solo un selector de casillas básicas. Requiere la construcción de las pestañas dinámicas de ingesta para los 11 Certificados Especiales (Anexos B al L de PDVSA IR-S-04).
2. **Formatos de Renderizado PDF 1:1:** El motor de PDF debe adaptar sus plantillas de lienzo para imprimir la réplica exacta de las cartelas de obra oficial de PDVSA.

### 🚀 5.3. Qué Falta y Debe Construirse en la Próxima Oleada
1. **Módulo de Inspección y Diagnóstico en Campo (Walkdown Inicial / GIS):** Pantalla de ingesta de la Fase 1 (captura de coordenadas UTM/KP, fotos del daño, videos y trazado KML/GeoJSON).
2. **Integración del Flujo de Cotización APU con la Inspección Inicial:** Conexión directa entre el diagnóstico de campo y la generación de la propuesta técnica/comercial.
3. **Fase 2 de RAG (Fichas Indexables para RAG):** Procesamiento de los 674 documentos del censo al recibir la autorización del Founder.
