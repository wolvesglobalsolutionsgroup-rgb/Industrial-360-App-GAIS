# ORQUESTADOR-MEMORIA-V1.md
## Memoria Persistente del Orquestador — IC360-NEXUS

**Propósito:** Este archivo ES la memoria del Orquestador (Perplexity
Computer). Se lee vía GitHub API al INICIO de cada sesión y se actualiza
al CIERRE de cada jornada de trabajo o evento significativo.

**Escritor autorizado:** Google AI Studio (por instrucción del
Orquestador, ejecutada por el Founder). Antigravity como respaldo.

**Regla suprema de este archivo:** Todo dato aquí es VERIFIED (con SHA
o evidencia) o CLAIMED (marcado explícitamente). Lo CLAIMED no puede
presentarse como hecho.

---

## 1. IDENTIDAD DEL PROYECTO

- **Producto:** IC360-NEXUS — suite SaaS industrial multi-tenant
- **Repo:** wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS (main)
- **Stack:** React 19 + TS + Vite 6 + Tailwind v4 + Firebase (Spark)
  + Vercel (hosting) + Dexie/IndexedDB (offline) + Gemini API (IA)
- **Restricción absoluta:** $0 USD de infraestructura
- **Piloto:** tríada PTS→ART→PTW + firma digital SHA-256 + QR
  verificable + Databook + Libro de Obra
- **Normativa:** PDVSA (IR-S-04, IR-S-17, SI-S-20), IEC 62443,
  ISO 27001, OWASP ASVS 4.0 L2
- **Marco rector:** 52 dimensiones (49 técnicas + 3 gobernanza),
  roadmap por Oleadas 0-3 en docs/governance/ROADMAP-MAESTRO-IC360-V1.md
- **Principio 6:** La IA es opcional. Siempre hay fallback manual
  y determinista. El sistema nunca bloquea decisiones de negocio.

---

## 2. ESTADO ACTUAL (ACTUALIZAR CADA SESIÓN)

- **Última actualización:** 2026-08-13 (cierre de Oleada 0)
- **HEAD verificado:** cc0ea89f007a40271baa0d223fc330f36c54a451
- **CI:** 5/5 VERDE (primer pipeline completamente verde del proyecto)
- **Oleada actual:** 0 CERRADA → arranca OLEADA 1 (Piloto Funcional)
- **Auditoría vigente:** 52 dimensiones (2026-08-12) —
  0 vulns npm, 0 copyleft, bundle 120 KB gzip, 505/508 tests,
  tsc 0 errores, SBOM real en CI

### Scores de la auditoría 52-dim (los que importan):
- Fortalezas: A1 bundle 93, B1 registry 95, C1 JWT 90, C2 RBAC 88,
  E1 CI 85, E2 observabilidad 88, F3 SBOM 90
- Brechas P1 (Oleada 1): A8B PDF no determinista 40, A4 outbox sin
  idempotency 68, A5 sin schemaVersion 20, E4 sin E2E 65, C4 firma
  RFC3161 25
- Post-piloto correcto: Bloque D enterprise 20-35, Bloque G edge 5-15

---

## 3. AGENTES Y SUS LIMITACIONES REALES (CONOCIMIENTO GANADO)

### Founder (Freddy)
- Autoridad final. Presiona "Stage and commit all" en Google AI Studio.
- Firma ejecutiva de documentos. Única autoridad para producción.

### Orquestador (Perplexity Computer — yo)
- Verifico TODO por GitHub API. Nunca confío en prosa de agentes.
- No tengo terminal del proyecto. Leo/escribo vía conector GitHub.
- Leo este archivo al inicio de cada sesión.

### Google AI Studio (Constructor)
- NO tiene terminal. NO ejecuta comandos CLI. NO puede hacer git pull.
- Solo EDITA archivos en su workspace; el Founder presiona el botón.
- Sus commits van DIRECTO a main (no hay branch protection real).
- RIESGO CONOCIDO: si su workspace está desactualizado, al commitear
  BORRA del repo lo que no tiene localmente (incidentes 90922430
  y 2fffc269 — dos borrados masivos).
- Aplica fixes PARCIALMENTE (arregló línea 6 del YAML, dejó rota la
  15). Toda orden se verifica por API, línea por línea.
- Prompts correctos para Google: solo "escribe/reemplaza este archivo
  con este contenido exacto" + "reporta en texto". JAMÁS comandos.

