# 📐 PLANTILLA-SPEC-IC360-V1 — Plantilla Canónica de Especificación de Feature/Módulo
**Uso:** Toda capacidad nueva o migración de módulo legacy comienza con este documento.
**Regla suprema:** el spec describe QUÉ y POR QUÉ. PROHIBIDO mencionar stack, librerías,
frameworks o diseño de implementación (eso va en el PLAN).
**Ubicación en repo:** `specs/<ID>-<nombre>/spec.md`

---

# SPEC: [ID-FEATURE] — [Nombre]
**Estado:** BORRADOR / CLARIFICADO / APROBADO-FOUNDER / IMPLEMENTADO
**Autor del spec:** [agente] · **Dictamen:** Orquestador · **Veto:** Founder
**Fecha:** [YYYY-MM-DD]

## 1. FORMATO(S) ORIGEN (OBLIGATORIO — Art. I)
| ID Formato | Documento Catálogo | Versión | Anexo/Página | ESTADO_VALIDACIÓN |
|---|---|---|---|---|
| [PTW-01] | 04_CATALOGO_FORMATOS_PTW_SHA_V2 | V2 | Anexo A IR-S-04 | VERIFICADA-CORPUS pág.X / PENDIENTE |

> Si ninguna fila puede marcarse verificada, el spec NO avanza a PLAN. Se resuelve primero
> la validación contra corpus local o web (Orquestador).

## 2. PROCESO HUMANO QUE DIGITALIZA (OBLIGATORIO)
Narrativa del proceso real, derivada de fuente normativa (corpus/NotebookLM) — no de supuestos:
- **Actor(es):** [quién ejecuta: supervisor IC360, custodio PDVSA, inspector SHA...]
- **Lugar y condiciones:** [campo, sol directo, guantes, sin señal, turno nocturno...]
- **Herramienta actual:** [planilla autocopiante, libro foliado, radio, WhatsApp...]
- **Presión/consecuencia del error:** [qué pasa si esto se llena mal: rechazo de valuación,
  riesgo de vida, bloqueo SAP...]
- **Cadena formato→dato→decisión:** [qué dato captura el humano, en qué formato lo asienta,
  qué decisión habilita o bloquea]
- **Fuente de esta narrativa:** [doc corpus + página / cuaderno NotebookLM / experiencia Founder — marcar]

## 3. ALCANCE
**Incluye:** [lista]
**NO incluye (out of scope):** [lista explícita]

## 4. REQUISITOS FUNCIONALES
| ID | Requisito | Formato origen (campo/bloque) | Prioridad |
|---|---|---|---|
| FR-001 | [El sistema debe...] | [PTW-01 Bloque 4 — Prueba de gas] | MUST |

## 5. HARD GATES DERIVADOS (OBLIGATORIO si aplica)
Cada "Campo Crítico de Rechazo" del formato origen se convierte en un gate:
| Gate | Regla | Tipo | Origen |
|---|---|---|---|
| [LEL>0% → BLOQUEO ABSOLUTO] | valor LEL debe ser 0 | BLOCK | PTW-01 Bloque 4 |
| [O₂ fuera de rango] | 19.5–23.5% | BLOCK | PTW-01 Bloque 4 |
| [Separación fuera de rango] | justificación requerida | WARNING (permisivo) | [formato] |

## 6. ENTREGABLES OFICIALES
[Qué documento/formato oficial produce: renglón en Weld Log, asiento en Libro de Obra,
partida SAP, PDF sellado con QR...]

## 7. UX — NOTAS DE CONSTRUCCIÓN (Art. VI)
- **Formato físico reconocible:** [cómo la pantalla refleja la estructura de la planilla real]
- **Estados obligatorios:** loading / empty / error / data / offline-queued
- **Modo campo:** [targets ≥48px, contraste solar, uso con guantes — si aplica]
- **Anti-slop:** [qué NO debe aparecer: métricas sin fuente, decoración, etc.]

## 8. CRITERIOS DE ACEPTACIÓN MEDIBLES
1. [Captura → Zod.parse → hard gates → DocumentViewModel → export 4 formatos, verde en test]
2. [Comando de verificación + resultado esperado]

## 9. PENDIENTES DE VALIDACIÓN (Art. VIII)
| # | Afirmación/parámetro | Fuente de resolución | Dueño |
|---|---|---|---|
| 1 | [ej. escaleras cada 7.50m vs OSHA 7.62m] | corpus IR-S-04 pág.X | Antigravity |

## 10. EVIDENCIA DE CIERRE (Art. IV)
[SHA de commits, comandos ejecutados con salida, screenshots del gate visual, estado ledger]
