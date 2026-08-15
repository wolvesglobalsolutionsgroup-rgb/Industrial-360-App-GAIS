# ORQUESTADOR-MEMORIA-V2 — Protocolo de Memoria Persistente y Arranque

**Versión:** 2.0 — 2026-08-15 (reemplaza a ORQUESTADOR-MEMORIA-V1)
**Ruta canónica:** `docs/governance/ORQUESTADOR-MEMORIA-V2.md` en el repo canónico.
**Principio rector:** El orquestador NO recuerda entre chats. La memoria del equipo NO vive en la cabeza de ningún agente: vive en el repo, versionada con SHA. Este protocolo es el procedimiento de arranque obligatorio de toda sesión.

---

## REGLA 0 — El repo canónico (resuelve la confusión de esta noche)

| Repo | Rol | Acceso |
|------|-----|--------|
| **`wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS`** | **ÚNICO repo canónico de código y gobernanza.** Todo trabajo, commit, backup y auditoría va aquí. | ACTIVO |
| `Industrial-360-App` | Histórico/legacy (último commit real 12-ago, solo docs) | 🔒 BLOQUEADO — archivar, no trabajar |
| `Industrial-360-App-old` | Legacy anterior | 🔒 BLOQUEADO — archivar |
| Cualquier otro repo de la cuenta | Fuera del proyecto IC360 | No tocar |

**Ningún agente lee ni escribe en los bloqueados.** Antigravity apunta su carpeta local al canónico (ver §4).

## REGLA 1 — Protocolo de arranque de toda sesión (el orquestador lo ejecuta ANTES de decidir nada)

Cuando el Founder abre un chat limpio y dice "somos el equipo IC360":

1. **Leer el bloque de reinicio vigente** (`docs/governance/BLOQUE-DE-REINICIO-*.md` — el de fecha más reciente) vía GitHub o el archivo que el Founder pegue.
2. **Reconciliar con la historia real del repo** — no confiar ciegamente en el bloque; verificar:
   - `list_commits` en el canónico: ¿hay commits posteriores al cierre del bloque?
   - Si los hay → `get_commit` de cada uno: qué cambió, cuántos archivos, deletions inesperadas.
   - Reportar al Founder: "el bloque dice X, el repo muestra Y" — la discrepancia se resuelve antes de trabajar.
3. **Verificar pendientes de la sesión anterior** (§6 del bloque de reinicio): cuáles se cumplieron, cuáles no, por qué.
4. **Confirmar al Founder:** listado de pendientes priorizados del día. SOLO después de esto se trabaja.

> Regla de oro del arranque: **la historia de GitHub manda sobre la memoria declarada.** Lo que está commiteado es verdad; lo que se "recuerda" se verifica.

## REGLA 2 — Auditoría continua (cada commit de cualquier agente)

Antes de que el Founder autorice un commit y después de que ocurra:

1. **Whitelist obligatoria:** el paquete de trabajo declara los archivos permitidos. El staged se coteja contra ella (lección del incidente F-MT-FIX: GAIS borró 6 docs de gobernanza sin orden — se detectó por esta verificación).
2. **Verificación independiente post-commit** (vía conector GitHub):
   - `get_commit` (detail: stats): nº de archivos = whitelist, 0 deletions no autorizadas.
   - `get_file_contents` de archivos críticos (gobernanza, contratos) tras commits que los toquen.
   - `search_code` de patrones prohibidos cuando aplique (ej: tenant hardcodeado).
3. **CI verde** confirmado (Founder en Actions o herramienta disponible) antes de dar el sprint por cerrado.

## REGLA 3 — Respaldo (Antigravity, custodio técnico)

1. **Apuntar al canónico:** la carpeta local `Desktop\Memoria\Industrial-360-App` debe hacer `git remote set-url origin` al repo **Industrial-360-App-GAIS** y sincronizar (`fetch` + `reset --hard origin/main` tras confirmar que no hay trabajo local sin respaldar). Hoy está desactualizada — corresponde al repo viejo.
2. Todo respaldo va a rama `fleet/workspace` del canónico, con SHA-256 por archivo y manifiesto. **Nunca push a main.**
3. Snapshot preventivo de `docs/governance/` antes de cualquier ola de cambios (ya probado: `backups/governance-20260815/`, commit `7201c9fa`).

## REGLA 4 — Cierre de sesión (obligatorio)

1. El orquestador emite `BLOQUE-DE-REINICIO-IC360-<fecha>.md` con: estado verificado (no declarado), doctrinas, pendientes priorizados, prompt de arranque.
2. Antigravity lo ingesta al canónico (`docs/governance/`) con SHA y manifiesto.
3. El bloque nuevo referencia al anterior y lo SUPERSEDE.

## REGLA 5 — Doctrinas permanentes del equipo (vigentes, acumulativas)

1. Construcción CON IA, no generación POR IA. El formato es la unidad atómica (tablero → formatos → archivo → dossier).
2. Ninguna librería entra por default — Célula de Stack con prueba de emulación en sandbox (lección zod-to-json-schema: devuelve `{}` silencioso con Zod 4; vetada, se usa `z.toJSONSchema()` nativo).
3. Dedup del corpus por CONTENIDO (SHA-256 idéntico), nunca por nombre similar.
4. Base sucia (639 archivos) se preserva intacta y se clasifica sin alterar.
5. El mercado entra por el método: señal → MERCADO-SENALES → experto/corpus → spec → código. Nunca feature creep.
6. Ningún agente borra documentación de gobernanza sin orden explícita del Founder.
7. Spec antes de código. Contratos (Zod) primero. Multi-tenant: ruta canónica `organizations/{orgId}/projects/{projectId}/`, SIN fallbacks hardcodeados.
8. Ruta de specs: `docs/intake/` (mercado), `docs/method/` (plantillas), `docs/specs/` (specs), `docs/stack/` (fichas de librerías), `docs/tasks/` (paquetes GAIS).

## REGLA 6 — Verificación del propio orquestador

El orquestador también se equivoca. Toda afirmación crítica del orquestador sobre el estado del repo debe poder verificarse en GitHub en <2 minutos. Si no es verificable, se declara como "no verificado" — nunca como hecho.

---

*V2 emitida tras la sesión 2026-08-15 (F-MT-FIX auditado, incidente de alcance GAIS resuelto, confusión de repos detectada). Supersede a V1. La V1 permanece en el repo como registro histórico.*
