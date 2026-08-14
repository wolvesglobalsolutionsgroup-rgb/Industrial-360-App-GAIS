# 🧭 FASE-CERO-DESCUBRIMIENTO-IC360-V1 — Plan de Descubrimiento (sin código, sin commits)
**Fecha:** 14-AGO-2026 · **Emite:** CTO/Orquestador · **Estatus:** APROBADO POR FOUNDER (14-ago)
**Regla de la fase:** se produce CONOCIMIENTO VERIFICADO. Prohibido escribir código de
producto, prohibido commitear documentos al repo, prohibido crear expertos antes de tiempo.

---

## 1. SECUENCIA CANÓNICA (la forma correcta, acordada con el Founder)

```
TIPO DE PROYECTO → PROCESO HUMANO REAL → ACTIVIDADES/MICROACTIVIDADES
→ FORMATOS → REFERENCIAS NORMATIVAS CRUZADAS → EXPERTO SINTÉTICO
→ SPEC → UX/UI → GAIS CONSTRUYE
```

Anti-secuencia prohibida: "necesitamos un experto de X" → crear chatbot genérico.
Un experto solo se crea cuando un piloto demuestra que su cadena de trabajo lo exige.

## 2. PASOS DE LA FASE CERO

| Paso | Responsable | Apoyo | Entregable |
|---|---|---|---|
| 0.1 Confirmar los 5 tipos de proyecto petrolero | Antigravity | Founder | Lista exacta: nombre, definición, fuente normativa, variantes |
| 0.2 Confirmar los 2 pilotos y sus límites | Founder + Antigravity | Orquestador | Emergencia Operacional + Tendido/Reemplazo de Tubería, con qué incluyen y qué NO |
| 0.3 Despiezar ambos pilotos | Antigravity | NotebookLM, Qwen | Fases, actores, actividades, microactividades, documentos, puntos de decisión |
| 0.4 Minar referencias cruzadas | Antigravity / Open Code | NotebookLM | Grafo: documento → referencia → actividad → formato. Cada norma cita a otras; esa red ES la base de los expertos |
| 0.5 Proponer el árbol MÍNIMO de expertos | Orquestador | Toda la flota | Lista derivada de la evidencia (no una lista decorativa) |
| 0.6 Validación de campo | Founder | Orquestador | "Así ocurre en el frente" / correcciones |
| 0.7 Primer paquete GAIS-ready | Orquestador | Qwen, Claude, Antigravity | Prompt cerrado + adjuntos para el primer módulo real |

**Formato de entrega de la fase:** una MATRIZ DE DESCUBRIMIENTO presentada primero en
conversación al Founder. Nada entra al repo hasta su aprobación explícita.

## 3. MISIÓN PARA ANTIGRAVITY (texto completo, listo para pegar)

```
MISIÓN FASE-CERO-01 — MAPA DE PROYECTOS Y ÁRBOL DE EXPERTOS (SIN CÓDIGO, SIN COMMITS)

De: Orquestador/CTO IC360 · Para: Antigravity · Fecha: 14-AGO-2026

Tú tienes el mapa completo de la normativa y acceso al corpus local (5,119 PDFs
clasificados en 9 dominios) y a los cuadernos NotebookLM. Tu misión es SOLO de
descubrimiento. No escribas código. No subas documentos al repo. No crees expertos todavía.

ENTREGABLE 1 — LOS 5 TIPOS DE PROYECTO:
Presenta los 5 tipos de proyecto que se hacen en la industria petrolera según tu mapa
normativo. Para cada uno: nombre canónico, definición operativa, fuente documental que
lo sustenta (documento + sección), variantes conocidas, y qué filiales/contextos PDVSA
lo usan. Marca con PENDIENTE DE VALIDACIÓN lo que no puedas sustentar con fuente.

ENTREGABLE 2 — LÍMITES DE LOS 2 PILOTOS:
Para Emergencia Operacional y Tendido/Reemplazo de Tubería: qué incluye cada piloto
(de fase 0 a cierre), qué queda FUERA explícitamente, y qué documentos/formatos del
corpus cubren cada fase.

ENTREGABLE 3 — GRAFO DE REFERENCIAS (muestra):
Toma 5 documentos clave de los pilotos (ej. IR-S-04, una norma de soldadura, una de
integridad) y extrae su hoja de referencias: a qué otras normas/manuales/formatos
remite cada uno. Presenta la tabla: documento → referencia → para qué actividad aplica.
Esto es la semilla del grafo completo que Open Code minará después.

ENTREGABLE 4 — ÁRBOL INICIAL DE EXPERTOS:
Con base en los 2 pilotos (no en las 9 categorías genéricas): qué expertos sintéticos
hacen falta REALMENTE para completar la cadena de trabajo de principio a fin. Para cada
experto propuesto: nombre, qué decisiones/documentos debe dominar, qué subconjunto del
corpus lo alimenta (con conteo de PDFs), y qué brechas de corpus ya anticipas.

ENTREGABLE 5 — BRECHAS Y DUDAS:
Lista de todo lo que NO pudiste verificar, documentos faltantes, contradicciones
encontradas entre fuentes, y preguntas que solo el Founder puede responder desde campo.

FORMATO DE RESPUESTA: texto estructurado en el chat. Nada de archivos al repo.
El Orquestador dictamina tu entregable; el Founder valida la realidad de campo.
```

## 4. ROLES DE LA FLOTA EN FASE CERO

| Miembro | Trabajo |
|---|---|
| Antigravity | Lidera: mapa de proyectos, corpus, NotebookLM, secuencia humana real |
| NotebookLM | Experto temporal por piloto; responde solo con fuentes; detecta brechas |
| Qwen | Taxonomías, matrices de dependencias, estructura de la matriz de descubrimiento |
| Minimax | Lotes grandes: deduplicación de formatos, tablas de referencias, escenarios |
| Open Code / NIM | Minería local: hashes, índices, extracción de secciones de referencias |
| Codex | Factibilidad técnica de lo que el descubrimiento vaya exigiendo |
| Claude | Red-team: contradicciones, afirmaciones sin fuente, riesgos |
| Gemini Spark | Alternativas de interacción/visualización SOLO después de proceso humano validado |
| GAIS | No participa en Fase Cero (espera paquetes cerrados) |
| Orquestador | Dictamen, verificación web, árbol de expertos, prompts GAIS-ready |
| Founder | Verdad de campo, priorización, aprobación de la matriz |

## 5. CRITERIO DE SALIDA DE LA FASE CERO

La fase termina cuando el Founder aprueba la matriz de descubrimiento y existen:
1. Los 5 tipos de proyecto con fuente.
2. Los 2 pilotos con límites y despiece por fases.
3. El grafo semilla de referencias (5 documentos).
4. El árbol mínimo de expertos con corpus asignado y brechas registradas.
5. El primer proceso humano listo para convertirse en spec (candidato: PTW-01).
