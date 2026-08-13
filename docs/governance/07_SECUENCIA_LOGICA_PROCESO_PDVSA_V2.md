# 📜 07_SECUENCIA_LOGICA_PROCESO_PDVSA_V2.md — DOCUMENTO MAESTRO DE LA SECUENCIA LÓGICA DE PROYECTOS PDVSA
**Fecha de Emisión:** 13 de Agosto, 2026  
**Versión:** V2 (Versión Fusionada Definitiva y Consolidada)  
**Autor:** Arquitecto Técnico Senior IC360 (Antigravity)  
**Perspectiva:** Empresa Contratista (Flujo Integrado Legal, Operativo, QA/QC, SHA y Financiero)  
**Repositorio Oficial:** `Industrial-360-App-GAIS` (`wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS.git`)

---

## 🏛️ 1. Marco Legal y de Contratación

La ejecución de cualquier proyecto, servicio u obra de infraestructura con Petróleos de Venezuela, S.A. (PDVSA) y sus filiales (PDVSA Petróleo, PDVSA Gas, Bariven, empresas mixtas) está estrictamente regulada por el marco jurídico venezolano. No existe espacio para la improvisación: cada transacción física y digital debe estar respaldada legalmente.

### 1.1. Bases Legales Fundamentales
- **Ley de Contrataciones Públicas de Venezuela (LCP) y su Reglamento:** Rige los procesos de selección de contratistas, adjudicación, contratación, ejecución, modificaciones, valuaciones, sanciones y rescisión.
- **Decreto con Rango, Valor y Fuerza de Ley de Contrataciones Públicas:** Establece los umbrales financieros para las modalidades de selección de contratistas.
- **Normas Técnicas PDVSA (Manuales de Ingeniería, Construcción, Inspección, SHA e Higiene):** Estándares corporativos obligatorios de cumplimiento técnico en campo (Normas IR-S, SI-S, HO-H, L-E, L-T).
- **Ley Orgánica de Prevención, Condiciones y Medio Ambiente de Trabajo (LOPCYMAT) y NT-01-2008:** Marco regulatorio de la seguridad laboral, responsabilidad patronal e INPSASEL.
- **Ley Orgánica del Trabajo, los Trabajadores y las Trabajadoras (LOTTT):** Regula los pasivos laborales, retenciones y liquidación de personal de obra.
- **Ley de Sustancias, Materiales y Desechos Peligrosos & Normativa MINEC:** Regulación ambiental sobre manejo de efluentes y desechos industriales.

### 1.2. Modalidades de Selección de Contratistas en PDVSA
1. **Concurso Abierto:** Llamado público para proyectos de gran envergadura o alta complejidad técnica.
2. **Concurso Cerrado:** Invitación directa a al menos cinco (5) contratistas inscritas y calificadas en el RNC.
3. **Consulta de Precios:** Procedimiento simplificado para obras o servicios de menor cuantía.
4. **Contratación Directa (Adjudicación Directa):** Modalidad excepcional justificada por:
   - **Emergencia Comprobada:** Contingencias operativas, paradas de planta no programadas o riesgos inminentes a la producción petrolera.
   - **Seguridad y Defensa de la Nación / Exclusividad Técnica:** Proveedor único o fabricante original de equipos (OEM).

---

## 🔄 2. Fases del Proceso Completo (Fase 0 a Fase 5)

```text
 ┌────────────────────────────────────────────────────────────────────────────┐
 │               FLUIJO MAESTRO DE UN PROYECTO CON CONTRATISTA PDVSA          │
 ├─────────────────┬───────────────────┬───────────────────┬──────────────────┤
 │ FASE 0:         │ FASE 1:           │ FASE 2:           │ FASE 3:          │
 │ Adjudicación y  │ Ingeniería APC y  │ Ejecución Diaria, │ Valuaciones      │
 │ Firma Contrato  │ Arranque de Obra  │ QA/QC y SHA       │ Parciales HES    │
 ├─────────────────┼───────────────────┼───────────────────┼──────────────────┤
 │ FASE 4:         │ FASE 5:           │ RESULTADO:        │ CICLO PERMANENTE:│
 │ Cierre Total y  │ Ruta Administrativa│ Cobro Bancario y  │ Trazabilidad y   │
 │ 3 Carpetas ARCHE│ Interna y Pago    │ Cierre Contractual│ Resguardo RAG    │
 └─────────────────┴───────────────────┴───────────────────┴──────────────────┘
```

