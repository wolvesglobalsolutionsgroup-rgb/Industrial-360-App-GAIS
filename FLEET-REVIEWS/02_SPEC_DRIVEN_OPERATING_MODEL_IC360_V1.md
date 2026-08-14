# ⚙️ 02_SPEC_DRIVEN_OPERATING_MODEL_IC360_V1.md — MODELO OPERATIVO SPEC-DRIVEN + SCORECARD 50 DIMENSIONES
**Fecha de Emisión:** 14 de Agosto, 2026
**Autor:** Orquestador IC360 (Perplexity)
**Estatus:** CANÓNICO (salvo veto del Founder). Registro: documento 02 de la serie governance.
**Complementa:** 00_CONCILIACION_MAESTRA_V1 (qué ordenar) — este doc define CÓMO se construye y DÓNDE estamos en las 50D.

---

## PARTE 1 — SCORECARD DE LAS 50 DIMENSIONES (estado verificado, no declarado)

**Leyenda:** ✅ VERIFICADO (evidencia en repo/CI) · 🟡 PARCIAL · 🔴 AUSENTE · ⬜ POST-PILOTO (diferido por diseño) · ❓ NO VERIFICABLE desde evidencia disponible
**Fuentes de evidencia:** auditoría 14-ago-2026 (75/100), verificaciones directas del Orquestador vía GitHub, 01_ACK, Doctrina F-QA-EXCELLENCE.

### BLOQUE A — Arquitectura de Software, Datos y Motor Core

| # | Dimensión | Estado | Evidencia / Brecha |
|---|---|---|---|
| 1 | Frontend & Bundle <500KB gz | 🔴 | Baseline 760.81 KB (F-H2) / 742.97 KB (F-QA.1); 17 imports síncronos de workflows; F-WF-LAZY pendiente. Meta no cumplida |
| 2 | Clean Core / Hexagonal | ✅ | server.ts 0 lógica de negocio (ADR-001), functions/ consolidado, domain/ 8 archivos. Auditoría: 95/100 |
| 3 | Zod Contracts + baseRepo | ✅ | 27 entitySchemas, writeBoundary 10/10, baseRepo con orgId/projectId obligatorios |
| 4 | Offline/Dexie/Outbox/Idempotencia | 🟡 | Motor existe con tests; prueba de idempotencia 100-retries y schemaVersion pendientes (Doctrina N6) |
| 5 | Edge Schema Versioning | 🟡 | Test upgrader v1→v2 pendiente (Doctrina N6) |
| 6 | Pipeline Media (TUS/presigned) | ❓ | Sin evidencia en auditoría; probablemente uploads directos Firebase Storage. Inventariar en BACKEND_SCHEMA_ASBUILT |
| 7 | Caching/CDN/Service Worker PWA | ❓ | Sin evidencia. Auditar vite.config + hosting headers |
| 8 | PDF Determinístico + QR | 🟡 | Exportadores consolidados (jsPDF único import ✅); endpoint verify-document existe; Golden SHA-256 test pendiente (Doctrina N8, Oleada 2) |

### BLOQUE B — Resiliencia, Tiempo Real y Micro-Arquitectura

| # | Dimensión | Estado | Evidencia / Brecha |
|---|---|---|---|
| 9 | FinOps/Cold Starts/Fallback LLM | 🟡 | quotaPolicy + guards conectados (exportDocument, baseRepo) ✅; fallback a búsqueda léxica local NO evidenciado; alertas cliente volátiles |
| 10 | Plugin-Kernel (100+ workflows) | 🟡 | Registry con anti-duplicados + lock ✅; 17 registrados; imports síncronos rompen escalado (F-WF-LAZY) |
| 11 | Tiempo Real + Notificaciones $0 | ❓ | Listeners con limit (F-C-bis); FCM/SSE/transaccionales sin evidencia |
| 12 | Circuit Breakers/Clock Skew/UTC | ❓ | America/Caracas planificado (S18); circuit breakers y skew correction sin evidencia |

### BLOQUE C — Ciberseguridad, Identidad y Normativa Industrial

