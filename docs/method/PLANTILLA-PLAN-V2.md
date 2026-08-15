# PLANTILLA-PLAN-V2 — Plantilla de Spec de Formato (Doctrina v2)

**Versión:** 2.0 — 2026-08-15
**Doctrina:** Construcción CON IA, no generación POR IA. Contratos primero. El formato es la unidad atómica del Kernel. Ningún spec nace de la imaginación: nace del corpus, del experto o de una brecha verificada del scorecard.

---

## Cómo usar esta plantilla

Copia este bloque por cada formato nuevo. Un spec está **LISTO PARA GAIS** solo cuando todas las casillas de la Sección 0 están marcadas con evidencia, no con intención.

---

## SECCIÓN 0 — Gate de origen (obligatorio, bloqueante)

- [ ] **Origen declarado:** ☐ Corpus (archivo + página) ☐ Experto NotebookLM (cuaderno + respuesta citada) ☐ Brecha de scorecard (Dim #, score, evidencia) ☐ Señal de mercado (MERCADO-SENALES #S_)
- [ ] **Formato físico de referencia existe** y está accesible (ruta en corpus o PDF de muestra).
- [ ] **Norma(s) que lo rigen identificadas** con código y edición (ej: SI-S-04 ed. 2022, no "la norma de permisos").
- [ ] **No duplica** un workflow existente (verificar contra `src/workflows/index.ts` — 17 registrados).

> Si alguna casilla no puede marcarse con evidencia → el spec NO se escribe. Vuelve al corpus/experto.

## SECCIÓN 1 — Identidad del formato

- **Código de formato:** (ej: PTW-01) — **Título oficial:** (como aparece en el papel)
- **Emisor / Receptor / Custodio:** (roles reales de campo, no inventados)
- **Frecuencia de uso en campo:** ☐ Diario ☐ Por evento ☐ Por fase
- **Prioridad de migración:** Ola _ (criterio MIGRATIONWAVES)

## SECCIÓN 2 — Contrato de datos (Zod primero)

```typescript
// Schema Zod 4 — TODO campo nace del formato físico, no de la imaginación.
// Regla: si el campo no existe en el papel, no existe aquí.
const XxxSchema = z.object({
  // campo: z.tipo().restricción(),  // ← comentario: dónde aparece en el formato físico
})
```

- **Hard gates** (bloquean guardado): listar con la regla exacta y su fuente normativa (artículo/sección).
- **Soft gates / warnings** (justificación requerida, no bloqueo): listar igual.
- **Regla de oro:** bloqueo solo cuando la norma lo exige; lo demás es warning + justificación (doctrina permisiva del despiece).

## SECCIÓN 3 — Ciclo de vida y estados

- Estados canónicos (enum cerrado, NO string libre — brecha Dim 5 conocida): `BORRADOR → EMITIDO → ... → ARCHIVADO`
- Quién transiciona cada estado (rol) y con qué evidencia.

## SECCIÓN 4 — Entregable y dossier

- ¿Genera DocumentViewModel exportable? (contrato `WorkflowDeliverable` — obligatorio)
- ¿Alimenta el dossier final? ¿En qué sección?
- Formatos de exportación requeridos: ☐ PDF ☐ Excel ☐ JSON

## SECCIÓN 5 — Multi-tenancy y costos

- Colección Firestore: `organizations/{orgId}/projects/{projectId}/<coleccion>` (ruta canónica, SIN fallback hardcodeado — brecha Dim 10)
- Guards FinOps aplicables: ☐ `guardFirestoreWrite` ☐ `guardExportDocument` ☐ `guardIaInvocation`

## SECCIÓN 6 — Criterios de aceptación (verificables)

1. Test de frontera Zod: _ casos (válido, hard gate violado, warning con justificación).
2. Test de aislamiento tenant (patrón `tenantIsolation.test.ts`).
3. E2E: captura → hard gate → DocumentViewModel → export.
4. Sin `Math.random`, sin mocks, sin arrays hardcodeados (doctrina F-H1).

---

## Registro de specs bajo esta plantilla

| Spec | Origen | Estado | Paquete GAIS |
|------|--------|--------|--------------|
| _(vacío — el primero será el piloto del proyecto Tendido de Tubera / Emergencia Operacional, cuando el experto del corpus emita la verdad de dominio)_ | | | |
