# WF-044-DATA-INGESTION-SPEC

> **Nota:** Especificación convertida de YAML a Markdown para compatibilidad con Google AI Studio.

## workflowId
- **workflowId:** `WF-044`

## ingestionSchema
- **header:** `{'numeroArt': {'type': 'STRING', 'required': True, 'rule': 'AUTO_GENERATED'}, 'tituloTrabajo': {'type': 'STRING', 'required': True}, 'instalacionArea': {'type': 'STRING', 'required': True}, 'empresa': {'type': 'STRING', 'required': True}, 'ordenSapNumero': {'type': 'STRING', 'required': False}, 'contratoNumero': {'type': 'STRING', 'required': True}, 'fechaElaboracion': {'type': 'DATE', 'required': True}}`
- **tableSteps:** `{'type': 'ARRAY_OBJECT', 'items': {'pasoNumero': {'type': 'INTEGER', 'required': True}, 'pasoDescripcion': {'type': 'STRING', 'required': True}, 'peligrosIdentificados': {'type': 'ARRAY_STRING', 'required': True}, 'medidasPreventivas': {'type': 'ARRAY_STRING', 'required': True}}}`
- **signatures:** `{'emisorCustodio': {'type': 'OBJECT', 'required': True}, 'receptorSupervisor': {'type': 'OBJECT', 'required': True}, 'ejecutorLider': {'type': 'OBJECT', 'required': True}, 'trabajadoresCuadrilla': {'type': 'ARRAY_OBJECT', 'required': True}}`
