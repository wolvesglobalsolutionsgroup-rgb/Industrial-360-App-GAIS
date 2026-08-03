# Registro de Decisiones de Arquitectura — Industrial Control 360
**Versión**: 2.0 · **Fecha**: 2026-08-03 · **Aprobador**: Fundador / Superadmin de Plataforma

---

## Decisiones Operativas Vigentes

| Tema | Decisión | Fecha |
|---|---|---|
| Repositorio | `wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS` | 2026-07-26 |
| Fuente operativa | `main`, siempre verificando SHA real antes de trabajar | 2026-07-26 |
| Superadmin | Acceso global de plataforma, server-side, auditado y separado de roles tenant | 2026-08-03 |
| QA canónico | `orgId: ic360-qa-pilot`, `environment: 'qa'`, displayName: "IC360 · Proyecto Piloto QA — Datos Sintéticos", org: Constructora Río Verde S.A. (DATOS SINTÉTICOS), proyecto: Gasoducto Anaco–Aragua DN20 · Fase II (QA) | 2026-08-03 |
| Datos QA | Sintéticos, versionados, reproducibles, etiquetados con datasetId/versión/fuente, reseteables solo por platformAdmin server-side | 2026-08-03 |
| Producción | Solo datos reales autorizados; nunca fallback demo silencioso, default_org, localStorage, números hardcodeados ni demo local | 2026-08-03 |
| Normativas | Referencia controlada; no se declara cumplimiento automático. Cada requisito requiere fuente, versión, página, sección y aprobación humana | 2026-08-03 |
| Documento emitido | Debe tener versión, fuente, estado, hash SHA-256, revisión y auditoría. Cambio posterior crea revisión nueva, no sobreescribe | 2026-08-03 |
| IA | Asiste, cita y alerta; no firma, autoriza, certifica ni decide por responsables humanos | 2026-08-03 |
| Entrega | Rama/PR, evidencia reproducible, auditoría independiente y merge/deploy solo por decisión humana explícita | 2026-08-03 |

---

## Decisiones de Arquitectura (ADRs)

| ID | Fecha | Decisión | Alternativas Consideradas | Razón |
|---|---|---|---|---|
| ADR-01 | 2026-07-26 | Sistema de Componentes UI Primitivos (`src/components/ui/`) | Estilos ad-hoc / shadcn completo | Normaliza UI "Industrial Executive" con tokens dinámicos sin sobrecargar bundle |
| ADR-02 | 2026-07-26 | Work Board Kanban colaborativo sobre Firestore (`/tasks` por `projectId`) | Socket.io / WebSocket dedicado | Sincronización reactiva nativa, persistencia multi-tenant y soporte offline sin infraestructura adicional |
| ADR-03 | 2026-07-26 | PAMS integrado + React.lazy() code-splitting + Vitest como test runner canónico | Bundle único / módulos separados | Reduce bundle inicial ~200KB, habilita ASME/API tests y Command Palette (⌘K) global |
| ADR-04 | 2026-07-26 | Sistema de tema unificado CSS variables `@theme` en `index.css`, clase `dark` en `<html>` via ThemeContext | Doble sistema JS+CSS | Elimina desincronización; contraste dinámico instantáneo. Sin prefijos `dark:` Tailwind ni colores hardcodeados |
| ADR-05 | 2026-08-03 | **Gestión de secretos post-brecha**: toda API key expuesta o sin perímetro adecuado debe rotarse antes de cerrar B1, independientemente de que el endpoint sea asegurado. Las keys viven en Secret Manager / variables de entorno server-side; nunca en `src/`, `.env` commiteado ni logs | Keys en .env local / sin rotación | Cerrar el endpoint no invalida una key comprometida. La rotación es un paso de seguridad no delegable al sprint B1 únicamente |

---

## Roles de Ejecución

| Rol | Responsabilidad |
|---|---|
| **Fundador / Superadmin** | Define prioridad, aprueba alcance, autoriza implementación, commit, merge, QA y producción. Único con poder de decisión final |
| **Google AI Studio (GAIS)** | Ejecutor técnico único: lee repo, implementa sprint autorizado, prueba, documenta cambios y entrega Gate 1 con evidencia |
| **Auditor-Guía** | Prepara prompts, audita reportes y evidencia de GAIS, emite veredictos AUTORIZADO / CORREGIR / BLOQUEADO. No edita código ni ejecuta comandos en IC360 |
| **GitHub / Vercel / Firebase** | Sistemas de registro, CI/CD, preview, despliegue y control técnico |

---

## Responsables de Aprobación Normativa (RAN)

Para sprints con requisitos de normas PDVSA (F2, G3, G4, E1, H2), antes de iniciar el sprint debe estar definido:

| Campo | Descripción |
|---|---|
| Nombre | Nombre completo del responsable humano |
| Cargo | Cargo formal en la organización |
| Organización | Empresa / unidad |
| Criterio de aceptación | Qué constituye "aprobado" para la matriz de requisitos del sprint |
| Fecha de designación | Registrada aquí antes de iniciar el sprint |

> **F2 específicamente**: El responsable que aprueba la matriz IR-S-04/IR-S-17 debe estar nombrado ANTES de que F2 inicie. Sin nombre registrado, F2 tiene un gate que nadie puede abrir.

**RAN designados actualmente**: NINGUNO — pendiente de designación del fundador antes de sprints normativos.

---

## Hallazgos P0 Activos (no cerrados)

| ID | Hallazgo | Sprint de Cierre |
|---|---|---|
| P0-01 | Dashboard con fallbacks ficticios: avance, presupuesto, gasto, NDT, permisos, curva S, frentes, incidentes | A1 |
| P0-02 | Diagnóstico Project Brain AI estático — no generado por IA ni datos reales | A1 |
| P0-03 | Clima de contingencia inventado | A1 |
| P0-04 | Proxy Gemini Express sin auth/tenant/rate-limit verificable | B1 |

## Hallazgos P1 Activos (no cerrados)

| ID | Hallazgo | Sprint de Cierre |
|---|---|---|
| P1-01 | Fallback default_org/demo en ProjectContext/dashboard | A1 |
| P1-02 | Storage insuficiente para formatos industriales (XER, BC3, KML, IFC, GLB) | C1 |
| P1-03 | Wildcard de subcolecciones Firestore requiere whitelist gradual | C1 |
| P1-04 | PDF Dashboard por captura PNG; sellado parcial, falta motor central | F1 |
| P1-05 | Rutas PersonnelDetails, ProgressDetails, BudgetDetails son placeholders | D1 |
| P1-06 | Falta modelo contratista-operador por contrato/servicio/OT | E1 |
