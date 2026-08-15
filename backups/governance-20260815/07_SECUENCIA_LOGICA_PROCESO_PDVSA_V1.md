# 📜 07_SECUENCIA_LOGICA_PROCESO_PDVSA_V1.md — SECUENCIA LÓGICA COMPLETA DE EJECUCIÓN DE PROYECTOS PDVSA
**Fecha de Emisión:** 13 de Agosto, 2026  
**Autor:** Arquitecto Técnico Senior IC360 (Antigravity)  
**Perspectiva:** Empresa Contratista (Perspectiva Operativa, Técnica y Financiera de Campo)  
**Repositorio Oficial:** `Industrial-360-App-GAIS` (`wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS.git`)

---

## 🛑 1. Fase 0: Adjudicación y Contratación (El Nacimiento Legal)

El flujo inicia formalmente cuando la Gerencia de Contratación de PDVSA emite la **Resolución de Adjudicación**. A partir de este momento corre un lapso legal perentorio de 15 días continuos para la consignación de recaudos y firma.

### 1.1. Recaudos Legales Obligatorios para la Firma del Contrato
1. **Certificado del RNC (Registro Nacional de Contratistas):** Estatus estrictamente *Vigente y Calificado* en la especialidad correspondiente.
2. **Solvencias Parafiscales y Laborales (Día de la Firma):**
   - **Solvencia Laboral:** Emitida por el Ministerio del Poder Popular para el Proceso Social de Trabajo (MINPPTRASS).
   - **Solvencia IVSS:** Instituto Venezolano de los Seguros Sociales.
   - **Solvencia INCES:** Instituto Nacional de Capacitación y Educación Socialista.
   - **Solvencia FAOV:** Fondo de Ahorro Obligatorio para la Vivienda (Banavih).
3. **Registro de Información Fiscal (RIF):** Copia digital y física legible de la empresa y representantes legales.
4. **Constitución de Fianzas (Garantías Contractuales en SUDESEG):**
   - **Fianza de Fiel Cumplimiento:** $10\%$ del monto total del contrato.
   - **Fianza de Anticipo:** $100\%$ del monto del anticipo otorgado (usualmente entre $30\%$ y $50\%$ del monto contractual).
   - **Fianza de Pasivos Laborales:** $5\%$ al $10\%$ del costo estimado de la mano de obra.

### 1.2. El Pedido SAP (La Reserva Presupuestaria de Dinero)
- **Generación:** Tras la firma física del contrato, Contratación de PDVSA procesa la orden internamente en SAP R/3 / S4HANA y genera el **Pedido SAP** (numeración correlativa `45xxxxxxxx`).
- **Regla de Oro:** **NUNCA movilizar personal ni equipos a campo sin la copia del Pedido SAP**. Este número ampara la disponibilidad de fondos corporativos y de él se derivan todas las Hoja de Entrada de Servicios (HES) y pagos.

---

## 🚀 2. Fase 1: Ingeniería de Detalle y Arranque de Obra

Antes de colocar el primer equipo en sitio, la contratista debe entregar y recibir aprobación formal de la planificación técnica, logística y de seguridad.

### 2.1. Ingeniería de Detalle & Planos Aprobados para Construcción (APC)
- **Estudios de Campo:** Levantamientos topográficos (puntos e itinerarios UTM), estudios de suelo (ensayos SPT ASTM D-1586, límites de Atterberg), planos de implantación e isométricos.
- **Entregable Oficial:** Planos firmados por el Proyectista de la Contratista y sellados por la Gerencia de Ingeniería/ITO de PDVSA con el sello húmedo **"APROBADO PARA CONSTRUCCIÓN" (APC)**.

### 2.2. Planificación y Control de Proyectos
- **Estructura WBS / Cómputos Métricos:** Desglose del presupuesto base por Códigos de Partida SAP.
- **Formatos Obligatorios:**
  - **Cronograma de Ejecución (Gantt):** Desarrollado en MS Project / Primavera P6 marcando la Ruta Crítica en rojo.
  - **Histograma de Personal & Equipos:** Curva de permanencia de mano de obra y maquinaria.
  - **Curva S de Inversión:** Gráfico de avance físico planificado vs. avance financiero en el tiempo.

### 2.3. Plan SHA (Seguridad, Higiene y Ambiente — PDVSA SI-S-04 / SI-S-06)
- **Matriz ARA / ART (Análisis de Riesgos por Actividad):** Desglose de tareas, identificación de peligros y controles (PDVSA HO-H-02).
- **Plan de Respuesta a Emergencias (PRE):** Rutas de evacuación médica a clínicas industriales de PDVSA y hospitales de zona.
- **Listado & Certificación de EPP:** Certificados de bragas ignífugas (NFPA 2112) y calzado dieléctrico.