### Antigravity (Auditoría / Custodia / Buzón local)
- SÍ tiene terminal local (Windows, Python, git, semgrep).
- Mantiene buzón IC360_INBOX_WF-SPECS + SYNC_PACK_GOOGLE.
- Agente de custodia: monitorea main cada 3 min, auto-restaura.
- Hace pushes directos a main (fix semgrep 85b7870, doc EVE 36033f7).
- Tiene skill de Semgrep — pero agregó el workflow con un ruleset
  que nunca existió (p/owasp-top-10). Lección: tener la skill no
  es tener la verificación.

### Spark (Diseño UX/UI + Investigación)
- Documentos de diseño (DESIGN-LANGUAGE V1/V2, PTW-SPLIT-VIEW),
  análisis competitivo, investigaciones técnicas.

### Qwen + Planificador (Gobernanza documental)
- Ledger canónico (PLAN-RECTOR). Escribe documentos SOLO por demanda
  de construcción, no por programa. No toca código.
- Su doc 05 v1.1 tenía datos stale (declaró SEMGREP "cerrado"
  mientras el CI estaba roto). Regla GR-14 nació de eso.

### GitHub Copilot (Análisis de fallos CI)
- Útil para diagnóstico rápido. PELIGRO: alucina nombres de rulesets
  (sugirió p/owasp-top-10-2021, que no existe). Toda sugerencia de
  Copilot se verifica contra documentación oficial antes de ejecutarse.

---

## 4. PROTOCOLOS OPERATIVOS VIGENTES

1. **5 Reglas Inviolables** (post-incidentes, firmadas por agentes)
2. **SYNC_PACK obligatorio** antes de cada tarea de Google
3. **Cadena de custodia:** prompt → ejecución → push → custodia →
   validación del Orquestador por API → siguiente tarea
4. **Contrato de Trabajo Unitario:** 1 orden = 1 cluster = 1 commit.
   Archivos autorizados + zona prohibida + criterio cuantitativo.
5. **GR-14:** Todo estado "CERRADO/ACTIVO" en ledgers debe tener
   verificación fresca (24h) vía API. Sin verificación = sospechoso.
6. **GR-15 (Prueba de Fuego):** Todo control de seguridad debe haber
   disparado al menos una vez (finding real o violación plantada).
   Control que nunca mordió = placebo.
7. **Prompts a Google:** sin CLI, solo archivos + reporte textual.
8. **Auditorías ancladas al repo:** todo informe vive en docs/audit/
   o docs/governance/. El delta se ancla a documento, no a memoria.

---

## 5. ROADMAP RESUMIDO (detalle en ROADMAP-MAESTRO-IC360-V1.md)

### OLEADA 0 — ESTABILIZACIÓN: ✅ CERRADA (2026-08-13, cc0ea89f)
- Semgrep reparado (YAML + registry + 14 hallazgos con logging)
- Bundle resuelto con esbuild minify (solución de Google, mejor que
  subir el límite — registrar como buena decisión de agente)
- CI 5/5 verde por primera vez

### OLEADA 1 — PILOTO FUNCIONAL (activa)
- F-OUTBOX: idempotencyKey + dedup server + schemaVersion (A4+A5)
- F-PDF: motor PDF server-side determinista bajo demanda (A8B)
- F-E2E: Playwright sobre flujo dorado PTW (E4)
- F-PWA: vite-plugin-pwa, app shell offline (A7)
- F-SPLIT: implementar PTW-SPLIT-VIEW-DESIGN-V1.1 (E5)
- F-TSA: decisión RFC 3161 documentada (C4)
- F-SEC-HARDENING: reescribir 2 reglas Semgrep rotas + gitleaks +
  prueba de fuego por regla + triangular reporte OWASP (nuevo)
- F-QA-EXCELLENCE: doctrina de pruebas rigurosa (ver sección 11)
- CRITERIO DE SALIDA: 3 PTW en campo sin conectividad + QR verificado

### OLEADA 2 — 10 CLIENTES $0
- Circuit breakers, UTC/clock skew, notificaciones, FinOps por tenant,
  DR, emergency override MOC, RAG pipeline, migración de 41 legados
- EVE Framework: agente Pre-Auditor Normativo (si spike pasa)

