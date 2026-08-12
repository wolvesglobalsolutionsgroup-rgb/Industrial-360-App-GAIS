# Auditoría Técnica Exhaustiva de Stack y Librerías: IC360-NEXUS

## 1. Inventario Actual del Stack (`package.json`)

**Veredicto General**: El bundle inicial de 488 KB gzipped está al borde superior del límite razonable para una PWA rápida. Se pueden aplicar estrategias de *lazy loading* y purga.

| Dependencia | Versión | Propósito | Veredicto |
|---|---|---|---|
| `@dnd-kit/core`, etc. | `^6.3.1` | Drag & Drop | **MANTENER**. Muy modular, accesible, ligero. |
| `@react-three/drei`, `fiber`, `three` | `^10.7.7` | 3D y visores | **MANTENER** con lazy loading estricto. |
| `@turf/turf` | `^7.3.5` | GIS calculations | **REEMPLAZAR** / Lazy load. Turf entero es pesado. Cambiar a imports específicos (`@turf/area`, etc.). |
| `date-fns` | `^4.1.0` | Manejo de fechas | **MANTENER / ACTUALIZAR**. Es modular. Importar solo lo usado. |
| `dexie` | `^4.4.4` | IndexedDB wrapper | **MANTENER**. Esencial para offline mode en PWA. |
| `exceljs` | `^4.4.0` | Export/Import Excel | **MANTENER**. Lazy load obligatorio. |
| `html2canvas` / `jspdf` | `^1.4.1`, `^4.2.1` | Generación PDF | **REEMPLAZAR**. `pdf-lib` es más robusto para manipular PDFs o `react-pdf` para renderizarlos. `html2canvas` genera layouts pesados y frágiles. |
| `leaflet`, `react-leaflet`, `draw` | `^1.9.4` | Mapas | **EVALUAR MIGRACIÓN** a MapLibre GL JS para WebGL render y mejor performance, o mantener si el peso es crítico (Leaflet es ~42kb, MapLibre ~150kb). |
| `recharts` | `^3.8.1` | Gráficos | **MANTENER**. Ligero y basado en D3 pero React-friendly. |
| `motion` | `^12.23.24` | Animaciones | **MANTENER / REVISAR**. Usar `m` component de `framer-motion` para cargar features asincrónicamente y reducir bundle. |
| `lucide-react` | `^0.546.0` | Íconos | **MANTENER**. |

## 2. Evaluación por Categoría

### a. Tablas de datos densas industriales
* **Opciones**: TanStack Table (MIT, ~15kb) vs AG Grid Community (MIT, ~150kb+) vs MUI DataGrid (MIT/Commercial).
* **Recomendación**: **TanStack Table**. 100% headless, 0 dependencias UI, ultra-ligero y $0. AG Grid es genial pero pesado y la versión Enterprise es de pago.

### b. Formularios y validación
* **Opciones**: React Hook Form + Zod (MIT, ~9kb) vs Formik (MIT, ~13kb) vs React Router Actions.
* **Recomendación**: **React Hook Form + Zod**. El estándar actual para performance sin re-renders en inputs. Formik está casi abandonado.

### c. Gráficos y dashboards
* **Opciones**: Recharts (MIT) vs Tremor (MIT, usa Recharts) vs ECharts (Apache 2.0, ~250kb).
* **Recomendación**: **ECharts (Apache 2.0)** para datos *industriales* densos (miles de puntos). Si los datos no son masivos, **Recharts** (actual) es más ligero. Migrar a ECharts solo en vistas específicas cargadas con lazy loading.

### d. 3D / BIM / visores
* **Opciones**: Three.js + R3F (MIT) vs Babylon.js (Apache 2.0) vs That Open Company / web-ifc (MPL 2.0 / MIT).
* **Recomendación**: **Three.js + R3F**. Mantener lo actual para 3D general. Para BIM puro (IFC), integrar **`web-ifc`** de manera lazy (WASM).

### e. GIS / mapas
* **Opciones**: MapLibre GL (BSD, fork libre de Mapbox GL, WebGL) vs Leaflet (BSD) vs deck.gl (MIT).
* **Recomendación**: Para capas de datos masivas (Point clouds GIS): **deck.gl** o **MapLibre GL JS**. Para simple visualización de marcadores y polígonos: **Leaflet** (actual, muy ligero).

