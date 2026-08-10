# Matriz de Trazabilidad End-to-End: `wf-043`

Esta matriz asegura la trazabilidad completa desde la norma oficial en PDF hasta su compilación final en el Databook.

---

## Matriz Trazable de Campo a Entregable

| Renglón Anexo A (`IR-S-04`) | Nombre del Campo | Origen del Dato | Norma de Referencia | Rol Capturador | Rol Verificador | Estado | Destino en Databook |
|---|---|---|---|---|---|---|---|
| **Renglón 1** | Tipo de Permiso | Elección según riesgo de ignición | PDVSA IR-S-04 Secc. 8.1 | Receptor | Emisor | `VERIFIED` | CH-02 SIHO-A / Sec. 2.1 |
| **Renglón 3** | Permiso N° | Correlativo único de sistema | PDVSA IR-S-04 Secc. 8.8.2 | Sistema | Emisor | `VERIFIED` | CH-02 SIHO-A / Sec. 2.1 |
| **Renglón 4** | Instalación/Área | Estructura WBS de Proyecto | PDVSA IR-S-04 Anexo A | Receptor | Emisor | `VERIFIED` | CH-02 SIHO-A / Sec. 2.1 |
| **Renglón 5** | Descripción | Alcance físico de la obra | PDVSA SI-S-20 Secc. 6.1 | Receptor | Emisor | `VERIFIED` | CH-02 SIHO-A / Sec. 2.1 |
| **Renglón 6** | N° de ART | Documento ART aprobado | PDVSA IR-S-17 Secc. 5.1 | Receptor | Emisor / SIHO | `VERIFIED` | CH-02 SIHO-A / Sec. 2.1 |
| **Renglón 7** | N° de PTS | Procedimiento técnico aprobado | PDVSA SI-S-20 Secc. 5.1 | Receptor | Emisor | `VERIFIED` | CH-02 SIHO-A / Sec. 2.1 |
| **Renglón 9** | Certificados Especiales | Matriz de riesgos del ART | PDVSA IR-S-04 Anexos B-L | Receptor | Emisor / SIHO | `VERIFIED` | CH-02 SIHO-A / Sec. 2.1 |
| **Renglón 10** | Preparación Equipos | Verificación física de líneas | PDVSA IR-S-04 Anexo A | Ejecutor | Emisor | `VERIFIED` | CH-02 SIHO-A / Sec. 2.1 |
| **Renglón 11.a**| Aislamiento LOTO | Candados y tarjetas en sitio | PDVSA SI-S-28 / IR-S-04 | Ejecutor | Emisor | `PENDING_EXTRACTION` (SI-S-28) | CH-02 SIHO-A / Sec. 2.1 |
| **Renglón 12** | Prueba de Gases | Detector multigas calibrado | PDVSA IR-S-04 Secc. 8.3 | Evaluador Gas | Emisor | `VERIFIED` | CH-02 SIHO-A / Sec. 2.1 |
| **Renglones 17-19**| Firmas Otorgamiento | Firma biométrica/digital en sitio | PDVSA IR-S-04 Secc. 8.1.2.g | Emisor/Receptor/Ejecut | Emisor | `VERIFIED` | CH-02 SIHO-A / Sec. 2.1 |
| **Renglón 20** | Prórroga (Máx 2h) | Inspección en sitio $<2\text{h}$ | PDVSA IR-S-04 Secc. 8.5 | Emisor/Receptor/Ejecut | Emisor | `VERIFIED` | CH-02 SIHO-A / Sec. 2.1 |
| **Renglón 21** | Cancelación | Registro de desviación/clima | PDVSA IR-S-04 Secc. 8.6 | Culaquier Autoridad | Emisor | `VERIFIED` | CH-02 SIHO-A / Sec. 2.1 |
| **Renglón 22** | Firmas de Cierre | Inspección de orden y limpieza | PDVSA IR-S-04 Secc. 8.7.1 | Emisor/Receptor/Ejecut | Emisor | `VERIFIED` | CH-02 SIHO-A / Sec. 2.1 |