### 2.4. El Acto Físico de Inicio de Obra
- **Acta de Inicio de Obra:** Documento oficial firmado en sitio por la Gerencia de Proyectos de PDVSA, la Inspección Técnica (ITO) y el Ingeniero Residente de la Contratista. Fija la fecha de inicio del plazo contractual.
- **Apertura del Libro de Obra:** Libro físico empastado de tres copias. La Página N° 1 contiene el asiento de apertura firmado por el Residente y la ITO.

---

## 🏗️ 3. Fase 2: Ejecución y Recopilación Diaria (El Dossier de Calidad)

Durante la ejecución diaria, la contratista debe blindar técnicamente cada actividad realizada. Todo trabajo soterrado o cubierto sin evidencia fotográfica y actas de medición es rechazado de cobro.

### 3.1. Recopilación Diaria por Especialidad
- **Área Civil / Estructural:**
  - Formato de Liberación de Excavación y Fundaciones.
  - Planilla de Ensayos de Concreto en Sitio (Slump Test ASTM C-143).
  - Reportes de Ensayos a Compresión de Testigos Cilíndricos (ASTM C-39 a 7, 14 y 28 días).
  - Certificados de Calidad de Cabillas y Cemento (MTR Sidor con número de colada).
- **Área Mecánica / Tuberías (Piping & Tubing):**
  - **Libro de Control de Soldadura (Weld Log):** Registro de junta, diámetro, espesor, soldador (WPQ), WPS aplicado y coladas.
  - **Ensayos No Destructivos (NDT Log):** Reportes de Radiografía Industrial (RT), Ultrasonido (UT) o Tintas Penetrantes (PT).
  - **Protocolo de Prueba Hidrostática / Neumática:** Carta del registrador Barton (Chart Recorder) a presión de prueba durante 4 a 24 horas.
- **Área Eléctrica e Instrumentación:**
  - Formato de Megado de Cables (Prueba de resistencia de aislamiento con Megóhmetro).
  - Certificados de Calibración Metrológica de manómetros, transmisores y sensores.
- **Procura de Equipos Mayores:**
  - Mill Test Certificate (MTR) del fabricante.
  - Formato "Acta de Recepción de Materiales en Sitio" (Almacén PDVSA).
  - Formato "Acta de Transferencia de Propiedad" a favor de PDVSA.

### 3.2. La Bitácora Legal: El Libro de Obra
- **Asiento Diario:** Redactado en tinta negra por el Ingeniero Residente sin tachaduras ni enmiendas. Registra actividades del día, personal activo, equipos operativos, condiciones climáticas y desviaciones.
- **Firma e Inspección:** Firmado diariamente por el Inspector Técnico de PDVSA (ITO).

---

## 💵 4. Fase 3: Valuaciones Parciales (Cobro Intermedio Quincenal / Mensual)

### 4.1. Medición y Conciliación de Cómputos Métricos
1. Reconciliación en campo entre el Ingeniero Residente y la ITO de PDVSA.
2. Llenado y firma de las **Hojas de Cómputos Métricos de Campo**.
3. Firma del **Acta de Conciliación de Cómputos Métricos**, congelando el monto físico a cobrar en el período.

### 4.2. Armado del Expediente de Valuación Parcial (Separadores Estrictos)
- **Separador 1:** Factura Comercial a nombre de la filial de PDVSA indicando Contrato y Pedido SAP (`45xxxxxxxx`).
- **Separador 2:** Hoja de Cobro / Valuación Formato PDVSA (Código de partida SAP, descripción, cantidad ejecutada, monto).
- **Separador 3:** Cuadro de Amortización de Anticipo (Descuento automático del $30\%$ al $40\%$ del monto bruto).
- **Separador 4:** Deducción por Retención de Fiel Cumplimiento ($5\%$ al $10\%$ depositado en custodia).
- **Separador 5:** Retención por Pasivos Laborales ($5\%$).
- **Separador 6:** Soportes de Cómputos Métricos, Croquis explicativos y Memoria Fotográfica (Antes, Durante y Después).

### 4.3. Carga en Sistema SAP (Generación de la HES)
1. Presentación del expediente físico a la ITO.
2. La ITO aprueba el Punto de Cuenta Interno.
3. El Administrador del Contrato de PDVSA genera la **Hoja de Entrada de Servicios (HES - `100xxxxxxx`)** en SAP.
4. El Gerente de Proyecto de PDVSA libera la HES electrónicamente, ingresando la factura a la Tesorería Corporativa.

---

## 🏁 5. Fase 4: Cierre Total y Paquete Final (Las 3 Carpetas ARCHE)

### 5.1. Cierre Físico y Técnico
- **Último Asiento del Libro de Obra:** Redacción del asiento de *"Culminación Física de los Trabajos"*, firmado y sellado por la ITO.
- **Acta de Recepción Provisional:** Firmada por Contratista, ITO, Superintendente de Construcción y Gerencia de Proyecto de PDVSA. Activa el período de garantía por vicios ocultos (90 a 180 días).

### 5.2. Estructura de las 3 Carpetas de Cierre ARCHE (Foliadas e Impresas)