### f. Generación PDF/A y documentos
* **Opciones**: pdf-lib (MIT) vs react-pdf (MIT) vs jsPDF (MIT).
* **Recomendación**: **pdf-lib** para rellenar plantillas PDF existentes y crear documentos conformes a firmas. Es mucho más exacto a nivel binario que jsPDF + html2canvas.

### g. Excel/CSV
* **Opciones**: ExcelJS (MIT) vs SheetJS Community (Apache 2.0 / limitado).
* **Recomendación**: **ExcelJS**. La versión comunitaria de SheetJS tiene restricciones en features modernos que requieren la Pro. ExcelJS es 100% MIT y permite estilos/fórmulas completas. Lazy Load.

### h. Fechas/horas industriales
* **Opciones**: date-fns (MIT) vs Temporal API (polyfill) vs Day.js (MIT, 2kb).
* **Recomendación**: **date-fns** si se hace tree-shaking agresivo (que ya tenemos). Si el bundle se vuelve un problema extremo, migrar a **Day.js**.

### i. Estado y data-fetching
* **Opciones**: TanStack Query (MIT) vs Zustand (MIT).
* **Recomendación**: **TanStack Query** para estado del servidor (fetching, caching, mutaciones) y **Zustand** para estado global cliente (filtros UI, modo oscuro, toggles).

### j. Animación sobria
* **Opciones**: Framer Motion (MIT) vs AutoAnimate (MIT).
* **Recomendación**: **AutoAnimate** (~2kb) para listas y toggles industriales (cero configuración). Dejar Framer Motion solo para vistas 3D / complejas (con load features asincrónico).

### k. Testing E2E
* **Recomendación**: **Playwright** (Apache 2.0). Rápido, multi-browser, $0 USD.

### l. Accesibilidad
* **Recomendación**: **Radix Primitives** (MIT) para componentes headless accesibles, o seguir estándares WAI-ARIA nativos.

## 3. Cálculos y Normas de Ingeniería
* En el repo (`src/lib/norms/`), tenemos `api1163.ts`, `api570.ts`, `b313.ts`, `b31g.ts`, `pdvsa906.ts`, etc.
* **Librerías Open Source útiles**:
  - `convert-units` o `mathjs` (Apache 2.0): Para conversiones rigurosas de unidades (psi a bar, mm a in).
  - Repositorios GitHub como `scipy` (Python) para referencia matemática, pero en JS lo ideal es mantener el motor `src/lib/norms/` aislado, escrito en TS puro sin dependencias (0 kb extras en bundle, 100% auditable y con tests unitarios con Vitest).
  - **Recomendación Arquitectónica**: Consolidar `src/lib/norms/` como una librería interna modular (`@ic360/engineering`), exportar métodos puros, cada uno con 100% de cobertura (TDD obligatorio para cálculos B31.3 / B31.8).

## 4. Repos y Recursos Gratuitos de Referencia
* **Admin/Dashboards**: `tabler/tabler` (MIT, excelentes dashboards de gestión), `tremorlabs/tremor` (componentes React industriales).
* **EHS / Inspecciones**: Estudiar repos open source de `ODK (Open Data Kit)` para formularios offline.
* **BIM / Construction**: Repos de `ThatOpen` (That Open Company) para motores IFC web.

## 5. Matriz Final de Decisión (Top Prioridades)

| Categoría | Librería Actual | Recomendada | Peso (gzipped) | Licencia | Justificación | Prioridad |
|---|---|---|---|---|---|---|
| PDF Docs | jsPDF + html2canvas | **pdf-lib** | ~100 KB | MIT | Generación PDF nativa, sin hack de canvas, firmas soportadas. | ALTA |
| Data Tables | Ninguna centralizada | **TanStack Table** | ~15 KB | MIT | Headless, virtualización para grandes datos, sin deps UI. | ALTA |
| Formularios | N/A o React state | **React Hook Form** | ~9 KB | MIT | Performance industrial sin re-renders masivos + Zod (validación). | ALTA |
| Estado / Cache| React hooks nativos | **TanStack Query**| ~15 KB | MIT | Manejo offline/cache robusto de reportes y lecturas de sensores. | MEDIA |
| Animaciones | `motion` completo | **AutoAnimate** | ~2 KB | MIT | Animaciones automáticas sobrias, reduce 30kb+ el bundle. | BAJA |
| Export Excel | `exceljs` | **ExcelJS** | ~130 KB | MIT | Mantener, pero extraer a `import('exceljs')` lazy loaded. | ALTA |
