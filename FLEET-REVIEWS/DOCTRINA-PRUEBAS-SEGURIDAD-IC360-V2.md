# 🛡️ DOCTRINA-PRUEBAS-SEGURIDAD-IC360-V2 — Doctrina de Máximo Rigor: Pruebas, Cobertura y Seguridad Ofensiva
**Fecha:** 14-AGO-2026 · **Emite:** CTO/Orquestador · **Estatus:** VINCULANTE tras aprobación Founder
**Extiende y reemplaza:** DOCTRINA-PRUEBAS-EXCELENCIA V1 (8 niveles) → esta doctrina la amplía a 12 niveles + programa de seguridad ofensiva.
**Principio rector (GR-15 ampliado):** NINGUNA auditoría debe sorprendernos. El score del proyecto se computa desde evidencia en cualquier momento. Un 90/100 que esconde una lluvia de problemas es un fraude contra nosotros mismos — prohibido por la Constitución Art. IV.
**Restricción:** todo el arsenal corre a $0 USD (herramientas open-source + capas gratuitas).

---

## PARTE 1 — LA PIRÁMIDE COMPLETA DE PRUEBAS (12 NIVELES)

| Nivel | Qué prueba | Herramienta ($0) | Estado HOY | Gate CI |
|---|---|---|---|---|
| **1. Unitario** | Funciones puras, dominio, utilidades | Vitest | ✅ 512 tests (baseline canónico; mínimo aceptable 507 por flake de emulador — ver §4) | Bloquea |
| **2. Contratos (Zod)** | Payloads inválidos rechazados en frontera; tipos derivados compilan | Zod + Vitest | ✅ 10/10 boundaries, 27 schemas | Bloquea |
| **3. Basado en Propiedades (Fuzzing)** | Generadores aleatorios atacan schemas y calculadoras (miles de casos: negativos, cero, límites, unicode, decimales extremos) | fast-check | 🔴 AUSENTE → **NUEVO** | Bloquea (smoke) + semanal (profundo) |
| **4. Reglas de Seguridad DB** | Matriz Org A vs Org B (debe FALLAR cruzado); roles; colecciones sensibles | @firebase/rules-unit-testing + emulador | 🟡 PARCIAL (corre solo si rules cambió) | Bloquea en cambio de rules + corrida completa semanal |
| **5. Integración** | repo → Firestore → Functions → export (cadena real) | Vitest + emuladores | 🟡 PARCIAL | Bloquea |
| **6. E2E Flujo Dorado** | login → crear PTW → firmar → emitir → verificar QR; y captura→Zod→gates→DVM→export por cada workflow | Playwright + emulador | 🔴 AUSENTE → **F-E2E** | Bloquea (desde F-E2E) |
| **7. Offline / Caos** | Idempotencia 100-retries=1 efecto; schemaVersion v1→v2; backoff sin pérdida; clock skew; multi-pestaña; corte a mitad de sync | Vitest + Dexie mocks | 🟡 PARCIAL (outbox existe; faltan las 3 pruebas de fuego) | Bloquea |
| **8. Golden Files (Determinismo documental)** | DocumentViewModel fijo → PDF con SHA-256 fijo; cambio de hash sin cambio de plantilla = falla | Vitest + crypto | 🔴 Planificado (N8 V1) → **F-PDF** | Bloquea (desde F-PDF) |
| **9. Regresión Visual** | Screenshot de pantallas críticas vs baseline aprobado por Founder | Playwright screenshots | 🔴 AUSENTE → **NUEVO** | Reporta (Oleada 2) |
| **10. Accesibilidad** | WCAG AA: contraste, teclado, foco, lector de pantalla, targets ≥48px campo | axe-core + Playwright | 🔴 Planificado (S20) | Bloquea en páginas migradas |
| **11. Carga / Rendimiento** | Functions bajo ráfaga; queries con límites; bundle budget | autocannon/k6 local + validateBundleBudget | 🟡 Bundle ✅ / carga 🔴 | Bundle bloquea; carga reporta |
| **12. Mutación** | ¿Los tests detectan si alguien rompe la lógica a propósito? (mata mutantes en domain/ y lib/) | Stryker | 🔴 AUSENTE → **NUEVO** (semanal, no por PR) | Reporta semanal |

## PARTE 2 — PROGRAMA DE SEGURIDAD OFENSIVA Y DEFENSIVA

