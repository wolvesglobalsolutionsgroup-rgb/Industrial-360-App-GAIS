# 🧠 GUIA-EXPERTOS-NOTEBOOKLM-IC360-V2 — Expertos Sintéticos con NotebookLM 2.0
**Fecha:** 14-AGO-2026 · **Versión:** V2 (conciliada)
**Cambios V1→V2:** (1) Límite de fuentes verificado por Minimax: Pro=300/cuaderno (Ultra 500-600) → sub-cuadernos obligatorios para dominios grandes. (2) Batería EXP-02 rediseñada: hallazgo Open Code — los PTW-XX NO existen como PDFs standalone (0 hits), viven como anexos dentro de IR-S-04 (39 hits); + pregunta trampa + preguntas de proceso (Minimax). (3) Operativa de "cita correcta": doc+sección+página+versión+fecha. (4) NotebookLM 2.0 como infraestructura central (Deep Research, Data Tables, ejecución código, exports). (5) Canal de automatización nlm CLI.
**Ejecutor:** Antigravity (NotebookLM MCP v2.0.0 + nlm CLI). **Precedente probado:** cuaderno Contrataciones (142 fuentes).

---

## 1. CURACIÓN POR REFERENCIAS CRUZADAS (sin cambios de fondo)
El experto se alimenta de la cadena de documentos que su flujo exige, no de "todo el dominio":
despiece del piloto → documentos fuente → hoja de referencias de cada uno → incorporar
referencias necesarias → grafo de dependencias. **Regla:** volcados masivos sin curación = prohibido.

## 2. LÍMITES DE CUADERNO (V2 — verificado por Minimax, web 14-ago)
| Plan | Fuentes/cuaderno | Consecuencia |
|---|---|---|
| Gratis | ~50 | — |
| **Pro (el del Founder)** | **300** | Dominios pequeños = 1 cuaderno |
| Ultra | 500-600 | — |
| **Operaciones (3,416 PDFs)** | **NO CABE** | **Sub-dividir en ~8-12 sub-cuadernos por sub-dominio** (decisión Founder registrada) |

## 3. NOTEBOOKLM 2.0 ("Gemini Notebook", jul-2026) — capacidades que explotamos
| Capacidad (verificada) | Uso en IC360 |
|---|---|
| **Deep Research / Fast Research** | El experto busca fuentes y auto-alimenta sus brechas (el bucle de §5, ahora nativo) |
| **Data Tables → export Sheets/CSV/JSON** | **Puente NotebookLM→specs:** experto responde en tabla estructurada → export → insumo de Zod/specs. Esto es AI-4 sin escribir integración |
| **Ejecución de código nativa** por cuaderno | Análisis sobre fuentes (conteos, tablas normativas) sin salir |
| **Historial de chat persistente y privado** | La memoria del experto persiste entre sesiones |
| **Exports:** pdf/docx/xlsx/pptx/csv/json/md | Entregables del experto en nuestros formatos canónicos |
| **100+ skills de software (Antigravity-powered)** | Converge con book-to-skill (O-PERP-12) |

## 4. CANAL DE AUTOMATIZACIÓN: `nlm` CLI (O-PERP-12)
Antigravity instala `notebooklm-mcp-cli` (jacob-bd). Permite crear/alimentar cuadernos por
script (sin copy-paste manual). Advertencias documentadas: APIs internas de Google (pueden
cambiar), auth por cookies (renovar 2-4 semanas), ~50 consultas/día en tier gratis, MCP de
43 tools se activa selectivamente por sesión (no permanente).

## 5. PROMPT MAESTRO DE CONFIGURACIÓN (sin cambios — sigue vigente)
[Ver GUIA V1 §2 — rol, reglas de cita, "NO ESTÁ EN MI BASE DOCUMENTAL", estructura de
proceso humano, contradicción registrada, conteo de brechas al final.]

