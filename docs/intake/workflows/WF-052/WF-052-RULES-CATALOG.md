# WF-052-RULES-CATALOG

> **Nota:** Especificación convertida de YAML a Markdown para compatibilidad con Google AI Studio.

## rules
### RULE-HARD-01
- **id:** `RULE-HARD-01`
- **name:** `Certificado de Calibración Vigente`
- **type:** `HARD_BLOCK`
- **condition:** `fecha_actual <= fecha_vencimiento`
### RULE-HARD-02
- **id:** `RULE-HARD-02`
- **name:** `Tolerancia Máxima de Error`
- **type:** `HARD_BLOCK`
- **condition:** `error_porcentaje <= 2.0`
