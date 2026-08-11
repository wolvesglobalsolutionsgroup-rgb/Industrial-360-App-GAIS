# WF-052-DATA-INGESTION-SPEC

> **Nota:** Especificación convertida de YAML a Markdown para compatibilidad con Google AI Studio.

## workflowId
- **workflowId:** `WF-052`

## ingestionSchema
- **header:** `{'certificadoNumero': {'type': 'STRING', 'required': True}, 'equipoSerial': {'type': 'STRING', 'required': True}, 'marcaModelo': {'type': 'STRING', 'required': True}, 'laboratorioCertificado': {'type': 'STRING', 'required': True}, 'fechaCalibracion': {'type': 'DATE', 'required': True}, 'fechaVencimiento': {'type': 'DATE', 'required': True}}`
- **gasCalibrationData:** `{'gasPatronLote': {'type': 'STRING', 'required': True}, 'gasPatronVencimiento': {'type': 'DATE', 'required': True}, 'lecturaO2': {'type': 'FLOAT', 'expected': 20.9}, 'lecturaLel': {'type': 'FLOAT', 'expected': 50.0}, 'lecturaH2s': {'type': 'FLOAT', 'expected': 25.0}, 'lecturaCo': {'type': 'FLOAT', 'expected': 100.0}}`
