# Modelo Operativo Detallado: `wf-043`

**ID Workflow**: `wf-043-aprobacion-ptw`  
**Nombre Operativo**: Permiso de Trabajo Seguro "En Frío o En Caliente"  
**Estado**: `PROPOSED_SPECIFICATION`

---

## 1. Problema Operativo que Resuelve
Resuelve el riesgo de incidentes graves, explosiones o intoxicaciones durante la intervención de instalaciones industriales en caliente o frío. Asegura que ninguna labor en áreas restringidas inicie sin:
1. Procedimiento de trabajo técnico aprobado (`PDVSA SI-S-20`).
2. Análisis de riesgos y divulgación firmada a la cuadrilla (`PDVSA IR-S-17`).
3. Verificación de prueba de gases segura y firmas en sitio de autoridades autorizadas (`PDVSA IR-S-04`).

---

## 2. Matriz de Actores, Roles y Responsabilidades Citadas

| Rol en la App | Nombre en Norma | Organización | Responsabilidad Específica Citada | Cita Exacta |
|---|---|---|---|---|
| **REQUESTER** | **Receptor** | Contratista / PDVSA | Elaborar el ART (`IR-S-17`), PTS (`SI-S-20`), solicitar el permiso, verificar EPP y herramientas, mantener copia en sitio. | IR-S-04 Secc. 8.2.2 (Pág. 18) |
| **AREA_AUTHORITY**| **Emisor / Custodio**| PDVSA | Inspeccionar el sitio de trabajo, realizar/validar la prueba de gases, validar el ART, otorgar el permiso en sitio y cancelar ante desviaciones. | IR-S-04 Secc. 8.2.1 (Pág. 18) |
| **EXECUTOR** | **Ejecutor / Capataz**| Contratista / PDVSA | Dirigir la cuadrilla, divulgar el ART en campo, velar por el uso de EPP y firmar otorgamiento/cierre en sitio. | IR-S-04 Secc. 8.12 (Pág. 22) |
| **HSE_REVIEWER** | **Inspector SIHO-A** | PDVSA / Contratista | Auditar la validez del ART, calibración del multigas y verificar cumplimiento de certificados especiales. | IR-S-04 Secc. 7.4 (Pág. 14) |
| **GAS_EVALUATOR** | **Evaluador Atmósferas**| PDVSA / Autorizado | Personal certificado para operar el multigas, realizar la medición a la hora de emisión y registrar lecturas. | IR-S-04 Secc. 8.3.3 (Pág. 19) |
| **CREW_WORKERS** | **Cuadrilla Obrera** | Contratista / PDVSA | Asistir a la charla de seguridad en sitio, conocer los riesgos y firmar la Sección C del ART antes de trabajar. | IR-S-17 Secc. 5.8 (Pág. 6) |

---

## 3. Información Necesaria al Inicio vs. Durante el Proceso

### A. Información Requerida al Inicio (Gabinete / Pre-llenado)
* Datos del Proyecto, Contrato y Work Package (WBS).
* Título, Objetivo, Alcance y Ubicación geográfica exacta (PTS Secc. 6.1-6.5, `SI-S-20`).
* N° de Procedimiento de Trabajo (`SI-S-20`) y N° de ART (`IR-S-17`).
* Certificaciones y carnet de autorización vigente de Emisor y Receptor (`IR-S-04` Secc. 8.11).

### B. Información Capturada Durante el Proceso (Campo / Sitio)
* Verificación de Preguntas 25.A a 25.E de Cambios en Sitio (`IR-S-17` Pág. 13).
* Verificación de las 14 Condiciones Mínimas (Renglón 11.a-n, `IR-S-04` Pág. 33).
* Lectura en tiempo real de Prueba de Gases (% LEL, % O2, PPM H2S, CO, SO2) y datos del equipo multigas (`IR-S-04` Renglón 12).
* Nombres, C.I. y firmas de la cuadrilla en la Sección C del ART (`IR-S-17` Renglones 29-32).
* Firmas Tripartitas en sitio de Emisor, Receptor y Ejecutor (`IR-S-04` Renglones 17-19).

---

## 4. Manejo de Excepciones, Cancelación y Cierre

```text
Ocurre Evento / Desviación (Clima, Fuga, Interrupción >1h)
  │
  ▼
[ Transición a SUSPENDED ] (Secc. 8.6, Pág. 20)
  │
  ├── ¿Se Corrige la Desviación y <2h? ──▶ [ Reprueba de Gas + Revalidación ] ──▶ [ Transición a ISSUED ]
  │
  └── ¿Condiciones Modificadas o Irrecuperables? ──▶ [ Transición a CANCELLED ] (Renglón 21, Pág. 33)
```

* **Suspensión**: Si la labor se interrumpe por $>1\text{ hora}$ en caliente o $>2\text{ horas}$ en frío, el permiso se suspende automáticamente hasta realizar una nueva prueba de gas satisfatoria (`IR-S-04` Secc. 8.3.5).
* **Cancelación**: Exige indicar motivo, fecha/hora, rol que tomó la acción y firma en el Renglón 21 (Pág. 33).
* **Cierre**: Al finalizar la labor o vencer el turno, se realiza inspección conjunta de orden/limpieza y se colocan las Firmas de Cierre en el Renglón 22 (Pág. 33).
