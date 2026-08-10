# Open Questions & Decisions — WF-043: Permiso de Trabajo Seguro PTW (PDVSA IR-S-04)

## Resolved Architectural Questions

1. **¿Cómo se maneja la discrepancia entre la hora de otorgamiento y la prueba de gases?**
   - *Resolución*: La norma PDVSA IR-S-04 exige que la hora de inicio del trabajo coincida exactamente con la hora de la prueba inicial de gases. Un Hard Gate bloquea la emisión si difieren.

2. **¿Cuál es la duración máxima permitida de un PTW?**
   - *Resolución*: Máximo 8 horas para turno operacional estándar. Si se declara "Parada de Planta o Mantenimiento Mayor", el límite se expande a 12 horas.

3. **¿Cómo se maneja la falta de integración directa con telemetría de explosímetros?**
   - *Resolución*: Se habilita el registro de `pendingExternalParameters` con la fuente esperada, garantizando honestidad técnica sin inventar datos simulados.
