# Registro de Decisiones de Arquitectura — Industrial Control 360
**Versión**: 2.1 · **Fecha**: 2026-08-03 · **Aprobador**: Fundador / Superadmin de Plataforma

---

## Decisiones Operativas Vigentes

| Tema | Decisión | Fecha |
|---|---|---|
| Repositorio | `wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS` | 2026-07-26 |
| Fuente operativa | `main`, siempre verificando SHA real antes de trabajar | 2026-07-26 |
| Superadmin | Acceso global de plataforma, server-side, auditado y separado de roles tenant | 2026-08-03 |
| QA canónico | `orgId: ic360-qa-pilot`, `environment: 'qa'`, org: Constructora Río Verde S.A. (DATOS SINTÉTICOS), proyecto: Gasoducto Anaco–Aragua DN20 · Fase II (QA) | 2026-08-03 |
| Datos QA | Sintéticos, versionados, reproducibles, etiquetados con datasetId/versión/fuente, reseteables solo por platformAdmin server-side | 2026-08-03 |
| Producción | Solo datos reales; nunca fallback demo silencioso, default_org, localStorage, números hardcodeados ni demo local | 2026-08-03 |
| Normativas | Referencia controlada; no se declara cumplimiento automático. Cada requisito requiere fuente, versión, página, sección y aprobación humana | 2026-08-03 |
| Documento emitido | Debe tener versión, fuente, estado, hash SHA-256, revisión y auditoría. Cambio posterior crea revisión nueva, no sobreescribe | 2026-08-03 |
| IA | Asiste, cita y alerta; no firma, autoriza, certifica ni decide por responsables humanos | 2026-08-03 |
| Entrega | Rama/PR, evidencia reproducible, auditoría independiente y merge/deploy solo por decisión humana explícita | 2026-08-03 |

---

## Decisiones de Arquitectura (ADRs)

| ID | Fecha | Decisión | Alternativas | Razón |
|---|---|---|---|---|
| ADR-01 | 2026-07-26 | Sistema de Componentes UI Primitivos (`src/components/ui/`) | Estilos ad-hoc / shadcn completo | Normaliza UI con tokens dinámicos sin sobrecargar bundle |
| ADR-02 | 2026-07-26 | Work Board Kanban sobre Firestore (`/tasks` por `projectId`) | Socket.io / WebSocket | Sincronización reactiva nativa, multi-tenant, offline sin infra adicional |
| ADR-03 | 2026-07-26 | PAMS + React.lazy() code-splitting + Vitest canónico | Bundle único | Bundle inicial ~200KB, tests ASME/API, Command Palette global |
| ADR-04 | 2026-07-26 | Tema unificado CSS `@theme` en `index.css`, `.dark` en `<html>` via ThemeContext | Doble sistema JS+CSS | Elimina desincronización; contraste dinámico instantáneo |
| ADR-05 | 2026-08-03 | **Gestión de secretos post-brecha**: toda API key expuesta debe rotarse antes de cerrar B1. Keys en Secret Manager / env server-side; nunca en `src/`, `.env` commiteado ni logs | Keys en .env local | Cerrar endpoint no invalida key comprometida. Rotación obligatoria en B1 |

---

## Roles de Ejecución

| Rol | Responsabilidad |
|---|---|
| **Fundador / Superadmin** | Define prioridad, aprueba alcance, autoriza implementación, commit, merge, QA y producción |
| **Google AI Studio (GAIS)** | Ejecutor técnico único: lee repo, implementa sprint autorizado, prueba y entrega Gate 1 con evidencia |
| **Auditor-Guía** | Prepara prompts, audita evidencia de GAIS, emite AUTORIZADO / CORREGIR / BLOQUEADO. No edita código en IC360 |
| **GitHub / Vercel / Firebase** | Registro, CI/CD, preview, despliegue y control técnico |

---

## Responsables de Aprobación Normativa (RAN)

> **F2 crítico**: El responsable que aprueba la matriz IR-S-04/IR-S-17 debe estar nombrado ANTES de que F2 inicie. Sin nombre registrado, F2 tiene un gate que nadie puede abrir.

| Campo | Descripción |
|---|---|
| Nombre | Nombre completo del responsable humano |
| Cargo | Cargo formal en la organización |
| Organización | Empresa / unidad |
| Criterio de aceptación | Qué constituye "aprobado" para la matriz del sprint |
| Fecha de designación | Registrada aquí antes de iniciar el sprint |

