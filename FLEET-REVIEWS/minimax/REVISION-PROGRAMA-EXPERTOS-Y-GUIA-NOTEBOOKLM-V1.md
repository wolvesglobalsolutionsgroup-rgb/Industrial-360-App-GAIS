# 🔍 REVISIÓN DE PIEDRA FUNDACIONAL — PROGRAMA-EXPERTOS + GUÍA NOTEBOOKLM
**Revisor:** Mavis (mvs_0c1db2869565442cae40166c1b9e9f0d) · **Sesión:** root
**Especialidad asignada:** procesamiento masivo y escenarios de fallo
**Fecha:** 14-AGO-2026
**Documentos revisados:**
1. `PROGRAMA-EXPERTOS-SINTETICOS-IC360-V1.md` (129 líneas)
2. `GUIA-EXPERTOS-NOTEBOOKLM-IC360-V1.md` (95 líneas)

---

## RESUMEN EJECUTIVO (veredicto primero)

| Documento | Veredicto | Razón de una línea |
|---|---|---|
| **PROGRAMA-EXPERTOS-SINTETICOS-IC360-V1.md** | 🟡 **APROBADO CON CAMBIOS** | Doctrina sólida y operable, pero faltan controles de escala (5,119 PDFs vs 12 expertos vs 1.5–2 GB de tokens de cuaderno) y un protocolo explícito de degradación cuando una fuente no se puede citar. |
| **GUIA-EXPERTOS-NOTEBOOKLM-IC360-V1.md** | 🟡 **APROBADO CON CAMBIOS** | El prompt maestro y la batería de calibración son buenos, pero la batería EXP-02 tiene 4 debilidades de diseño que permiten aprobar un experto no calibrado, y el "bucle de brechas" no tiene SLA ni criterios de cierre. |

**Veredicto global del programa:** el patrón BASE+CARTA+PRUEBA+REGISTRO **es la decisión arquitectónica correcta** (replica el precedente probado de Contrataciones/142 fuentes). Lo que falta es la **capa de governanza a escala**: cómo se evitan los colapsos conocidos de NotebookLM cuando el cluster Operaciones tiene 3,416 PDFs y un cuaderno solo admite ~300, cómo se mide que la calibración no se ha degradado con el tiempo, y qué pasa cuando dos expertos se contradicen en medio de un sprint.

---

## 1. PROGRAMA-EXPERTOS-SINTETICOS-IC360-V1 — REVISIÓN LÍNEA POR LÍNEA

### §1 Definición de Experto Sintético (líneas 12–26)
**✅ Aprobado con un matiz importante.**

Lo bueno:
- Los 4 componentes (BASE / CARTA / PRUEBA DE FUEGO / REGISTRO) están bien delimitados y son disjuntos: cada uno responde a "¿qué sabe / quién es / cómo se prueba / dónde queda constancia?".
- La regla de oro ("si no está en mi base, NO ESTÁ EN MI BASE DOCUMENTAL + registra brecha") es la pieza más valiosa del documento: es la única defensa real contra la **alucinación con apariencia de cita**, que es el modo de fallo #1 de cualquier sistema experto sintético.
- El precedente de Contrataciones (142 fuentes, ya activo) es real y le da credibilidad al diseño.