## 6. OPERATIVA DE "CITA CORRECTA" (V2 — hallazgo Minimax)
Toda afirmación del experto lleva: **documento + sección/página + versión/edición + fecha
de consulta.** Sin ese cuarteto, la cita no cuenta. Ejemplo válido:
`IR-S-04 (Rev. 4, ago-2013), Anexo A §Bloque 4 — consultado 14-ago-2026`.

## 7. BATERÍA DE CALIBRACIÓN EXP-02 (V2 — REDISEÑADA)
**Hallazgo crítico (Open Code, en vivo):** los formatos PTW-01/04/06/07 NO existen como PDFs
standalone en el corpus (0 hits). Viven como ANEXOS dentro de IR-S-04 (39 hits, 71 págs).
Por tanto la batería cita anexos/secciones, no archivos PTW imaginarios. **Esto valida que
la prueba de fuego muerde antes de construir sobre ella.**

| # | Pregunta | Respuesta esperada | Fuente esperada |
|---|---|---|---|
| 1 | Rango O₂ para trabajo en caliente y consecuencia fuera de rango | 19.5–23.5%; bloqueo | IR-S-04 Anexo A, Bloque 4 |
| 2 | Valor LEL exigido en caliente | 0% — bloqueo absoluto | IR-S-04 Anexo A, Bloque 4 |
| 3 | Documentos que preceden un PTW-01 | SHA-04→SHA-01→SHA-03→SHA-02 | IR-S-04 §secuencia |
| 4 | Duración máxima de un permiso | 12 h/turno | IR-S-04 Anexo A, encabezado |
| 5 | Altura mínima para permiso de altura y su anexo | ≥1.50 m; Anexo J | IR-S-04 Anexo J — validar letra |
| 6 | Quiénes firman un PTW-07 (Hot Tap) | Gerencia Gral, Superint. Operaciones, Superint. SHA, Gerente Proyecto, soldador | IR-S-04 Anexo H — validar |
| 7 | Vigía de fuego: qué es y cuándo es obligatorio | Obligatorio en caliente | IR-S-04 Anexo A Bloque 3 / IR-S-17 |
| 8 | Registro de gas en espacio confinado y frecuencia | O₂/LEL/H₂S/CO a 3 niveles, c/2h | IR-S-04 Anexo B, Bloque 2 |
| 9 | **[PROCESO]** Qué pasa si el explosímetro está vencido de calibración | Bloqueo del permiso; no se puede firmar | IR-S-04 (verificar) |
| 10 | **[PROCESO]** Qué pasa si un trabajador sale del confinado sin registrar salida | Protocolo de rescate/vigía; near-miss | IR-S-04 Anexo B (verificar) |
| 11 | **[NORMA INTL]** Qué OSHA aplica a espacios confinados | OSHA 1910.146 | web (Orquestador verifica) |
| 12 | **[TRAMPA]** Cuál es el límite de LEL para trabajo subacuático en gabarra | **"NO ESTÁ EN MI BASE DOCUMENTAL"** (o cita Anexo G si existe) | — (prueba anti-alucinación) |

**Certificación:** 12/12 con cita correcta (doc+sección+página+versión+fecha). Si el corpus
contradice el catálogo 04_V2, gana el corpus y se corrige el catálogo (04_V3).

## 8. BUCLE DE BRECHAS (sin cambios)
Pregunta del Orquestador → si "NO ESTÁ EN MI BASE" o falla cita → BRECHA registrada →
Antigravity busca fuente en corpus → si existe: se carga y recalibra → si NO: brecha de
corpus real (adquisición documental o consulta externa).

## 9. PROHIBICIONES (V2)
- No crear cuadernos sin curación por grafo de referencias.
- No aceptar respuestas sin el cuarteto de cita.
- No crear el experto 12-UX sin narrativas de campo validadas por el Founder.
- No usar al experto para documentos legales/certificaciones finales.
- **(V2)** No exceder 300 fuentes por cuaderno (Pro) — sub-dividir dominios grandes.