**RAN designados actualmente**: NINGUNO — pendiente de designación antes de F2, G3, G4.

---

## Sprint R1 — Catálogo Normativo (Trabajo Humano Continuo)

**Estado**: ⏳ EN CURSO — Iniciado 2026-08-03
**Regla**: Lotes de 5–15 documentos. Cada lote requiere validación humana antes de que sus requisitos pasen a un sprint técnico.
**Regla**: No se declara cumplimiento automático. Cada requisito debe incluir: fuente, versión, página, sección y firma de aprobación.

### Lotes Registrados

| Lote | Nombre | Documentos Iniciales | Sprints Destino | Estado |
|---|---|---|---|---|
| R-01 | Contratación | Manual corporativo de contratación, SI-S-04 | E1, H2 | ⏳ Pendiente inventario |
| R-02 | PTW/ART | IR-S-04, IR-S-17, SI-S-04, IR-S-20 | F2, G2 | ⏳ Pendiente inventario |
| R-03 | Calidad | Guía de calidad, Plan de Calidad, Construcción | F1, G3 | ⏳ Pendiente inventario |
| R-04 | Integridad | IR-S-14, Construcción, L-E-2-1 | G3, G4 | ⏳ Pendiente inventario |
| R-05 | Especificaciones | Estandarización de especificaciones y manuales futuros | G3, G4, H1 | ⏳ Pendiente inventario |
| R-06 | Leyes/COVENIN/API/ASME/AWS | Solo inventario y derechos primero — sin implementación aún | H1, matrices futuras | ⏳ Solo inventario |

### Protocolo por Lote

1. Inventariar documentos (nombre, versión, fecha, origen)
2. Clasificar: norma / procedimiento / especificación / ley
3. Extraer requisitos aplicables a IC360 con referencia exacta (artículo, sección, página)
4. Validación humana: responsable firma la ficha del lote
5. Solo tras validación: requisitos se incorporan al prompt del sprint destino
6. Lote archivado con hash SHA-256 del documento fuente

### Referencias Documentales por Sprint

| Sprint | Lotes requeridos | Normas clave |
|---|---|---|
| E1 | R-01 | Manual contratación, SI-S-04 |
| F1 | R-03 | Guía calidad, Plan de Calidad |
| F2 | R-02 ⚠️ + **RAN obligatorio** | IR-S-04, IR-S-17, SI-S-04, IR-S-20 |
| G2 | R-02 | IR-S-04, IR-S-17 |
| G3 | R-03, R-04, R-05 | Guía calidad, IR-S-14, L-E-2-1, ASME B31.4/B31.8, API 1104 |
| G4 | R-04, R-05 | IR-S-14, L-E-2-1, KML/GIS specs |
| H1 | R-05, R-06 | Corpus completo aprobado por RAN |
| H2 | R-01 | Manual contratación, formatos ROE PDVSA |

---

## Hallazgos P0

| ID | Hallazgo | Sprint | Estado |
|---|---|---|---|
| P0-01 | Dashboard con fallbacks ficticios | A1 | ✅ CERRADO `6502a4fb` |
| P0-02 | Diagnóstico Project Brain AI estático | A1 | ✅ CERRADO `6502a4fb` |
| P0-03 | Clima de contingencia inventado | A1 | ✅ CERRADO `6502a4fb` |
| P0-04 | Proxy Gemini sin auth/tenant/rate-limit | B1 | ⏳ Pendiente |

## Hallazgos P1

| ID | Hallazgo | Sprint | Estado |
|---|---|---|---|
| P1-01 | Fallback default_org/demo en ProjectContext | A1 | ✅ CERRADO `6502a4fb` |
| P1-02 | Storage insuficiente para XER, BC3, KML, IFC, GLB | C1 | ⏳ Pendiente |
| P1-03 | Wildcard subcolecciones Firestore requiere whitelist | C1 | ⏳ Pendiente |
| P1-04 | PDF Dashboard por captura PNG; sellado parcial | F1 | ⏳ Pendiente |
| P1-05 | PersonnelDetails, ProgressDetails, BudgetDetails, AlertsDetails son placeholders | D1 | ⏳ En implementación |
| P1-06 | Falta modelo contratista-operador por contrato/servicio/OT | E1 | ⏳ Pendiente |

---

## Sprints Cerrados

| Sprint | SHA de cierre | Fecha |
|---|---|---|
| A1 — Integridad Dashboard | `6502a4fbdc7e2ec07ffbf15e2483b3db5d558951` | 2026-08-03 |
