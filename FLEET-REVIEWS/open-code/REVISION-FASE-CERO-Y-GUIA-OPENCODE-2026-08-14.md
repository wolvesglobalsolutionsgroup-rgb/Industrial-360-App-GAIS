# Revisión Piedra Fundacional IC360 + Censo de Capacidades — Open Code / NIM
**Fecha:** 14-AGO-2026 · **Revisor:** Open Code (z-ai/glm-5.2 · ejecutor local de minería) ·
**Especialidad declarada:** ejecución local económica, scripting, minería de datos
**Documentos revisados (línea por línea):**
1. `FASE-CERO-DESCUBRIMIENTO-IC360-V1.md` (99 líneas)
2. `GUIA-EXPERTOS-NOTEBOOKLM-IC360-V1.md` (95 líneas)

---

## TAREA A — VEREDICTOS

### 📄 DOC 1 — FASE-CERO-DESCUBRIMIENTO-IC360-V1.md → **CON-CAMBIOS**

#### A.1 Paso 0.4 (minería de referencias cruzadas, línea 26)
**¿Ejecutable tal como está descrito?** **SÍ, con matices.** La línea 26 dice:
"Minar referencias cruzadas — Grafo: documento → referencia → actividad → formato".
La descripción es **concebible pero incompleta**: no define formato de salida, ni patrón de
referencia, ni manejo de duplicados/corruptos. Como ejecutor, necesito que se konkretice:

**Lo que YA tengo instalado y verificado hoy (sin instalar nada nuevo):**
| Herramienta | Versión | Usado para |
|---|---|---|
| PyMuPDF (fitz) | 1.27.2.3 | Extracción texto rápida (≈0.05 s/PDF) |
| pdfplumber | 0.11.9 | Tablas + layout (más lento, ~1 s/PDF) |
| pdfminer.six | 20251230 | Texto fallback |
| pypdf | 6.14.2 | Metadata + merge/split |
| pytesseract + ocrmypdf + easyocr | 0.3.13 / 17.7.0 / 1.7.2 | OCR para escaneados |
| networkx | 3.6.1 | Grafo de referencias ( exporting GEXF/GraphML) |
| pandas | 3.0.3 | Salida CSV / parquet |
| Pillow | 12.2.0 | Pre-procesamiento de imagen (OCR) |
| fastapi | 0.137.1 | API opcional de consulta del grafo |

**Lo que FALTA especificar en el documento (cambios solicitados):**
- **C1 — Patrón de referencia explícito.** Regex tentativo que usaré:
  `(?:ver|véase|verase|ver véase|consulte|consultar|conforme a|según|de acuerdo a|basado en|norma|instructivo)\s+(?:la?\s+)?(PDVSA\s+(?:IR|SI|SA|HSE|AVH)[\-A-Z]*\s*\d+(?:\s*Rev\.?\s*\d+)?|IR\-S\-\d+|SI\-S\-\d+|PTW\-\d+|SHA\-\d+|API\s+\w+|ISO\s+\w+|ASME\s+\w+)`
  → Pedir confirmación al Orquestador antes de fijarlo.
- **C2 — Política para los 5 PDFs de 0 bytes** detectados (`Get-ChildItem ... Length -eq 0`).
  ¿Se descartan, se registran como `CORRUPTO` en el inventario, o se reintenta descarga?
- **C3 — Política de deduplicación.** Detecté **936 archivos con sufijo `_NNN`**
  (p. ej. `06021202_SOPORTE_..._113.pdf`, `..._119.pdf`) que son casi-cieramente duplicados
  o versiones. Mi propuesta: dedup por **SHA-256 + similaridad de primeras 2 páginas**,
  conservando el más antiguo como canónico y registrando los demás como `DUPLICADO_DE: <sha>`.
- **C4 — Política de OCR.** Solo los PDFs donde `fitz` extrae < 50 caracteres/página y el
  archivo > 50 KB se envían a `ocrmypdf` (CPU-bound, ~10-30 s/página). Estimación: si el 15 %
  del corpus es escaneado, serán ~770 PDFs × 30 s = 6.4 h por lote. Pedir aprobación.

#### A.2 Regla para zonas NO confiables (`Memoria\` y `JULIO MAITA\`)
**Línea 26-27 y rol "Minería local" (línea 84) exigen: solo SHA-256 + inspección de contenido,
NUNCA nombre de archivo.**

