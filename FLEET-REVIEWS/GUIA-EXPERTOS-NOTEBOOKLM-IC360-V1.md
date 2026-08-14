# 🧠 GUIA-EXPERTOS-NOTEBOOKLM-IC360-V1 — Configuración de Expertos Sintéticos con NotebookLM
**Fecha:** 14-AGO-2026 · **Emite:** CTO/Orquestador · **Estatus:** BORRADOR para revisión de flota
**Ejecutor de la configuración:** Antigravity (tiene acceso al equipo, al corpus y a NotebookLM)
**Precedente probado:** cuaderno de Contrataciones (142 fuentes) — solo trabaja con fuentes,
detecta brechas y busca alimentación. Esta guía replica ese patrón.

---

## 1. PRINCIPIO DE CURACIÓN POR REFERENCIAS CRUZADAS

Un experto NO se alimenta con "todo el dominio". Se alimenta con la cadena de documentos
que su flujo de trabajo realmente exige:

1. Se parte del despiece del piloto (actividades y formatos requeridos).
2. Se toman los documentos fuente de esas actividades.
3. De cada documento se extrae su **hoja de referencias** (toda norma/manuales que cita).
4. Cada referencia necesaria se incorpora; cada incorporación puede traer nuevas referencias.
5. El resultado es un conjunto curado con grafo de dependencias — no un depósito de PDFs.

## 2. PROMPT MAESTRO DE CONFIGURACIÓN (pegar como instrucción del cuaderno)

```
CONFIGURACIÓN DE EXPERTO IC360 — [EXP-XX: NOMBRE DEL DOMINIO]

ROL: Eres el especialista senior de IC360 en [dominio]. Tu único universo de verdad son
las fuentes cargadas en este cuaderno. Fuera de ellas, no sabes nada y lo declaras.

REGLAS INQUEBRANTABLES:
1. Toda afirmación lleva cita: [documento, sección/página].
2. Si algo no está en tus fuentes, responde exactamente: "NO ESTÁ EN MI BASE DOCUMENTAL"
   y registra la brecha así: BRECHA: [qué falta] → [qué tipo de fuente la resolvería].
3. Nunca des un parámetro (%, plazo, distancia, presión, espesor) sin su fuente.
   Sin fuente → "PENDIENTE DE VALIDACIÓN".
4. Cuando describas un proceso, usa siempre esta estructura:
   - Actor(es) y rol
   - Lugar y condiciones de trabajo
   - Herramienta/documento que usa hoy
   - Secuencia de pasos humana real
   - Qué dato captura, en qué formato lo asienta
   - Qué decisión habilita o bloquea ese dato
   - Consecuencia del error (rechazo, riesgo, bloqueo de cobro)
5. Cuando detectes que dos fuentes se contradicen, no elijas: presenta ambas con cita
   y marca: CONTRADICCIÓN REGISTRADA.
6. Al final de cada respuesta sustantiva, añade: "Brechas detectadas en esta respuesta: [N]"
   y enúmeralas.

MISIÓN: que el Orquestador pueda construir especificaciones de software que reflejen
exactamente cómo se ejecuta tu dominio en la industria. No diseñas software, no escribes
código, no certificas cumplimiento legal. Produces VERDAD DE DOMINIO con cita.
```

## 3. CERTIFICACIÓN DEL EXPERTO (prueba de fuego)

Antes de que un experto alimente specs, debe pasar su batería de calibración:
- 10 preguntas con respuesta esperada y fuente conocida.
- Exigencia: 10/10 con cita correcta.
- Si falla: se identifica la brecha, se alimenta el cuaderno, se recalibra.
- La corrida se documenta (pregunta / respuesta / cita / pasa-falla) y se archiva.

## 4. BATERÍA DE CALIBRACIÓN EXP-02 — PTW/SHA (ejemplo estándar, derivada del catálogo 04_V2)

| # | Pregunta | Respuesta esperada (resumen) | Fuente esperada |
|---|---|---|---|
| 1 | ¿Rango permitido de O₂ para trabajo en caliente y qué ocurre fuera de rango? | 19.5%–23.5%; bloqueo del permiso | IR-S-04 / PTW-01 Bloque 4 |
| 2 | ¿Qué valor de LEL se exige para trabajo en caliente? | 0% — bloqueo absoluto | PTW-01 Bloque 4 |
| 3 | ¿Qué documentos preceden la emisión de un PTW-01? | SHA-04 (liberación de área) → SHA-01 (ART) → SHA-03 (checklist) → SHA-02 (gas test) | Catálogo 04 §3 / IR-S-04 |
| 4 | ¿Duración máxima de un permiso de trabajo? | 12 horas por turno | PTW-01 encabezado / IR-S-04 |
| 5 | ¿Desde qué altura aplica el permiso de altura y qué anexo lo cubre? | ≥1.50 m; Anexo J (PTW-03) | IR-S-04 Anexo J — PENDIENTE validar letra de anexo contra corpus |
| 6 | ¿Quiénes firman un PTW-07 (Hot Tap)? | Gerencia General PDVSA, Superintendente de Operaciones, Superintendente SHA, Gerente de Proyecto contratista, soldador especialista | PTW-07 / IR-S-04 Anexo H — validar anexo |
| 7 | ¿Qué es el vigía de fuego y cuándo es obligatorio? | Vigía designado obligatoriamente en trabajos en caliente | PTW-01 Bloque 3 / IR-S-17 |
| 8 | ¿Qué registra la prueba de gas en espacio confinado y con qué frecuencia? | O₂/LEL/H₂S/CO a 3 niveles, cada 2 horas continuas | PTW-04 Bloque 2 |
| 9 | ¿Cuándo se emite el acta de cierre de permiso (SHA-09)? | Al cierre diario: área limpia, ordenada, segura y devuelta al custodio | SHA-09 / IR-S-04 §8.7 — validar sección exacta |
| 10 | ¿Qué norma rige el LOTO y cuáles son las 5 reglas de oro? | SI-S-28; corte visible, bloqueo con candado/tarjeta, verificación tensión cero, puesta a tierra, señalización | PTW-06 Bloque 2 / SI-S-28 |

**Nota de calibración:** las respuestas marcadas "validar" prueban precisamente si el
experto cita el corpus real o repite el catálogo. Si el corpus dice otra cosa, gana el
corpus y se corrige el catálogo (04_V3).

## 5. BUCLE DE BRECHAS (cómo el experto sube de nivel)

```
Pregunta del Orquestador → respuesta del experto
   → si dice "NO ESTÁ EN MI BASE" o falla cita:
       BRECHA registrada → Antigravity busca la fuente en el corpus
       → si existe: se carga al cuaderno → recalibración
       → si NO existe: se registra como brecha de corpus real
         (posible adquisición documental o consulta externa)
```

## 6. PROHIBICIONES

- No crear cuadernos con volcados masivos sin curación (el grafo de referencias manda).
- No aceptar respuestas sin cita como insumo de specs.
- No crear el experto 12-UX hasta tener narrativas de campo validadas por el Founder.
- No usar al experto para redactar documentos legales/certificaciones finales.
