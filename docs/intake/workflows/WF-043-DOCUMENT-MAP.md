# WF-043: MAPA DOCUMENTAL COMPLETO (ANEXO A Y ANEXOS B-L)

**Documento Base:** PDVSA IR-S-04 — *Sistema de Permisos de Trabajo*, Rev. 4 (Agosto 2013).

---

## 1. DESGLOSE CAMPO POR CAMPO DEL PERMISO DE TRABAJO (ANEXO A - PÁGS. 33-35)

| Renglón No. | Campo / Elemento del Anexo A | Cita Normativa Exacta (Sección / Pág.) | Tipo de Dato / Opción | Estado |
|---|---|---|---|:---:|
| **1** | Tipo de Trabajo (En Frío / En Caliente) | Sec. 8.8.1, Anexo A, Pág. 33 | Radio / Enum ("EN_FRIO", "EN_CALIENTE") | `CONFIRMED` |
| **2** | Orden SAP No. | Anexo A Renglón 2, Pág. 33 | String (Alfanumérico) | `CONFIRMED` |
| **3** | Número del Permiso | Sec. 8.8.2, Anexo A, Pág. 33 | String Correlativo Único | `CONFIRMED` |
| **4** | Instalación / Área / Unidad / Equipo | Anexo A Renglón 4, Pág. 33 | String / Ubicación Específica | `CONFIRMED` |
| **5** | Descripción de los Trabajos | Anexo A Renglón 5, Pág. 33 | Texto Descriptivo + Fuente Ignición | `CONFIRMED` |
| **6** | Análisis de Riesgos No. (ART) | Sec. 7.1.2, Anexo A Renglón 6, Pág. 33 | String (Ref: PDVSA IR-S-17) | `CONFIRMED` |
| **7** | Procedimiento de Trabajo No. | Sec. 7.1.2, Anexo A Renglón 7, Pág. 33 | String (Ref: PDVSA SI-S-20) | `CONFIRMED` |
| **8** | Ejecutor del Trabajo | Anexo A Renglón 8, Pág. 33 | Enum ("PDVSA", "CONTRATISTA"), No. Personas | `CONFIRMED` |
| **9** | Certificados Requeridos | Sec. 7.2.b, Anexo A Renglón 9, Pág. 33 | Checkbox Group (Anexos B a L / No Aplica) | `CONFIRMED` |
| **10** | Preparación de Recipientes/Equipos | Anexo A Renglón 10, Pág. 33 | Checkbox Group (Lavados, Aislados, Purgados, etc.) | `CONFIRMED` |
| **11** | Condiciones a Verificar (items a-n) | Sec. 8.1.2, Anexo A Renglón 11, Pág. 33 | Checkbox List (a a n: LOTO, EPP, Clima, etc.) | `CONFIRMED` |
| **12** | Pruebas de Gases | Sec. 8.3, Anexo A Renglón 12, Pág. 33 | Tabla Mediciones ($Ex, O_2, H_2S, SO_2, NH_3, CO, CO_2, \text{Benceno}$) | `CONFIRMED` |
| **13** | Fecha de Emisión | Anexo A Renglón 13, Pág. 33 | Date (Día / Mes / Año) | `CONFIRMED` |
| **14** | Hora de Inicio | Sec. 8.1.1.b, Anexo A Renglón 14, Pág. 33 | Time (Coincidente con Prueba de Gas) | `CONFIRMED` |
| **15** | Validez Hasta | Sec. 8.4.1, Anexo A Renglón 15, Pág. 33 | Time (Max 8h continuo / Max 12h paradas) | `CONFIRMED` |
| **16** | Manejo del Cambio No. (MDC) | Anexo A Renglón 16, Pág. 33 | Enum ("NO_APLICA", "TEMPORAL", "PERMANENTE", "EMERGENCIA") | `CONFIRMED` |
| **17** | Firma Emisor | Sec. 8.1.2.g, Anexo A Renglón 17, Pág. 33 | Nombre, Cédula, Firma | `CONFIRMED` |
| **18** | Firma Receptor | Sec. 8.1.2.g, Anexo A Renglón 18, Pág. 33 | Nombre, Cédula, Firma | `CONFIRMED` |
| **19** | Firma Ejecutor | Sec. 8.1.2.g, Anexo A Renglón 19, Pág. 33 | Nombre, Cédula, Firma | `CONFIRMED` |
| **20** | Prórroga del Permiso | Sec. 8.5, Anexo A Renglón 20, Pág. 33 | Hora Hasta (Max 2h), Firmas, Re-prueba Gas | `CONFIRMED` |
| **21** | Cancelación del Permiso | Sec. 8.6, Anexo A Renglón 21, Pág. 33 | Motivo, Fecha/Hora, Acción tomada por, Firma | `CONFIRMED` |
| **22** | Cierre del Permiso | Sec. 8.7, Anexo A Renglón 22, Pág. 33 | Hora, Firmas Emisor/Receptor/Ejecutor | `CONFIRMED` |
| **23** | Observaciones | Anexo A Renglón 23, Pág. 33 | Texto / Firmas Custodios Afectados | `CONFIRMED` |

