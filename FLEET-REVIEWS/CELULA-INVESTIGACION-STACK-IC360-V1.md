# 🔬 CELULA-INVESTIGACION-STACK-IC360-V1 — Protocolo Anti-Defaults para Stack y Librerías
**Fecha:** 14-AGO-2026 · **Emite:** CTO/Orquestador · **Estatus:** VIGENTE AL APROBARSE
**Problema que resuelve:** los LLMs (incluido GAIS) usan por defecto las librerías de su
entrenamiento, no las mejores/actuales. En IC360 ninguna decisión de stack sale del
"default del modelo".

---

## 1. CUÁNDO SE ACTIVA LA CÉLULA

- Antes de introducir CUALQUIER dependencia nueva.
- Antes de reemplazar un patrón existente (ej. manejo de estado, tablas, formularios).
- Cuando un sprint requiera capacidad no presente en el stack (ej. delta-sync, wake lock,
  compresión de imágenes en Web Worker, firmas con vectores biométricos).
- Revisión programada del stack base en cada ACK mensual.

## 2. STACK BASE DE REFERENCIA (verificado vía 01_ACK, 13-ago-2026)

React 18.3.1 · Vite 6.4.3 · TypeScript 5.5.3 · Firebase 10.12.2 · Express 4.19.2 ·
Tailwind 4.0.0 · Zod 3.23.8 · Zustand 4.5.2 · jsPDF 2.5.1 · docx 9.5.0 · pptxgenjs 4.0.0 ·
exceljs 4.4.0 · DOMPurify 3.1.5 · Vitest 4.1.10 · Playwright 1.44.1 · Semgrep 1.78.0 ·
Radix UI (dialog/dropdown/select) · cmdk · Lucide 0.395.0

Toda investigación parte de aquí: la propuesta debe SUPERAR o CONFIRMAR esta base con
evidencia, nunca reemplazarla por hábito.

## 3. PROTOCOLO DE INVESTIGACIÓN (roles)

| Paso | Quién | Qué hace |
|---|---|---|
| 1. Investigación primaria | Codex + Antigravity | Buscan candidatos actuales con acceso a internet: documentación oficial, releases, estado de mantenimiento, alternativas reales del ecosistema |
| 2. Robustez y contratos | Qwen | Evalúa API, tipado, edge cases, compatibilidad con Kernel/Zod/baseRepo |
| 3. Seguridad y licencias | Claude | Licencia (zero AGPL/GPL contaminante), CVEs, superficie de ataque, anti-patrones |
| 4. Dictamen de orquestación | Orquestador (Perplexity) | Contrasto documentación oficial vía web: mantenimiento real, bundle size, costo, lock-in, compatibilidad React/Vite/Firebase, encaje con las 50 dimensiones |
| 5. Decisión | Founder | Aprueba o veta (si implica costo, ADR obligatorio) |

## 4. FORMATO DE SALIDA (obligatorio — "FICHA DE DECISIÓN DE STACK")

```markdown
## FICHA DE DECISIÓN: [capacidad a resolver]
**Fecha:** · **Solicita:** [sprint/dimensión] · **Estado:** PROPUESTA / APROBADA / VETADA

### Opción recomendada: [nombre + versión]
- Por qué gana: [3 razones con evidencia y link oficial]
- Mantenimiento: [último release, frecuencia, bus-factor]
- Licencia: [tipo — compatible: sí/no]
- Bundle: [KB gz estimado, tree-shakeable: sí/no]
- Costo: [$0 confirmado / requiere plan]
- Compatibilidad: [React 18.3.1 / Vite 6.4.3 / Firebase 10.12.2 / TS 5.5.3]
- Riesgos y mitigación: [...]

### Alternativas evaluadas
| Opción | Por qué pierde |
|---|---|
| [B] | [...] |
| [C] | [...] |

### Lo que el modelo habría usado por defecto (y por qué se descartó)
[...]

### Decisión del Founder: ☐ Aprobada ☐ Vetada ☐ Pedir más evidencia
```

## 5. REGLAS DURAS

1. Prohibido añadir dependencia >100 KB gz sin ADR y justificación de bundle.
2. Prohibido introducir librería que duplique capacidad existente (verificar primero con
   `npm ls` y grep — precedente: jsPDF único punto de import).
3. Toda ficha cita documentación oficial con fecha de consulta. Sin link oficial → no hay
   recomendación.
4. Si la investigación no es concluyente: se marca PENDIENTE DE VALIDACIÓN y se usa el
   stack base. Nunca se improvisa.
5. Las fichas aprobadas se archivan en `docs/adr/` (cuando Antigravity lo cree) como ADR
   de stack.