### 🛑 Fase 0: Adjudicación y Contratación (Nacimiento Legal)
- **Disparador Inicial:** Emisión formal de la **Resolución de Adjudicación** por la Comisión de Contrataciones de la Filial o División de PDVSA.
- **Lapso de Consignación:** La contratista cuenta con quince (15) días continuos para entregar los recaudos legales actualizados.
- **Checklist de Recaudos Legales:**
  1. *Registro Nacional de Contratistas (RNC):* Certificado de inscripción en estatus **Vigente y Calificado** (Financiero y Técnico).
  2. *Solvencia Laboral MINPPTRASS:* Emitida por el Ministerio del Poder Popular para el Proceso Social de Trabajo.
  3. *Solvencias Parafiscales:* IVSS (Seguro Social), INCES (Capacitación), BANAVIH (FAOV).
  4. *Registro de Información Fiscal (RIF):* Copia legible y vigente de la empresa y directivos.
  5. *Fianzas de Contrato (Emitidas por aseguradoras registradas en SUDESEG):*
     - Fianza de Anticipo: $100\%$ del monto otorgado.
     - Fianza de Fiel Cumplimiento: $10\%$ a $20\%$ del monto total contractual.
     - Fianza Laboral: $5\%$ a $10\%$ de la estimación de mano de obra.
- **Firma del Contrato:** Suscripción entre el Apoderado Legal de la Contratista y el Gerente de División / Director autorizado de PDVSA.
- **Generación y Liberación del Pedido SAP (`Purchasing Order - PO` `45xxxxxxxx`):**
  - Contratación y Finanzas de PDVSA cargan la estructura contractual en SAP.
  - **HITO CRÍTICO BLOQUEANTE:** *Sin la existencia y liberación del Pedido SAP `45xxxxxxxx`, la Inspección Técnica de Obra (ITO) no puede registrar Hoja de Entrada de Servicios (HES), congelando toda posibilidad de cobro.*

---

### 🚀 Fase 1: Ingeniería de Detalle y Arranque de Obra
- **Ingeniería Aprobada para Construcción (Planos APC):**
  - Levantamiento topográfico UTM, ensayos de suelo SPT (ASTM D-1586), isométricos y diagramas P&ID.
  - Los planos y memorias técnicas deben llevar el sello húmedo original **"APROBADO PARA CONSTRUCCIÓN" (APC)** firmado por la Gerencia de Ingeniería de PDVSA / ITO.
- **Planificación de Proyectos y Línea Base:**
  - *Cronograma Gantt:* En MS Project o Primavera P6 estructurado en EDT/WBS.
  - *Curva S:* Curva de avance físico planificado vs. avance financiero para medición del valor ganado (SPI/CPI).
  - *Histograma de Recursos:* Planificación de mano de obra calificada y maquinaria.
- **Plan SHA (Seguridad, Higiene y Ambiente — PDVSA SI-S-04 / SI-S-06):**
  - *Matriz ARA / ART:* Análisis de Riesgos por Actividad (PDVSA HO-H-02).
  - *Plan de Respuesta a Emergencias (PRE):* Rutas de evacuación y clínicas de convenio.
  - *Matriz de EPP:* Dotación certificada de bragas ignífugas (NFPA 2112) y calzado dieléctrico.
- **Acta de Inicio y Libro de Obra:**
  - *Acta de Inicio de Obra:* Firmada en sitio por Gerencia PDVSA, ITO e Ingeniero Residente. Marca el Día 1 del plazo.
  - *Apertura del Libro de Obra:* Libro empastado de 3 copias foliadas. Asiento N° 1 firmado por Residente e ITO.

---