**Hallazgos de campo (verificados hoy):**
- `C:\Users\Administrator\Desktop\Memoria\` ✅ existe (separado del corpus).
- `C:\Users\Administrator\Desktop\JULIO MAITA\` ✅ existe; y dentro aparece
  **`JULIO MAITA\JULIO MAITA\`** (subcarpeta homónima anidada — trampa típica).
- En el corpus `INVESTIGACION_LEYES_CONTRATOS_NORMAS` hay **0 archivos con "JULIO MAITA"**
  en el nombre, y 35 con "Memoria"/"MEMORIA" — es decir, los nombres problemáticos viven
  **fuera** del corpus normativo. ✔️ La regla está bien acotada.

**¿La regla es suficiente? PARCIALMENTE. Faltan 4 controles:**
- **R1 — Definir qué es "inspección de contenido" operacionalmente.** Propongo:
  (a) abrir con PyMuPDF y extraer texto; (b) si `len(texto)<200` → marcar `SOSPECHA_ESCANEADO`;
  (c) escanear **keywords prohibidas** (p. ej. `contraseña|password|api[_-]?key|token|Bearer|
 Administrator|HKEY_|C:\\Users\\`); (d) listar **embeddings / JavaScript** (`doc.is_form_dirty`,
  `doc.embfile_count`, anotaciones `/JS`).
- **R2 — Política de encoding de filename.** Detectados nombres con **mojibake**:
  `06021202_SOPORTE_FORMAS_ESTANDAR_PARA_APROBACION_JOS\u0092_GILAR_2026-07-02.pdf`.
  Open Code **no confía** en el filename, pero el manifest **debe** guardar el nombre crudo
  (`bytes latin-1 → utf-8`) porque el SHA-256 solo garantiza integridad del binario, no de la
  trazabilidad humana. Propongo columna extra `filename_encoding_guessed`.
- **R3 — Límite de tamaño.** El corpus tiene PDFs de **hasta 88 MB**. En zonas no confiables,
  proponer **tope de 100 MB por archivo** (flag `OVERSIZE`); los países que excedan, no se
  incorporan al grafo sin inspección humana al Orquestador.
- **R4 — logging inmutable.** Cada archivo procesado de zona no confiable debe generar
  `Memoria/SHA256/` con timestamp + hash + `decision` (INCORPORAR / OMITIR / REVISAR_HUMANO)
  en un CSV append-only, para auditoría posterior.

#### A.3 Curación por referencias cruzadas (GUIA §1 — automatizable con mis tools)
**SÍ, automatizable. Pipeline concreto propuesto (8 etapas):**

```
[1] WALK corpus  → para cada *.pdf: path, size, mtime, sha256
                          ↓
[2] HEALTH-CHECK → skip 0-byte; flag oversized; detectar encoding filename
                          ↓
[3] DEDUP        → agrupar por (sha256) y por (prefijo + page_count + similitud)
                  → individuales = canonical; los demás = DUPLICADO_DE
                          ↓
[4] EXTRACT      → PyMuPDF por canonical:
                    · texto completo + páginas
                    · secciones (regex: "ANEXO [A-Z]", "§\d+", "Pág\. \d+",
                                  patrones PDVSA "IR-S-XX Rev.Y")
                    · TOC si existe (doc.get_toc())
                          ↓
[5] REF-MINE     → regex (ver C1) sobre texto + TOC; captura grupo = ID referenciado
                    · salida: lista (doc_id, ref_id, page, snippet, sección_origen)
                          ↓
[6] GRAPH        → networkx.DiGraph:
                    nodos = docs canónicos
                    aristas = "citas_a" con attrs {page, sección, snippet}
                    detectar: huérfanos (sin salientes), sumideros (sin entrantes), SCCs
                          ↓
[7] OUTPUT       → 3 artefactos:
                    · inventario_corpus_normativo.csv  (path, sha256, dominio, page_count,
                                                         refs_out_count, refs_in_count,
                                                         status, cuaderno_hint)
                    · grafo_referencias.gexf            (visualizable en Gephi/Cytoscape)
                    · grafo_referencias.json            (consumo por NotebookLM / Orquestador)
                          ↓
[8] AUDIT        → log de corrida: timestamp, archivos procesados, decisiones,
                    brechas (PDFs con 0 refs extraídas), errores de encoding
