> **NOTA DE OBSOLESCENCIA**: Este documento ha sido reemplazado oficialmente por [PTW-SPLIT-VIEW-DESIGN-V1.1.md](PTW-SPLIT-VIEW-DESIGN-V1.1.md).

# Especificación Detallada de Pantalla Piloto: Split View PTW (WF-043)
**Aplicación**: IC360-NEXUS (`Industrial-360-App-GAIS`)  
**Repositorio**: [wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS](https://github.com/wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS)  
**Ruta de Especificación**: `docs/design/screens/PTW-SPLIT-VIEW-DESIGN-V1.md`  
**Estado**: OBSOLETO / SUPERSEDED BY V1.1  
**Norma de Referencia**: `PDVSA IR-S-04` (Sistema de Permisos de Trabajo - Rev. 4, Agosto 2013, Anexo A)  
**Alineación**: Formato Maestro de Entregables Rev. 1, Slate Navy Tokens, Cero Emojis (`lucide-react`)

---

## 1. Wireframe en Texto / ASCII (Layout Completo)

La pantalla piloto en modo escritorio (`≥ 1280px`) utiliza un visor dividido de dos paneles (*Split View 50/50*) con sincronización bidireccional entre el formulario de captura y el documento A4 WYSIWYG.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER SUPERIOR FIJO (60px)                                                                                            │
│ [Icon: ShieldCheck] IC360-NEXUS | Org: PROINTECA C.A. ▾ | Proyecto: Cardón-Amuay ▾ | [Icon: Search] Buscar Tag/WBS...   │
│ Rol: Emisor (Custodio) | Modo: Dark | [Icon: Bell] (2) | [Icon: User] Ing. Carlos Mendoza (PDVSA)                        │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ CABECERA CONTEXTUAL DE PERMISO (48px)                                                                                  │
│ Breadcrumbs: Proyectos > Cardón-Amuay > SIHO-A > WF-043 PTW > PTW-2026-00412                                            │
│ Tag WBS: WBS-MEC-04 | Renglón: Trabajo en Caliente | Quad-Status: [Icon: ShieldCheck] 🟢 CONFORME (0% LEL | ART Ok)     │
├───────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┤
│ PANEL IZQUIERDO: WIZARD DE CAPTURA PTW (50% Ancho)        │ PANEL DERECHO: VISOR A4 WYSIWYG ANEXO A (50% Ancho)        │
│                                                           │                                                            │
│ ┌───────────────────────────────────────────────────────┐ │ ┌────────────────────────────────────────────────────────┐ │
│ │ PASOS DEL WIZARD                                      │ │ │ BARRA DE HERRAMIENTAS VISOR A4 (36px)                  │ │
│ │ [1. Datos]  [2. Preparación]  [3. Gases]  [4. Firmas] │ │ │ [Icon: ZoomIn] [100%] [Icon: ZoomOut] | [Icon: Printer] │ │
│ └───────────────────────────────────────────────────────┘ │ │ Logos: [✓ Operador] [  Contratista] | [Icon: Download] │ │
│                                                           │ └────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────┐ │                                                            │
│ │ SECCIÓN ACTIVA: 3. PRUEBA DE GASES Y VERIFICACIONES   │ │ ┌────────────────────────────────────────────────────────┐ │
│ │                                                       │ │ │ CONTENEDOR VIRTUAL A4 (HOJA FORMAL DE DERECHO)          │ │
│ │ [Icon: Gauge] Lectura LEL (%): [ 0.0 ] 🟢 Conforme    │ │ │                                                          │ │
│ │ [Icon: Zap] Lectura O2 (%):    [ 20.9 ] 🟢 Normal     │ │ │  [LOGO OPERADOR]       ANEXO A - PERMISO PTW             │ │
│ │ [Icon: AlertTriangle] H2S:     [ 0.0 ] PPM            │ │ │  ──────────────────────────────────────────────────────  │ │
│ │                                                       │ │ │  1. EN CALIENTE   2. SAP: 4001291   3. N°: PTW-2026-00412  │ │
│ │ Serial Detector Multigas *:                            │ │ │  ──────────────────────────────────────────────────────  │ │
│ │ [ GX-2012-SOL-9841                  ] [Icon: Check]   │ │ │  ... (Campos sincronizados en tiempo real) ...           │ │
│ │ (Campo Obligatorio Normativo)                         │ │ │  ──────────────────────────────────────────────────────  │ │
│ │                                                       │ │ │  12. PRUEBA DE GASES: 0% LEL | O2: 20.9% | H2S: 0 PPM   │ │
│ │ Evaluador de Rango de Gas:                            │ │ │  Serial Multigas: GX-2012-SOL-9841                       │ │
│ │ 🟢 Gas dentro de norma (0.0% LEL <= 0.0% LEL)         │ │ │  ──────────────────────────────────────────────────────  │ │
│ │                                                       │ │ │  17. EMISOR           18. RECEPTOR       19. EJECUTOR    │ │
│ │ [Icon: Clock] Hora de Medición: [ 07:30 AM ]          │ │ │  [Pendiente]          [Pendiente]        [Pendiente]     │ │
│ └───────────────────────────────────────────────────────┘ │ │  ──────────────────────────────────────────────────────  │ │
│                                                           │ │  IR-S-04 Rev.4 Pág.33   [Icon: QrCode] Hash: 48af9f...   │ │
│ ┌───────────────────────────────────────────────────────┐ │ └────────────────────────────────────────────────────────┘ │
│ │ NAVEGACIÓN Y ACCIONES DEL FORMULARIO                  │ │                                                            │
│ │ [Icon: ArrowLeft] Anterior  |  [Someter a Aprobación] │ │                                                            │
│ └───────────────────────────────────────────────────────┘ │                                                            │
└───────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────┘
```

---

### A. Sincronización de Scroll e Ingesta en Tiempo Real
* **Enlace de Campos (*Data-Binding*)**: Cada evento `onChange` en los campos del wizard actualiza instantáneamente los nodos DOM correspondientes dentro de la hoja A4 virtual del panel derecho (sub-30ms).
* **Scroll Sincronizado por Sección**: Al avanzar o cambiar de paso en el wizard izquierdo (ej. de *Paso 1. Datos* a *Paso 3. Prueba de Gases*), el contenedor del visor A4 realiza un desplazamiento suave (*scrollIntoView*) focalizando la Sección 12 (Prueba de Gases) del documento impreso.

---

## 2. Estados Completos de la Pantalla

| Estado de la Pantalla | Elementos Visibles | Elementos Habilitados | Elementos Bloqueados | Comportamiento del Visor A4 |
|---|---|---|---|---|
| **`DRAFT` (Borrador Nuevo)** | Wizard en Paso 1, aviso "Borrador sin guardar", Quad-Status en `⚪ NEUTRAL`. | Campos del Paso 1 (Datos de Instalación, SAP, Descripción). | Pasos 2, 3, 4 y botón de sometimiento. | Muestra marca de agua en diagonal: **`BORRADOR NO VALIDO`**. QR genera URL temporal de borrador. |
| **`FILLING` (Llenando Datos)** | Wizard en Pasos 1, 2 o 3 con medidores de avance. | Inputs de texto, checkboxes de preparación y campos de gas. | Botones de firma digital (requieren validación previa). | Muestra datos tipeados en tiempo real. Hash `visualVersionHash` se calcula dinámicamente. |
| **`HARD_GATE_BLOCKED`** | Alerta roja en cabecera: *“Atención: Hard Gate Bloqueante Activo”*. | Campo con error (ej. `equipoMultigasSerial` o `gasLelPercent`). | Avance al Paso 4 y botón [ Someter a Firma ]. | La sección correspondiente en el A4 se resalta con borde rojo (`#F87171`) indicando el dato faltante. |
| **`READY_TO_SIGN`** | Paso 4 activo con los 3 cuadros de captura de firma. | Paneles táctiles de firma para Emisor, Receptor y Ejecutor. | Campos de datos de pasos anteriores (pasan a modo lectura). | Desaparece marca de agua de borrador. Se habilita cuadro visual de firmas. |
| **`ISSUED` (Firmado / Emitido)** | Banner verde de aprobación: *“Permiso Emitido Oficialmente”*. | Botón [ Imprimir A4 ], [ Descargar PDF ], [ Ver QR de Auditoría ]. | **Todos los campos e inputs del formulario** (100% bloqueado a lectura). | Muestra las 3 firmas estampadas con Hash SHA-256 definitivo, Sello RFC 3161 y QR de auditoría activo. |
| **`EXTENSION_REQUESTED`** | Modal / Sección 20 de Prórroga activa. | Selector de prórroga (Máximo +2h), nueva prueba de gas y firma del Emisor. | Extensión $> 2\text{ horas}$ (bloqueado por norma IR-S-04). | Actualiza el Renglón 20 del Anexo A indicando la nueva hora de vencimiento y firma de prórroga. |
| **`CLOSED / ARCHIVED`** | Sello visual en A4: **`PERMISO CERRADO`** / **`CANCELADO`**. | Botón [ Consultar en Databook (Capítulo 02) ]. | Cualquier edición o firma posterior. | Muestra Sección 21 (Cancelación) o Sección 22 (Cierre) llenada y archivada. |

---

## 3. Semáforo Quad-Status de `WF-043`

El indicador Quad-Status consolida la salud operativa del Permiso de Trabajo Seguro en una píldora compacta ubicada en la cabecera contextual del formulario (`height: 24px`):

```text
┌────────────────────────────────────────────────────────────────────────┐
│ ESTRUCTURA VISUAL DEL SEMÁFORO QUAD-STATUS                             │
├────────────────────────────────────────────────────────────────────────┤
│ [Icon: ShieldCheck] 🟢 PERMISO CONFORME (0% LEL | ART Válido | Gas Ok) │
└────────────────────────────────────────────────────────────────────────┘
```

### A. Lógica de Conexión a los 4 Hard Gates de `WF-043`

1. **Gate 1 — PTS Aprobado (`PDVSA SI-S-20`)**: Verifica que exista un Procedimiento de Trabajo Seguro en estado `APPROVED`.
2. **Gate 2 — ART Divulgado (`PDVSA IR-S-17`)**: Verifica que el Análisis de Riesgos del Trabajo tenga el 100% de las firmas de la cuadrilla obrera en la Sección C.
3. **Gate 3 — Prueba de Gas Válida**: Verifica que la lectura de gas inflamable sea strictly $0.0\%\text{ LEL}$ y el Oxígeno esté entre $19.5\%$ y $23.5\%$.
4. **Gate 4 — Serial Multigas Presente (`equipoMultigasSerial`)**: Verifica que se haya ingresado el serial físico del detector.

### B. Matriz de Estados del Quad-Status

* **🟢 VERDE (`--status-success`)**: Los 4 Hard Gates están validados. El permiso es apto para firma y emisión.
* **🟡 AMARILLO (`--status-warning`)**: Solicitud de prórroga en proceso ($<2\text{h}$) o aviso de cambio de condiciones en campo (Preguntas 25.A-E en 'SI').
* **🔴 ROJO (`--status-danger`)**: Gas inflamable detectado ($>0.0\%\text{ LEL}$), serial multigas ausente o ART no divulgado. **Bloquea la emisión del PTW**.
* **⚪ GRIS (`--status-neutral`)**: Estado borrador inicial (`DRAFT`).

---

## 4. Densidad y Adaptabilidad Responsive

### A. Modo Escritorio (`≥ 1280px`)
* **Layout**: Visor dividido (*Split View 50/50*) permanente.
* **Densidad**: Formulario compacto en grid de 2 columnas, altura de inputs `36px`, padding de celdas `6px 12px`.

### B. Modo Laptop Pequeña (`1024px` a `1279px`)
* **Layout**: Visor dividido ajustable 60% Formulario / 40% Visor A4, o botón de conmutación rápido `[ Ver Visor A4 ]` que despliega un panel lateral (*Contextual Drawer*) de `520px` de ancho.

### C. Modo Tablet / Campo Operativo (`768px` a `1023px`)
* **Layout**: Una sola columna con barra de conmutación superior fija:
  > `[ Icon: FileText ] Formulario de Captura`  |  `[ Icon: Eye ] Vista Previa A4`
* **Objetivos Táctiles Aumentados**: Todos los botones, inputs, radios y celdas tienen una zona de toque mínima de **`44x44px`** para operabilidad con guantes de seguridad.
* **Modo Luz Solar Directa (High-Contrast Field Mode)**:
  * Fondo: Negro Puro (`#000000`).
  * Texto: Blanco Sólido (`#FFFFFF`).
  * Bordes: Grosor de `2px` (`#475868`).
* **Sincronización Offline**: Indicador superior con icono `<WifiOff className="w-4 h-4 text-amber-400" />` notificando las transacciones almacenadas localmente en la cola IndexedDB.

---

## 5. Bloque de Firmas Tripartitas Criptográficas

En el Paso 4 del Wizard (*Firmas y Autorizaciones*), se presentan los tres cuadros de captura táctil correspondientes a las tres autoridades de trabajo exigidas por la norma `PDVSA IR-S-04`:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ BLOQUE DE CAPTURA DE FIRMAS TRIPARTITAS (PASO 4)                                       │
├───────────────────────────────────┬───────────────────────────┬────────────────────────┤
│ 17. EMISOR (CUSTODIO DE PLANTA)   │ 18. RECEPTOR (SUPERVISOR) │ 19. EJECUTOR (CAPATAZ) │
│ Ing. Carlos Mendoza               │ TSU Roberto Silva         │ Señor Pedro Bastardo   │
│ C.I.: V-16.842.105                │ C.I.: V-14.201.993        │ C.I.: V-12.504.118     │
│ Nómina: PDVSA Petróleo, S.A.      │ Empresa: PROINTECA C.A.   │ Empresa: PROINTECA C.A.│
│                                   │                           │                        │
│ ┌───────────────────────────────┐ │ ┌───────────────────────┐ │ ┌────────────────────┐ │
│ │ [PANEL TÁCTIL DE FIRMA]       │ │ │ [PANEL TÁCTIL FIRMA]  │ │ │ [PANEL TÁCTIL]     │ │
│ │                               │ │ │                       │ │ │                    │ │
│ │  (Dibujar trazo / stylus)     │ │ │  (Dibujar trazo)      │ │ │  (Dibujar trazo)   │ │
│ └───────────────────────────────┘ │ └───────────────────────┘ │ └────────────────────┘ │
│ [Icon: RefreshCw] Limpiar Trazo   │ [Icon: RefreshCw] Limpiar │ [Icon: RefreshCw]      │
│                                   │                           │                        │
│ 🟢 Firmado: 2026-08-12 07:35 AM   │ 🟢 Firmado: 07:38 AM      │ 🟢 Firmado: 07:40 AM   │
│ Hash: 48af9f76ae5b3f29...         │ Hash: 98bc101f28...       │ Hash: 104fba2911...    │
└───────────────────────────────────┴───────────────────────────┴────────────────────────┘
```

### A. Proceso de Estampado y Registro
1. **Captura Táctil**: El usuario dibuja su trazo sobre el componente `SignatureCanvas`.
2. **Generación de Hash y Sello RFC 3161**: Al presionar `[ Confirmar Firma ]`, el sistema combina la imagen vectorizada, la cédula de identidad, el rol, las coordenadas GPS y el timestamp oficial del servidor, generando la estampa visual en verde de seguridad:  
   > `✓ Firmado Digitalmente (TS-RFC3161: 2026-08-12T07:35:10Z | Hash: 48af9f76...)`
3. **Reflejo Inmediato en A4**: El Visor A4 estampa simultáneamente la firma y metadatos en la Sección 17, 18 o 19 del Anexo A.

---

## 6. Estilo de Impresión A4 / Hoja Blanca (`Print Stylesheet`)

Cuando el usuario presiona `[ Imprimir A4 ]` o exporta a PDF, las reglas CSS `@media print` transforman la interfaz oscura de la aplicación en un documento de ingeniería en blanco sobre negro impecable:

```css
@media print {
  /* 1. Ocultar elementos de la interfaz de la aplicación */
  header, sidebar, .wizard-navigation, .action-buttons, .toolbar-a4 {
    display: none !important;
  }

  /* 2. Configurar la página impresa a Carta/A4 */
  @page {
    size: letter portrait;
    margin: 8mm 8mm 8mm 8mm;
  }

  /* 3. Transformación de colores para impresión */
  body {
    background-color: #ffffff !important;
    color: #000000 !important;
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 8pt !important;
  }

  .form-container-a4 {
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: #ffffff !important;
  }

  /* 4. Bordes y tablas nítidas para impresión vectorial */
  table, td, th {
    border: 1px solid #000000 !important;
    border-collapse: collapse !important;
    color: #000000 !important;
  }

  .section-header-a4 {
    background-color: #e2e8f0 !important; /* Gris claro de impresión */
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color: #000000 !important;
    font-weight: bold !important;
  }

  /* 5. Asegurar visibilidad del QR, Hash y Firmas */
  .qr-code-img, .digital-signature-stamp {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    visibility: visible !important;
  }
}
```

---

## 7. Microcopy Real en Español Industrial Venezolano

Todos los textos, etiquetas, ayudas y mensajes de error utilizan la terminología técnica oficial empleada en las instalaciones de la industria petrolera y petroquímica nacional:

### A. Títulos y Etiquetas de Sección
* **Cabecera Oficial**: `"ANEXO A - PERMISO DE TRABAJO EN FRÍO O EN CALIENTE"`
* **Norma Marco**: `"PDVSA IR-S-04 (Manual de Ingeniería de Riesgos - Rev. 4)"`
* **Emisor**: `"Emisor (Custodio Operativo de la Instalación / Planta)"`
* **Receptor**: `"Receptor (Supervisor Responsable por la Contratista / Ejecutora)"`
* **Ejecutor**: `"Ejecutor (Capataz / Líder de la Cuadrilla de Trabajo)"`

### B. Textos de Ayuda Contextual (*Helper Texts*)
* **Serial Multigas**: `"Ingrese el número de serial grabado en el chasis del detector multigas utilizado en sitio para la prueba de atmósfera."`
* **Prueba de Gases**: `"El Límite Inferior de Explosividad (% LEL) debe registrar estrictamente 0.0% para trabajos en caliente. La concentración de Oxígeno debe situarse entre 19.5% y 23.5%."`
* **Prórroga**: `"La norma PDVSA IR-S-04 Sección 8.5 limita la prórroga continua de turno a un máximo de 2 horas. Requiere nueva prueba de gas y firma del Emisor."`

### C. Mensajes de Error y Alertas de Hard Gates
* **Error Serial Multigas**:  
  🔴 *"Error Bloqueante: Debe ingresar el serial del detector multigas antes de someter el Permiso de Trabajo."*
* **Error Gas Inflamable**:  
  🔴 *"Peligro de Atmósfera Inflamable: Se ha detectado una concentración de gas superior a 0.0% LEL. Queda prohibida la emisión del permiso en caliente y se ordena la suspensión de actividades en el área."*
* **Error ART Incompleto**:  
  🔴 *"Hard Gate SIHO-A: El Análisis de Riesgos del Trabajo (ART-2026-0891) no posee la totalidad de las firmas de la cuadrilla obrera en la Sección C."*
* **Advertencia Prórroga > 2h**:  
  🟡 *"Exceso de Tiempo de Prórroga: No es posible otorgar prórrogas superiores a 2 horas. Para continuar los trabajos debe aperturar un nuevo Permiso de Trabajo."*

### D. Acciones y Botones
* `[ Someter a Validación SIHO-A ]`
* `[ Firmar Emisor (Custodio) ]`
* `[ Otorgar Prórroga de Turno (+2h) ]`
* `[ Cancelar Permiso por Condición Insegura ]`
* `[ Cerrar y Archivar en Databook (Capítulo 02) ]`
* `[ Imprimir Hoja Oficial A4 ]`
