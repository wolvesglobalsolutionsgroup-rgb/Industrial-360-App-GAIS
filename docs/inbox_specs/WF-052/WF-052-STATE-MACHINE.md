# Máquina de Estados Operativos: WF-052

```yaml
workflowId: wf-052-instrumentacion-lazos-pid
stateMachine:
  states:
    - DRAFT: "Borrador inicial pre-llenado con Tags del P&ID"
    - IN_PROGRESS: "Registro de lecturas de calibración en banco/sitio"
    - SUBMITTED: "Calibración completada enviada a revisión QA/QC"
    - UNDER_REVIEW: "Inspección de lazo y verificación de tolerancia"
    - CHANGES_REQUESTED: "Recalibración o ajuste de cero/span requerido"
    - APPROVED: "Prueba de lazo y calibración aprobada"
    - ISSUED: "Certificado emitido con firmas tripartitas"
    - SUSPENDED: "Lazo suspendido por falla de señal o reemplazo de instrumento"
    - CLOSED: "Lazo integrado y normalizado en planta"
    - ARCHIVED: "Documento indexado en Capítulo 03 del Databook"
```
