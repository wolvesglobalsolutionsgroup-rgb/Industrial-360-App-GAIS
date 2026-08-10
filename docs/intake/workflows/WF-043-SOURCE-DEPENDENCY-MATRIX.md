# Source Dependency Matrix — WF-043: Permiso de Trabajo Seguro PTW (PDVSA IR-S-04)

| Field / Feature | Dependency Source | Normative Reference | Verification Method |
|---|---|---|---|
| Estatus APTA Contratista | Registro SIHOA / SI-S-20 | PDVSA SI-S-20 | Hard Gate (`gate-contractor-readiness`) |
| Plan SIHOA Aprobado | Custodio / SIHOA | PDVSA SI-S-20 | Hard Gate (`gate-contractor-readiness`) |
| ART Aprobado | Análisis de Riesgo IR-S-17 | PDVSA IR-S-17 | Hard Gate (`gate-contractor-readiness`) |
| LEL % (Explosividad) | Explosímetro Multigas | PDVSA IR-S-04 Sec. 8.3 | Hard Gate (`gate-issuance-hard-blocks`) |
| Coincidencia Hora Inicio / Gas | Formulario PTW Anexo A | PDVSA IR-S-04 Sec. 8.1 | Hard Gate (`gate-issuance-hard-blocks`) |
| Duración Máxima 8h / 12h | Formulario PTW Anexo A | PDVSA IR-S-04 Sec. 8.4 | Hard Gate (`gate-issuance-hard-blocks`) |
| Prórroga Max 2h | Sección Prórroga | PDVSA IR-S-04 Sec. 8.5 | Hard Gate (`gate-issuance-hard-blocks`) |
| Cierre Orden y Limpieza | Inspección Final | PDVSA IR-S-04 Sec. 9.1 | Hard Gate (`gate-closeout-verification`) |
