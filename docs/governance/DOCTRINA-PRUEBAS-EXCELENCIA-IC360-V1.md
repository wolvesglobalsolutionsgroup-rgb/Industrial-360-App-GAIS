# 📜 DOCTRINA DE PRUEBAS DE EXCELENCIA — IC360-NEXUS V1
## F-QA-EXCELLENCE · Oleada 1 · Marco de 8 Niveles de Evidencia

**Fecha de Emisión:** 13 de Agosto, 2026  
**Contexto:** Exigencia de rigor senior en IC360-NEXUS. Esta doctrina define QUÉ significa "probado" en IC360-NEXUS, con gates medibles e infranqueables en CI.  
**Regla Suprema (GR-15):** Todo control debe demostrar que muerde (prueba de fuego) antes de declararse activo.

---

## 🏛️ LOS 8 NIVELES DE EVIDENCIA

### NIVEL 1 — Unitario (Vitest) · ESTADO: ACTIVO (505/508)
Base actual. Regla de endurecimiento:
- Todo módulo de `src/lib/domain/` y `src/lib/offline/` exige $\ge 80\%$ de cobertura de líneas medida por Vitest coverage en CI.
- Todo test nuevo debe fallar si se borra la función que prueba (*mutation spot-check* manual en PR review).

### NIVEL 2 — Contratos (Zod en Fronteras) · ESTADO: ACTIVO
- `writeBoundaryValidation` ya corre 10/10. Endurecer: todo schema nuevo en `entitySchemas.ts` exige test negativo (payload inválido rechazado) + test de contrato (tipo derivado compila).

### NIVEL 3 — Reglas de Seguridad DB · ESTADO: PARCIAL
- `@firebase/rules-unit-testing` existe como dependencia.
- Gate nuevo: las pruebas de `firestore.rules` corren en CI con emulador en cada PR que toque `firestore.rules`.
- Matriz obligatoria: por cada colección sensible, test de lectura/escritura cruzada entre `orgId` distintos (debe FALLAR).

### NIVEL 4 — SAST (Semgrep) · ESTADO: ACTIVO DESDE 2026-08-13
- 4 reglas custom + `p/owasp-top-ten` + `p/typescript` + `p/react`.
- Endurecimiento Oleada 1 (F-SEC-HARDENING):
  1. Reescribir `ic360-strict-tenant-isolation` contra el patrón real del código (`baseRepo` + `orgId`), no contra API namespaced.
  2. Reescribir regla Sentry: auditar `Sentry.init()` (`beforeSend`), no call sites de `captureException`.
  3. Agregar `gitleaks` al pipeline (todos los formatos de secreto).
  4. **PRUEBA DE FUEGO por regla:** archivo trampa en `tests/semgrep-traps/` con una violación plantada por regla; CI exige que Semgrep la detecte (conteo de findings $\ge$ trampas plantadas).

### NIVEL 5 — E2E (Playwright) · ESTADO: AUSENTE $\rightarrow$ SPRINT F-E2E
- Flujo dorado: login $\rightarrow$ crear PTW $\rightarrow$ firmar $\rightarrow$ emitir $\rightarrow$ verificar QR.
- Corre en CI contra build de producción + emulador Firebase.
- Criterio cuantitativo: 1 spec, 5 assertions, $<3\text{ min}$ de corrida.

### NIVEL 6 — Offline / Resiliencia · ESTADO: PARCIAL
- Tests de Outbox existen. Endurecer con F-OUTBOX:
  - Test de idempotencia: misma mutación 2 veces $\rightarrow$ aplicada 1 vez.
  - Test de `schemaVersion`: mutación v1 leída por upgrader v2.
  - Test de reintento con backoff: fallo simulado $\rightarrow$ cola no pierde la mutación tras 3 reintentos.

### NIVEL 7 — Seguridad Ofensiva Ligera · ESTADO: NUEVO
- `npm audit` en CI (ya corre) + gate: 0 críticas/altas = merge bloqueado.
- `gitleaks` en CI: cualquier secreto real en diff = merge bloqueado.
- Anual (o por release v1.0): checklist OWASP ASVS 4.0 L2 ejecutado y archivado en `docs/security/` con evidencia.

### NIVEL 8 — Regresión Visual / Documental · ESTADO: NUEVO (Oleada 2)
- **Golden file test del PDF:** `DocumentViewModel` fijo $\rightarrow$ hash SHA-256 fijo. Si el hash cambia sin cambio de plantilla autorizado, CI falla. (Este test ES la garantía del motor PDF determinista, F-PDF.)

---

## ⚙️ GATES DE CI RESULTANTES (ORDEN DE EJECUCIÓN)

```text
1. tsc --noEmit (raíz + functions)          → bloquea
2. vitest run                                → bloquea
3. firestore rules tests (si rules cambió)   → bloquea
4. semgrep custom (4 reglas, --error)        → bloquea
5. semgrep registry (owasp/ts/react)         → reporta (no bloquea, Oleada 1)
6. gitleaks                                  → bloquea
7. npm audit (altas/críticas)                → bloquea
8. bundle budget                             → bloquea
9. playwright E2E (flujo dorado)             → bloquea (desde F-E2E)
10. golden PDF hash                          → bloquea (desde F-PDF)
```

---

## 🎯 DEFINICIÓN DE "PROBADO" EN IC360 (A PARTIR DE HOY)

Una capacidad solo puede declararse **PROBADA** cuando tiene:
1. Test que falla si la capacidad se borra (no test decorativo).
2. Evidencia de corrida en CI con SHA.
3. Para controles de seguridad: prueba de fuego documentada.

**Todo lo demás es CLAIMED y se trata como tal en cualquier ledger.**