### 🏗️ Fase 2: Ejecución y Recopilación Diaria (El Dossier QA/QC)
- **Control de Campo y Formatos por Disciplina:**
  - *Disciplina Civil:* Liberación de Excavaciones, Slump Test en Concreto (ASTM C-143), Ensayos de Compresión de Testigos Cilíndricos (ASTM C-39 a 7, 14 y 28 días), MTRs de cabillas/cemento.
  - *Disciplina Mecánica / Piping:*
    - **Weld Log (Libro de Soldadura):** Junta, diámetro, espesor, soldador (WPQ), WPS aplicado y colada de consumible.
    - **Reportes NDT:** Radiografía Industrial (RT), Ultrasonido (UT), Tintas Penetrantes (PT), Partículas Magnéticas (MT).
    - **Protocolo de Prueba Hidrostática:** Carta de registro de presión Barton (4 a 24 horas).
  - *Disciplina Eléctrica e Instrumentación:* Megado de cables, calibración metrológica de transmisores/manómetros con patrones trazables, Loop Tests.
  - *Procura de Equipos:* Mill Test Certificates (MTR) del fabricante, Acta de Recepción en Almacén PDVSA y Acta de Transferencia de Propiedad.
- **Gestión del Libro de Obra:**
  - Asiento diario redactado en tinta negra por el Residente sin tachaduras ni enmiendas.
  - Revisado y firmado diariamente por la ITO de PDVSA con observaciones o aprobaciones.
- **Compilación Diaria del Dossier de Calidad Preliminar:** Indexación inmediata del Data Book por subsistema para evitar cuellos de botella en el cierre.

---

### 💵 Fase 3: Valuaciones Parciales (Cobro Intermedio)
- **Medición y Conciliación de Cómputos Métricos:**
  - Reconciliación quincenal/mensual en sitio entre Residente e ITO.
  - Firma de las Hojas de Cómputos Métricos de Campo y del **Acta de Conciliación de Cómputos**.
- **Armado del Expediente de Valuación ("Paquete de Valuación"):**
  1. *Factura Comercial SENIAT:* A nombre de la filial de PDVSA, indicando Pedido SAP (`45xxxxxxxx`) y Contrato.
  2. *Hoja de Cobro / Resumen Formato PDVSA:* Desglose bruto, amortización de anticipo y retenciones contractuales.
  3. *Relación de Cómputos Métricos Conciliados.*
  4. *Copia de Folios del Libro de Obra del período.*
  5. *Memoria Fotográfica:* Evidencia clara (Antes, Durante y Después).
  6. *Certificaciones QA/QC & SHA:* Ensayos NDT, reportes de laboratorio y reporte de Horas-Hombre Trabajadas (HHT) sin accidentes.
- **Gestión SAP (Creación de HES y Cola de Pago):**
  - La ITO aprueba el paquete físico e ingresa a SAP para crear la **Hoja de Entrada de Servicios (HES `100xxxxxxx`)**.
  - El Gerente de Proyecto de PDVSA realiza la **Aceptación de la HES en SAP**, liberando el asiento contable de gasto.
  - El expediente físico con la HES impresa se radica en Finanzas.

---

### 🏁 Fase 4: Cierre Total y Paquete Final (Las 3 Carpetas ARCHE)
- **Cierre Técnico:**
  - Asiento final en Libro de Obra (*"Culminación Física de los Trabajos"*).
  - Firma del **Acta de Recepción Provisional** (inicia el período de garantía de vicios ocultos de 90 a 180 días).
- **Estructura de las 3 Carpetas de Cierre ARCHE (Foliadas e Impresas):**
  - **Carpeta 1: Cierre Administrativo y Financiero:** Factura final, Valuación de Cierre (cuadre a cero), HES definitiva, Estado de cuenta contractual, Solicitud de devolución de retenidos y Transferencia de propiedad.
  - **Carpeta 2: Cierre Técnico y Calidad (Dossier As-Built):** Acta de Recepción Provisional, Libro de Obra original completo, Planos sellados original *"AS-BUILT / IGUAL AL CAMPO"*, Cómputos globales, Histórico NDT, Cartas Barton y MTRs.
  - **Carpeta 3: Cierre Laboral, Social y SHA:** Acta de Cierre Laboral (Inspectoría del Trabajo), Finiquitos de prestaciones firmados con huella, Solvencias parafiscales finales, Cierre del Compromiso Social ($3\%$ a $5\%$) e Informe SHA final con remediación MINEC.

---

### 🏛️ Fase 5: Proceso Interno de Pago en PDVSA (La Ruta de la Factura)

