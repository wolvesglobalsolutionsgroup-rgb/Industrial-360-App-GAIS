# 🧠 PROGRAMA-EXPERTOS-SINTETICOS-IC360-V1 — La Firma de Ingeniería Virtual
**Fecha:** 14-AGO-2026 · **Emite:** CTO/Orquestador bajo Mandato del Founder
**Estatus:** PROGRAMA ACTIVO · Registro: complementa doc 00 §5 y Protocolo de Flota §5
**Tesis del Founder (adoptada como doctrina):** en una firma real esto lo harían dos equipos
— especialistas Oil & Gas + equipo full-stack senior. Nosotros construimos AMBOS. Los de
dominio se construyen con base normativa (corpus + NotebookLM). Los de código ya existen
(la flota). El Founder es el círculo de calidad humano. El Orquestador es el círculo de
calidad técnico.

---

## 1. QUÉ ES UN EXPERTO SINTÉTICO (definición operativa, sin magia)

Un Experto Sintético NO es un chatbot con un prompt bonito. Es un activo versionado con
4 componentes obligatorios:

| Componente | Qué es | Dónde vive |
|---|---|---|
| **BASE** | Corpus curado con hash (subconjunto de los 5,119 PDFs + fuentes web verificadas) | Cuaderno NotebookLM dedicado + registro en INVENTARIO_CORPUS |
| **CARTA** | System prompt de experto: rol, límites, obligación de citar fuente, prohibición de inventar, formato de respuesta | `docs/expertos/EXP-XX_<nombre>.md` en el repo |
| **PRUEBA DE FUEGO** | Batería de 10-20 preguntas de calibración con respuesta esperada y fuente. Si no pasa, el experto NO se certifica | Sección de la carta + evidencia de corrida |
| **REGISTRO** | Entrada en el ledger: qué sabe, qué no sabe, cuándo se alimentó, qué brechas detectó | `docs/expertos/REGISTRO-EXPERTOS.md` |

**Regla de oro del experto:** solo habla desde sus fuentes. Si no está en la base, dice
"NO ESTÁ EN MI BASE DOCUMENTAL" y registra la brecha para que se alimente. Esto ya funcionó
con contrataciones (142 fuentes, busca sus propias brechas). Se replica, no se reinventa.

## 2. LOS 12 EXPERTOS (fila 1 = ya probado y operativo)

| ID | Experto | Cuaderno NotebookLM (de la clasificación 9 dominios) | Alimenta (specs/módulos) |
|---|---|---|---|
| EXP-01 | **Contrataciones y Marco Legal PDVSA** | NB-CONTRATOS-APU-LEGAL (142 fuentes, ACTIVO) | doc 09, Fase 0/3/5, valuaciones, HES |
| EXP-02 | **PTW y Seguridad (SHA/SIHO)** | NB-SIHO-SHA-PERMISOS (274 PDFs) | catálogo 04, wf-043, specs de permisos |
| EXP-03 | **Soldadura y NDT** | NB-CALIDAD-WELD-NDT (299 PDFs) | doc 03, Ola 5 (QaQcWelding), Weld Log |
| EXP-04 | **Piping, Mecánica y Tanques** | NB-MEC-PIPING-TANQUES (619 PDFs) | piloto Pipeline, Hot Tap, isométricos |
| EXP-05 | **Ingeniería Civil y Suelos** | NB-CIVIL-SUELOS-CONCRETO (110 PDFs) | wf-050, excavaciones, concreto |
| EXP-06 | **Electricidad e Instrumentación** | NB-ELEC-INSTRUMENTACION (89 PDFs) | LOTO, lazos, calibración, megado |
| EXP-07 | **Procura, MTR y Almacén (Bariven)** | NB-PROCURA-MTR-ALMACEN (87 PDFs) | trazabilidad coladas, recepción |
| EXP-08 | **Ambiente y Desechos (MINEC)** | NB-AMBIENTE-MINEC-RASDA (21 PDFs) | SHA-07/08, manifiestos, doc 09 |
| EXP-09 | **Operaciones, Pozos y Procesos** | NB-OPERACIONES-PROCESOS (3,416 PDFs) | doc 08 (paradas, VMOS, emergencias) |
| EXP-10 | **Planificación y Control de Proyectos** | por crear (P6/MS Project, EVM, cómputos) | Fase 1/3, curva S, valuaciones |
| EXP-11 | **QA/QC y Dossier de Calidad** | por crear (ITP, NCR, Data Book, ARCHE) | Fase 2/4, DossierCompiler |
| EXP-12 | **UX Industrial y Proceso Humano** | por crear (benchmarks + narrativas de campo validadas por Founder) | screen-specs, doctrina premium |

## 3. CÓMO TRABAJA LA FIRMA VIRTUAL (el flujo que reemplaza al equipo de especialistas)

```
NECESIDAD (ej. spec de pantalla PTW-01)
   │
   ├─► EXP-02 (PTW/SHA, cuaderno 274 PDFs) → narrativa de proceso humano
   │     + campos y reglas del formato, CON CITA DE PÁGINA
   │
   ├─► EXP-12 (UX Industrial) → screen-spec: layout que replica la planilla,
   │     estados, modo campo, anti-slop
   │
   ├─► ORQUESTADOR (yo) → dictamen: verifico normas internacionales vía web,
   │     cruzo con catálogo 04, marco PENDIENTES, emito spec V1 completo
   │
   ├─► FOUNDER → validación de campo: "esto SÍ es así en el frente" (veto)
   │
   └─► PLAN + TASKS → PROMPT GAIS-READY → GAIS construye → 4 capas → main
```