---

## 2. RESUMEN DE MAPEO DE ANEXOS B A L (CERTIFICADOS ESPECIALES)

* **Anexo B (Espacios Confinados):** Sec. 11 (Págs. 23, 36-38). Factores de riesgo, aislamiento mecánico, LOTO, voltaje max (6/12/24/50V), EPP respiratorio, prueba de gas, Observador/Rescatista.
* **Anexo C (Izamiento de Cargas):** Sec. 12 (Págs. 24, 39-42). Tipo de grúa, serial, prueba de carga, capacidad nominal, cálculo de ratio ($<80\%$), señalero, interferencias de alta tensión.
* **Anexo D (Radiaciones Ionizantes):** Sec. 13 (Págs. 24, 43-45). Tipo emisión, actividad (Ci), RNPFEGRI, tasa de dosis ($<0.5\ \mu\text{Sv/h}$ en barrera), dosímetro, CAPRA.
* **Anexo E (Excavación):** Sec. 14 (Págs. 25, 46-48). Dimensiones ($L \times A \times P$), tipo de suelo, firmas supervisores de servicios (electricidad, agua, telecom, gas), entibado/talud.
* **Anexo F (Sistema Eléctrico):** Sec. 15 (Págs. 26, 49-52). LOTO (PDVSA SI-S-28), desenergización, diagramas unifilares, aprobación Despacho Carga (72h preventivo, 24h urgente).
* **Anexo G (Subacuáticos y Superficies Acuáticas):** Sec. 16 (Págs. 28, 53-55). Buceo en pareja, tablas descompresión, bote emergencia, mangueras/compresor.
* **Anexo H (Hot-Tapping):** Sec. 17 (Págs. 29, 56-58). Datos de línea (diámetro, fluido, presión, temp, espesor), válvula apertura completa, hermeticidad, EPS soldadura, aprobación Gerente Custodio.
* **Anexo I (Áreas Compartidas):** Sec. 18 (Págs. 29, 59-60). Notificación 5 días continuos antes, franja seguridad (50m en líneas eléctricas según IR-S-16), firmas custodios afectados.
* **Anexo J (Trabajos en Altura):** Sec. 19 (Págs. 31, 61-63). Trabajos $>1.50\text{m}$, andamiero certificado, relación base/altura (4:1), arnés doble cabo de vida.
* **Anexo K (Fumigación):** Anexo K (Págs. 64-66). Método, producto comercial, permisos INSAI/MPPSALUD, Hoja MSDS, tiempo reentrada.
* **Anexo L (Soldadura):** Anexo L (Págs. 67-69). EPS No., calificación soldadores (PDVSA PI-06-06-01), certificación máquinas de soldar, matachispas.
