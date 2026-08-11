# Traceability Matrix — WF-043: Permiso de Trabajo Seguro PTW (PDVSA IR-S-04)

| Requirement Code | Description | Implementation File | Verification Gate / Test |
|---|---|---|---|
| REQ-043-01 | Elegibilidad APTA de Contratista | `definition.ts` | `gate-contractor-readiness` / Unit test |
| REQ-043-02 | Aprobación de Plan SIHOA | `definition.ts` | `gate-contractor-readiness` / Unit test |
| REQ-043-03 | ART Aprobado (PDVSA IR-S-17) | `definition.ts` | `gate-contractor-readiness` / Unit test |
| REQ-043-04 | Procedimiento Aprobado (SI-S-20) | `definition.ts` | `gate-contractor-readiness` / Unit test |
| REQ-043-05 | Explosividad 0.0% LEL en Caliente | `definition.ts` | `gate-issuance-hard-blocks` / Unit test |
| REQ-043-06 | Coincidencia de Hora de Inicio y Gas | `definition.ts` | `gate-issuance-hard-blocks` / Unit test |
| REQ-043-07 | Duración Máxima 8h / 12h | `definition.ts` | `gate-issuance-hard-blocks` / Unit test |
| REQ-043-08 | Firma Tripartita Requerida | `definition.ts` | `gate-issuance-hard-blocks` / Unit test |
| REQ-043-09 | Prórroga Máxima de 2 Horas | `definition.ts` | `gate-issuance-hard-blocks` / Unit test |
| REQ-043-10 | Orden, Limpieza y Retiro de Bloqueos LOTO | `definition.ts` | `gate-closeout-verification` / Unit test |
| REQ-043-11 | Generación de Documento ViewModel | `definition.ts` | `deliv-043-ptw-ir-s-04` factory / Unit test |