| # | Dimensión | Estado | Evidencia / Brecha |
|---|---|---|---|
| 13 | Auth/JWT/Sesiones | ✅ | Firebase Auth + custom claims + ensureOwnClaims (S14.2 absorbido); TENANT_ISOLATION_PROOF.md existe |
| 14 | RBAC/Multi-tenancy | ✅ | 85/100; baseRepo forzado; ⚠️ fallback PROJ-CARDON-AMUAY NO CONFIRMADO (pendiente E1, grep local) |
| 15 | OWASP ASVS L2 + LLM Top 10 | 🟡 | Semgrep OWASP/TS/React activo + 4 reglas custom; ASVS L2 anual pendiente; anti Indirect-Prompt-Injection en RAG sin control formal |
| 16 | RFC 3161 + Firma Biométrica | 🔴 | Sellos SHA-256 y QR existen (S14.4 absorbido); TSA RFC 3161 y vectores de trazo NO implementados |
| 17 | Cumplimiento Industrial/HITL/Override | 🟡 | Hard gates PDVSA + HITL en prompts ✅; protocolo formal Emergency Override/MOC con doble firma PENDIENTE (va en doc 08/10); Legal Hold vs PII sin política escrita |
| 18 | Rate Limiting/WAF/trust proxy | 🟡 | trust proxy verificado ✅; rate limit en geminiProxy; WAF/Cloud Armor no aplica en tier $0 (documentar como decisión) |

### BLOQUE D — Gobernanza B2B y Negocio (POST-PILOTO por diseño)

| # | Dimensión | Estado | Nota |
|---|---|---|---|
| 19 | SSO SAML/OIDC + SCIM | ⬜ | Post-piloto. Firebase Auth soporta SAML/OIDC sin cambiar arquitectura |
| 20 | Customer-Facing Audit Trail | 🟡 | Audit log interno planificado (S22); exportación firmada al cliente = Fase 2 |
| 21 | Webhooks HMAC + Public API | ⬜ | Post-piloto; prerrequisito del MCP server (doc 00 §4, AI-3) |
| 22 | Entitlements/Billing | ⬜ | Post-piloto; pricing por módulo ya existe en legado NEXUS ($30-60/mes) como insumo |
| 23 | Custom Domains/Control Plane | ⬜ | Post-piloto |

### BLOQUE E — DevOps, Observabilidad, Calidad y Orquestación IA

| # | Dimensión | Estado | Evidencia / Brecha |
|---|---|---|---|
| 24 | CI/CD Hard Gates | ✅ | 3 jobs, 5 gates mecánicos, permissions: contents: read, gitleaks, SBOM |
| 25 | Observabilidad/APM Sanitizado | 🟡 | Regla Sentry beforeSend pendiente de reescritura (Doctrina N4); logs estructurados con Trace ID sin evidencia |
| 26 | Disaster Recovery (RPO/RTO/PITR) | 🔴 | Sin evidencia. **CONFLICTO $0:** PITR de Firestore requiere plan Blaze. Alternativa $0: export programado + backup local documentado en runbook |
| 27 | Pirámide de Testing | 🟡 | Unit fuerte (baseline por fijar: 417 vs 459 vs 505/508); rules-testing existe; E2E AUSENTE (F-E2E pendiente) |
| 28 | UX Industrial/Tokens/WCAG/Campo | 🟡 | S20 planificado; UX 70/100; doctrina premium en Parte 3 de este doc |
| 29 | Gobernanza IA/Anti-Clutter/Licencias | 🟡 | ORQUESTADOR-MEMORIA + SYNC_PACK existen; .cursorrules y auditoría de licencias no verificados |

### BLOQUE F — Meta-Operativas y Ecosistema

| # | Dimensión | Estado | Evidencia / Brecha |
|---|---|---|---|
| 30 | ADRs / Trunk-Based | 🟡 | ADR-001 citado pero **docs/adr/ NO existe como directorio** (verificado). Formalizar |
| 31 | OLTP vs OLAP | ⬜ | Post-piloto |
| 32 | Supply Chain/SBOM | ✅ | SBOM en CI + npm audit gate + CVE_EXCEPTIONS.md; security.txt pendiente |
| 33 | Cost-per-Tenant Margin | 🟡 | Cuotas por orgId existen; margen por tenant sin instrumentar |

