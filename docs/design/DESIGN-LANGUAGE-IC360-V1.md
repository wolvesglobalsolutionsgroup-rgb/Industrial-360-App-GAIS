# Lenguaje de Diseño y Sistema de Interfaz UI/UX: IC360-NEXUS (v1.0)

**Aplicación**: IC360-NEXUS (`Industrial-360-App-GAIS`)  
**Repositorio**: [wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS](https://github.com/wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS)  
**Ruta de Especificación**: `docs/design/DESIGN-LANGUAGE-IC360-V1.md`  
**Estado**: ESPECIFICACIÓN TÉCNICA OFICIAL  
**Propósito**: Definir el lenguaje de diseño industrial de clase mundial para la plataforma IC360-NEXUS, eliminando patrones genéricos de IA (gradientes púrpura/azul, glassmorphism sin propósito, tarjetas flotantes sueltas y uso de emojis como iconos) para instaurar una interfaz de alta densidad, precisión técnica y legibilidad en campo.

---

## 1. Benchmark de Diseño Premium de Referencia Mundial

### Grupo A — SaaS Premium de Referencia Mundial (Craft de UI)

#### 1. Linear (https://linear.app)
* **Tipografía**: `Inter` / `Inter Display` (Subpixel anti-aliased, kerning ajustado).
* **Escala de Espaciado**: Sistema Base-4 (`2px`, `4px`, `8px`, `12px`, `16px`, `24px`, `32px`).
* **Sistema de Iconos**: Iconografía vectorial monocromática de trazo fino (1.25px / 1.5px stroke).
* **Densidad de Tablas**: Ultra-densa, altura de fila fija de `32px`, navegación por teclado prioritaria (`J`/`K` navigation, `Cmd+K` palette).
* **Command Bar**: Ventana modal flotante centrada (`560px` ancho) con búsqueda difusa en sub-30ms, atajos de teclado resaltados en badges de alto contraste.
* **Uso del Color**: Paleta oscura neutra monocromática (`#0B0C0E` fondo, `#16181D` superficie, `#22252D` bordes). Uso de color restringido strictly a prioridades de tareas.
* **Micro-interacciones**: Transiciones inmediatas (100ms ease-out), sin animaciones pesadas de rebote o resortes.

#### 2. Stripe Dashboard (https://stripe.com)
* **Tipografía**: `Inter` / `SF Pro Text`
* **Escala de Espaciado**: Grid de 8px estricto.
* **Sistema de Iconos**: Iconos de trazo funcional con caja de `16x16px`.
* **Densidad de Tablas**: Tablas de alta densidad de datos, altura de fila de `36px` a `40px`, columnas numéricas alineadas a la derecha con fuentes monoespaciadas (`font-variant-numeric: tabular-nums`).
* **Command Bar**: Buscador omnibox en header con autocompletado de entidades (Clientes, Transacciones, Facturas).
* **Uso del Color**: Fondo gris pizarra oscuro (`#0A2540` / `#0F172A`), con badges semánticos con opacidad del 10% de fondo y texto sólido.
* **Micro-interacciones**: Paneles laterales deslizantes (*Contextual Drawers*) desde la derecha (`300ms cubic-bezier(0.16, 1, 0.3, 1)`).

#### 3. Vercel (https://vercel.com)
* **Tipografía**: `Geist Sans` & `Geist Mono`
* **Escala de Espaciado**: Grid de 4px/8px (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`).
* **Sistema de Iconos**: `Geist Icons` / `Lucide React` (Trazo de 1.5px).
* **Densidad de Tablas**: Filas compactas de `36px`, identificadores de commit y hashes presentados en `Geist Mono`.
* **Command Bar**: `Cmd+K` flotante con ruteo asíncrono.
* **Uso del Color**: Monocromo negro puro (`#000000` pitch black, `#111111` superficie, `#333333` bordes, `#FFFFFF` texto).
* **Micro-interacciones**: Bordes con brillo sutil (*subtle glow*) al enfocar con el teclado.

#### 4. Attio (https://attio.com)
* **Tipografía**: `Inter`
* **Escala de Espaciado**: Grid de 4px
* **Sistema de Iconos**: Dual-tone stroke icons
* **Densidad de Tablas**: Edición de celdas tipo hoja de cálculo en vivo, altura de fila `34px`.
* **Command Bar**: Buscador flotante multidominio.
* **Uso del Color**: Carbón neutro oscuro (`#121316`, `#1A1D21`).
* **Micro-interacciones**: Arrastre multi-columna y construcción de filtros en línea.

#### 5. Raycast (https://www.raycast.com)
* **Tipografía**: `Inter`
* **Escala de Espaciado**: Compacto de 4px/8px
* **Sistema de Iconos**: Trazo vectorial compacto 16x16.
* **Densidad de Tablas**: Vista dividida lista-detalle, filas de `32px`.
* **Command Bar**: El estándar de la industria en paletas de comandos.
* **Uso del Color**: Fondo neutro profundo (`#0C0D0E`), superficies en `#18191B`.
* **Micro-interacciones**: Resaltado instantáneo de coincidencias de texto.

#### 6. Height (https://height.app)
* **Tipografía**: `Inter`
* **Escala de Espaciado**: 4px/8px
* **Sistema de Iconos**: Lucide / custom stroke icons
* **Densidad de Tablas**: Selección múltiple tipo Excel, altura `34px`.
* **Command Bar**: Atajos en la barra superior.
* **Uso del Color**: Oscuro neutro (`#141517`), divisores discretos (`#26282B`).
* **Micro-interacciones**: Contorno activo de celdas y creación rápida de filas.

#### 7. Plane (https://plane.so)
* **Tipografía**: `Inter`
* **Escala de Espaciado**: 4px/8px
* **Sistema de Iconos**: Lucide React
* **Densidad de Tablas**: Listas de tareas y tableros Kanban, filas de `36px`.
* **Color**: Pizarra oscura (`#0F172A`, `#1E293B`, `#334155`).
* **Micro-interacciones**: Transiciones de estado de breadcrumbs.

---

### Grupo B — Software Industrial y Enterprise de Dominio

#### 1. Palantir Foundry (https://www.palantir.com/platforms/foundry/)
* **Navegación**: Menú lateral multi-nivel (Ontología, Taller, Pipeline Builder, Contorno).
* **Presentación de Datos**: Tablas de objetos de alta densidad, grafos de tuberías de datos, vistas divididas para propiedades.
* **Jerarquía**: `Organización ➔ Espacio de Trabajo ➔ Proyecto ➔ Instancia de Objeto ➔ Auditoría`.

#### 2. Siemens Xcelerator (https://www.sw.siemens.com)
* **Navegación**: Árbol de dominio anclado a la izquierda + selector de contexto en top-bar.
* **Presentación de Datos**: Árboles BOM (Bill of Materials), grids de propiedades, visor CAD 3D integrado junto a tablas.
* **Jerarquía**: `Planta / Instalación ➔ Unidad ➔ Equipo / Tag ➔ Hoja de Datos / Documento`.

#### 3. AVEVA Unified Operations Center (https://www.aveva.com)
* **Navegación**: Viewport central GIS/3D rodeado de paneles de telemetría y alarmas.
* **Presentación de Datos**: Superposición de telemetría sobre P&ID, tablas de severidad de alarmas ISA 18.2.
* **Jerarquía**: `Sitio / Refinería ➔ Área / Tren ➔ Equipo ➔ Sensor / Tag`.

#### 4. Hexagon SDx (https://hexagon.com)
* **Navegación**: Estructura de desglose de proyecto (PBS) + registro de transmisión de documentos.
* **Presentación de Datos**: Matrices de referencia cruzada Tag-a-Documento, tablas de historial de revisiones.
* **Jerarquía**: `Proyecto ➔ Paquete de Trabajo ➔ Tag / Activo ➔ Transmittal / Documento`.

#### 5. IBM Maximo (https://www.ibm.com/products/maximo)
* **Navegación**: Centro de navegación por roles (Órdenes de Trabajo, Salud de Activos, Inventario, Seguridad).
* **Presentación de Datos**: Tablas densas de órdenes de trabajo, cronogramas de mantenimiento preventivo, árboles de fallas.
* **Jerarquía**: `Sitio ➔ Ubicación ➔ Activo ➔ Orden de Trabajo ➔ Plan de Trabajo / Permiso`.

#### 6. Bentley iTwin (https://www.bentley.com/software/itwin/)
* **Navegación**: Viewport 3D iModel + árbol espacial de ingeniería.
* **Presentación de Datos**: Listas de detección de interferencias (clashes), Gantt 4D, hojas de propiedades.
* **Jerarquía**: `Activo de Infraestructura ➔ Modelo / Disciplina ➔ Elemento / Tag ➔ Registro de Inspección`.

#### 7. Procore (https://www.procore.com)
* **Navegación**: Barra superior de proyecto + sidebar de herramientas.
* **Presentación de Datos**: Tablas de mano de obra en libro diario, listas de observaciones, seguimiento de submittals.
* **Jerarquía**: `Empresa ➔ Proyecto ➔ Paquete de Trabajo / Sección ➔ Inspección`.

#### 8. Oracle Aconex (https://www.oracle.com/construction-engineering/aconex/)
* **Navegación**: Selector de módulos + registro de búsqueda de documentos.
* **Presentación de Datos**: Registros de transmisión de documentos, flujos de revisión multi-parte.
* **Jerarquía**: `Organización ➔ Proyecto ➔ Paquete ➔ Revisión de Documento ➔ Transmittal`.

---

## 2. Sistema de Diseño Propuesto para IC360-NEXUS

### A. Tipografía
Se selecciona la familia **`Inter`** (disponible open-source bajo licencia SIL Open Font License), complementada con **`Geist Mono`** para datos numéricos y códigos de auditoría.

* **Justificación**: `Inter` posee métricas verticales optimizadas para pantallas de alta densidad de datos, excelente legibilidad en tamaños pequeños (11px-13px) y soporte para `font-variant-numeric: tabular-nums` (evita saltos horizontales al actualizar números o contadores).

```css
/* Escala Tipográfica Oficial IC360 */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'Geist Mono', 'JetBrains Mono', monospace;

/* Tamaños y Pesos */
--text-xs: 0.6875rem;   /* 11px - Etiquetas pequeñas, badges, pies normativos */
--text-sm: 0.75rem;     /* 12px - Texto secundario, cabeceras de tabla, metadatos */
--text-base: 0.8125rem; /* 13px - Texto principal del cuerpo, celdas de tabla */
--text-md: 0.875rem;    /* 14px - Títulos de sección, inputs, botones */
--text-lg: 1rem;        /* 16px - Títulos de tarjetas, modales */
--text-xl: 1.25rem;     /* 20px - Títulos de vista, cabeceras de módulo */
--text-2xl: 1.5rem;     /* 24px - KPIs principales, contadores */
--text-3xl: 2rem;       /* 32px - Números de héroe en dashboards */

--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

### B. Iconografía
Se mantiene y estandariza **`lucide-react`** como la librería exclusiva de iconos vectoriales.

* **Justificación**: `lucide-react` ya está instalada en la plataforma, ofrece más de 1,400 iconos con grosor de trazo uniforme (1.5px por defecto), consistencia de caja de `24x24px` (renderizada a `16x16px` o `18x18px` en la UI compacta) y cero sobrecarga de bundle.
* **Prohibición**: Queda **estrictamente prohibido usar Emojis** como iconos de navegación o estado.

---

### C. Paleta de Colores (Modo Oscuro Industrial Primario)

La paleta se basa en tonos neutros de gris carbón/pizarra (`Slate Navy`), garantizando ratios de contraste que superan la norma **WCAG AA (mínimo 4.5:1 para texto normal)**.

```css
:root {
  /* Superficies e Fondos Neutros */
  --bg-app: #080A0C;          /* Fondo base de la aplicación (Pitch Dark) */
  --bg-surface-1: #101418;    /* Contenedores primarios, paneles de trabajo */
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

  /* Colores Semánticos de Estado (Verificados WCAG AA) */
  /* Conforme / Aprobado */
  --status-success-bg: #062B1E;
  --status-success-border: #0E6245;
  --status-success-text: #34D399;

  /* Advertencia / En Revisión / Prórroga */
  --status-warning-bg: #2B1D06;
  --status-warning-border: #633800;
  --status-warning-text: #FBBF24;

  /* Bloqueo de Seguridad / Gas fuera de Rango / Descalibrado */
  --status-danger-bg: #320A0A;
  --status-danger-border: #7A0C00;
  --status-danger-text: #F87171;

  /* No Aplica / Neutral */
  --status-neutral-bg: #1E293B;
  --status-neutral-border: #334155;
  --status-neutral-text: #94A3B8;
}
```

---

### D. Espaciado, Grid y Densidad de Tablas
* **Sistema de Rejilla**: Grid de `4px` y `8px`.
* **Breakpoints Responsivos**:
  * `sm`: `640px` (Tabletas verticales / teléfonos)
  * `md`: `768px` (Tabletas horizontales)
  * `lg`: `1024px` (Laptops de campo)
  * `xl`: `1280px` (Estaciones de trabajo)
  * `2xl`: `1536px` (Pantallas de centro de monitoreo / Command Wall)
* **Densidad de Tablas**:
  * Altura de Fila Estándar: `36px`
  * Altura de Fila Compacta: `32px`
  * Padding Celda: `6px 12px`

---

### E. Elevación, Bordes y Motion
* **Radios de Borde (`border-radius`)**:
  * Badges y botones pequeños: `4px`
  * Tarjetas e inputs: `6px`
  * Modales y paneles principales: `8px`
* **Política de Sombras**: Uso de sombras sobrias de baja difuminación (`box-shadow: 0 1px 3px rgba(0,0,0,0.4)`). Se prohíbe el uso de neones o resplandores flotantes desmedidos.
* **Reglas de Motion**:
  * **Lo que SÍ se anima**: Transiciones de estado en botones (100ms ease), apertura de paneles laterales (200ms cubic-bezier), aparición de modales (150ms ease-out).
  * **Lo que NO se anima**: Carga de filas de tablas, actualización de datos de telemetría/gases, cambios de pestañas en formularios.

---

## 3. Auditoría de Componentes de la Plataforma

| Componente Necesario | Patrón de Referencia e Inspiración | Comportamiento Esperado en IC360 |
|---|---|---|
| **Tabla Densa de Datos** | Linear / Stripe Dashboard | Filas de `36px`, ordenamiento por columna, columnas fijas a la izquierda para IDs, filtros rápidos superiores y paginación asíncrona. |
| **Split View (Lista - Detalle)** | Raycast / Height | División en 2 paneles: Lista izquierda de actividades (35% ancho) y panel de detalle del workflow activo a la derecha (65% ancho). |
| **Contextual Drawer** | Stripe / Attio | Panel lateral deslizante desde la derecha (`380px` de ancho) para consultar historial de auditoría o adjuntar evidencias sin salir del flujo. |
| **Command Palette (`Cmd+K`)** | Linear / Raycast | Ventana modal centrada de búsqueda omnibox para saltar entre Proyectos, WBS, Tags de Instrumentos o Permisos activos. |
| **Wizard Progresivo** | Enablon / Site App Pro | Barra de progreso en 3 pasos (`1. Gabinete ➔ 2. Inspección & Gases ➔ 3. Firmas`) con validación Zod al cambiar de paso. |
| **Visor A4 WYSIWYG** | Oracle Aconex / Formato Maestro | Contenedor centrado de hoja Carta/A4 con controles de zoom, descarga PDF y regla de Co-Branding de logotipos (Operador Izq / Contratista Der). |
| **Árbol del Databook** | Hexagon SDx / Bentley iTwin | Árbol jerárquico desplegable de Capítulos (01 al 08) con estado de compilación y descarga de paquetes auditables en ZIP/PDF. |
| **Badge de Estado Semántico** | Stripe / Vercel | Píldora compacta (`height: 20px`) con fondo de baja opacidad, borde sutil y punto indicador de color semántico. |
| **Firma Digital Biométrica** | IAMTech / Procore | Módulo de captura táctil con sello de tiempo criptográfico RFC 3161 y generación de Hash SHA-256 en tiempo real. |

---

## 4. Stack y Framework de UI Recomendado

* **Evaluación**: `Tailwind CSS` + `shadcn/ui` (basado en primitivos de `Radix UI`).
* **Recomendación Justificada**:
  1. El repositorio ya cuenta con `Vite`, `React 18`, `TypeScript` y `Tailwind CSS`.
  2. `shadcn/ui` sobre `Radix UI` no añade una librería cerrada pesada; copia componentes descompuestos en TypeScript directamente en `src/components/ui/` que se pueden adaptar 100% a la paleta de colores y densidad de celdas requerida.
  3. Proporciona accesibilidad nativa total (cumplimiento estricto de accesibilidad ARIA e interacción por teclado).
