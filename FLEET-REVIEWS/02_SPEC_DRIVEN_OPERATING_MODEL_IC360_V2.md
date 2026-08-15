# ⚙️ 02_SPEC_DRIVEN_OPERATING_MODEL_IC360_V2 — Modelo Operativo Spec-Driven + Scorecard 50D
**Fecha:** 14-AGO-2026 · **Versión:** V2 (conciliada tras revisión de flota)
**Cambios V1→V2:** (1) Scorecard corregido — V1 sumaba 48, no 50 (hallazgo Codex); se recontó. (2) Stack real del repo (Codex ejecutó en vivo): **React 19.2.8 · Vite 6.4.3 · TS 5.8.2 · Tailwind 4.3.3 · Zod 4.4.3 · Firebase 12** — el 01_ACK citaba versiones viejas (React 18.3.1/Firebase 10.12.2/Zod 3.23.8/TS 5.5.3); se corrige. (3) Fases AI anotadas con factibilidad Codex. (4) Referencia a Doctrina V2 (12 niveles) y Matriz Adversaria (instrumento 18).
**Complementa:** 00_CONCILIACION_MAESTRA_V1.

---

## PARTE 1 — SCORECARD 50D (V2, recontado)

**Leyenda:** ✅ VERIFICADO · 🟡 PARCIAL · 🔴 AUSENTE · ⬜ POST-PILOTO · ❓ NO VERIFICABLE
**Evidencia:** auditoría 14-ago (75/100) + verificaciones del Orquestador + ejecuciones de Antigravity/Codex en vivo.

### BLOQUE A — Arquitectura Core
| # | Dimensión | Estado | Evidencia/Brecha |
|---|---|---|---|
| 1 | Bundle <500KB gz | 🟡 | Entry real 301.85 KB raw / **95.61 KB gz** (bajo meta) · PERO chunk workflows-kernel 753.83 KB raw se carga en arranque por imports síncronos → F-WF-LAZY |
| 2 | Clean Core | ✅ | server.ts 0 lógica, functions/ consolidado (95/100) |
| 3 | Zod + baseRepo | ✅ | 27 schemas, 10/10 boundaries, baseRepo forzado |
| 4 | Offline/Outbox/Idempotencia | 🟡 | Motor existe; 3 pruebas de fuego pendientes (Doctrina V2 N7) |
| 5 | Edge Schema Versioning | 🟡 | Test upgrader v1→v2 pendiente |
| 6 | Pipeline Media (TUS/presigned) | ❓ | Sin evidencia; inventariar en BACKEND_SCHEMA_ASBUILT |
| 7 | Caching/CDN/SW PWA | ❓ | Sin evidencia |
| 8 | PDF determinista + QR | 🟡 | Exportadores consolidados; golden hash pendiente (Doctrina V2 N8) |

### BLOQUE B — Resiliencia/Tiempo Real
| # | Dimensión | Estado | Nota |
|---|---|---|---|
| 9 | FinOps/Cold/Fallback LLM | 🟡 | quotaPolicy + guards conectados; fallback léxico no evidenciado |
| 10 | Plugin-Kernel 100+ | 🟡 | Registry + 17 wf; imports síncronos (F-WF-LAZY) |
| 11 | Tiempo Real/Notif $0 | ❓ | Listeners con limit; FCM/SSE sin evidencia |
| 12 | Circuit Breakers/UTC | ❓ | America/Caracas en S18; circuit breakers sin evidencia |

### BLOQUE C — Seguridad/Identidad/Normativa
| # | Dimensión | Estado | Nota |
|---|---|---|---|
| 13 | Auth/JWT/Sesiones | ✅ | Firebase Auth + claims (S14.2 absorbido) |
| 14 | RBAC/Multi-tenancy | ✅ | 85/100; fallback PROJ-CARDON-AMUAY CONFIRMADO (E1) → F-MT-FIX GO |
| 15 | OWASP ASVS + LLM Top10 | 🟡 | Semgrep activo; **S7 LLM security = P0** (Doctrina V2) antes de conectar RAG |
| 16 | RFC 3161 + firma biométrica | 🔴 | Sellos SHA-256 existen; TSA y vectores de trazo pendientes |
| 17 | Cumplimiento/HITL/Override | 🟡 | Hard gates + HITL; protocolo Emergency Override formal pendiente (doc 08/10) |
| 18 | Rate Limit/WAF/trust proxy | 🟡 | trust proxy ✅; rate limit en geminiProxy; WAF no aplica a $0 (documentar) |

### BLOQUE D — B2B/Negocio (post-piloto por diseño)
| 19 SSO/SCIM ⬜ · 20 Customer Audit Trail 🟡 · 21 Webhooks HMAC ⬜ · 22 Entitlements ⬜ · 23 Custom Domains ⬜ |

