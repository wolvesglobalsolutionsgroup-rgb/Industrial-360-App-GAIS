# Arsenal de Diseño y Recursos de Construcción UI/UX: IC360-NEXUS (v1.0)

**Aplicación**: IC360-NEXUS (`Industrial-360-App-GAIS`)  
**Repositorio**: [wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS](https://github.com/wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS)  
**Ruta de Especificación**: `docs/design/DESIGN-ARSENAL-IC360-V1.md`  
**Estado**: ESPECIFICACIÓN TÉCNICA OFICIAL  
**Propósito**: Definir el arsenal completo de componentes, librerías, assets, tipografías, estándares HMI/SCADA e inspiración de producto de clase mundial para la plataforma IC360-NEXUS, utilizando exclusivamente recursos **100% gratuitos y Open Source** verificables.

---

## 1. Arsenal de Componentes Premium (Open Source & Free Tier Analysis)

Se evaluaron las principales librerías de componentes y galerías de UI para seleccionar los bloques de construcción óptimos para IC360-NEXUS:

### A. Evaluaciones de Librerías y Frameworks UI

#### 1. `shadcn/ui` (sobre Radix UI Primitives + Tailwind CSS)
* **URL**: [https://ui.shadcn.com](https://ui.shadcn.com) | **Licencia**: MIT (Open Source)
* **Peso de Bundle**: **0 KB** de sobrecarga runtime (los componentes TypeScript se copian directamente en `src/components/ui/`).
* **Bloques y Plantillas Gratuitas**:
  * *shadcn/ui Blocks*: [https://ui.shadcn.com/blocks](https://ui.shadcn.com/blocks) (Headers, Sidebar de proyectos, Dashboard Grids).
  * *Shadcn Taxonomy Template*: [https://github.com/michaeltrainor/taxonomy](https://github.com/michaeltrainor/taxonomy) (Plantilla de gestión de proyectos y autenticación).
* **Veredicto y Aplicación en IC360**: **SELECCIÓN PRINCIPAL DE ARQUITECTURA**. Proporciona los primitivos accesibles WAI-ARIA (`DataTable`, `Dialog`, `Command`, `Drawer`, `Accordion`, `Tabs`, `DropdownMenu`) que se adaptan 100% al modo oscuro industrial y la alta densidad de celdas de IC360.

#### 2. `Tremor` (Dashboards, KPIs y Gráficos Financieros/EVM)
* **URL**: [https://www.tremor.so](https://www.tremor.so) | **Licencia**: Apache 2.0 / MIT
* **Peso de Bundle**: ~25-35 KB (Componentes React nativos en Tailwind CSS).
* **Galería de Bloques**: [https://www.tremor.so/blocks](https://www.tremor.so/blocks)
* **Veredicto y Aplicación en IC360**: **LIBRERÍA SECUNDARIA PARA ANALÍTICA**. Se utilizará para construir las tarjetas de KPIs de la barra superior, micro-gráficos *Sparklines* en celdas de prueba de gases/telemetría y gráficos de avance físico/financiero de ingeniería EVM (`wf-073`).

#### 3. `Ark UI` & `Park UI` (Zag.js Primitives)
* **URL**: [https://ark-ui.com](https://ark-ui.com) / [https://park-ui.com](https://park-ui.com) | **Licencia**: MIT
* **Análisis**: Primitivos basados en máquinas de estado (Zag.js). Excelente arquitectura, pero añade una capa de estado adicional frente a Radix UI.
* **Veredicto**: Desestimado para mantener simplicidad frente al stack actual de `shadcn/ui`.

#### 4. `Headless UI` (Tailwind Labs)
* **URL**: [https://headlessui.com](https://headlessui.com) | **Licencia**: MIT
* **Análisis**: Primitivos accesibles sin estilos de Tailwind Labs (~10 KB).
* **Veredicto**: Utilizable para transiciones simples de popover y comboboxes.

#### 5. `Flowbite Free` & `HyperUI`
* **URL**: [https://flowbite.com](https://flowbite.com) / [https://www.hyperui.dev](https://www.hyperui.dev) | **Licencia**: MIT
* **Análisis**: Componentes copy-paste de Tailwind CSS puro sin dependencias JavaScript adicionales.
* **Aplicación en IC360**: Útiles para barras de búsqueda de filtros rápidos, tiras de metadatos y encabezados secundarios.

#### 6. `Tailwind UI` (Referencia de Patrones Visuales)
* **URL**: [https://tailwindui.com](https://tailwindui.com) | **Licencia**: Comercial (Referencia de diseño únicamente)
* **Análisis**: Referencia de proporciones de espacio, jerarquía de sidebars y paneles laterales de alta calidad. Se replican sus patrones en código Tailwind propio sin usar código cliente pagado.

---

## 2. Iconografía, Assets Visuales & Texturas CSS

### A. Comparativa de Librerías de Iconos

| Librería | URL | Licencia | Trazo / Caja | Veredicto para IC360 |
|---|---|---|---|---|
| **`Lucide React`** | [https://lucide.dev](https://lucide.dev) | ISC (MIT) | 1.5px / 24x24 | **MANTENER Y ESTANDARIZAR COMO UNICO**. Cobertura total de 1,400+ iconos industriales (`ShieldCheck`, `FlaskConical`, `HardHat`, `Compass`, `Package`, `BrainCircuit`, `Gauge`, `Zap`, `AlertTriangle`, `CheckCircle2`, `WifiOff`, `QrCode`). |
| **`Phosphor Icons`** | [https://phosphoricons.com](https://phosphoricons.com) | MIT | 6 Estilos | Alternativa de respaldo para variantes duotono. |
| **`Tabler Icons`** | [https://tabler.io/icons](https://tabler.io/icons) | MIT | 1.5px / 24x24 | Alternativa de consulta. |
| **`Heroicons`** | [https://heroicons.com](https://heroicons.com) | MIT | 1.5px / 24x24 | Segunda alternativa de respaldo. |

* **Regla Inviolable**: Queda **estrictamente prohibido el uso de Emojis** como iconos de la interfaz.

---

### B. Ilustraciones y Estados Vacíos Industriales
* **`unDraw`** ([https://undraw.co](https://undraw.co)) — Licencia MIT (Gratis).
* **`Storyset`** ([https://storyset.com](https://storyset.com)) — Licencia Capterra/Freepik (Gratis para uso técnico).
* **Criterio de Selección para IC360**: Ilustraciones vectoriales planas geométricas con paleta desaturada (`#2E3A46` / `#64748B`), evitando dibujos caricaturescos o infantiles para mantener la seriedad industrial.

---

### C. Texturas y Patrones de Fondo en CSS Puro

#### 1. Malla Industrial (Grid Pattern)
```css
.bg-industrial-grid {
  background-image: radial-gradient(#1f2832 1px, transparent 1px);
  background-size: 16px 16px;
}
```

#### 2. Matriz de Puntos (Dot Matrix Pattern)
```css
.bg-industrial-dots {
  background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 0);
  background-size: 12px 12px;
}
```

---

## 3. Tipografía: El Dúo Exacto para IC360

Se realiza la evaluación tipográfica para seleccionar la combinación óptima de legibilidad, rendimiento y personalidad industrial:

### A. Evaluación de Familias

| Familia Sans | Fuente | Tipo de Licencia | Legibilidad Pequeña (11-13px) | Soporte `tabular-nums` | Veredicto |
|---|---|---|---|---|---|
| **`Inter`** | [rsms.me/inter](https://rsms.me/inter) | SIL Open Font | Excelente (Diseñada para UI) | Excelente | **SELECCIÓN SANS PRIMARIA** |
| **`Geist Sans`** | [vercel.com/font](https://vercel.com/font) | SIL Open Font | Excelente | Excelente | Alternativa de consulta |
| **`IBM Plex Sans`**| [github.com/IBM/plex](https://github.com/IBM/plex) | SIL Open Font | Buena (Estética técnica) | Buena | Considerada |

| Familia Mono | Fuente | Tipo de Licencia | Legibilidad de Hashes/Códigos | Veredicto |
|---|---|---|---|---|
| **`Geist Mono`** | [vercel.com/font](https://vercel.com/font) | SIL Open Font | Excelente (Hashes SHA-256 y Timestamps RFC 3161) | **SELECCIÓN MONO PRIMARIA** |
| **`IBM Plex Mono`**| [github.com/IBM/plex](https://github.com/IBM/plex) | SIL Open Font | Buena | Alternativa |
| **`JetBrains Mono`**| [jetbrains.com/mono](https://www.jetbrains.com/lp/mono) | OFL | Muy buena | Alternativa |

---

### B. Recomendación Justificada del Dúo Tipográfico

1. **Sans Principal (Interfaz y Campo)**: **`Inter`**
   * *Justificación*: Creada por Rasmus Andersson para interfaces de alta densidad. Su altura de x (*x-height*) amplia y kerning ajustado aseguran lectura clara bajo luz solar en tabletas de campo. Su archivo WOFF2 subset latin pesa solo **~28 KB**.
2. **Monoespaciada (Hashes, Códigos y Datos Tabulares)**: **`Geist Mono`**
   * *Justificación*: Diseñada por Vercel para código y metadatos numéricos. Alineación impecable para renderizar el `visualVersionHash` SHA-256, timestamps RFC 3161, coordenadas GPS y lecturas de calibración.

```css
/* Configuración CSS de Producción */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-variant-numeric: tabular-nums lining-nums;
}

code, pre, .font-mono {
  font-family: 'Geist Mono', 'JetBrains Mono', monospace;
}
```

---

## 4. Diseño Industrial Serio: Estándares HMI/SCADA de Alto Rendimiento

### A. Principios del High Performance HMI Handbook (ANSI/ISA-101)
En la ingeniería industrial de salas de control y operaciones de campo, el diseño sigue estándares internacionales de interfaz hombre-máquina (HMI):

1. **Gris Neutro como Base de Control (90% de la Pantalla)**:
   * Toda la interfaz utiliza fondos y contenedores en tonos gris pizarra/carbón desaturados (`#080A0C` a `#181E24`). Esto elimina distracciones y reduce la fatiga visual en turnos de 12 horas.
2. **Uso de Color Exclusivo para Desviaciones Operativas (ISA-101)**:
   * El color NO se usa para decoración ni gradientes estéticos sueltos.
   * El verde (`#34D399`), amarillo (`#FBBF24`) y rojo (`#F87171`) se reservan **únicamente para indicar estados y alarmas normativas**.

---

### B. Patrones de Alta Densidad de Datos (`Data-Dense UI`)

1. **Tablas con Micro-Gráficos Sparklines**:
   * Inclusión de líneas de tendencia en miniatura (`height: 18px`) dentro de las celdas para monitorear fluctuaciones de pruebas de gas (% LEL, O2) o presión de calibración.
2. **Franjas de KPIs (KPI Strips)**:
   * Tira superior compacta de `48px` de altura con contadores numéricos en `Geist Mono` y badges semánticos.
3. **Mapas de Calor de Estado Operativo**:
   * Rejillas compactas de mosaicos cuadrados que reflejan de un vistazo el estado de cumplimiento de 50+ lazos de instrumentación o permisos activos.

---

## 5. Motion y Micro-interacciones Sobrias

### A. Reglas de Animación por Librería
* **`Framer Motion`** ([https://www.framer.com/motion/](https://www.framer.com/motion/)) — Licencia MIT:
  * Utilizado para transiciones de apertura de paneles laterales (*Contextual Drawers*) y la aparición del modal de vista previa A4.
* **`AutoAnimate`** ([https://auto-animate.formkit.com/](https://auto-animate.formkit.com/)) — Licencia MIT:
  * Animación automática sin configuración al agregar o eliminar filas en tablas dinámicas.

### B. Duraciones y Curvas Easing Fijas
* **Hover / Focus**: `100ms ease-out`
* **Desplazamiento Drawer / Modal**: `200ms cubic-bezier(0.16, 1, 0.3, 1)`
* **Prohibición**: NUNCA animar cargas de datos masivos, telemetría de gases o entradas de formularios.

---

## 6. Recursos Gratuitos de Referencia Continua y Design Systems

### A. Galerías de Referencia Viva de UI
* **Mobbin**: [https://mobbin.com](https://mobbin.com) (Patrones web y móviles de productos reales).
* **Dark Mode Design**: [https://www.darkmodedesign.com](https://www.darkmodedesign.com) (Inspiración de contraste oscuro).
* **UI Garage**: [https://uigarage.net](https://uigarage.net)
* **Lapa Ninja**: [https://www.lapa.ninja](https://www.lapa.ninja)

### B. Design Systems Abiertos de Clase Mundial para Extraer Patrones
* **Shopify Polaris**: [https://polaris.shopify.com](https://polaris.shopify.com) (Manejo impecable de estados de carga, filtros y banners).
* **GitHub Primer**: [https://primer.style](https://primer.style) (Jerarquía de pestañas, badges de estado y diseño de registros/commits).
* **IBM Carbon**: [https://carbondesignsystem.com](https://carbondesignsystem.com) (Estándar de software industrial pesado, densidad de tablas y accesibilidad).
* **Atlassian Design System**: [https://atlassian.design](https://atlassian.design) (Flujos de aprobación y estados de workflows).
* **Uber Base Web**: [https://baseweb.design](https://baseweb.design) (Tablas de datos de alto rendimiento y selección de fechas).

---

## TOP 20 Decisiones de Construcción Recomendadas para el Sprint UX-01

1. Estandarizar `shadcn/ui` (Radix UI) + Tailwind CSS como la arquitectura principal de componentes en React.
2. Adoptar el dúo tipográfico **`Inter`** (Sans principal de UI) + **`Geist Mono`** (Hashes SHA-256, timestamps RFC 3161 y celdas numéricas) con `tabular-nums`.
3. Estandarizar **`lucide-react`** con trazo de `1.5px` como la única librería de iconos vectoriales, eliminando 100% el uso de Emojis.
4. Aplicar el estándar HMI/SCADA (ANSI/ISA-101): base gris neutro en el 90% de la UI y reserva del color exclusivamente para semáforos semánticos.
5. Implementar la estructura de navegación en cascada de 5 Niveles (`Organización ➔ Proyecto ➔ Work Package ➔ Dominio ➔ Workflow`).
6. Reducir la navegación principal a **6 Dominios Operativos** en la barra lateral fija (`220px`).
7. Usar `Tremor` para los micro-gráficos Sparklines y las tarjetas de KPIs en los Dashboards.
8. Crear el componente `DenseDataTable` con altura de fila fija de `36px`, columnas ancladas e identificadores monoespaciados.
9. Implementar el `ContextualDrawer` deslizante desde la derecha (`380px` de ancho) para consultas de auditoría y carga de evidencias.
10. Configurar la Command Palette (`Cmd+K`) centrada a `560px` para búsqueda difusa multidominio en sub-30ms.
11. Implementar el `ProgressiveWizard` de 3 Pasos (`1. Gabinete ➔ 2. Inspección & Gases ➔ 3. Firmas`) con validación Zod al avanzar.
12. Integrar el Visor A4 WYSIWYG nativo con Co-Branding de doble logo (Operador a la izquierda / Contratista a la derecha).
13. Implementar el pie de página de entregables oficial Rev. 1 con Hash SHA-256, Sello de Tiempo RFC 3161 y Código QR de verificación.
14. Implementar la máquina de 10 estados en los `StatusBadge` con opacidad del 10% de fondo y texto sólido.
15. Aplicar firma digital biométrica con sello criptográfico y hash visual impreso en verde de seguridad (`#34D399`).
16. Implementar el árbol jerárquico del Databook (`DatabookTree`) con porcentaje de completación por capítulo y descarga ZIP/PDF.
17. Habilitar la vista unificada `[ Ver Tríada ]` en un modal de 4 pestañas (`PTS + ART + Calibración + PTW`).
18. Asegurar zona táctil de toque de `44x44px` en modo tablet para inspecciones de campo bajo luz solar directa.
19. Integrar el patrón de fondo CSS puro de punteado industrial (`12x12px dot matrix`).
20. Aplicar la política de Motion con `prefers-reduced-motion` deshabilitando animaciones pesadas en dispositivos de baja potencia.
