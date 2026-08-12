# Lenguaje de Diseño y Sistema de Interfaz UI/UX: IC360-NEXUS (v2.0)

**Aplicación**: IC360-NEXUS (`Industrial-360-App-GAIS`)  
**Repositorio**: [wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS](https://github.com/wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS)  
**Ruta de Especificación**: `docs/design/DESIGN-LANGUAGE-IC360-V2.md`  
**Estado**: ESPECIFICACIÓN TÉCNICA OFICIAL (V2 - Cierre de Brechas)  
**Propósito**: Consolidar el lenguaje de diseño industrial de clase mundial para la plataforma IC360-NEXUS, eliminando por completo emojis como iconografía, instaurando reglas estrictas de Motion, un catálogo exhaustivo de 14 componentes UI, adaptabilidad táctil para tabletas de campo y plena alineación con el Formato Maestro Rev. 1.

---

## 1. Sistema de Iconografía Vectorial (`lucide-react`)

Queda **estrictamente prohibido el uso de Emojis** en cualquier parte de la navegación o interfaz de usuario. Todos los dominios, botones, indicadores de estado y acciones se representan mediante la librería **`lucide-react`** (versión instalada en el proyecto).

### A. Mapeo Explicito de Iconos por Dominio Operativo

| Dominio Operativo | Nombre Exacto del Icono `lucide-react` | Renderizado |
|---|---|---|
| **1. Permisos & SIHO-A** | `ShieldCheck` | `<ShieldCheck className="w-5 h-5 text-slate-300" />` |
| **2. QA/QC & Integridad** | `FlaskConical` | `<FlaskConical className="w-5 h-5 text-slate-300" />` |
| **3. Construcción & Campo** | `HardHat` | `<HardHat className="w-5 h-5 text-slate-300" />` |
| **4. Ingeniería & GIS Alignment**| `Compass` | `<Compass className="w-5 h-5 text-slate-300" />` |
| **5. Precomisionado & Databook** | `Package` | `<Package className="w-5 h-5 text-slate-300" />` |
| **6. Project Brain IA** | `BrainCircuit` | `<BrainCircuit className="w-5 h-5 text-slate-300" />` |

---

### B. Reglas de Uso e Iconometría Estándar

1. **Escala de Tamaños Fijos**:
   * **`16px` (`w-4 h-4`)**: Utilizado en tablas densas, badges de estado, botones secundarios compactos e inputs en línea.
   * **`20px` (`w-5 h-5`)**: Utilizado en la navegación principal (sidebar de dominios), cabeceras de sección, botones principales y modales.
   * **`24px` (`w-6 h-6`)**: Utilizado en la barra superior (header), avisos de alerta principal y vistas de estado vacío (*Empty States*).

2. **Ancho de Trazo (*Stroke Width*)**:
   * **Fijo a `1.5px` (`strokeWidth={1.5}`)** en toda la plataforma para mantener coherencia visual sobria y evitar saturación óptica en pantallas de campo.

3. **Política Outline vs. Filled**:
   * **`Outline` (Por Defecto)**: Todos los iconos de navegación, acciones de tabla, filtros e insumos de formulario.
   * **`Filled` / `Dual-Tone`**: Reservado exclusivamente para indicadores activos de estado (ej. punto central de estado con `fill-emerald-500` dentro de `<CheckCircle2 />` o selecciones de menú activo).

---

## 2. Sección Motion y Animaciones en Software Industrial

En un entorno de operaciones industriales de campo, las animaciones excesivas causan distracción, consumen batería en dispositivos móviles y generan latencia percibida en conexiones lentas.

### A. Política de Motion: Lo que SÍ y NO se Anima

* **Lo que NO se anima (Fijo / Cero Latencia)**:
  * Carga y renderizado de filas en tablas de datos densos.
  * Cambios de valor de telemetría de gases multigas ($LEL, O_2, H_2S$).
  * Entrada de caracteres en formularios o wizards de captura.
  * Cambios de pestaña en documentos A4 o wizards de 3 pasos.
* **Lo que SÍ se anima (Transiciones Micro-UI)**:
  * Feedback táctil de clic en botones (`100ms ease-out`).
  * Desplazamiento de paneles laterales (*Contextual Drawers*) desde la derecha (`200ms cubic-bezier(0.16, 1, 0.3, 1)`).
  * Aparición suave de ventanas modales (`150ms ease-out` con opacidad de 0 a 1).

### B. Especificación de Curvas Easing y Duraciones
* **Duración Corta**: `100ms` a `150ms` para estados hover/focus y botones.
* **Duración Media**: `200ms` para cajones laterales y modales.
* **Curva Estándar**: `cubic-bezier(0.16, 1, 0.3, 1)` (Transición desacelerada sin rebote).

### C. Soporte para `prefers-reduced-motion`
Para dispositivos de campo con baterías limitadas o preferencias de accesibilidad, se incluye en el CSS global:

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 3. Catálogo Exhaustivo de Componentes UI (14 Componentes)

### 1. Tabla Densa de Datos (`DenseDataTable`)
* **Inspiración**: [Linear](https://linear.app) / [Stripe Dashboard](https://stripe.com)
* **Comportamiento**: Altura de fila fija de `36px`, columnas de ID y Tags ancladas a la izquierda, ordenamiento por columna, columnas numéricas alineadas a la derecha con `tabular-nums`.
* **Estados**:
  * *Cargando*: Skeleton de 5 filas pulsantes (`#181E24`).
  * *Vacío*: Componente `EmptyState` con mensaje *"No se encontraron registros en este WBS"*.
  * *Error*: Borde superior rojo (`#7A0C00`) con mensaje de reintento de conexión.

### 2. Split View (Lista - Detalle)
* **Inspiración**: [Raycast](https://www.raycast.com) / [Height](https://height.app)
* **Comportamiento**: División horizontal flexible 35% / 65%. Lista rápida a la izquierda con estado semántico y vista previa interactiva a la derecha.

### 3. Drawer Contextual (`ContextualDrawer`)
* **Inspiración**: [Stripe](https://stripe.com) / [Attio](https://attio.com)
* **Comportamiento**: Desplazamiento desde el borde derecho (`380px` de ancho) para adjuntar evidencias, revisar el log de auditoría o consultar la norma sin perder el contexto principal.

### 4. Command Palette (`Cmd+K`)
* **Inspiración**: [Linear](https://linear.app) / [Vercel](https://vercel.com)
* **Comportamiento**: Ventana flotante centrada (`560px` ancho) activable mediante `Cmd+K` o `Ctrl+K`. Búsqueda instantánea multidominio (Proyectos, WBS, Permisos, Instrumentos).

### 5. Wizard Progresivo (`ProgressiveWizard`)
* **Inspiración**: [Wolters Kluwer Enablon](https://www.wolterskluwer.com/en/solutions/enablon/control-of-work-software) / [Site App Pro](https://www.siteapppro.com/features/forms-and-processes)
* **Comportamiento**: Indicador de progreso de 3 pasos (`1. Gabinete ➔ 2. Inspección & Gases ➔ 3. Firmas`). Deshabilita el avance si los Hard Gates normativos están incompletos.

### 6. Timeline de Eventos e Historial (`EventTimeline`)
* **Inspiración**: [Raken App](https://slashdot.org/software/p/Aconex/alternatives) / [Procore](https://marketplace.procore.com/apps/signonsite)
* **Comportamiento**: Cronología vertical con stamps de tiempo inmutables, autor de la acción y hash visual de cada cambio de estado.

### 7. Visor A4 WYSIWYG (`WYSIWYGDocumentViewer`)
* **Inspiración**: [Oracle Aconex](https://www.oracle.com/construction-engineering/aconex/) / Formato Maestro Rev. 1
* **Comportamiento**: Renderizado nativo Carta/A4 con margen de `8mm`, controles de zoom ($50\% - 200\%$), descarga PDF y regla de Co-Branding de logotipos (Operador Izq / Contratista Der).

### 8. Árbol de Dossier de Calidad (`DatabookTree`)
* **Inspiración**: [Hexagon SDx](https://hexagon.com) / [Bentley iTwin](https://www.bentley.com/software/itwin/)
* **Comportamiento**: Estructura de carpetas por Capítulos (01 al 08). Muestra el porcentaje de completación de cada capítulo y permite descargar el paquete compilado en ZIP/PDF.

### 9. Badge de Estado Semántico (`StatusBadge`)
* **Inspiración**: [Stripe](https://stripe.com) / [Vercel](https://vercel.com)
* **Comportamiento**: Píldora compacta de `20px` de altura con fondo de baja opacidad del 10%, borde fino de `1px` y texto en color semántico conforme (🟢 `#34D399`), advertencia (🟡 `#FBBF24`), o peligro (🔴 `#F87171`).

### 10. Bloque de Firma Digital Criptográfica (`DigitalSignatureBlock`)
* **Inspiración**: [IAMTech iPermit](https://www.iamtech.com/america/products/permit-software) / [Procore](https://marketplace.procore.com/apps/signonsite)
* **Comportamiento**: Cuadro táctil de captura de trazo, visualización de C.I., Cargo, Sello de Tiempo RFC 3161 y hash SHA-256 impreso en verde de seguridad (`#16a765`).

### 11. Estados Vacíos (`EmptyState`)
* **Inspiración**: [Vercel](https://vercel.com)
* **Comportamiento**: Contenedor centrado con icono Lucide desaturado (`24px`), mensaje principal claro y botón directo de acción (*"Crear Permiso PTW"*).

### 12. Esqueletos de Carga (`SkeletonLoader`)
* **Inspiración**: [Stripe](https://stripe.com)
* **Comportamiento**: Bloques rectangulares gris oscuro (`#181E24`) con animación sutil de opacidad en pulso (`pulse 1.5s infinite`) durante la carga asíncrona de datos.

### 13. Toast / Alertas de Sistema (`ToastNotification`)
* **Inspiración**: [Vercel](https://vercel.com) / [Procore](https://marketplace.procore.com/apps/signonsite)
* **Comportamiento**: Notificación emergente anclada a la esquina inferior derecha (`320px` ancho) para alertas de prueba de gases, vencimientos de prórroga o confirmación de guardado offline.

### 14. Nube de Rutas (`BreadcrumbNavigation`)
* **Inspiración**: [Palantir Foundry](https://www.palantir.com/platforms/foundry/)
* **Comportamiento**: Muestra la jerarquía exacta: `Proyectos > Cardón-Amuay > SIHO-A > PTW-2026-00412`, permitiendo saltar a cualquier nivel superior con un solo clic.

---

## 4. Breakpoints y Densidad por Contexto Operativo

### A. Modo Escritorio de Oficina / Centro de Monitoreo (`≥ 1280px`)
* **Enfoque**: Máxima densidad de información para toma de decisiones rápida.
* **Densidad**: Filas de tabla compactas (`32px` / `36px`), padding de celdas `6px 12px`, panel lateral de detalles permanente.

### B. Modo Tablet / Campo Operativo (`768px` a `1024px`)
* **Enfoque**: Operatividad bajo luz solar directa, uso con guantes y conectividad intermitente.
* **Ajustes de UI Táctil**:
  * **Objetivos Táctiles Aumentados**: Todos los botones, celdas seleccionables e inputs tienen una zona de toque mínima de **`44x44px`** (cumpliendo norma de accesibilidad móvil Apple/Android).
  * **Modo Alto Contraste para Luz Solar Directa**: Incrementa el fondo a negro puro (`#000000`) con texto en blanco sólido (`#FFFFFF`) y bordes de `2px` (`#475868`).
  * **Indicador de Estado Offline**: Barra de estado superior con el icono `<WifiOff />` y contador de transacciones diferidas pendientes de sincronización en cola IndexedDB.

---

## 5. Paleta de Colores Oficial (Modo Oscuro Industrial)

```css
:root {
  /* Superficies e Fondos Neutros */
  --bg-app: #080A0C;          /* Fondo base (Pitch Dark) */
  --bg-surface-1: #101418;    /* Contenedores primarios, paneles */
  --bg-surface-2: #181E24;    /* Tarjetas, celdas activas, cabeceras de tabla */
  --bg-surface-3: #222A32;    /* Inputs, hovers, estados enfocados */
  
  /* Bordes y Divisores */
  --border-subtle: #1F2832;   /* Divisores internos discretos */
  --border-default: #2E3A46;  /* Bordes principales de tarjetas y tablas */
  --border-active: #475868;   /* Bordes de elementos enfocados o activos */

  /* Tipografía y Texto */
  --text-primary: #F1F5F9;    /* Texto principal (Contraste 15.2:1 sobre bg-app) */
  --text-secondary: #94A3B8;  /* Metadatos, etiquetas (Contraste 7.1:1 sobre bg-app) */
  --text-muted: #64748B;      /* Textos deshabilitados, marcas de agua */

  /* Colores Semánticos de Estado (WCAG AA) */
  --status-success-bg: #062B1E;
  --status-success-border: #0E6245;
  --status-success-text: #34D399;

  --status-warning-bg: #2B1D06;
  --status-warning-border: #633800;
  --status-warning-text: #FBBF24;

  --status-danger-bg: #320A0A;
  --status-danger-border: #7A0C00;
  --status-danger-text: #F87171;

  --status-neutral-bg: #1E293B;
  --status-neutral-border: #334155;
  --status-neutral-text: #94A3B8;
}
```