### OLEADA 3 — ENTERPRISE/EDGE (solo por evidencia de campo)
- Bloque D completo, Bloque G completo, OLAP, ADRs dedicados

---

## 6. LECCIONES APRENDIDAS (LOG DE INCIDENTES)

| Fecha | Incidente | Lección |
|---|---|---|
| 2026-08-11 | 90922430: borrado masivo por push desactualizado | SYNC_PACK + custodia nacen aquí |
| 2026-08-12 | 2fffc269: segundo borrado masivo | 5 Reglas Inviolables + protección procedural |
| 2026-08-12 | Google degradó Censo RAG (−171 líneas) y Cyber-Gap V1 (−106) | Todo doc tocado por agente se audita en diff |
| 2026-08-12 | Semgrep CI declarado "cerrado" pero NUNCA corrió (ruleset 404 + YAML roto) | GR-14 y GR-15 nacen aquí |
| 2026-08-13 | Copilot alucinó ruleset p/owasp-top-10-2021 | Verificar contra docs oficiales siempre |
| 2026-08-13 | Google arregló línea 6 del YAML, dejó línea 15 rota | Fixes parciales: verificar línea por línea por API |
| 2026-08-13 | Bundle: Google eligió esbuild minify en vez de subir límite | Buenas decisiones de agentes también se registran |

---

## 7. DECISIONES REGISTRADAS

- **DEC-EVA-01:** EVE Framework → EVALUAR EN OLEADA 2. Agente
  candidato: Pre-Auditor Normativo. Condiciones: spike empírico
  VERIFIED antes de spec, Gemini directo sin AI Gateway, piloto
  100% funcional sin EVE. Doc: docs/architecture/INVESTIGACION-EVE-IC360-V1.md
- **DEC-GOV-01:** Un solo plan rector (ROADMAP-MAESTRO). Doc 05 de
  Qwen se fusiona como PLAN-RECTOR. Documentos 06-14: demand-pulled.
- **DEC-SEC-01:** Regla silent-catch queda en ERROR (bloqueante).
  Los 14 hallazgos se corrigieron con logging, no bajando severidad.
- **DEC-CI-01:** Bundle budget se resuelve con minificación real,
  no moviendo la meta (solución de Google, adoptada).

---

## 8. COLA PENDIENTE (ACTUALIZAR CADA SESIÓN)

Al cierre de Oleada 0:
- [ ] Antigravity: spike EVE local (npx eve init, Gemini directo,
      1 skill normativa) → SPIKE-EVE-RESULTADO.md
- [ ] Revisar diff y revertir degradación de DOCUMENT-CENSUS-V1.md
      y CYBER-GAP-ANALYSIS-V1.md si el corte no fue autorizado
- [ ] Qwen: corrección v1.2 del PLAN-RECTOR (datos stale + GR-14/15)
- [ ] Arrancar F-OUTBOX (prompt ya redactado en auditoría V2, §7)
- [ ] Triangular primer reporte OWASP real (corrió por primera vez
      en cc0ea89f)

---

## 9. GLOSARIO RÁPIDO

- **Tríada:** PTS (Permiso de Trabajo Seguro) → ART (Análisis de
  Riesgo de Tarea) → PTW (Permit to Work)
- **Hard Gate / NormativeControl:** control normativo ADVISORY
  (nunca bloquea, registra override humano)
- **Golden Workflow:** Plan de Calidad (candidato)
- **Outbox:** cola offline de mutaciones (Dexie) que sincroniza
  al recuperar conectividad
- **Oleada:** unidad de gobierno del roadmap; el scorecard de 52
  dimensiones se re-evalúa solo al cerrar oleada

---

## 10. PROTOCOLO DE ACTUALIZACIÓN DE ESTE ARCHIVO

1. Al CIERRE de cada jornada, el Orquestador emite una instrucción
   de actualización (qué secciones cambian y con qué contenido).
2. El Founder la ejecuta vía Google AI Studio (o Antigravity).
3. El commit debe referenciar: docs(memory): update ORQUESTADOR-MEMORIA.
4. El Orquestador verifica por API que el contenido aterrizó íntegro.
5. Si este archivo supera 500 líneas, las secciones 6-7 (lecciones
   y decisiones antiguas) se archivan a ORQUESTADOR-MEMORIA-ARCHIVO.md.

**Versión:** V1 · **Creado:** 2026-08-13 · **SHA de creación:** [commit del día]
