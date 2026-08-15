# 🧠 PROGRAMA-EXPERTOS-SINTETICOS-IC360-V2 — La Firma de Ingeniería Virtual
**Fecha:** 14-AGO-2026 · **Versión:** V2 (conciliada)
**Cambios V1→V2:** (1) Escala NotebookLM verificada (Pro=300/cuaderno) → estrategia de sub-cuadernos. (2) NotebookLM 2.0 como infraestructura central (Data Tables como puente a specs). (3) Solapamiento EXP-03/EXP-11 resuelto (hallazgo Minimax). (4) Mitigación del cuello de botella del Orquestador (hallazgo Minimax). (5) Cita auditable (cuarteto). (6) Canal nlm CLI.
**Tesis del Founder (doctrina):** construimos los dos equipos de una firma real — especialistas Oil&Gas (con base normativa) + equipo full-stack (la flota). Founder = círculo de calidad humano. Orquestador = círculo de calidad técnico.

---

## 1. QUÉ ES UN EXPERTO SINTÉTICO (4 componentes, sin cambios)
| Componente | Qué es | Dónde vive |
|---|---|---|
| **BASE** | Corpus curado con hash (subconjunto de los 5,117 PDFs + fuentes web verificadas) | Cuaderno NotebookLM + INVENTARIO_CORPUS |
| **CARTA** | System prompt: rol, límites, cita obligatoria, prohibición de inventar | `docs/expertos/EXP-XX_<nombre>.md` |
| **PRUEBA DE FUEGO** | Batería de calibración (12 preguntas, ver GUIA V2 §7) con respuesta+fuente | Sección de la carta + evidencia de corrida |
| **REGISTRO** | Qué sabe, qué no, cuándo se alimentó, brechas | `docs/expertos/REGISTRO-EXPERTOS.md` |

**Regla de oro:** solo habla desde sus fuentes. Si no está en la base → "NO ESTÁ EN MI BASE
DOCUMENTAL" + registra brecha.

## 2. ESTRATEGIA DE CUADERNOS (V2 — con límite verificado)
- **Dominio pequeño (<300 fuentes):** 1 cuaderno (ej. SIHO-SHA 274, Calidad 299, Civil 110).
- **Dominio grande (>300):** sub-cuadernos por sub-dominio. **Operaciones (3,416) → ~8-12
  sub-cuadernos** (pozos / refinería / producción / paradas / etc.). Decisión Founder registrada.
- **Canal de alimentación masiva:** `nlm` CLI (O-PERP-12) — script, no mouse.
- **Salida estructurada:** Data Tables → export CSV/JSON → insumo de specs (puente AI-4).

## 3. LOS EXPERTOS (V2 — solapamiento resuelto)
| ID | Experto | Cuaderno | Nota V2 |
|---|---|---|---|
| EXP-01 | Contrataciones y Marco Legal | NB-CONTRATOS (142, ACTIVO) | Ya probado; formalizar carta + prueba de fuego |
| EXP-02 | PTW y Seguridad (SHA/SIHO) | NB-SIHO-SHA (274) | Batería V2 lista (GUIA §7) |
| EXP-03 | **Soldadura y NDT** | NB-CALIDAD-WELD-NDT (299) | **V2: absorbe QA/QC de materiales/MTR** |
| ~~EXP-11~~ | ~~QA/QC y Dossier~~ | — | **V2: ELIMINADO como experto separado** — su dominio (ITP, NCR, Data Book) se divide: ITP/NCR → EXP-03; Data Book/cierre → EXP-04 (Piping) o EXP-01 (contractual). Resuelve solapamiento Minimax |
| EXP-04 | Piping, Mecánica y Tanques | NB-MEC-PIPING (619) | Piloto Pipeline |
| EXP-05 | Civil y Suelos | NB-CIVIL (110) | wf-050 |
| EXP-06 | Electricidad e Instrumentación | NB-ELEC-INSTRUM (89) | LOTO, lazos, calibración |
| EXP-07 | Procura/MTR/Almacén (Bariven) | NB-PROCURA (87) | trazabilidad coladas |
| EXP-08 | Ambiente y Desechos (MINEC) | NB-AMBIENTE (21) | SHA-07/08 |
| EXP-09 | Operaciones, Pozos y Procesos | **NB-OPERACIONES → 8-12 sub-cuadernos** | doc 08 (paradas, VMOS, emergencias) |
| EXP-10 | Planificación y Control | por crear (P6/EVM/cómputos) | Fase 1/3, Curva S |
| EXP-12 | UX Industrial y Proceso Humano | por crear (benchmarks + narrativas Founder) | screen-specs, doctrina premium |

**Total: 11 expertos** (no 12 — se eliminó el solapamiento).

## 4. CÍRCULO DE RIGOR DOBLE (sin cambios) + MITIGACIÓN CUELLO DE BOTELLA (V2)
- **Círculo humano (Founder):** valida que el flujo/pantalla ES como se hace en campo.
- **Círculo técnico (Orquestador):** valido fuente, normas internacionales (web), coherencia.
- **V2 (hallazgo Minimax — el Orquestador como único dictaminador es cuello de botella):**
  se delega dictamen de BAJO RIESGO (documentación, formatos no regulados, tooling) a
  Antigravity como Router, y el Orquestador solo dictamina lo que toca constitución/costo/
  kernel/normas reguladas. Registro de todo en TABLERO.md.
- **Contradicciones:** se registran con ambas posiciones + fuente; no se fuerza consenso falso.

## 5. PLAN DE ACTIVACIÓN (V2)
| Fase | Qué | Dueño | Cierre |
|---|---|---|---|
| E-1 | Plantilla CARTA + batería estándar | Orquestador (emitida en GUIA V2) | Founder aprueba formato |
| E-2 | EXP-01 Contrataciones: carta + prueba de fuego documentada | Antigravity + Founder | 12/12 con cita correcta |
| E-3 | EXP-02 PTW/SHA + EXP-03 Soldadura (alimentan pilotos y Ola 5) | Antigravity (cuadernos) + Qwen (cartas) + Orquestador (dictamen) | Cuaderno activo + carta en repo + prueba pasada |
| E-4 | EXP-04 Piping (piloto Pipeline) | igual | igual |
| E-5 | Resto en paralelo | flota | registro completo |
| E-6 | INVENTARIO_CORPUS con SHA-256 (Open Code, O-PERP-11) alimenta la BASE de todos | Open Code | 5,117 con hash y dominio |

## 6. PLANTILLA DE CARTA DE EXPERTO (estándar — ver GUIA V2 §5 para el prompt maestro)
Sin cambios de fondo; añadir en cada carta: la operativa de cita (cuarteto) y la regla de
Data Tables para salida estructurada.

## 7. PENDIENTES DE VALIDACIÓN (V2)
1. ~~Límite de fuentes~~ → RESUELTO (Pro=300, verificado Minimax). Sub-cuadernos aprobados.
2. Exportación de respuestas a specs: manual (Data Tables→CSV) vs MCP futuro. Fase AI-4.
3. Cifras de PDFs por dominio: la clasificación de 9 dominios existe solo en chat de
   Antigravity, NO en disco (corpus PLANO — Open Code). Se confirma contra INVENTARIO_CORPUS
   real cuando Open Code lo emita (O-PERP-11).
