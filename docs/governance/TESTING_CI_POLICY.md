# Políticas de Pruebas Unitarias y Configuración de CI — Industrial Control 360

## 1. Comando de Ejecución en CI
El pipeline de integración continua (CI) de Industrial Control 360 ejecuta exactamente el siguiente comando para pruebas unitarias de frontend y componentes de aplicación:

```bash
npm run test:unit
```

Este script está definido en `package.json` como:
```json
"test:unit": "vitest run src"
```

El comando ejecuta Vitest en modo ejecución única (`run`) acotado al directorio `src/`, procesando todas las suites de prueba bajo `src/**/__tests__/*.test.ts(x)`.

---

## 2. Diagnóstico de Causa Raíz: ¿Por qué pasaron desapercibidos antes de Sprint F-H2?

Durante el Sprint F-H2 se detectó que al diferir la carga de workflows para optimizar el bundle inicial (reducir `index-*.js` de ~1.52 MB a 760 KB), 3 aserciones en `src/components/navigation/__tests__/phaseNavigation.test.ts` requirieron actualización.

### Razón Técnica:
1. **Auto-registro sincrónico previo:** Antes del Sprint F-H2, el archivo `src/components/navigation/phaseNavigation.ts` ejecutaba `ensureWorkflowsRegistered()` en el cuerpo del módulo. Esto importaba de forma sincrónica los 13 archivos `definition.ts` de `src/workflows/`.
2. **Efecto secundario de registro en tiempo de importación:** Al ejecutar `vitest run src`, el mero `import` de `phaseNavigation.ts` poblaba síncronamente el `workflowRegistry`. Cuando `getPhaseForPath()` o `getBreadcrumbsForPath()` se invocaban, el registro ya contenía los títulos completos de los `WorkflowDefinition` (ej. `'Inspección Pre-Operativa de Equipos de Izaje (ASME B30.5)'`).
3. **Desacoplamiento en F-H2:** Al convertir `ensureWorkflowsRegistered()` en una función diferida asíncrona (`ensureWorkflowsRegisteredAsync()`), `phaseNavigation.ts` dejó de cargar e importar sincrónicamente todos los workflows. En consecuencia, durante la primera evaluación del test unitario sin registro sincrónico previo, `getPhaseForPath()` operaba en modo fallback o diferido.
4. **Actualización de Aserciones (Sprint F-H3):**
   - **Títulos de Breadcrumb:** Se ajustó la aserción a `.toContain('Izaje')` para satisfacer tanto la definición canónica del workflow (`'Inspección Pre-Operativa de Equipos de Izaje (ASME B30.5)'`) como el título del módulo estático.
   - **Búsqueda y Ranking:** Se verificó que `searchNavigation('izaje', 'campo')` ordena prioritariamente coincidencias exactas por título (`matchType: 'title'`, prioridad 1) por encima de coincidencias generales por descripción de fase (`matchType: 'phase'`, prioridad 3), colocando `wf-042` en la primera posición.

---

## 3. Matriz de Comandos de Pruebas

| Comando | Cobertura | Entorno / Requisito |
|---|---|---|
| `npm run test:unit` | `src/` (componentes, navegadores, utilidades, calculadores) | In-memory (Vitest) |
| `npm run test:domain` | `tests/domain/` (reglas de dominio, workflows, contratos) | In-memory (Vitest) |
| `npm run test:rules` | `tests/rules/` (seguridad Firestore) | Requiere Firebase Emulator |
| `npm run test:all` | Suite completa de la aplicación | Requiere Firebase Emulator |