### BLOQUE E — DevOps/Observabilidad/Calidad
| # | Dimensión | Estado | Nota |
|---|---|---|---|
| 24 | CI/CD Hard Gates | ✅ | 3 jobs, 5 gates, permissions read, gitleaks, SBOM |
| 25 | Observabilidad/APM | 🟡 | Sentry beforeSend pendiente; Trace ID sin evidencia |
| 26 | DR (RPO/RTO/PITR) | 🔴 | PITR requiere Blaze (pago) → alternativa $0: export programado + backup local (runbook) |
| 27 | Pirámide Testing | 🟡 | Ver Doctrina V2 (12 niveles) — E2E ausente, fuzzing nuevo, mutación nuevo |
| 28 | UX tokens/WCAG/campo | 🟡 | S20 planificado; UX 70/100 |
| 29 | Gobernanza IA/anti-clutter | 🟡 | ORQUESTADOR-MEMORIA + SYNC_PACK; .cursorrules/licencias por verificar |

### BLOQUE F — Meta-operativas
| 30 ADRs/Trunk 🟡 (docs/adr/ NO existe — crear) · 31 OLTP/OLAP ⬜ · 32 Supply Chain ✅ (SBOM+audit+CVE_EXCEPTIONS) · 33 Cost-per-Tenant 🟡 |

### BLOQUE G — Edge/Campo (roadmap)
| 34-47 | 🟡/⬜ | Fundamento Dexie existe; resto = Fase campo (specs listas en dim 39-47) |

### BLOQUE H — Gobernanza Construcción/RAG
| # | Dimensión | Estado | Nota |
|---|---|---|---|
| 48 | Gobernanza Multi-Agente | 🟡→✅ | Los 3 docs (AI-AGENT-GOVERNANCE, GOOGLE-SYNC-PROTOCOL, AGENT-CUSTODY) NO existían → **hoy se formalizan vía PROTOCOLO-FLOTA V2 + KANBAN V2 + MANDATO-CTO** |
| 49 | Documental/RAG | 🟡 | **Cifra canónica: 5,117 PDFs** (Open Code en vivo; no 5,119 ni 4,138); corpus PLANO (no 9 dominios en disco); 5 corruptos; 936 dupes `_NNN`; RAG Fase 2 pendiente autorización |
| 50 | Migración Legacy & PMF | 🟡 | MIGRATION_WAVES existe; cifras en conflicto (41 vs 30+ vs 67) → UX_MAP_ASBUILT reconcilia; proxies PMF = REQUIERE VALIDACIÓN DE CAMPO |

**Resumen V2:** ✅ 7 · 🟡 24 · 🔴 4 · ⬜ 13 · ❓ 2 = **50** (corregido).

## PARTE 2 — SPEC-KIT PROPIO (sin cambios de fondo; ver instrumentos 3-6)
Adoptamos el PATRÓN spec-kit (constitution → specify → plan → tasks → implement + analyze +
converge) como kit propio, NO como dependencia. Nuestra ventaja: el "qué" nace de formatos
PDVSA reales, no de conversación. Templates exigen Formato Origen + ESTADO_VALIDACIÓN.

## PARTE 3 — DOCTRINA UX PREMIUM (sin cambios de fondo)
Anti-slop + toda pantalla nace de un formato + tokens + modo campo + estados obligatorios +
gate visual del Founder con checklist mecánico. Ver MATRIZ-PRUEBAS-ADVERSARIA (inst. 18)
para casos de regresión visual y a11y.

## PARTE 4 — GOBERNANZA INMEDIATA (actualizada)
| # | Acción | Dueño | Cierra |
|---|---|---|---|
| G1 | Formalizar gobernanza multi-agente (hecho hoy: PROTOCOLO-FLOTA V2 + KANBAN V2) | Orquestador | 48 |
| G4 | Reconciliar cifras corpus (5,117 canónico) y módulos | Antigravity | 49,50 |
| G5 | Crear docs/adr/ + migrar ADR-001 + decisión EVE | Antigravity | 30 |
| G6 | Runbook DR alternativo $0 | Codex | 26 |
| G7 | spec-kit init local + constitución + preset | Antigravity | 29,48 |
| G8 | Inventariar docs/design/ y docs/intake/ (piedra fundacional UX ya existe) | Antigravity | 28,50 |
| G9 | **S7 LLM security antes de conectar NotebookLM/GraphRAG** | Claude + Orquestador | 15 |
| G10 | Stack real del repo en 01_ACK_V2 (React 19/Firebase 12/Zod 4/TS 5.8) | Antigravity | 3 |

## PARTE 5 — SECUENCIA (fusiona doc 00 + Doctrina V2 + dictamen AI-Native)
```
AHORA: O-PERP-10 ✅ (candados) → O-PERP-11 (Open Code minería) → O-PERP-12 (armamento)
SEMANA 2: Pista A — F-MT-FIX → F-WF-LAZY → F-DATA-AUDIT (GAIS, paquetes STAGED-FOR-GAIS)
SEMANA 3-4: Pista B — Fase Cero + cuadernos NotebookLM 2.0 (nlm CLI) + Data Tables→specs
SEMANA 5+: AI-Native — spec WF-043-AI (aiBridge SERVER-SIDE corregido) + Ola 5 (QaQcWelding/IntegrityIli)
```