```

#### A.4 Generación del INVENTARIO_CORPUS_NORMATIVO (path + SHA-256 + dominio + cuaderno)
**¿En una sola corrida? SÍ.** Estimación en este entorno (Windows + Python 3.14.4 + SSD):

| Fase | Items | Velocidad | Tiempo estimado |
|---|---|---|---|
| Walk + SHA-256 (5,117 PDFs) | 5,117 | ~40/s | ~2 min |
| Health-check + dedup | 5,117 | ~50/s | ~2 min |
| Extract texto + secciones | ~4,200 canónicos (post-dedup) | ~8/s (PyMuPDF) | ~9 min |
| Ref-mine + grafo | ~4,200 | ~25/s | ~3 min |
| Output CSV + GEXF + JSON | — | — | <1 min |
| **Total sin OCR** | | | **≈ 17-20 min** |
| OCR batch (si ~15 % escaneado) | ~770 | ~10-30 s/PDF | **+ 6 a 7 h (lotes desatendidos)** |

**Recomendación:** 2 pasadas. Pasada 1 (sin OCR) en ~20 min → entrega inventario + grafo
parcial. Pasada 2 (OCR solo sobre flag `SOSPECHA_ESCANEADO`) en lotes desatendidos durante
la noche. **Esto desbloquea el Entregable 3 de la Misión Fase-Cero-01 en menos de una hora.**

#### A.5 Discrepancias de hecho detectadas en el DOC 1 (deben corregirse)
- **D1 — Línea 41 & 46 & 84:** el doc afirma "5,119 PDFs clasificados en 9 dominios".
  Verificación en disco → **5,117 PDFs (diferencia: −2)** y el corpus es **PLANO** (cero
  subcarpetas). El reclamo "9 dominios clasificados" **no es cierto hoy**; los dominios son
  latentes y reconstruirlos requiere clasificación por prefijo de filename (PDVSA = 2,083,
  API = 258, PI = 127, CH = 95, INF = 56, ASME = 37, ISO = 30, JICA = 30 … y **1,622 "OTHER"**
  que requieren inspección). **Acción:** reformular como "5,117 PDFs con dominios latentes
  a clasificar en fase 0.4", no "9 dominios clasificados".
- **D2 — Línea 26 paso 0.4 apoya:** "Antigravity / Open Code" → correcto, pero falta
  establecer **criterio de aceptación del grafo semilla** (¿cuántas aristas mínimas?
  ¿cobertura mínima de los 5 documentos del Entregable 3?). Sin cota, el paso 0.4 no termina.

#### A.6 Veredicto DOC 1: **CON-CAMBIOS**
Reproducible y ejecutable. Pero los 6 cambios (C1-C4, D1-D2, más el tope de tamaño R3 y la
definición R1 de "inspección de contenido") debenoger incorporados en una **V2** antes de
iniciar la corrida. La regla de zonas no confiables es correcta en espíritu pero operacional-
mente floja.

---

### 📄 DOC 2 — GUIA-EXPERTOS-NOTEBOOKLM-IC360-V1.md → **CON-CAMBIOS**

#### B.1 — §1 Principio de curación (líneas 9-18) **Automatizable: SÍ**
El pipeline de la sección A.3 anterior implementa exactamente los pasos (3)→(5) de la GUIA:
extraer hoja de referencias de cada fuente y construir grafo de dependencias curado. **100 %
mapeable a mis tools.** Ningún cambio a la lógica; solo (ver abajo) a la batería de pruebas.

#### B.2 — §2 Prompt maestro (líneas 21-50)
No tengo objeciones — es un prompt NotebookLM, no een mi scope. **Silencio = aprobado.**

#### B.3 — §3 Certificación + §4 Batería EXP-02 PTW/SHA (líneas 53-77) **PROBLEMA CRÍTICO**
Las 10 preguntas de la batería asumen que existen **PTW-01, PTW-04, PTW-06, PTW-07** como
documentos del corpus. Verificación:
```
Get-ChildItem INVESTIGACION_LEYES_CONTRATOS_NORMAS -File | ? Name -like '*PTW*'
→ 0 hits
```
**Cero archivos con prefijo PTW en el filename.** Sin embargo `IR-S-04` devuelve **39 hits**
(versiones/Rev.4/etc.), y el IR-S-04_S-04_Rev4 (71 páginas) contiene literalmente el texto
*"Sistema de Permisos de Trabajo"* con Anexo A = Permiso de Trabajo. **Interpretación
operacional:** los PTW-XX son **formatos (planillas) dentro del IR-S-04**, no PDFs
independientes. La batería debe reformularse como:

- Reescribir "Fuente esperada" de "PTW-01 Bloque 4" → **"IR-S-04 §Anexo A (la planilla PTW
  es el formato que llena IR-S-04, no un documento aparte)"**, o alternativamente
- Pedir al Founder **confirmar** si los PTW-01/04/06/07 existen como ~documentos físicos
  separados que se diligencian en campo (es lo más probable), en cuyo caso son datos de
  TRANSACCIÓN, no normas — y deberían entrar al corpus como **imágenes escaneadas de
  planillas llenas** o como **PDFs de Catálogo de Formatos**, no como normas citables.

**Acción solicitada:** agregar ¿nota al §4: "Los PTW-XX son formatos transaccionales
incluidos como anexos del IR-S-04. La batería EXP-02 se calibra sobre IR-S-04 más el Catálogo
de Formatos cuando el Founder lo entregue. Si la batería se corre hoy, fallará la B1-B4 y
B6-B9."**

#### B.4 — §5 Bucle de brechas (líneas 79-88) **OK**
El flujo "BRECHA → Antigravity busca en corpus → si existe carga→ recalibra; si no,
registra brecha real" es **automatizable** con el grafo de la sección A.3: una BRECHA
reportada por el experto se traduce en una query `grafo_refs.find(nombre_normalizado)`;
si devuelve 0 nodos → "NO EXISTE en corpus"; si devuelve N nodos → "EXISTE, anexar al
cuaderno estos N". Puedo entregar un mini-script `lookup_brecha.py` que Antigravity llame.
**Aprobado.**

#### B.5 — §6 Prohibiciones (líneas 91-95)
No tengo objeciones. La prohibición (línea 94) "No crear el experto 12-UX hasta tener
narrativas de campo validadas por el Founder" es **clave**; la apoyo explícitamente.

#### B.6 Veredicto DOC 2: **CON-CAMBIOS**
La pieza latente es la batería §4 que asume documentos PTW-XX standalone. Sin resolver eso,
EXP-02 no se puede certificar 10/10.

---

## TAREA B — CENSO DE CAPACIDADES OPEN CODE / NIM

### B.1 IDENTIDAD
- **Modelo LLM:** `nvidia/z-ai/glm-5.2` (decodificación de tokens). No poseo introspección de
  control de versiones interno; reported por el entorno.
- **NIM NVIDIA:** no tengo 能ops expuestos en el entorno para confirmar qué modelos NIM están
  cargados en GPU. Expongo honestamente: el runtime me presenta `z-ai/glm-5.2` como motor de
  razonamiento. Si el Orquestador quiere usar CUDA para OCR/inference paralela, necesito
  que se me dote de `nvidia-smi` o se confirme la pila NIM disponible; hoy no puedo inventarla.

### B.2 HERRAMIENTAS (verificadas en disco y ejecutadas hoy)

| Categoría | Estado | Detalle |
|---|---|---|
| CLI / terminal | ✅ | Windows PowerShell 5.1 (vía wrapper bash).áticos: `&&`, encoding. |
| **MCP servers** | ✅ | **GitHub MCP Server** conectado (issues, PRs, commits, branches, releases). Es el único visible en esta sesión. |
| Skills locales | ✅ | Sistema opencode con el catálogo de SKILLes accesible (graphify, deep-research-pro, codewiki,
notebooklm-expert, pdf-official, web-scraping-expert, mcp-builder, etc.). |
| Internet | ⚠️ Limitado | Solo vía `webfetch` (120 s timeout, sin JS dinámico). Sin navegador headless. |
| Disco local | ✅ | Acceso total a `C:\` + rutas Desktop. Tmp pre-aprobado:
  `C:\Users\Administrator\AppData\Local\Temp\opencode\` |
| Ejecuto de código | ✅ | **Python 3.14.4** y **PowerShell 5.1**. |
| GitHub | ✅ | vía MCP server (get/list/search/commit/PR). `gh` CLI no verificado. |
| Librerías PDF + OCR | ✅ | pypdf 6.14.2, PyPDF2 3.0.1, pdfminer.six, pdfplumber 0.11.9, PyMuPDF 1.27.2.3,
pypdfium2 5.9.0, pytesseract 0.3.13, easyocr 1.7.2, ocrmypdf 17.7.0, Pillow 12.2.0. |
| Librerías grafo / datos | ✅ | networkx 3.6.1, pandaseda 3.0.3, fastapi 0.137.1. |
| GPU | ❓ | No tengo tooling expuesto. Necesitaría `nvidia-smi` o env vars `CUDA_VISIBLE_DEVICES`. |

### B.3 FUERZAS (dónde produzco mejor trabajo)
- **Minería de PDF a escala corpus** (5,119 → 5,117) con extracción rápida + dedup por SHA-256.
- **Grafo de referencias cruzadas** (networkx) — la pieza central de Fase 0.4.
- **Inventario íntegro en una corrida** (path + SHA + dominio + cuaderno) en <25 min.
- **Deduplicación inteligente** de los 936 archivos con sufijo `_NNN`.
- **OCR local desatendido** en lotes nocturnos para los escaneados (no requiere cloud).
- **Scripts reproducibles** (Python) que puedo dejar en `FLEET-REVIEWS\open-code\` para que
  Antigravity/Orquestador re-correrlos sin mi intervención.

### B.4 DEBILIDADES CONOCIDAS (qué NO debo hacer)
- **No** debo confiar en encoding de filename de Windows (mojibake `JOS\u0092_GILAR` confirmado).
- **No** debo asumir que `&&` funciona en PowerShell encadenado (uso `; if ($?) {}`).
- **No** debo ejecutar jobs > 2 h en un solo comando (timeout por defecto); partir en lotes
  con checkpoints idempotentes.
- **No** tengo navegación headless; no sirvo para inspección visual de PDFs como humano.
- **No** debo afirmar el output de modelos NIM que no puedo inspeccionar; seré explícito.
- **No** debo commitear documentos al repo IC360 sin aprobación explícita (regla Fase 0).

### B.5 LÍMITES
- Comando bash: **timeout por defecto 120 s; ampliable**. Particiono trabajos largos.
- Contexto LLM: no tengo introspección exacta; asumo ventana moderada y **trabajo con
  validez_inodevata persistente (CSV/JSON en disco)** rather than mantener todo en memoria.
- Sin GPU confirmada; el OCR será CPU-bound (puede ser lento en el 15 % del corpus).
- `webfetch` límite: 120 s por URL. No apto para descarga de PDFs externos.

### B.6 PRUEBA DE CAPACIDAD (ejecutada en vivo al inicio de esta revisión)
**Pedido:** listar y contar los PDFs de
`C:\Users\Administrator\Desktop\INVESTIGACION_LEYES_CONTRATOS_NORMAS`.

**Resultado:**
```
.pdf       5117
TOTAL FILES: 5117
PDF COUNT:  5117
Sum   : 7,392 MB   (= ~7.2 GB)
Avg   : 1.44 MB
Max   : 88.24 MB
Min   : 0.00 KB    (5 archivos vacíos corruptos)
```

**Sub-productos extraídos en la misma corrida (sin costo marginal):**
- **Discrepancia con el DOC 1**: el corpus tiene **5,117** PDFs, no 5,119 (diff −2).
- **Estructura**: el corpus es **PLANO** (cero subcarpetas); "9 dominios" no está
  materializado en disco. Es una afirmación latente.
- **5 PDFs de 0 bytes** detectados → gestionar como `CORRUPTO`.
- **936 archivos con sufijo `_NNN`** → gestionar como duplicados probables.
- **PTW prefix = 0 hits** en archivos (los PTW-XX son formatos dentro del IR-S-04); afecta
  a la batería EXP-02 (ver B.3).
- **IR-S-04 prefix = 39 hits** → soporta pedido del Entregable 3 (grafo semilla).
- **Memoria\** y **JULIO MAITA\** confirmadas como carpetas externas en el Desktop (no
  dentro del corpus) → la regla de zonas no confiables aplica correctamente.
- **PyMuPDF probe exitoso**: IR-S-04_Rev4_Ago2013.pdf → 71 páginas, texto extraído limpio
  (incluye la cadena `"PDVSA IR-..."` que es justo el patrón de referencia a minar).

**Conclusión de la prueba:** la minería del corpus es viable hoy con el stack instalado.
Entrego **grafo semilla del Entregable 3** mensualmente si se me autoriza.

---

## RESUMEN EJECUTIVO PARA EL ORQUESTADOR

| Documento | Veredicto | Bloqueadores |
|---|---|---|
| FASE-CERO-DESCUBRIMIENTO-IC360-V1.md | **CON-CAMBIOS** | Requiere V2 con C1-C4, R1-R4, y corrección D1 (5,119→5,117; "9 dominios"→"dominios latentes"). |
| GUIA-EXPERTOS-NOTEBOOKLM-IC360-V1.md | **CON-CAMBIOS** | Requiere nota en §4 sobre la inexistencia de PTW-01/04/06/07 como PDFs standalone en el corpus. |

**Oferta inmediata de Open Code:** puedo entregar en **<60 min** un primer corte del
`inventario_corpus_normativo.csv` + `grafo_referencias.gexf` inicial (sin OCR) tan pronto
como el Orquestador:
1. Apruebe el patrón regex de referencias (C1).
2. Defina el destino de los 5 PDFs corruptos y los 936 duplicados (C2 + C3).
3. Confirme el path de salida de artefactos (propongo
   `C:\Users\Administrator\Desktop\IC360_INBOX_WF-SPECS\FLEET-REVIEWS\open-code\output\`).

**Fin de la revisión.**
