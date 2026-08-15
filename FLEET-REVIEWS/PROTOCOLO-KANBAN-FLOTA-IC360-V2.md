# 📋 PROTOCOLO-KANBAN-FLOTA-IC360-V2 — Transporte, Custodia y Tablero de Trabajo
**Versión:** V2 (conciliada). **Cambios V1→V2:** (1) GAIS restringido a sprint/* (main solo merge humano) — corrección Spark. (2) Vía de entrega para agentes remotos sin disco (GitHub MCP directo a fleet/workspace — probada por Spark commit e0da4d9). (3) Rebase periódico Z2↔Z3 (Spark). (4) Branch protection main+fleet/workspace (aplicada 14-ago, O-PERP-10).
**Ubicación canónica:** `docs/spec-kit-ic360/PROTOCOLO-KANBAN-FLOTA-IC360-V2.md`

---

## 1. LAS TRES ZONAS

| Zona | Qué es | Quién escribe | Quién lee |
|---|---|---|---|
| **Z1 — Staging Local** | `C:\...\IC360_INBOX_WF-SPECS\` en el equipo del Founder | Agentes con acceso local (Antigravity gestiona) | Agentes locales |
| **Z2 — Rama `fleet/workspace`** | Transporte + respaldo + tablero. **GAIS NUNCA la toca** | Antigravity (local) · agentes remotos vía GitHub MCP | Orquestador (integridad), Founder (contenido) |
| **Z3 — `main`** | Canónico. Solo lo aprobado por las 4 Capas | Merge humano (Founder) | Todos |

**REGLA DE ORO:** ningún trabajo valioso vive solo en un chat o solo en el workspace de GAIS.
Si no está en Z2 o Z3, no existe.

## 2. ESTRUCTURA Z1 (local)
```
IC360_INBOX_WF-SPECS\
├── ORQUESTADOR-INBOX\        ← lo que los agentes me dirigen
├── FLEET-REVIEWS\<agente>\   ← revisiones por agente (claude/, qwen/, codex/, minimax/, open-code/, gemini-spark/, antigravity/)
├── STAGED-FOR-GAIS\          ← paquetes listos para adjuntar a GAIS
├── TO-REPO\                  ← candidatos aprobados para main
├── ARCHIVE\                  ← histórico con fecha
└── SYNC_PACK_GOOGLE\         ← (existente) paquete de sincronización GAIS
```

## 3. FLUJO DEL TABLERO (estados Kanban)
```
DRAFT-LOCAL → COMMITTED-FLEET (hash) → REVIEWED-ORQUESTADOR
→ APPROVED-FOUNDER → MAIN (4 capas) | GAIS (adjunto) | ARCHIVE
```
1. **DRAFT-LOCAL:** agente produce y guarda en su subcarpeta.
2. **COMMITTED-FLEET:** Antigravity copia a Z1, commitea a fleet/workspace, reporta ruta + SHA + tamaño. **Vía alternativa (V2):** agentes remotos sin disco local (probado por Spark) commitean directo a fleet/workspace vía GitHub MCP en su subcarpeta. Sin SHA = no entregado (GR-16).
3. **REVIEWED-ORQUESTADOR:** yo verifico contra GitHub API y pido extractos dirigidos.
4. **APPROVED-FOUNDER:** Founder ve lo crítico y aprueba/veta.
5. **Destino:** MAIN (4 capas) · GAIS (STAGED-FOR-GAIS) · ARCHIVE.

## 4. CUARENTENA GAIS + PROTECCIÓN DE RAMAS (V2)

1. **GAIS opera SOLO en ramas `sprint/*`.** `main` solo recibe merge humano (Art. IX).
   *(V1 decía "main/sprint/*" — corregido: main NO es espacio de trabajo de GAIS.)*
2. GAIS **nunca** toca `fleet/workspace`.
3. Todo prompt a GAIS lleva el PROTOCOLO GAIS-SAFE-PUSH (git status 0 borrados ·
   git diff --stat origin/main sin eliminaciones ajenas · ABORTA si hay borrados ajenos ·
   commit solo con archivos de su tarea).
4. **Branch protection (aplicada 14-ago, O-PERP-10):** `main` con PR obligatorio (1
   aprobación), force-push y deletions bloqueados, enforce_admins. Mismo espíritu en
   `fleet/workspace` (bloquear force-push/deletions).
5. Antigravity verifica post-push de GAIS que el conteo de archivos de docs/, .github/,
   scripts/ no disminuyó. Si disminuyó → restauración inmediata + alerta roja al Founder.
6. **Sincronización periódica Z2↔Z3 (V2):** tras cada sprint cerrado en main, Antigravity
   aplica `git merge origin/main` sobre fleet/workspace para evitar divergencia acumulada.
7. **Anti-deriva:** antes de TODO push a fleet/workspace, `git pull --rebase origin
   fleet/workspace` (regla permanente).

## 5. REVISIÓN DE DOCUMENTOS SIN ADJUNTAR (mecánica del Founder)
1. Antigravity coloca documentos en Z1/Z2 y reporta la ruta.
2. El prompt al revisor dice: **"Lee línea por línea los documentos en [ruta]. Si tienes
   algo que agregar/mejorar/corregir: (a) commitea tu revisión en FLEET-REVIEWS\<tú>\ y
   reporta el SHA, o (b) respóndeme citando la sección exacta. Veredicto:
   APROBADO / CON-CAMBIOS / RECHAZADO."**
3. Orquestador consolida → Founder resuelve desacuerdos → solo entonces va a main.

## 6. APLICACIÓN: LOS 16 INSTRUMENTOS FUNDACIONALES
Los 16 documentos del Orquestador (emitidos 14-ago) entran al tablero: Founder los entrega
a Antigravity → commitea a fleet/workspace → cada revisor lee por ruta → Orquestador
concilia → Founder aprueba → main (commit firmado) → SYNC_PACK se regenera → GAIS inmunizado.

## 7. PROHIBICIONES DEL TABLERO
- Prohibido commitear a fleet/workspace secretos o el archivo de recursos legacy
  (INCIDENT-2026-08-14). gitleaks aplica también a esa rama.
- Prohibido que GAIS reciba adjuntos que no vengan de STAGED-FOR-GAIS\ (fuente única).
- Prohibido reportar entregas sin SHA de commit (GR-16).
- Prohibido que dos agentes editen el mismo archivo en Z1 simultáneamente (subcarpetas por agente).
- Prohibido abrir PR masivo de fleet/workspace → main (la franja amarilla "Compare & PR"
  de GitHub se IGNORA; lo que va a main llega por PR dirigido o cherry-pick a rama sprint).

## 8. REGISTRO VIVO
Antigravity mantiene `fleet/workspace/TABLERO.md`: | Documento | Autor | Estado Kanban | SHA actual | Revisor | Dictamen | Destino final |
Ese archivo ES el tablero que el Founder abre en GitHub en cualquier momento.