```text
 📂 CARPETA 1: CIERRE ADMINISTRATIVO, FINANCIERO Y PROCURA
 ├── Separador 1: Factura Comercial de Valuación de Cierre (Saldo Remanente).
 ├── Separador 2: Valuación General de Cierre Aprobada (Cuadro de Cuadre a Cero).
 ├── Separador 3: Hoja de Entrada de Servicios (HES) Definitiva emitido por SAP.
 ├── Separador 4: Cuadro de Estado de Cuenta Contractual (Monto - Anticipos - Valuaciones = 0).
 ├── Separador 5: Carta de Solicitud de Devolución del Retenido por Fiel Cumplimiento.
 └── Separador 6: Acta de Transferencia de Propiedad de Equipos Adquiridos.

 📂 CARPETA 2: CIERRE TÉCNICO Y CALIDAD (EL DOSSIER AS-BUILT)
 ├── Separador 1: Copia Certificada del Acta de Recepción Provisional.
 ├── Separador 2: El Libro de Obra Original Completo (Hojas originales desprendidas).
 ├── Separador 3: Planos As-Built Sellados "IGUAL AL CAMPO" por QA/QC e ITO.
 ├── Separador 4: Cómputos Métricos Globales de Respaldo Definitivos.
 ├── Separador 5: Histórico de Protocolos NDT, Cartas Barton y Pruebas Hidrostáticas.
 └── Separador 6: Compendio de Certificados de Calidad MTR de Materiales Permanentes.

 📂 CARPETA 3: CIERRE LABORAL, SOCIAL Y SHA
 ├── Separador 1: Acta de Cierre Laboral expedida por la Inspectoría del Trabajo.
 ├── Separador 2: Finiquitos de Prestaciones Sociales firmados con Huella y Soporte Bancario.
 ├── Separador 3: Solvencias Parafiscales Actualizadas (IVSS, INCES, FAOV, Solvencia Laboral).
 ├── Separador 4: Constancia de Cierre del Compromiso Social (3% al 5% Gerencia Desarrollo Social).
 └── Separador 5: Informe Final SHA (Estadísticas HHT, Cero Accidentes, Manifiesto MINEC).
```

---

## 🏛️ 6. Fase 5: Proceso Interno de Pago en PDVSA

```text
 1. Revisión y Conformación ITO
    (Inspección hoja por hoja de la Carpeta ARCHE y conciliación de céntimos)
               │
               ▼
 2. Aprobación Gerencia de Proyectos PDVSA
    (Firma del Punto de Cuenta de Cierre y liberación de HES en SAP)
               │
               ▼
 3. Auditoría y Finanzas Internas PDVSA
    (Verificación de montos facturados vs. Órdenes HES en sistema SAP)
               │
               ▼
 4. Tesorería Corporativa PDVSA
    (Ejecución de transferencia bancaria directa a cuenta RNC de la Contratista)
```

---

## 📊 7. Mapa de Dependencias entre Formatos e Hitos

| Hito del Proyecto | Formatos Habilitantes Requeridos | Impacto Financiero / Cobro |
|---|---|---|
| **Firma del Contrato** | RNC Vigente + Solvencia Laboral + Fianzas SUDESEG | Habilita la emisión del Pedido SAP (`45xxxxxxxx`). |
| **Arranque de Obra** | Planos APC + Plan SHA (ART/PRE) + Pedido SAP | Generación del **Acta de Inicio de Obra**. |
| **Cobro Valuación Parcial** | Cómputos Métricos + Weld Log + Liberaciones + ART + PTW | Generación de la **HES en SAP** y cobro de factura parcial. |
| **Culminación Física** | 100% Protocolos NDT + Prueba Hidrostática + Libros de Obra | Firma del **Acta de Recepción Provisional**. |
| **Cobro de Cierre y Retenido**| 3 Carpetas ARCHE + Solvencia Laboral Final + Cierre MINEC | **Liberación del Retenido por Fiel Cumplimiento** y saldo final. |

---

## ⚠️ 8. Puntos Críticos de Rechazo o Retraso en Auditoría

1. **Inconsistencia de Céntimos en Valuación vs. HES SAP:** Si la factura difiere en $\pm 0.01\text{ Bs/USD}$ con el registro en SAP, la Hoja de Entrada es rechazada.
2. **Solvencias Parafiscales Vencidas al Momento del Pago:** Si la Solvencia Laboral o IVSS vence mientras el expediente está en Finanzas, se paraliza el desembolso.
3. **Plano As-Built sin Sello Húmedo:** Planos finales entregados en digital sin el sello físico *"AS-BUILT / IGUAL AL CAMPO"* firmado por el Inspector QA/QC e ITO.
4. **Falta de Trazabilidad Colada-MTR:** Juntas soldadas en el Weld Log cuyo Heat Number no posee su certificado MTR correspondiente en la Carpeta 2.
5. **Asientos del Libro de Obra con Inconsistencias Horarias:** Fechas de soldadura o vaciado registradas en el Libro de Obra que no coinciden con las horas amparadas en el Permiso de Trabajo (Anexo A).
