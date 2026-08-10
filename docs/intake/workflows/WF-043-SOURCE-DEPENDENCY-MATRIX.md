# Matriz de Dependencias Documentales: `wf-043` (Permiso de Trabajo Seguro)

**ID Workflow**: `wf-043-aprobacion-ptw`  
**Nombre Operativo**: Permiso de Trabajo Seguro "En Frío o En Caliente" (PDVSA SIHO-A)  
**Dominio Técnico**: Seguridad Industrial, Higiene Ocupacional y Ambiente (SIHO-A) / Permisoría de Campo  
**Estado de Análisis**: `PROPOSED_SPECIFICATION`  
**Nivel de Confianza**: `HIGH` (Basado en 3 PDFs oficiales confirmados + 10 fuentes dependientes registradas)

---

## 1. Fuentes Documentales Confirmadas (PDFs Oficiales Reales)

| ID Documento | Título Oficial | Revisión / Fecha | Nivel de Autoridad | Ámbito en `wf-043` |
|---|---|---|---|---|
| **`PDVSA IR-S-04`** | Manual de Ingeniería de Riesgos: Sistema de Permisos de Trabajo | Rev. 4, Agosto 2013 | `CONFIRMED_PDF` | Norma marco, Renglones 1-23 del Permiso Base (Anexo A), procedimientos de otorgamiento, prueba de gases, prórroga, cancelación y cierre. |
| **`PDVSA IR-S-17`** | Manual de Ingeniería de Riesgos: Análisis de Riesgos del Trabajo (ART) | Rev. 0, Octubre 2006 | `CONFIRMED_PDF` | Matriz de 35 Renglones, identificación de peligros, jerarquía de controles (Fuente-Trayectoria-Receptor), Sección C de campo y firmas de cuadrilla. |
| **`PDVSA SI-S-20`** | Manual de Seguridad Industrial: Procedimientos de Trabajo | Rev. 0, Noviembre 2006 | `CONFIRMED_PDF` | Estructura de 15 Secciones Obligatorias, secuencia de tareas en infinitivo y manejo ambiental de desechos (Decreto 2635). |

---

## 2. Fuentes Referenciadas Faltantes (`MISSING_SOURCE`)

| ID Documento | Título Referenciado en Norma | Norma Origen que Cita | Páginas Citadas | Estado | Impacto en `wf-043` |
|---|---|---|---|---|---|
| **`PDVSA SI-S-28`** | Control de Fuentes de Energía (LOTO) | PDVSA IR-S-04 / SI-S-20 | IR-S-04 Pág. 7, 17, 26 | `MISSING_SOURCE` | Requerido para la validación detallada del Aislamiento LOTO (Renglón 11.a de IR-S-04). |
| **`PDVSA HO-H-06`** | Guía para Trabajos en Espacios Confinados | PDVSA IR-S-04 | IR-S-04 Pág. 7, 23 | `MISSING_SOURCE` | Requerido para la integración completa del Certificado Anexo B. |
| **`PDVSA PI-15-02-01`** | Requisitos en Izamiento de Cargas | PDVSA IR-S-04 | IR-S-04 Pág. 7, 24 | `MISSING_SOURCE` | Requerido para la integración del Certificado Anexo C / ASME B30.5. |
| **`PDVSA SI-S-27`** | Andamios: Requisitos de Seguridad | PDVSA IR-S-04 | IR-S-04 Pág. 7, 31 | `MISSING_SOURCE` | Requerido para la integración del Certificado Anexo J (Altura). |
| **`PDVSA SI-S-31`** | Seguridad Industrial para Trabajos en Altura | PDVSA IR-S-04 | IR-S-04 Pág. 7, 31 | `MISSING_SOURCE` | Requerido para la validación de arnés, puntos de anclaje y líneas de vida. |
| **`PDVSA SI-S-29`** | Trabajos en Sistemas Eléctricos Alta Tensión | PDVSA IR-S-04 | IR-S-04 Pág. 7, 28 | `MISSING_SOURCE` | Requerido para la integración del Certificado Anexo F (Eléctrico). |
| **`PDVSA SI-S-32`** | Trabajos en Sistemas Eléctricos Baja Tensión | PDVSA IR-S-04 | IR-S-04 Pág. 7, 28 | `MISSING_SOURCE` | Requerido para la validación de interruptores, tableros y tierras temporales. |
| **`COVENIN 2247`** | Excavaciones a Cielo Abierto y Subterráneas | PDVSA IR-S-04 | IR-S-04 Pág. 6, 26 | `MISSING_SOURCE` | Requerido para la integración del Certificado Anexo E (Excavaciones). |
| **`PDVSA IR-E-01`** | Clasificación Eléctrica de Áreas | PDVSA IR-S-04 | IR-S-04 Pág. 7, 16 | `MISSING_SOURCE` | Requerido para verificar compatibilidad de equipos en áreas restringidas. |
| **`PDVSA IR-S-16`** | Zonas de Seguridad en Áreas Compartidas | PDVSA IR-S-04 | IR-S-04 Pág. 7, 29 | `MISSING_SOURCE` | Requerido para la integración del Certificado Anexo I (Corredores). |
| **`PDVSA 10606.1.401`**| Guidelines for Hot-Tapping | PDVSA IR-S-04 | IR-S-04 Pág. 7, 29 | `MISSING_SOURCE` | Requerido para la integración del Certificado Anexo H (Perforación en Caliente). |
| **`Decreto 2635`** | Manejo de Desechos y Efluentes Peligrosos | PDVSA SI-S-20 | SI-S-20 Pág. 3, 9 | `MISSING_SOURCE` | Requerido para la clasificación de desechos en la Sección 6.13 de los PTS. |

---

## 3. Matriz de Conflictos y Desviaciones Identificadas

| Conflicto / Desviación | Fuente 1 (Autoridad Mayor) | Fuente 2 (Secundaria) | Análisis del Conflicto | Resolución Adoptada |
|---|---|---|---|---|
| **Bloqueo Automático vs Evaluador Advisory** | Práctica UX/UI previa en repo (`blocking: true`) | PDVSA IR-S-04 Secc. 8.3 / 8.6 | La norma establece que las desviaciones atmosféricas o de seguridad exigen intervención y decisión humana (Emisor/Receptor), no rechazos automáticos de software. | `RESOLVED_ADVISORY`: La app notifica la alerta y exige justificación humana/firma de excepción. |
| **Ciclo de Estados Abreviado** | Interfaz previa (`DRAFT -> APPROVED`) | PDVSA IR-S-04 Secc. 8.1 - 8.7 | La norma describe fases operativas de inspección en sitio, entrega de copia, suspensión por clima, prórroga, cancelación y cierre. | `RESOLVED_LIFECYCLE`: Implementada máquina de 10 estados (`DRAFT` a `ARCHIVED`). |
| **Firma Tripartita Unificada** | Suposición de 3 firmas fijas para todo | PDVSA IR-S-04 / SI-S-20 | El Permiso `IR-S-04` exige 3 firmas (Emisor, Receptor, Ejecutor), pero el ART `IR-S-17` Sección C exige firmas de toda la cuadrilla. | `RESOLVED_SIGNATURES`: Distinguir firmas de aprobación de permiso vs firmas de divulgación de cuadrilla. |