```text
 1. Inspección Técnica de Obra (ITO)
    ├── Verificación física y cuantitativa de la valuación.
    └── Firma de conformidad y carga de la HES en SAP.
               │
               ▼
 2. Gerencia de Proyectos / Operaciones PDVSA
    ├── Aprobación del Punto de Cuenta Interno.
    └── Liberación / Aceptación electrónica de la HES en SAP.
               │
               ▼
 3. Auditoría y Control de Gestión
    ├── Verificación de exactitud aritmética de los cómputos.
    └── Auditoría de soportes del Dossier QA/QC (evita pagos sin sustento).
               │
               ▼
 4. Gerencia de Finanzas e Impuestos
    ├── Aplicación de retenciones SENIAT (IVA, ISLR, Timbres Fiscales, Aporte Social).
    └── Emisión del comprobante digital de retención fiscal.
               │
               ▼
 5. Tesorería Corporativa PDVSA
    ├── Programación en el flujo de caja central.
    └── Transferencia bancaria directa a la cuenta amparada en el RNC de la Contratista.
```

---

## ⚙️ 3. Parámetros Configurables por Contrato / Filial

Para garantizar la longevidad de 30 años de IC360-NEXUS, **ningún porcentaje ni plazo está hardcodeado en la lógica**. El sistema utiliza un **Motor de Parámetros Configurables por Contrato**:

| Parámetro Contractual | Rango Típico / Configurable | Valor Default IC360 | Explicación Regla de Negocio |
|---|---|---|---|
| **Fianza de Fiel Cumplimiento** | $10\% \text{ a } 20\%$ | $10\%$ | Porcentaje deducido o amparado por fianza de aseguradora. |
| **Fianza de Pasivos Laborales** | $5\% \text{ a } 10\%$ | $5\%$ | Custodia para garantías de indemnización laboral. |
| **Porcentaje de Anticipo** | $30\% \text{ a } 50\%$ | $30\%$ | Monto de pago inicial otorgado contra fianza $100\%$ de anticipo. |
| **Amortización de Anticipo** | $30\% \text{ a } 50\%$ | Proporcional a Valuación | Descuento automático por cada valuación hasta saldar a cero. |
| **Garantía de Vicios Ocultos** | $90 \text{ a } 360 \text{ días}$ | $180\text{ días}$ | Lapso contado a partir del Acta de Recepción Provisional. |
| **Retención de Fiel Cumplimiento**| $5\% \text{ a } 15\%$ | $10\%$ | Retención aplicada en la Hoja de Cobro si no hay fianza. |
| **Alerta Previa Vencimiento RNC**| $15 \text{ a } 60 \text{ días}$ | $30\text{ días}$ | Notificación preventiva antes de bloqueo automático en SAP. |
| **Límite Notificación Accidentes**| $\le 60 \text{ minutos}$ | $60\text{ min}$ (Estricto) | Lapso legal para declarar incidente ante INPSASEL/PDVSA. |

---

## 🗺️ 4. Mapa de Dependencias (Formatos $\rightarrow$ Hitos $\rightarrow$ Cobro)

```text
 ┌─────────────────────────────┐
 │ 1. Resolución Adjudicación  │ ──► Genera ──► [Consignación RNC + Solvencias + Fianzas]
 └──────────────┬──────────────┘
                │
                ▼
 ┌─────────────────────────────┐
 │ 2. Firma del Contrato       │ ──► Dispara ──► [Carga y Liberación del Pedido SAP 45xxxx]
 └──────────────┬──────────────┘
                │
                ▼
 ┌─────────────────────────────┐
 │ 3. Planos APC + Plan SHA    │ ──► Habilita ──► [Acta de Inicio + Apertura Libro de Obra]
 └──────────────┬──────────────┘
                │
                ▼
 ┌─────────────────────────────┐
 │ 4. Ejecución Diaria Campo   │ ──► Genera ──► [Asientos Libro Obra + Weld Log + NDT + Slump]
 └──────────────┬──────────────┘
                │
                ▼
 ┌─────────────────────────────┐
 │ 5. Conciliación Cómputos    │ ──► Permite ──► [Armado Expediente Valuación + Factura SAP]
 └──────────────┬──────────────┘
                │
                ▼
 ┌─────────────────────────────┐
 │ 6. Carga de HES (100xxxxxxx)│ ──► Habilita ──► [Aceptación SAP + Auditoría + Pago Tesorería]
 └──────────────┬──────────────┘
                │
                ▼
 ┌─────────────────────────────┐
 │ 7. Culminación 100% + Dossier│ ──► Dispara ──► [Acta Recepción Provisional + 3 Carpetas ARCHE]
 └──────────────┬──────────────┘
                │
                ▼
 ┌─────────────────────────────┐
 │ 8. Cierre Laboral + MINEC   │ ──► Libera ──► [Valuación de Cierre + Retenido Fiel Cumplimiento]
 └─────────────────────────────┘
```

