# Especificación Detallada de Pantalla Piloto: Split View PTW (WF-043) - v1.1
**Aplicación**: IC360-NEXUS (`Industrial-360-App-GAIS`)  
**Repositorio**: [wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS](https://github.com/wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS)  
**Ruta de Especificación**: `docs/design/screens/PTW-SPLIT-VIEW-DESIGN-V1.1.md`  
**Estado**: ESPECIFICACIÓN TÉCNICA OFICIAL Y CONSTRUIBLE (v1.1)  
**Norma de Referencia**: `PDVSA IR-S-04` (Sistema de Permisos de Trabajo - Rev. 4, Agosto 2013, Anexo A)  
**Alineación**: Formato Maestro de Entregables Rev. 1, Slate Navy Tokens, Cero Emojis (`lucide-react`)

---

## 1. Wireframe en Texto / ASCII (Wizard de 5 Pasos en Split View 50/50)

La pantalla piloto en modo escritorio (`≥ 1280px`) utiliza un visor dividido de dos paneles (*Split View 50/50*) sincronizado en tiempo real entre el wizard de 5 pasos y el documento A4 WYSIWYG.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER SUPERIOR FIJO (60px)                                                                                            │
│ [Icon: ShieldCheck] IC360-NEXUS | Org: PROINTECA C.A. ▾ | Proyecto: Cardón-Amuay ▾ | [Icon: Search] Buscar Tag/WBS...   │
│ Rol: Emisor (Custodio) | Modo: Dark | [Icon: Bell] (2) | [Icon: User] Ing. Carlos Mendoza (PDVSA)                        │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ CABECERA CONTEXTUAL DE PERMISO (48px)                                                                                  │
│ Breadcrumbs: Proyectos > Cardón-Amuay > SIHO-A > WF-043 PTW > PTW-2026-00412                                            │
│ Tag WBS: WBS-MEC-04 | Renglón: Trabajo en Caliente | Quad-Status: [Icon: ShieldCheck] CONFORME (0% LEL | ART Ok)          │
│ Botón de Acción Principal: [Icon: ShieldCheck] [ Ver Tríada (PTS | ART | Calibración | PTW) ]                           │
├───────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┤
│ PANEL IZQUIERDO: WIZARD PTW DE 5 PASOS (50% Ancho)        │ PANEL DERECHO: VISOR CARTA WYSIWYG ANEXO A (50% Ancho)     │
│                                                           │                                                            │
│ ┌───────────────────────────────────────────────────────┐ │ ┌────────────────────────────────────────────────────────┐ │
│ │ PASOS DEL WIZARD (REMAPEO 5 PASOS CANÓNICOS)          │ │ │ BARRA DE HERRAMIENTAS VISOR (36px)                     │ │
│ │ [1.Elegibilidad] [2.Core] [3.Anexos] [4.Prórroga] [5.Cierre] │ [Icon: ZoomIn] [100%] [Icon: ZoomOut] | [Icon: Printer] │ │
│ └───────────────────────────────────────────────────────┘ │ │ Logos: [✓ Operador] [  Contratista] | [Icon: Download] │ │
│                                                           │ └────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────┐ │                                                            │
│ │ PASO 2 EN CAPTURA: PTW CORE & ANEXO A (RENNGLÓN 1-16) │ │ ┌────────────────────────────────────────────────────────┐ │
│ │                                                       │ │ │ CONTENEDOR VIRTUAL CARTA (216x279mm VENEZUELA)          │ │
│ │ Orden SAP: [ 4001291              ] [Icon: Check]     │ │ │                                                          │ │
│ │ Instalación/Área: [ Planta Compresora San Joaquín   ] │ │ │  [LOGO OPERADOR]       ANEXO A - PERMISO PTW             │ │
│ │                                                       │ │ │  ──────────────────────────────────────────────────────  │ │
│ │ Prueba de Gases Multigas (Paso 2):                    │ │ │  1. EN CALIENTE   2. SAP: 4001291   3. N°: PTW-2026-00412  │ │
│ │ • Lectura LEL (%): [ 0.0 ] (Conforme: <= 0.0% LEL)    │ │ │  ──────────────────────────────────────────────────────  │ │
│ │ • Lectura O2 (%):  [ 20.9 ] (Rango: 19.5% - 23.5%)   │ │ │  ... (Campos sincronizados en tiempo real) ...           │ │
│ │ • Lectura H2S:     [ 0.0 ] PPM                        │ │ │  ──────────────────────────────────────────────────────  │ │
│ │                                                       │ │ │  12. PRUEBA DE GASES: 0.0% LEL | O2: 20.9% | H2S: 0 PPM  │ │
│ │ Serial Detector Multigas *:                            │ │ │  Serial Multigas: GX-2012-SOL-9841                       │ │
│ │ [ GX-2012-SOL-9841                  ] [Icon: Check]   │ │ │  ──────────────────────────────────────────────────────  │ │
│ │ (Campo Obligatorio Normativo)                         │ │ │  17. EMISOR           18. RECEPTOR       19. EJECUTOR    │ │
│ │                                                       │ │ │  [Pendiente]          [Pendiente]        [Pendiente]     │ │
│ │ Hora de Medición (Formato 24h): [ 07:30 ]             │ │ │  ──────────────────────────────────────────────────────  │ │
│ └───────────────────────────────────────────────────────┘ │ │  IR-S-04 Rev.4 Pág.33   (BORRADOR NO VÁLIDO - SIN QR)    │ │
│                                                           │ └────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────┐ │                                                            │
│ │ NAVEGACIÓN DEL WIZARD                                 │ │                                                            │
│ │ [Icon: ArrowLeft] Anterior  |  [Siguiente: Anexos]    │ │                                                            │
│ └───────────────────────────────────────────────────────┘ │                                                            │
└───────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────┘
```

---

### A. Remapeo de los 5 Pasos del Wizard Real (`definition.ts`)

Conforme a la arquitectura del archivo `src/workflows/wf-043-aprobacion-ptw/definition.ts`, el wizard de captura se organiza en **5 pasos strictly**:

1. **Paso 1: Elegibilidad & Prerrequisitos**: Verificación de existencia y estado del Procedimiento de Trabajo Seguro (`PDVSA SI-S-20` en estado `APPROVED`) y del Análisis de Riesgos del Trabajo (`PDVSA IR-S-17` divulgado con firmas de cuadrilla).
2. **Paso 2: PTW Core & Anexo A**: Llenado de los Renglones 1 al 16 del Anexo A de `PDVSA IR-S-04` (Orden SAP, instalación, tipo de trabajo en frío/caliente, ejecutor, serial multigas obligatorio y lecturas de gas multigas a las 07:30).
3. **Paso 3: Anexos Especiales**: Matriz de 9 Certificados Especiales Requeridos (Espacios Confinados, Izamiento, LOTO, Excavación, Altura, Hot-Tapping, Radiaciones, Subacuáticos, Áreas Compartidas).
4. **Paso 4: Ejecución & Prórroga**: Monitoreo continuo de gases en sitio, solicitud de prórroga de turno (máximo 2 horas en formato 24h, requiere firma del Emisor) e insumo de notas de bitácora.
5. **Paso 5: Cierre & Firmas**: Captura RBAC de firmas tripartitas (Sección 17 Emisor, Sección 18 Receptor, Sección 19 Ejecutor) y acciones de Cancelación (Sección 21) o Cierre Final (Sección 22).

---

## 2. Mapeo de Estados de Pantalla al Ciclo de Vida del Formato Maestro Rev. 1

Se elimina el uso de estados de pantalla inventados y se establece un mapeo directo contra el enumerado canónico `lifecycleStatus`:

| `lifecycleStatus` (Formato Maestro) | Estado de Interfaz en Pantalla | Comportamiento e Inmutabilidad del Visor CARTA | Presencia y Comportamiento del Código QR |
|---|---|---|---|
| **`DRAFT`** | Borrador Inicial (captura libre). | Formulario 100% editable. Muestra marca de agua en diagonal: **`BORRADOR NO VALIDO`**. | **SIN CÓDIGO QR Y SIN URL**. (Protección de auditoría: previene escaneos de borradores no emitidos). |
| **`FOR_REVIEW`** | En Revisión Compartida. | Inputs en modo revisión. Permite observaciones de Emisor y Receptor. | **QR TEMPORAL DE REVISIÓN**: Apunta a la vista previa de auditoría preliminar en servidor. |
| **`APPROVED_VIGENTE`** | Aprobado, Listo para Emisión. | Habilita bloques de firma RBAC. Desaparece la marca de agua de borrador. | **QR DEFINITIVO**: Se genera con la URL oficial de verificación de servidor. |
| **`ISSUED_ACTIVE`** | Emitido Activo en Campo. | Formulario 100% bloqueado a modo lectura. Muestra firmas tripartitas estampadas. | **QR TOTALMENTE ACTIVO**: Enlaza a `https://ic360-nexus.pdvsa.com/verify?docId=:docId&hash=:visualVersionHash`. |
| **`CLOSED_ARCHIVED`** | Cerrado o Cancelado. | Inmutable. Muestra sello de Cierre (Secc. 22) o Cancelación (Secc. 21). | **QR HISTÓRICO DE ARCHIVO**: Muestra el entregable firmado e indexado en el Capítulo 02 del Databook. |

---

## 3. Cero Emojis en la UI (Estandarización Iconográfica y CSS Tokens)

Queda **completamente eliminado el uso de Emojis** (`🟢`, `🟡`, `🔴`, `⚪`) en semáforos, alertas o mensajes de error.

### A. Especificación del Semáforo Quad-Status (Sin Emojis)
* **Contenedor**: Badge de `24px` de altura, `padding: 2px 8px`, `border-radius: 4px`.
* **Mapeo de Iconos Lucide y Tokens CSS**:

```tsx
// Ejemplo de Renderizado de Semáforo Quad-Status en React
function QuadStatusBadge({ status }: { status: 'SUCCESS' | 'WARNING' | 'DANGER' | 'NEUTRAL' }) {
  switch (status) {
    case 'SUCCESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[var(--status-success-bg)] border border-[var(--status-success-border)] text-[var(--status-success-text)]">
          <ShieldCheck className="w-4 h-4 stroke-[1.5]" />
          CONFORME (0.0% LEL | ART Válido | Gas Ok)
        </span>
      );
    case 'WARNING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] text-[var(--status-warning-text)]">
          <AlertTriangle className="w-4 h-4 stroke-[1.5]" />
          PRÓRROGA ACTIVA (< 2h)
        </span>
      );
    case 'DANGER':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] text-[var(--status-danger-text)]">
          <OctagonX className="w-4 h-4 stroke-[1.5]" />
          BLOQUEADO (Gas > 0.0% LEL o Serial Faltante)
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-[var(--status-neutral-bg)] border border-[var(--status-neutral-border)] text-[var(--status-neutral-text)]">
          <MinusCircle className="w-4 h-4 stroke-[1.5]" />
          BORRADOR
        </span>
      );
  }
}
```

### B. Componentes de Alerta y Mensajes de Error (Sin Emojis)
Las alertas de validación utilizan el componente `Alert` de `shadcn/ui` con bordes e iconos semánticos de Lucide React:

```tsx
// Alerta de Hard Gate Bloqueante por Serial Multigas
<Alert variant="destructive" className="bg-[#320A0A] border-[#7A0C00] text-[#F87171]">
  <OctagonX className="w-4 h-4 stroke-[1.5] text-[#F87171]" />
  <AlertTitle className="font-semibold text-xs">Error Bloqueante Normativo</AlertTitle>
  <AlertDescription className="text-xs">
    Debe ingresar el serial del detector multigas para certificar la validez de la prueba de gases en el Paso 2.
  </AlertDescription>
</Alert>
```

---

## 4. Gestión del Código QR y Reglas de Auditoría

1. **Fase `DRAFT`**:
   * **PROHIBIDO INCLUIR CÓDIGO QR**.
   * El pie de página del Visor A4 únicamente muestra la referencia normativa y la marca de agua **`BORRADOR NO VALIDO`**.
2. **Fase `FOR_REVIEW`**:
   * Se genera un **QR Temporal de Revisión** que permite a las autoridades de área inspeccionar el borrador en servidor.
3. **Fases `APPROVED_VIGENTE` e `ISSUED_ACTIVE`**:
   * Se estampa el **QR Definitivo Inmutable** en la esquina inferior derecha apuntando a:  
     `https://ic360-nexus.pdvsa.com/verify?docId=:docId&hash=:visualVersionHash`

---

## 5. Cita Normativa de Prórrogas (Nota `PENDING-NORM-CITE`)

> **NOTA PENDING-NORM-CITE**: La cita de la sección de prórrogas de permisos de trabajo se registra provisionalmente como **`PDVSA IR-S-04 (sección de prórrogas — cita en verificación por Antigravity)`**. Se actualizará con el número de sección exacto una vez que Antigravity verifique el articulado contra el manual impreso.

* **Regla de Duración Máxima**: Estrictamente **2 horas continuas** (formato 24h: `17:00` a `19:00`).
* **UI de Prórroga (Paso 4)**: Si el usuario intenta seleccionar un tiempo $> 2\text{ horas}$, la aplicación despliega la alerta semántica de advertencia:  
  > *"Advertencia: La prórroga continua está limitada a un máximo de 2 horas. Para trabajos de mayor duración se requiere la emisión de un nuevo Permiso de Trabajo."*

---

## 6. Acceso a la Tríada de Seguridad en la Cabecera (`[ Ver Tríada ]`)

En la cabecera contextual de la pantalla se incluye el botón de acción rápida `[ Ver Tríada ]` que abre un contenedor modal de 4 pestañas para inspeccionar la salud técnica de todo el frente de trabajo:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ MODAL UNIFICADO: TRÍADA DE SEGURIDAD Y CALIDAD                                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PESTAÑAS: [1. PTS (SI-S-20)]  [2. ART (IR-S-17)]  [3. Calibración]  [4. PTW (IR-S-04)]  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PESTAÑA ACTIVA: 2. ART (ANALISIS DE RIESGOS DEL TRABAJO - PDVSA IR-S-17)               │
│ • N° Documento: ART-2026-0891 | Estatus: [ APPROVED_VIGENTE ]                          │
│ • Verificación de Divulgación: 6/6 Trabajadores de Cuadrilla Firmados (Sección C)     │
│ • Preguntas de Cambio en Campo (25.A-E): Todos en 'NO' (Sin desviaciones de riesgo)    │
│                                                                                        │
│ [Icon: ExternalLink] Abrir Documento ART Completo | [Icon: CheckCircle2] ART Conforme  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Control de Acceso Basado en Roles (RBAC) en Firmas

Cada panel de captura de firma en el Paso 5 (*Cierre & Firmas*) valida en tiempo real las credenciales del usuario logueado (`JWT custom claim role`):

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PANEL DE CAPTURA DE FIRMA CON CONTROL RBAC (SECCIÓN 17 - EMISOR)                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Título: 17. EMISOR (CUSTODIO OPERATIVO DE LA INSTALACIÓN)                              │
│ Rol Requerido: ROLE_EMISOR_CUSTODIO                                                    │
│                                                                                        │
│ CASO A: Usuario con Rol de Emisor Logueado:                                           │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [PANEL TÁCTIL DE FIRMA ABIERTO] (Dibujar trazo / stylus)                           │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│ [Confirmar Firma de Emisor]                                                            │
│                                                                                        │
│ CASO B: Usuario Logueado con Rol Diferente (ej. RECEPTOR):                            │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ [Icon: Lock] PANEL DE FIRMA BLOQUEADO                                              │ │
│ │ "Esta firma corresponde al Emisor (Custodio). Tu rol actual (Receptor) no posee   │ │
│ │  autoridad de firma en este renglón."                                              │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Captura de Coordenadas GPS *Best-Effort*

* **Captura no Bloqueante**: Al presionar `[ Confirmar Firma ]`, la aplicación intenta obtener la posición geográfica del dispositivo vía `navigator.geolocation`.
* **Manejo de Excepciones**: Si el dispositivo carece de chip GPS, la señal es débil o el usuario deniega el permiso del navegador, **la firma NO se bloquea**.
* **Estampa de Firma Visual**:
  * *Con GPS disponible*: `✓ Firmado Digitalmente (TS-RFC3161: 2026-08-12T07:35:10Z | GPS: 10.2104 N, -64.6301 W | Hash: 48af9f76...)`
  * *Sin GPS*: `✓ Firmado Digitalmente (TS-RFC3161: 2026-08-12T07:35:10Z | GPS: no disponible | Hash: 48af9f76...)`

---

## 9. Formato Carta Venezuela ($216\times 279\text{ mm}$) y Formato de Hora 24h

### A. Especificación del Tamaño de Hoja de Impresión
Se fija explícitamente el tamaño **CARTA ($216\times 279\text{ mm}$)** en las reglas de impresión CSS `@media print` para coincidir con el papel estándar utilizado en las instalaciones venezolanas:

```css
@media print {
  @page {
    size: 216mm 279mm; /* Formato CARTA Estándar Venezuela */
    margin: 8mm 8mm 8mm 8mm;
  }
}
```

### B. Formato Estricto de Hora 24 Horas
Toda la interfaz de usuario, selectores de tiempo, marcas de agua, firmas y registros de prueba de gas utilizan estrictamente el **formato de 24 horas** (sin sufijos AM/PM):
* `07:30` (Hora de medición inicial de gases)
* `17:00` (Hora de vencimiento del turno regular)
* `19:00` (Hora límite con prórroga máxima de 2 horas)