**Regla:** ningún experto escribe código. Los expertos producen VERDAD DE DOMINIO
estructurada. El código lo escribe GAIS desde specs que citan esa verdad.

## 4. CÍRCULO DE RIGOR DOBLE (la barrera que el Founder ordenó)

- **Círculo humano (Founder):** valida que el flujo/pantalla/formato ES como se hace en
  la industria. Su palabra de campo pesa más que cualquier PDF.
- **Círculo técnico (Orquestador):** valido que toda afirmación tenga fuente, que las
  normas internacionales sean reales y vigentes (web), que los expertos no se contradigan
  entre sí, y que nada genérico pase disfrazado de específico.
- **Registro de contradicciones:** cuando dos expertos (o experto vs Founder) difieran,
  se abre entrada en `PENDIENTES DE VALIDACIÓN` con ambas posiciones y fuente. No se
  fuerza consenso falso. (Precedente: el mapeo de anexos IR-S-04 difiere entre el legado
  NEXUS y el catálogo 04_V2 — solo el corpus lo resuelve.)

## 5. PLAN DE ACTIVACIÓN (orden y dueños)

| Fase | Qué | Dueño | Criterio de cierre |
|---|---|---|---|
| E-1 | Plantilla de CARTA DE EXPERTO + batería de calibración estándar | Orquestador (ya emitida en §6) | Founder aprueba formato |
| E-2 | EXP-01 Contrataciones: formalizar carta y registrar (ya existe como cuaderno; falta carta y prueba de fuego documentada) | Antigravity + Founder | 10/10 preguntas de calibración con cita correcta |
| E-3 | EXP-02 PTW/SHA y EXP-03 Soldadura (prioridad: alimentan pilotos y Ola 5) | Antigravity crea cuadernos desde clusters 274/299; Qwen redacta cartas; Orquestador dictamina | Cuaderno activo + carta en repo + prueba de fuego pasada |
| E-4 | EXP-04 Piping (piloto Pipeline) | igual | igual |
| E-5 | Resto (05-12) en paralelo según disponibilidad | flota | registro completo |
| E-6 | INVENTARIO_CORPUS con SHA-256 (Open Code, ya ordenado en O-PERP-01) alimenta la columna BASE de todos | Open Code | 5,119 PDFs con hash y dominio |

## 6. PLANTILLA DE CARTA DE EXPERTO (estándar — copiar por cada EXP-XX)

```markdown
# CARTA DE EXPERTO: EXP-XX — [Nombre]
## ROL
Eres el especialista senior de IC360 en [dominio]. Tu único universo de verdad es tu
BASE documental (cuaderno NotebookLM [ID], [N] fuentes) más las normas internacionales
que el Orquestador haya verificado vía web y registrado en tu sección VERIFICADO-WEB.
## OBLIGACIONES
1. Responde SOLO desde tus fuentes. Toda afirmación lleva cita (documento + página/sección).
2. Si no está en tu base: responde "NO ESTÁ EN MI BASE DOCUMENTAL" y registra la brecha
   con el formato: BRECHA: [qué falta] → [qué fuente la resolvería].
3. Cuando describas un proceso, usa la estructura de Proceso Humano: actor, lugar,
   herramienta actual, presión, consecuencia del error, cadena formato→dato→decisión.
4. Nunca des un parámetro (%, plazo, distancia, presión) sin su fuente. Sin fuente →
   PENDIENTE DE VALIDACIÓN.
## LÍMITES
- No escribes código. No diseñas UI. No certificas cumplimiento legal.
- No contradices al Founder en materia de campo sin marcarlo como contradicción registrada.
## PRUEBA DE FUEGO (batería de calibración)
[10-20 preguntas con respuesta esperada + fuente. Certificación exige 10/10 con cita
correcta. Evidencia de corrida se adjunta al REGISTRO-EXPERTOS.]
## VERIFICADO-WEB (lo llena el Orquestador)
[Normas internacionales confirmadas: código, título, edición, fecha de verificación]
```

## 7. PENDIENTES DE VALIDACIÓN DEL PROGRAMA

1. Límite de fuentes por cuaderno NotebookLM (300 en el plan actual) vs clusters grandes
   (Operaciones: 3,416 PDFs) → estrategia de sub-cuadernos por sub-dominio. PENDIENTE:
   decisión Founder (sub-dividir Operaciones vs curación agresiva).
2. Exportación de respuestas de cuadernos hacia specs: flujo manual (copy-paste) vs
   automatización futura vía MCP. PENDIENTE: fase AI-4 (doc 00 §4).
3. Las cifras de PDFs por dominio provienen de la clasificación de Antigravity en chat;
   se confirman contra INVENTARIO_CORPUS_NORMATIVO_V1 cuando Open Code lo emita.

---

**Emitido bajo Mandato. La firma virtual abre sus puertas: primero Contrataciones (ya
probado), luego PTW/SHA y Soldadura (los que alimentan los pilotos).**
