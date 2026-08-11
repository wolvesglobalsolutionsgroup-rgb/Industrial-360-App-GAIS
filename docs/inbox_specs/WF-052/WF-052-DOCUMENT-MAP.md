# Mapa Documental Integrado: WF-052

Este mapa establece la cadena de trazabilidad desde el plano P&ID de ingeniería hasta el Certificado de Calibración archivado en el Databook.

---

## Cadena de Flujo Documental

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. PLANO P&ID Y HOJA DE DATOS ISA 20                                   │
│    • Identifica Tag N° (ej. PT-101A) y Diagrama P&ID-SJ-101-REV2.     │
│    • Define Rango Min/Max (ej. 0 a 100 PSI) y Tolerancia %FS.          │
│    • Verifica Clasificación Eléctrica PDVSA IR-E-01 (Clase I Div 1/2). │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. PRUEBA DE CAMPO Y CALIBRACIÓN EN BANCO (WF-052 CAPTURE)             │
│    • Registro de 5 puntos (0%, 25%, 50%, 75%, 100% FS asc/desc).        │
│    • Medición con patrón calibrado e impresiones HART / Fieldbus.      │
│    • Verificación de Sello Antiexplosivo Ex-d / Ex-i (IR-E-01 Pág 10). │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. CERTIFICADO OFICIAL DE CALIBRACIÓN E INTEGRIDAD DE LAZO            │
│    • Código: CERT-INST-PT-101A                                         │
│    • Firmas: Técnico I&C, Inspector QA/QC y Custodio Operador.         │
│    • Destino Databook: CAPÍTULO 03 (QA/QC) / SECCIÓN 3.2 INSTRUMENTOS.  │
└────────────────────────────────────────────────────────────────────────┘
```
