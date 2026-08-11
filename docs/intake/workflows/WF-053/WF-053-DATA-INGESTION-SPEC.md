# WF-053-DATA-INGESTION-SPEC

> **Nota:** Especificación convertida de YAML a Markdown para compatibilidad con Google AI Studio.

## workflowId
- **workflowId:** `WF-053`

## ingestionSchema
- **valuation:** `{'valuacionNumero': {'type': 'INTEGER', 'required': True}, 'montoBrutoValuado': {'type': 'FLOAT', 'required': True}, 'retencionLegalFielCumplimiento': {'type': 'FLOAT', 'required': True, 'rate': 0.05}, 'hesSapNumero': {'type': 'STRING', 'required': True}}`
- **mechanicalCompletion:** `{'punchListCatAPendientes': {'type': 'INTEGER', 'required': True, 'max': 0}, 'actaANotificacion': {'type': 'BOOLEAN', 'required': True}, 'actaBVerificacion': {'type': 'BOOLEAN', 'required': True}, 'actaCRecepcionProvisional': {'type': 'BOOLEAN', 'required': True}}`