**Matiz que falta (escala):**
- La BASE dice "subconjunto de los 5,119 PDFs + fuentes web verificadas". **5,119 PDFs NO caben en 12 cuadernos** (12 × ~300 fuentes = 3,600 fuentes, ya con margen). Esto choca con la realidad de que EXP-09 (Operaciones) tiene 3,416 PDFs asignados en §2. El programa lo sabe (lo levanta como pendiente #1 en §7) pero **el veredicto de aprobación debe condicionarse a que se resuelva ANTES de activar E-3/E-4**, no en paralelo.

### §2 Los 12 Expertos (líneas 28–44)
**🟡 Aprobado con observaciones de cobertura y un hueco real.**

| ID | Observación |
|---|---|
| EXP-01 a EXP-09 | Coherentes con la clasificación de 9 dominios. Cifras de PDFs plausibles (suma ≈ 5,057). |
| EXP-10 (Planificación) | **Huella normativa débil.** No se nombra un corpus base (PMI PMBOK, PRINCE2, ISO 21500, normativa PDVSA de control de proyectos). Si se crea el cuaderno "por crear" sin esos anclajes, el experto se va a llenar de respuestas genéricas estilo consultoría. |
| EXP-11 (QA/QC) | **Cobertura correcta pero solapa con EXP-03 (Soldadura/NDT) y EXP-04 (Piping)**. Sin una regla de desambiguación explícita (quién habla cuando hay duda entre calidad metalúrgica vs calidad de dossier), se va a producir la primera contradicción operativa. |
| EXP-12 (UX Industrial) | **Aprobación condicional correcta** (no se crea hasta tener narrativas del Founder). Pero la lista de insumos es demasiado blanda: "benchmarks + narrativas". Un benchmark no es fuente de verdad de proceso humano. **Falta decir: el cuaderno EXP-12 se alimenta de las salidas de EXP-01 a EXP-11 (los formatos que el campo usa), no de internet.** Si no, se contamina con patrones de SaaS genérico. |

**Pendiente crítico de esta sección:** las cifras de PDFs vienen de la clasificación hecha en chat por Antigravity (§7 punto 3). **Hasta que INVENTARIO_CORPUS_NORMATIVO_V1 no confirme los conteos con SHA-256, ningún EXP-XX debe certificarse.** Esto debería estar como condición bloqueante, no como "pendiente de confirmación".

### §3 Cómo Trabaja la Firma Virtual (líneas 45–65)
**✅ Aprobado.** El flujo NECESIDAD → EXP-XX → EXP-12 → ORQUESTADOR → FOUNDER → GAIS está bien secuenciado y respeta el círculo de rigor doble. La regla "ningún experto escribe código" es **no negociable** y está bien colocada.

**Lo que falta en el flujo (escala):**
- No hay un paso explícito de **versionado de la verdad de dominio**. Cuando EXP-02 actualice su cuaderno (E-3), las specs que ya se emitieron con la versión anterior no se invalidan automáticamente. Se necesita un trigger de "re-validación de specs vigentes" cuando un cuaderno se actualice más allá de un umbral (ej. >10% de fuentes añadidas).
- El "ORQUESTADOR dictamina" es un cuello de botella. A escala de 12 expertos y múltiples specs en paralelo, **el dictamen debe ser un comité (Orquestador + Founder + 1 revisor técnico de flota)**, no una sola persona. Esto es lo que el Founder llama "círculo humano" — pero el programa no lo formaliza como comité, solo como veto.

### §4 Círculo de Rigor Doble (líneas 67–77)
**✅ Aprobado, pero con una grieta de proceso.**

Lo bueno:
- "No se fuerza consenso falso" es la frase más importante del documento. La regla de **registrar contradicciones en PENDIENTES** en lugar de resolverlas a la fuerza es la única defensa contra el **groupthink del prompt engineering** (todos los expertos alimentados del mismo corpus terminan diciendo lo mismo aunque esté mal).

**Grieta:**
- No hay un **criterio de cierre** para una entrada de PENDIENTES. ¿Cuánto tiempo puede vivir una contradicción abierta antes de que bloquee la spec que la necesita? Sin SLA, el PENDIENTES se convierte en un cementerio. Sugerencia: máximo 5 días hábiles; si no se cierra, se escala al Founder con opciones A/B/C.

### §5 Plan de Activación (líneas 79–88)
**🟡 Aprobado con 2 observaciones de secuencia.**

- E-1 (plantilla) y E-6 (INVENTARIO_CORPUS con SHA-256) deberían ser **prerrequisito duro** de E-2/E-3/E-4, no fases en paralelo. El plan los pone como dueños distintos (Orquestador vs Open Code) sin un punto de sincronización. Si Open Code no entrega el SHA-256, Antigravity no puede crear el cuaderno de EXP-02 con "fuentes verificadas" — solo con "fuentes cargadas", que es distinto.
- E-5 ("resto en paralelo según disponibilidad") es la frase más peligrosa del plan. Es donde se va a colar la calidad. **Cada experto que se active sin E-1+E-6 completos debe etiquetarse como EXPERTO-BORRADOR, no como EXPERTO-CERTIFICADO.** El programa no distingue entre los dos estados.

### §6 Plantilla de Carta de Experto (líneas 90–114)
**✅ Aprobado.** Es la pieza más reutilizable del documento. Cuatro puntos finos:
- "VERIFICADO-WEB" debería ser una sección **borrada o reescrita**: el Orquestador llena la carta, no la fuente. Lo que el experto debe registrar es **"NORMAS INTERNACIONALES QUE EL ORQUESTADOR HA VERIFICADO Y AUTORIZADO A USAR COMO BASE"** — son dos roles distintos.
- Falta una sección **"HISTORIAL DE VERSIONES DE LA CARTA"** (v1, v2, …, qué cambió, quién aprobó). Sin esto, la carta se reescribe silenciosamente y nadie sabe qué versión usó la spec X.
- "PRUEBA DE FUEGO" dentro de la carta es duplicación con la GUÍA-EXPERTOS-NOTEBOOKLM §3. Recomiendo **dejar la batería fuera de la carta** y referenciar el archivo de calibración por ruta. La carta debe ser estable; la calibración se actualiza.
- El lenguaje "10/10 con cita correcta" es bueno pero no define **qué cuenta como cita correcta** (¿ruta del PDF? ¿página? ¿sección+versión de la norma?). Falta definición operativa.

### §7 Pendientes del Programa (líneas 116–124)
**🟡 Insuficiente.** Solo lista 3 pendientes y son todos de "datos". Faltan pendientes **de governanza**:
- ¿Qué pasa si NotebookLM no puede ingerir el PDF X por estar escaneado sin OCR? (probable en un corpus normativo de 1990s).
- ¿Qué pasa si un EXP-XX se certifica y luego una de sus fuentes se retracta o se actualiza (ej. nueva edición de una norma ASME)?
- ¿Cómo se audita que el experto no está citando de memoria cuando la cita no aparece en el texto citado? (esto es el "false citation" de los LLMs con corpus).

**Recomendación:** añadir §7-bis "RIESGOS DEL PROGRAMA" con al menos 5 riesgos rankeados (probabilidad × impacto), no solo pendientes operativos.

---

## 2. GUIA-EXPERTOS-NOTEBOOKLM-IC360-V1 — REVISIÓN LÍNEA POR LÍNEA

### §1 Principio de Curación por Referencias Cruzadas (líneas 9–18)
**✅ Aprobado — la mejor pieza de las dos.** Esto es lo que separa un cuaderno serio de un "volcado masivo". La frase "no un depósito de PDFs" debería ser doctrina de toda la flota.

**Sugerencia menor:** añadir un test de cordura: **"el grafo de dependencias debe poderse dibujar en una sola hoja A3"**. Si no cabe, hay sobredocumentación o dominios mal segmentados.

### §2 Prompt Maestro de Configuración (líneas 20–50)
**🟡 Aprobado con 2 cambios obligatorios.**

| # | Regla del prompt | Riesgo | Cambio recomendado |
|---|---|---|---|
| 1 | "Toda afirmación lleva cita" | **Cumplible, pero no auditable.** El LLM puede poner `[doc X, p. 5]` y que la p. 5 no diga eso. | Añadir regla 1-bis: "Cuando cites, debes poder señalar el párrafo exacto; si no puedes, escribe CITA-NO-VERIFICABLE y el Orquestador validará." |
| 2 | "NO ESTÁ EN MI BASE DOCUMENTAL" + brecha | **Bien.** Pero la brecha se queda en el chat. | Forzar formato de brecha que sea **parseable** (BRECHA-ID, fecha, dominio, qué falta, qué fuente lo resolvería, severidad). Hoy es texto libre. |
| 3 | "Nunca des parámetro sin fuente" | **Bien** — pero ¿y los parámetros derivados (ej. 19.5%–23.5% sale de OSHA 1910.146 + NFPA 350)? | Aclarar: "Parámetro DERIVADO de una fuente = cita la fuente y marca DERIVADO. Parámetro INVENTADO sin fuente = PENDIENTE." |
| 4 | "Estructura de Proceso Humano" | **Excelente.** Es el único punto donde el programa se ancla al campo real, no a la teoría. | Dejar igual. |
| 5 | "CONTRADICCIÓN REGISTRADA" | **Bien.** | Aclarar que la contradicción se registra con ambas citas textuales, no con paráfrasis. |
| 6 | "Brechas detectadas en esta respuesta: [N]" | **Bien como recordatorio, mal como accountability.** | Convertir en **lista numerada con ID**, no en un conteo. Hoy el experto puede escribir "0" para evadir. |

### §3 Certificación del Experto (líneas 52–58)
**🟡 Aprobado pero incompleto.** "10/10 con cita correcta" sin definir operativa:
- **¿Quién evalúa la "cita correcta"?** Hoy implícitamente el Orquestador. Pero el Orquestador no puede verificar 10 citas por experto × 12 expertos en cada sprint.
- **¿Con qué frecuencia se recalibra?** El documento no dice. Un experto certificado hoy puede degradarse en 3 meses si su cuaderno se actualiza. **Recomiendo recalibración trimestral O cuando se incorporen >10% de fuentes nuevas, lo que ocurra primero.**

### §4 Batería EXP-02 PTW/SHA (líneas 60–77) — **ANÁLISIS DETALLADO**

**Esta es la pieza que más se va a copiar. Si está mal diseñada, los 11 próximos expertos van a heredar el error.**

| # | Pregunta | Diagnóstico |
|---|---|---|
| 1 | O₂ 19.5–23.5% | 🟢 Bien. Cita doble (IR-S-04 / PTW-01). Verificable. |
| 2 | LEL 0% para trabajo en caliente | 🟢 Bien. Cita única y verificable. |
| 3 | Precedencia documental (SHA-04 → SHA-01 → SHA-03 → SHA-02) | 🟢 **Excelente.** Prueba comprensión de proceso, no de dato. |
| 4 | Duración máxima 12h | 🟢 Bien. |
| 5 | Altura ≥1.50 m + Anexo J | 🟡 **Peligrosa.** El propio documento dice "PENDIENTE validar letra de anexo contra corpus". Si la pregunta 5 ya entra con duda, la certificación arranca con un 10% de incertidumbre. **Recomiendo:** cambiarla por una pregunta 100% blindada (ej. "¿quién firma la SHA-04?" que no tiene ambigüedad de anexo). |
| 6 | Firmantes PTW-07 (Hot Tap) | 🟡 Similar a #5: "validar anexo" marcado. Misma recomendación. |
| 7 | Vigía de fuego | 🟢 Bien. |
| 8 | Gas test: 3 niveles, cada 2h | 🟢 Bien. **Pero falta el "por qué"**: ¿se acepta "cada 2h" sin que la respuesta explique que es para detectar desplazamiento de atmósfera? Un experto que solo dice "2h" sin justificar es repetidor, no intérprete. |
| 9 | Acta SHA-09 | 🟡 "Validar sección exacta" otra vez. **3 de 10 preguntas con marcador de duda es demasiado.** |
| 10 | LOTO + 5 reglas de oro | 🟢 Bien. Cita doble (PTW-06 / SI-S-28). |

**Defectos de diseño de la batería (síntesis):**

1. **3/10 preguntas con "validar"** = la batería certifica sobre cimientos no cerrados. **Mínimo 10/10 deben ser blindadas antes de la primera corrida.**
2. **0 preguntas de proceso, no de dato.** Las 10 son de memoria (rangos, listas, cantidades). El experto que pasa esta batería puede ser un loro; todavía no sabemos si entiende el dominio. **Recomiendo añadir 2 preguntas de "qué pasa si…":** ej. "Si el gas test marca LEL 5% en la medición de fondo del espacio confinado, ¿qué decisión toma el vigía y bajo qué documento queda registrada?" — eso no se responde con la memoria, hay que comprender.
3. **0 preguntas trampa deliberadas.** Las baterías robustas (modelo USMLE, modelo CFA) incluyen 1–2 preguntas cuya respuesta correcta es "NO ESTÁ EN MI BASE" para verificar que el experto no alucina por presión de aprobar. **Recomiendo añadir P11: "¿Cuál es el límite de O₂ para trabajo en espacio confinado en presencia de helio?" — la respuesta correcta es "NO APLICA / NO ESTÁ EN MI BASE PARA ESTE CASO".** Si el experto inventa un número, falla.
4. **0 preguntas de norma internacional (OSHA, NFPA, API, ASME).** Todo es normativa interna PDVSA (IR-S-04, SHA-XX). ¿Qué pasa cuando el campo exige una norma internacional que el corpus interno no tiene? El experto debería poder decir "esta regulación local NO contradice OSHA 1910.146 §…" — y la batería no prueba eso.
5. **No hay pregunta sobre el "qué NO hacer".** Las 10 son procedimentales positivas. Un experto calibrado debe saber también las **prohibiciones**: "qué pasa si el vigía abandona la posición antes del cierre del permiso". Esto prueba comprensión, no memorización.

**Veredicto de la batería:** 🟠 **REQUIERE REVISIÓN ANTES DE LA PRIMERA CORRIDA.** El patrón está bien (10 preguntas, cita doble, tabla limpia), pero 5 debilidades listadas arriba. Tiempo de corrección: 2 horas. Vale la pena.

### §5 Bucle de Brechas (líneas 79–88)
**🟡 Aprobado con SLA faltante.**

Diagrama correcto (Pregunta → falla → brecha → Antigravity busca → si existe carga / si no registra como brecha de corpus). Pero:
- **No hay SLA** para el bucle. ¿Cuánto tarda Antigravity en buscar la fuente? ¿Qué pasa si no la encuentra en 48h?
- **No hay escalado.** "Posible adquisición documental" es una frase, no un plan. ¿Quién decide comprar la norma? ¿Con qué presupuesto? ¿En qué plazo?
- **No hay cierre del bucle.** ¿Cómo sabe el Orquestador que la brecha se cerró? Hoy: re-preguntando. **Recomiendo:** un log de brechas en `REGISTRO-EXPERTOS.md` con columna ESTADO (ABIERTA / EN-BUSQUEDA / RESUELTA / DESESTIMADA) y FECHA-CIERRE.

### §6 Prohibiciones (líneas 90–95)
**✅ Aprobado.** Las 4 prohibiciones son las correctas. Sugerencia: añadir una 5ª:
- "**No crear el cuaderno del experto hasta que E-1 (plantilla de carta) y E-6 (INVENTARIO_CORPUS con SHA-256) estén cerrados.**" Esto ata las dos dependencias que la §5 del PROGRAMA deja sueltas.

---

## 3. VALIDACIÓN DE LAS 3 PREGUNTAS DEL ORQUESTADOR

### 3.1 ¿El concepto BASE + CARTA + PRUEBA DE FUEGO + REGISTRO es completo y operable?
**Veredicto: SÍ, completo. Operable CON DOS CONDICIONES:**

1. **Resolución del problema de escala (5,119 PDFs vs ~300 por cuaderno)** antes de activar E-3 en adelante. Hoy se delega a §7 pendiente #1 — eso es un **bloqueante disfrazado de pendiente**.
2. **Definición operativa de "cita correcta"** (ruta del PDF + página + sección + versión de la norma + fecha de verificación). Sin esto, la PRUEBA DE FUEGO es subjetiva.

Los 4 componentes cubren las 4 preguntas fundamentales de un sistema experto: **conocimiento, identidad, validación, auditoría**. Es el patrón correcto. La calificación sería 8.5/10 — excelente arquitectura, faltan los detalles de instrumentación.

### 3.2 ¿La batería EXP-02 (10 preguntas PTW/SHA) está bien diseñada?
**Veredicto: 🟠 DISEÑO PARCIAL. Requiere revisión antes de la primera corrida.**

| Criterio | Cumple | Comentario |
|---|---|---|
| Preguntas verificables con fuente | 🟡 7/10 | 3 llevan "validar" |
| Cubre el dominio (proceso + datos + normas) | 🔴 No | Solo datos; falta proceso, normas internacionales, "qué NO hacer" |
| Distingue memorización de comprensión | 🔴 No | Todas se pueden aprobar repitiendo el catálogo |
| Incluye preguntas trampa anti-alucinación | 🔴 No | Ninguna |
| Tamaño (10 preguntas) | 🟢 Sí | Estándar de la industria |
| Cita doble (corpus + planilla) | 🟢 Sí | Patrón correcto |
| Trazabilidad por pregunta | 🟢 Sí | Tabla limpia |

**5 cambios obligatorios antes de correr:**
1. Eliminar las 3 preguntas "validar" o sustituirlas por preguntas blindadas.
2. Añadir 2 preguntas de proceso ("qué pasa si…").
3. Añadir 1 pregunta trampa (respuesta correcta = "NO ESTÁ EN MI BASE").
4. Añadir 1 pregunta de norma internacional.
5. Añadir 1 pregunta de prohibición / "qué NO hacer".

Con esos 5 cambios, **la batería pasa de 6.5/10 a 9/10**.

### 3.3 ¿Qué escenarios de fallo del programa NO están cubiertos?

**8 escenarios no cubiertos, ordenados por severidad:**

| # | Escenario | Probabilidad | Impacto | Mitigación propuesta |
|---|---|---|---|---|
| 1 | **Colapso de contexto de NotebookLM con EXP-09 (3,416 PDFs).** NotebookLM tiene un límite de fuentes y un límite de tokens por cuaderno. Subir 3,416 PDFs no es viable. | **Alta** | **Crítico** — sin EXP-09 no hay docs de paradas, VMOS ni emergencias. | **Subdividir Operaciones en 4–6 sub-cuadernos** (Producción, Procesos, Mantenimiento, Pozos, Paradas, Emergencias). Política de "un cuaderno = un sub-dominio + sus normas". |
| 2 | **Doble rol EXP-03 vs EXP-11.** Cuando se trate de NCR (Non-Conformance Report) metalúrgica, ¿quién responde? | Alta | Alto — contradicciones en QA/QC frenan la Ola 5. | Regla: "Si el tema es material + soldadura, EXP-03. Si el tema es dossier/documentación, EXP-11. Si ambos, EXP-03 primero, EXP-11 valida." |
| 3 | **Degradación de la calibración con el tiempo.** Experto certificado en ene-2026 puede estar "vencido" en jun-2026 si su cuaderno cambió. | Alta | Medio — specs pasadas pueden no aplicar ya. | Recalibración trimestral obligatoria. Hash de la versión del cuaderno en cada spec. |
| 4 | **Citas inventadas (false citation).** El LLM pone `[doc X, p. 5]` y la página no dice eso. | Media-Alta | Alto — contaminación silenciosa de specs. | Verificador automático que abra el PDF en la página citada y haga OCR/match. No confiar en la honestidad del LLM. |
| 5 | **Brecha que no se cierra nunca.** Una pregunta recurrente cuya fuente simplemente no existe en el corpus. Se queda como PENDIENTE eternamente. | Media | Medio — bloquea specs pero el equipo sigue trabajando. | SLA: 5 días hábiles. Si no se cierra, se etiqueta "B-RECHAZADA" con justificación y la spec se emite con la limitación explícita. |
| 6 | **Contradicción entre expertos que nadie detecta.** EXP-02 y EXP-12 diseñan una pantalla PTW con campos distintos. El Orquestador no se da cuenta porque aprobó cada pieza por separado. | Media | Alto — defectos en la app. | **Pruebas de integración entre expertos** antes de emitir la spec final. Hoy no existen. |
| 7 | **Cuello de botella del Orquestador.** Un solo dictaminador técnico para 12 expertos y N specs. | Alta | Crítico — bloquea toda la cadena. | Comité de dictamen (Orq + Founder + 1 técnico de flota) o delegación a Qwen/Codex para dictamen de primer nivel. |
| 8 | **Cambio de edición de norma sin aviso.** ASME B31.3 saca edición 2026 y reemplaza la 2024 que está en el cuaderno. | Baja | Alto — la spec cita norma obsoleta. | Verificación web semestral de las normas listadas en VERIFICADO-WEB de cada carta. Trigger automático. |

**El escenario #1 es el más urgente.** Los 3,416 PDFs de Operaciones van a romper NotebookLM en el primer intento. Subdividir ANTES de E-3 es la decisión más rentable de toda la fase de activación.

---

## 4. RECOMENDACIONES FINALES (ordenadas por prioridad)

| # | Acción | Responsable | Plazo sugerido |
|---|---|---|---|
| 1 | **Subdividir Operaciones (3,416 PDFs) en 4–6 sub-cuadernos** antes de activar E-3 | Antigravity + Orquestador | Antes de E-3 |
| 2 | **Reescribir batería EXP-02** con los 5 cambios obligatorios | Orquestador | 2 horas, antes de la primera corrida |
| 3 | **Definir operativa de "cita correcta"** (ruta + página + sección + versión + fecha) | Orquestador | 1 día |
| 4 | **Crear REGISTRO-EXPERTOS.md con log de brechas** (ESTADO, FECHA-CIERRE) | Open Code o Qwen | 3 días |
| 5 | **Añadir §7-bis RIESGOS DEL PROGRAMA** con los 8 escenarios rankeados | Orquestador | 1 día |
| 6 | **Política de recertificación trimestral** + hash de versión de cuaderno en cada spec | Orquestador | 1 semana |
| 7 | **Pruebas de integración entre expertos** (EXP-02 + EXP-12 por ejemplo) | Orquestador + Qwen | Antes de cualquier spec de pantalla |
| 8 | **Comité de dictamen** (no un solo Orquestador) | Founder | Decisión política |

---

## 5. CONCLUSIÓN

Ambos documentos son **una buena piedra fundacional** pero **no están listos para escalar tal cual**. La doctrina (BASE+CARTA+PRUEBA+REGISTRO) es la decisión correcta; la instrumentación (batería EXP-02, bucle de brechas, plan de activación) tiene huecos que se van a traducir en specs contaminadas si no se cierran antes de E-3.

**Aprobaría el programa bajo la condición de cerrar los 8 puntos de la sección 4 antes de la fase de activación. Tiempo estimado de cierre: 2 semanas. Vale la pena: sin esta capa de governanza, los expertos sintéticos se degradan en 3–6 meses.**

El precedente de Contrataciones (142 fuentes, operativo) demuestra que el patrón funciona a escala 1. La pregunta no es "¿funciona?" sino "¿se degrada al multiplicar por 12?" — y la respuesta honesta es **sí, sin las 8 acciones de la sección 4**.

---

**Emitido por Mavis · root session mvs_0c1db2869565442cae40166c1b9e9f0d**
**Ruta del archivo:** `C:\Users\Administrator\Desktop\IC360_INBOX_WF-SPECS\FLEET-REVIEWS\minimax\REVISION-PROGRAMA-EXPERTOS-Y-GUIA-NOTEBOOKLM-V1.md`
