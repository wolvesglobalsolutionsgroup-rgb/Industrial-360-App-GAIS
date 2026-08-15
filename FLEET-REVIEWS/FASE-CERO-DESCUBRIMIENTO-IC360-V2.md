# 🧭 FASE-CERO-DESCUBRIMIENTO-IC360-V2 — Plan de Descubrimiento (sin código, sin commits)
**Fecha:** 14-AGO-2026 · **Versión:** V2 (conciliada)
**Cambios V1→V2:** (1) Cifra canónica del corpus: **5,117 PDFs reales** (Open Code en vivo; no 5,119 ni 4,138), 5 corruptos, 936 duplicados `_NNN`, corpus PLANO (no "9 dominios" en disco). (2) C1-C4 de Open Code incorporados (regex, corruptos, dedup, OCR). (3) Contingencia "si no son 5 tipos" (Qwen). (4) Criterios de aceptación por entregable (Qwen). (5) Zonas Hermes con política reforzada (Open Code R1-R4).
**Regla de la fase:** se produce CONOCIMIENTO VERIFICADO. Prohibido código de producto, commits a main, o crear expertos antes de tiempo.

---

## 1. SECUENCIA CANÓNICA (sin cambios)
```
TIPO DE PROYECTO → PROCESO HUMANO REAL → ACTIVIDADES/MICROACTIVIDADES
→ FORMATOS → REFERENCIAS NORMATIVAS CRUZADAS → EXPERTO SINTÉTICO
→ SPEC → UX/UI → GAIS CONSTRUYE
```
Anti-secuencia prohibida: crear chatbot genérico sin que un piloto lo exija.

## 2. PASOS DE LA FASE CERO (V2 — con criterios de aceptación)

| Paso | Responsable | Entregable | Criterio de aceptación (Qwen) |
|---|---|---|---|
| 0.1 Confirmar los N tipos de proyecto | Antigravity | Lista con fuente | Cada tipo con documento+sección que lo sustenta |
| 0.2 Confirmar los 2 pilotos y límites | Founder + Antigravity | Alcance in/out | Founder firma que representa el frente real |
| 0.3 Despiezar ambos pilotos | Antigravity + NotebookLM + Qwen | Fases/actores/actividades/documentos | Trazable a corpus, no inventado |
| 0.4 Minar referencias cruzadas | Antigravity / Open Code | Grafo semilla | Ver C1-C4 (§3) |
| 0.5 Proponer árbol MÍNIMO de expertos | Orquestador | Lista derivada de evidencia | Cada experto justificado por una cadena de trabajo real |
| 0.6 Validación de campo | Founder | Aprobación | "Así ocurre en el frente" |
| 0.7 Primer paquete GAIS-ready | Orquestador | Prompt + adjuntos | Revisado por Claude antes de enviar |

**Formato de entrega:** MATRIZ DE DESCUBRIMIENTO en conversación al Founder. Nada entra al
repo hasta su aprobación explícita.

## 3. C1-C4 APROBADOS (Open Code — reglas de minería)
- **C1 — Regex de referencias:** Open Code define y documenta el patrón de extracción de la
  sección "Referencias/Normas" de cada PDF.
- **C2 — Corruptos:** los 5 PDFs corruptos → carpeta `CORRUPTOS-REVIEW\` (NO borrar).
- **C3 — Duplicados:** los 936 `_NNN` → conservar el más completo; el resto a `DUPES-REVIEW\`
  (Founder decide borrado).
- **C4 — OCR:** solo bajo demanda, no masivo.

**Política de zonas NO confiables (Memoria\, JULIO MAITA\ — V2 reforzada):**
(R1) "inspección de contenido" = lectura de las primeras N páginas + metadatos, no solo nombre.
(R2) manejar mojibake/encoding Windows en extracción. (R3) tope 100 MB por archivo.
(R4) log append-only de toda acción de minería. `JULIO MAITA\JULIO MAITA\` anidado confirmado
(trampa típica) — tratar con cautela.

## 4. CONTINGENCIA (V2 — hallazgo Qwen)
**"Si no son exactamente 5 tipos":** la evidencia del corpus manda. Si el mapa arroja 4 o 7
tipos de proyecto, se documenta lo REAL, no se fuerza el número 5. El 5 era una hipótesis de
partida de Antigravity; la Fase Cero la verifica o la corrige.

## 5. MISIÓN PARA ANTIGRAVITY (FASE-CERO-01 — sin cambios de fondo)
[Ver FASE-CERO V1 §3 — los 5 entregables: tipos de proyecto, límites de pilotos, grafo
semilla, árbol de expertos, brechas. Sin código, sin commits, sin crear expertos.]
**Añadido V2:** Antigravity coordina con Open Code para el paso 0.4 (minería) y usa el corpus
REAL de 5,117 (no la cifra vieja).

## 6. CRITERIO DE SALIDA (sin cambios)
1. Los N tipos de proyecto con fuente. 2. Los 2 pilotos con límites y despiece. 3. Grafo
semilla (10 documentos). 4. Árbol mínimo de expertos con corpus asignado y brechas.
5. Primer proceso humano listo para spec (candidato: PTW-01).