### BLOQUE G — Edge Industrial y Campo (ROADMAP CAMPO)

| # | Dimensión | Estado | Nota |
|---|---|---|---|
| 34 | Periféricos Web Bluetooth/Serial | ⬜ | Fase campo; prerrequisito: PWA estable |
| 35 | Cuotas IndexedDB/Multi-pestaña/Purga | 🟡 | Dexie existe (fundamento); políticas LRU/purga/blocked sin evidencia |
| 36 | Seguridad Móvil/Kiosk/DLP | ⬜ | Fase campo |
| 37 | Expand/Contract remoto | 🟡 | Solapa con dim 5 (schema versioning) |
| 38 | Soberanía de Datos/Geofencing | ⬜ | Decisión de región GCP pendiente (documentar) |
| 39 | Aislamiento Multi-Usuario en Tablet | 🟡 | Patrón `ic360_db_${sha256(orgId+userId)}` definido aquí como spec; implementación pendiente |
| 40 | Network Flapping/Hysteresis (15s) | 🟡 | Spec definido; implementar en syncEngine |
| 41 | Thermal/Battery FinOps | ⬜ | Spec con nota de factibilidad ya incluida (getBattery deprecado → proxies) |
| 42 | Anti-Spoofing GPS/Clock | ⬜ | Spec con mitigaciones server-side (plausibilidad, timers monotónicos) |
| 43 | Client Kill-Switch vía CDN | ⬜ | Spec definido; bandera en hosting como archivo estático = $0 |
| 44 | Delta-Sync/Micro-Payloads | ⬜ | Optimización 2G/3G; post-MVP |
| 45 | PII Memory Scrubbing | ⬜ | visibilitychange purge; Fase campo |
| 46 | Web Worker Imágenes/OOM Guard | ⬜ | Crítico para tablets 2-4GB; Fase campo |
| 47 | Web Wake Lock en sync | ⬜ | Spec definido; Fase campo |

### BLOQUE H — Gobernanza de Construcción y RAG

