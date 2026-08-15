# 📐 PLANTILLA-SPEC-IC360-V2 — Especificación de Feature/Módulo
**Versión:** V2 (conciliada). **Cambios V1→V2:** +§0 Contexto Regulatorio (Qwen) · +campo Integraciones (Qwen) · +estado VETO-FUNDADOR (Qwen) · +§2.5 cadena formato→dato→decisión reforzada · +§5.1 hard gates con tipo BLOCK/WARNING explícito · +§7.1 referencia a Doctrina V2.
**Regla suprema:** describe QUÉ y POR QUÉ. PROHIBIDO stack/librerías/implementación (eso es el PLAN).
**Ubicación:** `specs/<ID>-<nombre>/spec.md`

---

# SPEC: [ID-FEATURE] — [Nombre]
**Estado:** BORRADOR / CLARIFICADO / APROBADO-FOUNDER / **VETO-FUNDADOR** / IMPLEMENTADO
**Autor:** [agente] · **Dictamen:** Orquestador · **Veto:** Founder · **Fecha:** [YYYY-MM-DD]

## 0. CONTEXTO REGULATORIO (NUEVO V2 — obligatorio en módulos regulados)
| Marco | Referencia | ESTADO_VALIDACIÓN |
|---|---|---|
| [IR-S-04 Anexo A] | [doc corpus + página] | VERIFICADA-CORPUS / VERIFICADA-WEB / PENDIENTE |
[Leyes (LCP/LOPCYMAT/LOTTT), normas PDVSA, estándares internacionales que rigen este feature]

## 1. FORMATO(S) ORIGEN (OBLIGATORIO — Art. I)
| ID Formato | Documento Catálogo | Versión | Anexo/Página | ESTADO_VALIDACIÓN |
|---|---|---|---|---|
| [PTW-01] | 04_CATALOGO_PTW_SHA_V2 | V2 | Anexo A IR-S-04 | ... |
> Si ninguna fila es verificada, el spec NO avanza a PLAN.

## 2. PROCESO HUMANO QUE DIGITALIZA (OBLIGATORIO)
- **Actor(es):** · **Lugar/condiciones:** · **Herramienta actual:** · **Presión/consecuencia del error:**
- **Fuente de la narrativa:** [corpus pág.X / cuaderno NotebookLM / Founder]

### 2.5. Cadena formato→dato→decisión (V2 reforzada)
[Qué dato captura el humano → en qué formato lo asienta → qué decisión habilita/bloquea
aguas abajo → qué entregable oficial lo consume]

## 3. ALCANCE
**Incluye:** · **NO incluye (out of scope explícito):**

## 4. REQUISITOS FUNCIONALES
| ID | Requisito | Formato origen (campo/bloque) | Prioridad |
|---|---|---|---|
| FR-001 | ... | ... | MUST/SHOULD/COULD |

## 5. HARD GATES DERIVADOS
| Gate | Regla | Tipo | Origen |
|---|---|---|---|
| [LEL>0% → bloqueo] | LEL == 0 | **BLOCK** | PTW-01 Bloque 4 |
| [separación fuera de rango] | justificación requerida | **WARNING** | [formato] |

## 6. ENTREGABLES OFICIALES
[Documento/formato oficial producido: Weld Log, Libro de Obra, partida SAP, PDF sellado QR...]

## 7. UX — NOTAS DE CONSTRUCCIÓN (Art. VI)
- **Formato físico reconocible:** [la pantalla replica la planilla real]
- **Estados obligatorios:** loading / empty / error / data / offline-queued
- **Modo campo:** targets ≥48px, contraste solar, guantes (si aplica)
- **Anti-slop:** [qué NO debe aparecer]

### 7.1. Integraciones (NUEVO V2)
[Conectores externos que este feature invoca: SAP, P6, NotebookLM, APIs. Cada uno con:
tipo, $0-compatible sí/no, y nota de que TODA llamada externa va server-side vía
functions/ (nunca SDK en cliente — ver banderas #1/#17 del dictamen AI-Native)]

## 8. CRITERIOS DE ACEPTACIÓN MEDIBLES
1. [captura → Zod.parse → gates → DocumentViewModel → export 4 formatos, verde en test]
2. [comando de verificación + resultado esperado]
3. [casos adversarios aplicables de la MATRIZ-PRUEBAS-ADVERSARIAS (instrumento 18)]

## 9. PENDIENTES DE VALIDACIÓN (Art. VIII)
| # | Afirmación/parámetro | Fuente de resolución | Dueño |
|---|---|---|---|

## 10. EVIDENCIA DE CIERRE (Art. IV)
[SHA commits, comandos con salida, screenshots gate visual, estado ledger]
