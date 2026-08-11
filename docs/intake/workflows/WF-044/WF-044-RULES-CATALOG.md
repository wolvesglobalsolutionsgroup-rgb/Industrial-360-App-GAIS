# WF-044-RULES-CATALOG

> **Nota:** Especificación convertida de YAML a Markdown para compatibilidad con Google AI Studio.

## rules
### RULE-HARD-01
- **id:** `RULE-HARD-01`
- **name:** `Elaboración en Sitio`
- **type:** `HARD_BLOCK`
- **citation:** `PDVSA IR-S-17 §5.2`
- **condition:** `elaborado_en_sitio == true`
### RULE-HARD-02
- **id:** `RULE-HARD-02`
- **name:** `Divulgación y Firma de Trabajadores`
- **type:** `HARD_BLOCK`
- **citation:** `PDVSA IR-S-17 §5.3`
- **condition:** `firmas_cuadrilla.length == total_trabajadores`
### RULE-HARD-03
- **id:** `RULE-HARD-03`
- **name:** `Firmas Tripartitas`
- **type:** `HARD_BLOCK`
- **citation:** `PDVSA IR-S-17 Anexo A`
- **condition:** `firmas_presentes == ['EMISOR', 'RECEPTOR', 'EJECUTOR']`
### RULE-HARD-04
- **id:** `RULE-HARD-04`
- **name:** `Re-evaluación por Cambio de Condiciones`
- **type:** `HARD_BLOCK`
- **citation:** `PDVSA IR-S-17 §8.1`
- **condition:** `cambio_condiciones == true => status == 'NEEDS_REVISION'`