---

## 🚨 5. Puntos Críticos de Rechazo o Retraso (Lista Maestra Ordenada por Impacto)

### 🔴 Categoría 1: Bloqueantes Absolutos (Detención Total del Proceso)
1. **Incongruencia de Céntimos entre Factura y HES SAP:** Cualquier diferencia de $\pm 0.01\text{ Bs/USD}$ entre el monto físico de la factura y el registro HES en SAP provoca el rechazo automático del sistema contable.
2. **Inexistencia o Falta de Liberación del Pedido SAP (`45xxxxxxxx`):** Trabajar por "orden verbal" sin la orden SAP liberada impide cargar HES. Resultado: Meses de trabajo no valuables.
3. **Solvencias Laborales o RNC Vencidos en Sistema SAP:** Si la Solvencia Laboral, el RNC o la solvencia IVSS vencen un día antes del desembolso, SAP bloquea automáticamente el pago al proveedor.
4. **Trazabilidad MTR/Colada Inexistente:** Uniones soldadas en el Weld Log cuyos números de colada (Heat Numbers) no tengan certificado Mill Test Report (MTR) en la Carpeta 2 invalidan el subsistema completo.

### 🟡 Categoría 2: Retrasos Graves (Devolución de Expediente — 15 a 30 días de retraso)
5. **Descalce de Fechas/Horas entre Libro de Obra y Permisos de Trabajo (PTW / Anexo A):** Si un ensayo crítico o soldadura registrada en el formato QA/QC tiene fecha/hora que no coincide exactamente con el folio del Libro de Obra o la validez del PTW, Auditoría rechaza la valuación.
6. **Planos As-Built sin Sello Húmedo Original:** Planos de cierre entregados en formato digital o copias simples sin el sello húmedo original *"AS-BUILT / IGUAL AL CAMPO"* firmado por QA/QC e ITO.
7. **Soldadores o Procedimientos (WPS/WPQ) No Calificados:** Ejecutar soldadura sin estampa de soldador vigente o sin WPS aprobado anula las uniones y exige ensayos NDT destructivos/adicionales.

### 🔵 Categoría 3: Retrasos Moderados (Solicitud de Corrección — 5 a 10 días de retraso)
8. **Cómputos Métricos sin Sustento Gráfico o Memoria Fotográfica:** Valuaciones que no incluyen croquis de medición referenciados a planos APC o cuyas fotografías no muestran el "Antes, Durante y Después".
9. **Falta de Manifiesto Ambiental MINEC para Desechos Peligrosos:** Inexistencia del certificado de disposición final de trapos impregnados de hidrocarburo, solventes o químicos.

---

## 🔬 6. Pendientes de Validación (Mesa Técnica IC360)

1. **Plataformas Digitales PDVSA 2026:** Validar si PDVSA está exigiendo la precarga de Dossiers de Calidad en plataformas digitales específicas (ej. SAP Ariba, SIS-PDVSA) previo a la consignación física de las 3 Carpetas ARCHE.
2. **Actualización de Providencias Fiscales SENIAT 2026:** Confirmar los porcentajes de retención tributaria vigentes (ISLR, IVA, Impuestos Municipales) aplicables sobre facturas de servicios y obras petroleras.
3. **Tiempos Promedio Reales de Tránsito de Factura:** Verificar el lapso real entre la Aceptación de la HES en SAP y el abono en cuenta bancaria en la Tesorería Corporativa de PDVSA en el escenario económico actual.
4. **Alerta Automatizada RNC/Solvencias en IC360:** Diseñar la integración o web scraper que alerte con 30 días de anticipación el vencimiento del RNC y solvencias parafiscales de la contratista dentro de la plataforma.
