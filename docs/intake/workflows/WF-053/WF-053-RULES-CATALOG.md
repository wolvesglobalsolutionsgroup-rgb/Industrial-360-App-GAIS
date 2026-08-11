# WF-053-RULES-CATALOG

> **Nota:** Especificación convertida de YAML a Markdown para compatibilidad con Google AI Studio.

## rules
### RULE-HARD-01
- **id:** `RULE-HARD-01`
- **name:** `Retención Legal Obligatoria 5%`
- **type:** `HARD_BLOCK`
- **condition:** `retencion == monto_bruto * 0.05`
### RULE-HARD-02
- **id:** `RULE-HARD-02`
- **name:** `Punch List Catálogo A Cero`
- **type:** `HARD_BLOCK`
- **condition:** `punch_list_cat_a == 0`