| Capa | Qué cubre | Herramienta ($0) | Estado HOY | Gate |
|---|---|---|---|---|
| **S1. SAST** | Patrones inseguros en código (XSS, inyección, tenant) | Semgrep (4 custom + OWASP/TS/React) | ✅ Activo | Bloquea |
| **S2. Prueba de fuego SAST** | Archivos trampa con violaciones plantadas — CI exige que Semgrep las detecte | tests/semgrep-traps/ | 🔴 Pendiente (N4 V1) | Bloquea |
| **S3. Secretos** | Tokens/keys en diffs e historial | gitleaks | ✅ Activo (probado en incidente real 14-ago) | Bloquea |
| **S4. Cadena de suministro** | Vulnerabilidades en dependencias; SBOM; licencias | npm audit + SBOM + license-checker | ✅ audit+SBOM · 🟡 licencias (añadir gate zero AGPL/GPL) | Bloquea |
| **S5. DAST (ataque dinámico)** | ZAP baseline contra el build de preview: headers, CORS, inyección, exposición de errores | OWASP ZAP (baseline scan) | 🔴 AUSENTE → **NUEVO** (corre nocturno/semanal contra preview) | Reporta → bloquea tras calibración |
| **S6. ASVS 4.0 L2** | Checklist completo de verificación de seguridad aplicativa | OWASP ASVS checklist | 🔴 Pendiente (anual/por release) | Documentado en docs/security/ |
| **S7. Seguridad LLM (OWASP LLM Top 10)** | Prompt injection directa; **inyección indirecta vía documentos RAG/corpus**; exfiltración por herramientas; salida no validada | Reglas Semgrep custom + tests de adversario + sanitización de contexto | 🔴 AUSENTE → **CRÍTICO AHORA** (NotebookLM/MCP/GraphRAG entran en operación) | Bloquea en aiBridge/connectorHub |
| **S8. Adversarial multi-tenant** | Org A intenta leer/escribir Org B en TODA superficie nueva | tenantIsolation.test.ts (extender) | ✅ Base existe | Bloquea |
| **S9. Pentest** | Prueba de penetración manual/externa | — | ⬜ POST-PILOTO (con primer cliente; deuda documentada) | N/A a $0 |
| **S10. Anti-spoofing campo** | GPS falso, salto de reloj, replay de mutaciones | Plausibilidad server-side + timers monotónicos (Dim 42) | 🔴 Spec lista, código pendiente | Fase campo |

## PARTE 3 — REGLA DEL SCORE HONESTO (anti-terror del Founder)

1. **El score de cualquier dimensión no puede superar su gate más débil.** Si E2E está ausente, "Workflows reales" no puede pasar de 50/100 — la matemática lo impide, no la opinión.
2. **Toda métrica en un documento de gobernanza debe ser reproducible con un comando.** Si no hay comando, se marca CLAIMED y el score baja automáticamente.
3. **Flake policy:** un test inestable NUNCA se silencia. Se cuarentena con ticket, fecha y dueño (precedente: 3 timeouts del emulador Firestore → ticket con timeout 15000ms o cuarentena documentada). Baseline: 512 totales; verde exigido 512; piso aceptable 507 con los 3 flakes registrados.
4. **Cobertura mínima:** `src/lib/domain/` y `src/lib/offline/` ≥80% líneas medido en CI; toda calculadora de ingeniería (ASME/EVM/B31G) ≥95% + fuzzing obligatorio (son funciones de dinero y seguridad).
5. **Prueba de fuego universal (GR-15):** todo control nuevo demuestra que muerde antes de declararse activo — con evidencia en el PR.

## PARTE 4 — ORDEN DE GATES EN CI (secuencia canónica)

```text
 1. tsc --noEmit (raíz + functions)              → bloquea
 2. vitest run (unit + contratos + integración)  → bloquea (≥512, piso 507 documentado)
 3. fast-check smoke (schemas + calculadoras)    → bloquea [NUEVO]
 4. firestore rules tests (si rules cambió)      → bloquea
 5. semgrep custom + trampas (prueba de fuego)   → bloquea
 6. gitleaks                                     → bloquea
 7. npm audit (altas/críticas) + license gate    → bloquea
 8. bundle budget                                → bloquea
 9. playwright E2E (flujo dorado + 17 workflows) → bloquea (desde F-E2E)
10. golden PDF hash                              → bloquea (desde F-PDF)
11. ZAP baseline (nocturno, contra preview)      → reporta → bloquea tras calibración
12. Stryker (semanal, domain/ + lib/)            → reporta
```

## PARTE 5 — PLAN DE CIERRE DE BRECHAS (prioridad × $0)

| Prioridad | Brecha | Sprint/acción | Costo |
|---|---|---|---|
| **P0** | S7 LLM security (inyección indirecta RAG) | Spec + reglas Semgrep + tests adversarios ANTES de conectar NotebookLM/GraphRAG a la app | $0 |
| **P0** | Nivel 6 E2E | F-E2E (ya planificado) | $0 |
| **P0** | S2 trampas Semgrep | F-SEC-HARDENING (ya en Doctrina V1) | $0 |
| **P1** | Nivel 3 fuzzing (fast-check) en calculadoras + schemas | Sprint F-FUZZ | $0 |
| **P1** | Nivel 7 offline: 3 pruebas de fuego (idempotencia, schemaVersion, backoff) | F-OUTBOX hardening | $0 |
| **P1** | Nivel 8 golden PDF | F-PDF | $0 |
| **P1** | Flake emulador (3 timeouts) | Ticket con timeout/retry + cuarentena documentada | $0 |
| **P2** | S5 DAST ZAP nocturno | Tras preview por PR (decisión Founder pendiente) | $0 |
| **P2** | Nivel 12 mutación (Stryker semanal) | Oleada 2 | $0 |
| **P2** | Nivel 9 visual + Nivel 10 a11y | Con S20 (UX) | $0 |
| **P2** | S6 ASVS L2 | Antes de release v1.0 | $0 |
| **P3** | S9 Pentest | Primer cliente | $$$ (post-piloto) |

## PARTE 6 — DEFINICIÓN DE "PROBADO" (V2, definitiva)

Una capacidad es **PROBADA** solo cuando tiene, simultáneamente:
1. Test que falla si la capacidad se borra o se degrada (no decorativo).
2. Prueba de fuego si es control de seguridad (demuestra que muerde).
3. Evidencia de corrida en CI con SHA literal (GR-16).
4. Cobertura dentro del umbral de su categoría.
5. Cero hallazgos abiertos P0/P1 en su superficie.

**Todo lo demás es CLAIMED — y CLAIMED baja el score. Así ninguna auditoría vuelve a mostrarte un espejismo.**
