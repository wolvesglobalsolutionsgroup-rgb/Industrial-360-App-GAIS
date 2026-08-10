# Implementation Brief — WF-043: Permiso de Trabajo Seguro PTW (PDVSA IR-S-04)

## Executive Summary

WF-043 gestiona la aprobación y emisión estricta de Permisos de Trabajo Seguro (PTW) para actividades en frío o caliente en instalaciones de la industria petrolera y de gas, conforme a la norma **PDVSA IR-S-04 Rev. 4**, **PDVSA IR-S-17** (ART), y **PDVSA SI-S-20** (Procedimientos de Trabajo).

## Key Implementation Pillars

1. **Elegibilidad de Contratistas**: Validación obligatoria de estatus `APTA` y Plan SIHOA aprobado.
2. **Hard Gates Inquebrantables**:
   - 0.0% LEL en trabajos en caliente.
   - Coincidencia exacta de hora de inicio y hora de la prueba inicial de gas.
   - Duración máxima de 8 horas (extendible a 12 horas únicamente en paradas de planta).
   - Firmas tripartitas registradas (Emisor Custodio, Receptor, Ejecutor).
3. **Soporte de 11 Anexos Especiales**: Trabajo en altura, izaje, espacios confinados, etc.
4. **Prórrogas y Cierre**: Límite de 2 horas de prórroga manteniéndose condiciones iniciales y firmantes.