| # | Dimensión | Estado | Evidencia / Brecha |
|---|---|---|---|
| 48 | Gobernanza Multi-Agente | 🔴 | **AI-AGENT-GOVERNANCE-V1.md, GOOGLE-SYNC-PROTOCOL-V1 y AGENT-CUSTODY-PROTOCOL-V1.md NO EXISTEN en docs/governance/** (verificado 14-ago). Solo ORQUESTADOR-MEMORIA-V1. Formalizar YA (Parte 4) |
| 49 | Gobernanza Documental/RAG | 🟡 | DOCUMENT-CENSUS-V1.md existe (3.4KB) pero cifra difiere: **4,138 (censo) vs 5,119 (clasificación Antigravity)** → reconciliar; RAG Fase 2 pendiente de autorización Founder; INVENTARIO_CORPUS con SHA-256 asignado a Open Code (O-PERP-01) |
| 50 | Migración Legacy & PMF | 🟡 | MIGRATION_WAVES.md existe; **tres cifras en conflicto: 41 módulos (dim 50) vs ~30+ páginas (auditoría) vs 67 workflows (MODULE_WORKFLOW_MAPPING)** → UX_MAP_ASBUILT las reconcilia; proxies PMF (PTW-SPLIT-VIEW, Databook auto, tríada PTS→ART→PTW) = REQUIERE VALIDACIÓN DE CAMPO |

**Resumen cuantitativo:** ✅ 6 · 🟡 22 · 🔴 4 · ⬜ 13 · ❓ 3 (totales: 50)
**Lectura ejecutiva:** el núcleo de plataforma (A, C parcial, E) está construido y verificado. Las brechas rojas son pocas y conocidas (bundle, DR, RFC 3161, gobernanza multi-agente). El Bloque G es el roadmap de campo — es donde IC360 se vuelve imposible de replicar por un chatbot.

---

## PARTE 2 — ADOPCIÓN DE SPEC-KIT (github/spec-kit) COMO PIPELINE DE CONSTRUCCIÓN

### 2.1. Qué es (verificado en fuente primaria, v0.14.2)

Toolkit open-source (MIT) de GitHub para Spec-Driven Development: CLI `specify` (Python 3.11+, se instala con `uv tool install specify-cli`), que scaffolda en el repo un flujo de comandos para 30+ agentes de código:

- `/speckit.constitution` → principios rectores inmutables del proyecto (`.specify/memory/constitution.md`)
- `/speckit.specify` → spec de feature (QUÉ y POR QUÉ; prohíbe stack técnico; obliga marcadores `[NEEDS CLARIFICATION]`)
- `/speckit.clarify` → resuelve ambigüedades antes de planear
- `/speckit.plan` → plan técnico con gates constitucionales (genera research.md, data-model.md, contracts/, quickstart.md)
- `/speckit.tasks` → tasks.md ejecutable con paralelización [P]
- `/speckit.analyze` → análisis de consistencia cruzada spec/plan/tasks (pre-implementación)
- `/speckit.implement` → ejecución; `/speckit.converge` → brecha spec↔código (brownfield)
- Sistema de **presets/extensiones/bundles**: plantillas personalizables con prioridad (overrides locales > presets > extensiones > core)

### 2.2. Por qué encaja con IC360 (mapeo 1:1 con nuestro método rector)

| Spec-Kit | IC360 ya lo tiene como |
|---|---|
| constitution.md (artículos inmutables) | Método rector + AGENTS.md + Doctrina 8 niveles + GR-16 → **se fusionan en UNA constitución** |
| `[NEEDS CLARIFICATION]` obligatorio | Nuestro `PENDIENTE DE VALIDACIÓN` — mismo principio anti-alucinación |
| Spec = WHAT, prohibido HOW | FORMATOS PRIMERO: el QUÉ viene del catálogo (03/04/07/08/10), no del modelo |
| Phase gates constitucionales en plan | Nuestros 5 gates mecánicos CI + 10 gates Doctrina |
| `/speckit.analyze` (consistencia) | Auditor externo (Claude) + Orquestador (coherencia 50D) |
| `/speckit.converge` (brownfield) | Olas 5-10 de migración legacy |
| specs/ por rama de feature | Ramas sprint + 4 capas de cierre (GAIS→auditor→Founder→merge humano) |

**Nuestra ventaja sobre spec-kit vanilla:** spec-kit asume que el "qué" nace de conversación con el usuario. En IC360 el "qué" nace de **formatos PDVSA reales verificados** — el spec de un PTW no se inventa: se deriva del Anexo A del IR-S-04. Eso es spec-driven con suelo industrial.

### 2.3. Qué NO adoptamos literalmente

1. **Article III (Test-First estricto red-phase):** se sustituye por nuestra Doctrina de 8 Niveles (más completa: incluye prueba de fuego, golden hash, E2E).
2. **Library-first/CLI-mandate (Articles I-II):** aplican a librerías, no a páginas React; se reinterpretan como "toda capacidad de dominio vive en src/lib/ o src/workflows/, nunca inline en páginas".
3. **Constitución default de 9 artículos:** se reemplaza por la Constitución IC360 (Parte 2.5).
4. **specs/ en inglés:** nuestros specs se escriben en español industrial venezolano (el dominio manda).

### 2.4. Quién puede operar spec-kit (matriz de capacidades)

| Agente | Terminal local | Rol en el pipeline spec-kit |
|---|---|---|
| **Antigravity** | ✅ | `specify init`, instala preset IC360, ejecuta /plan /tasks, commitea specs/ |
| **Codex** | ✅ | /implement en ramas feature; prototipos |
| **Open Code** | ✅ | Scripts de minería; soporte /implement económico |
| **Claude (Desktop/Code)** | ✅ | /speckit.analyze + auditoría de PRs (checklist mecánico) |
| **Qwen** | ✅ | Redacción de specs de estructura/reglas (08) |
| **Minimax** | ✅ | Fixtures y datos de prueba |
| **GAIS (Gemini 3.7)** | ❌ (sin terminal persistente verificada) | **Consume** spec.md + plan.md + tasks.md como prompts (su flujo actual no cambia; mejora porque el input es más rico) |
| **Perplexity (Orquestador)** | ❌ | Redacta constitución, preset y specs de dominio; dictamina /analyze; coherencia 50D. No instala nada |

### 2.5. Constitución IC360 para spec-kit (`.specify/memory/constitution.md`)

El Orquestador la emite como documento aparte (`CONSTITUCION-IC360-V1.md`). Artículos:

1. **FORMATOS PRIMERO:** todo spec cita su formato(s) origen del catálogo (ID + versión + ESTADO_VALIDACIÓN). Spec sin formato origen = RECHAZADO.
2. **$0 USD hasta ≥10 clientes:** toda decisión de plan demuestra operación en tier gratuito.
3. **Multi-tenant sin fallback:** orgId/projectId/membership/role obligatorios, server-side, sin excepción.
4. **Evidencia o no existe:** todo claim con SHA verificable + comando reproducible. SHAs solo de `git rev-parse` (GR-16).
5. **HITL en lo regulado:** la IA propone; hard gates validan; humano firma. Prohibido auto-aprobar permisos PTW.
6. **Anti-slop UX (Parte 3):** prohibidos mocks, gradientes genéricos, datos inventados, estados vacíos sin diseño.
7. **Kernel protegido:** src/lib/workflows/, src/lib/exporters/ solo se modifican con ADR + aprobación Founder.
8. **PENDIENTE DE VALIDACIÓN:** prohibido afirmar normas/parámetros no verificables; marcar y seguir.
9. **4 capas de cierre:** auto-checklist → auditor externo → gate Founder → merge humano. Sin excepciones.

### 2.6. Preset IC360 (personalización de plantillas spec-kit)

Antigravity instala como override local (`.specify/templates/overrides/`):

- **spec-template:** añade secciones obligatorias `## Formato(s) Origen` (tabla: ID formato, doc catálogo, versión, página/anexo, ESTADO_VALIDACIÓN) y `## Hard Gates Derivados` (cada "Campo Crítico de Rechazo" del formato → un gate).
- **plan-template:** añade gate `## Restricción $0` (demostrar tier gratuito) y `## Impacto Multi-Tenant`.
- **tasks-template:** ordena: schema Zod → tests de frontera → gates → UI → export → E2E.

### 2.7. Primer ciclo spec-kit (piloto)

**Ola 5 (QaQcWelding + IntegrityIli)** será el primer feature construido 100% bajo spec-kit:
`/speckit.specify` alimentado con el doc 03 (soldadura) → `/speckit.clarify` (con Founder) → `/speckit.plan` (Codex) → `/speckit.tasks` → `/speckit.analyze` (Claude) → `/speckit.implement` (GAIS/Codex) → 4 capas.

---

## PARTE 3 — DOCTRINA UX/UI PREMIUM "CONSTRUCCIÓN CON IA" (anti-slop)

**Premisa del Founder:** construimos CON IA, no generamos POR IA. La UX se diseña, no se improvisa.

### 3.1. Anti-patrones IA PROHIBIDOS (rechazo en gate visual)

1. Gradiente púrpura/azul genérico "de IA", glow sin propósito, glassmorphism decorativo
2. Dashboards con métricas inventadas, sparklines decorativas, contadores sin fuente
3. Tarjetas idénticas sin jerarquía visual ni densidad de información real
4. Iconos emoji como sustituto de iconografía industrial (Lucide/tokens)
5. Tablas sin estado vacío/carga/error; formularios sin validación visible en línea
6. Texto de relleno, "Lorem", datos de ejemplo que parecen reales
7. Pantallas que no reflejan el formato físico PDVSA que digitalizan

### 3.2. Reglas de construcción premium

1. **Toda pantalla nace de un formato:** el layout de PTW-01 replica la estructura lógica del Anexo A (encabezado → identificación → riesgos → controles → gas test → firmas). El usuario de campo debe reconocer su planilla de papel en la pantalla.
2. **Design tokens centralizados** (dim 28): paleta industrial (modo oscuro operaciones / modo claro sol-de-campo), targets ≥48px en campo, WCAG AA medido, `prefers-reduced-motion`.
3. **Estados obligatorios:** toda vista define loading / empty / error / data / offline-queued. Sin excepción.
4. **Densidad informativa profesional:** las pantallas de ingeniería muestran datos reales con unidades, TAGs, y referencias normativas — no "cards bonitas".
5. **Firma y evidencia como ciudadanos de primera clase:** trazo de firma con vectores (dim 16), foto georreferenciada, QR de verificación — visibles y táctiles.
6. **Gate visual del Founder (Capa 3) con checklist mecánico:** tokens usados (0 colores arbitrarios), estados presentes, formato origen reconocible, 0 datos inventados.

### 3.3. Cómo "lo averiguamos" (proceso)

1. **UX_MAP_ASBUILT** (Antigravity, E3 del doc 00): inventario de las ~45 páginas + contenido de `docs/design/` y `docs/intake/` (descubiertos hoy — posiblemente tu trabajo de pantallas de 2024 ya está ahí).
2. **Benchmark dirigido (Orquestador):** análisis web de UX de software industrial serio (EPC/O&G) para fijar barra de calidad — entregable: `docs/design/BENCHMARK-UX-INDUSTRIAL-V1.md`.
3. **Screen-specs por formato:** cada formato del catálogo 04/03 genera un screen-spec (spec-kit) antes de tocarse su UI. Piloto: PTW-01 split-view (campo: captura / revisión).
4. **Prototipo en rama, gate visual, merge.** La estética se aprueba con evidencia (screenshots en PR), no con adjetivos.

---

## PARTE 4 — ACCIONES DE GOBERNANZA INMEDIATAS (cierra brechas del scorecard)

| # | Acción | Dueño | Cierra dim |
|---|---|---|---|
| G1 | Formalizar `AI-AGENT-GOVERNANCE-V1.md` (roles flota, prohibiciones, GR-16) | Qwen redacta → Orquestador dictamina | 48 |
| G2 | Formalizar `GOOGLE-SYNC-PROTOCOL-V1.md` (SYNC_PACK: qué entra, qué no, espejo en docs/sync/) | Antigravity | 48 |
| G3 | Formalizar `AGENT-CUSTODY-PROTOCOL-V1.md` (cadena prompt→ejecución→push→verificación contra GitHub API, no contra reportes) | Qwen + Antigravity | 48 |
| G4 | Reconciliar cifras corpus (4,138 vs 5,119) y módulos (41 vs 30+ vs 67) | Antigravity (UX_MAP + censo) | 49, 50 |
| G5 | Crear `docs/adr/` y migrar ADR-001 + decisiones EVE | Antigravity | 30 |
| G6 | Runbook DR alternativo $0 (export programado Firestore + backup local) | Codex | 26 |
| G7 | Instalar spec-kit local + `specify init` en rama `chore/spec-kit-init` + aplicar constitución y preset IC360 | Antigravity | 29, 48 |
| G8 | Inventariar `docs/design/` y `docs/intake/` (directorios descubiertos, no catalogados) | Antigravity | 28, 50 |

---

## PARTE 5 — SECUENCIA INTEGRADA (fusiona con los 30 días del doc 00)

```
HOY:        Founder rota secretos · Antigravity: E1-E7 + G4/G5/G8
DÍA 2-3:    G7 (spec-kit init + constitución + preset) · G1-G3 (Qwen/Antigravity)
SEMANA 2:   08 (Qwen) + validación anexos + PRD firmado
SEMANA 3:   10 despiece + F-WF-LAZY/F-DATA-AUDIT (GAIS) + UX_MAP + benchmark UX (Orquestador)
SEMANA 4:   OLA 5 BAJO SPEC-KIT COMPLETO (primer ciclo specify→analyze→implement→4 capas)
            + F-E2E pilotos + TRD_V1 + PLAN_V3
```

**Definición de éxito del primer ciclo spec-kit:** spec de QaQcWelding que cita el doc 03
con formato-origen verificado, 0 marcadores [NEEDS CLARIFICATION] sin respuesta del Founder,
/analyze de Claude sin inconsistencias, CI verde, gate visual aprobado.

---

**FIN DEL MODELO OPERATIVO V1.** Próxima revisión: al cierre del primer ciclo spec-kit (Ola 5).
