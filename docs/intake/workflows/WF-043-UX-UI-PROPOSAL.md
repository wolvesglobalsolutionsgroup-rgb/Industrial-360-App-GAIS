# UX/UI Proposal — WF-043: Permiso de Trabajo Seguro PTW (PDVSA IR-S-04)

## Component Architecture

Component: `PtwApprovalCapture.tsx`

### Interface Tabs and Navigation

1. **Tab 1: Datos Generales (Core PTW Anexo A)**
   - Código PTW, Orden SAP N°, Tipo de Trabajo (Frío / Caliente), Ubicación, Equipo e Intervención, Descripción del trabajo.
   - Hora de Inicio, Duración Máxima, Indicador Parada de Planta.
2. **Tab 2: Elegibilidad Contratista & Prerrequisitos SIHOA**
   - Estatus Contratista (APTA), Código y Aprobación de Plan SIHOA.
   - Código y Estado de Aprobación del ART (PDVSA IR-S-17) y Procedimiento (PDVSA SI-S-20).
3. **Tab 3: Prueba Atmosférica y Preparación de Equipo**
   - Valores de LEL %, O2 %, H2S PPM y Hora de Prueba de Gas (con alerta dinámica si difiere de la hora de inicio).
   - Checklist de Aislamiento y Preparación (Lavado, Aislado, Purgado, Venteado, Inertizado, Despresurizado, Drenado).
4. **Tab 4: Anexos Especiales (B a K)**
   - Selección interactiva y despliegue contextual de requerimientos para Trabajos en Altura, Izaje, Espacios Confinados, etc.
5. **Tab 5: Firmas Tripartitas y Prórroga**
   - Registro de datos de Emisor (Custodio PDVSA), Receptor (Mantenimiento) y Ejecutor (Contratista).
   - Panel de Solicitud de Prórroga (hasta 2 horas max).
6. **Tab 6: Cierre, Limpieza y Fuentes Externas**
   - Confirmación de Orden y Limpieza, Retiro de Bloqueos LOTO.
   - Panel de Parámetros Externos Pendientes (telemetría / fuentes externas esperadas).

## Design Rules Applied

- **Color Scheme**: High-contrast surface tokens (`bg-surface`, `text-ink`, `border-border`).
- **Safety Feedback**: Dynamic warning highlights for non-zero LEL in Hot Work or time mismatch.
- **Strict Read-Only Mode**: Disables all fields when workflow state is final or viewer lacks permissions.
