# Resumen de Implementación y Guía Técnica: `wf-043`

**ID Workflow**: `wf-043-aprobacion-ptw`  
**Estatus**: `PROPOSED_SPECIFICATION`  
**Cambios de Código en este Sprint**: `0` (Solo Análisis y Especificación Documental)

---

## 1. Módulos y Componentes del Repositorio Evaluados

| Ruta en Repositorio | Función Actual | Reutilizable | Mejoras Propuestas |
|---|---|---|---|
| `src/workflows/wf-043-aprobacion-ptw/definition.ts` | Definición de contrato `WorkflowDefinition` | Sí | Ampliar esquema Zod para incluir los 23 Renglones del Anexo A de IR-S-04. |
| `src/workflows/wf-043-aprobacion-ptw/components/PtwApprovalCapture.tsx` | Componente UI de captura | Sí | Rediseñar interfaz en 3 pasos progresivos y hacer tabla de gases responsive. |
| `src/pages/WorkflowRunnerPage.tsx` | Runner dinámico universal | Sí | Eliminar selector de 16 números de la cabecera y conectar con el selector por Módulo. |
| `src/components/navigation/phaseNavigation.ts` | Navegación por Fases | Sí | Integrar el mapping de módulos técnicos (`SIHO_A`). |
| `src/lib/documentViewModel.ts` | Modelo de vista para entregables | Sí | Garantizar soporte para doble membrete (Co-Branding Operador/Contratista) y hash. |

---

## 2. Pruebas Unitarias Requeridas para Futura Fase de Código (`Vitest`)

1. **`test_anexo_a_zod_schema`**: Verificar que los 23 renglones obligatorios del Anexo A pasen la validación de Zod con datos válidos y fallen con campos requeridos vacíos.
2. **`test_gas_test_advisory_evaluator`**: Confirmar que lecturas fuera de rango ($LEL > 0\%$, $O_2 < 19.5\%$) generen un resultado `WARNING_ATMOSPHERE_OUT_OF_RANGE` con requerimiento de decisión humana (`humanDecisionRequiredOnException: true`).
3. **`test_extension_max_2_hours`**: Comprobar que prórrogas mayores a 2 horas o segundas prórrogas emitan una advertencia de vencimiento normativo (Secc. 8.5, `IR-S-04`).
