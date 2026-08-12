# AUDITORÍA TÉCNICA Y CENSO VISUAL DE FRONTEND SUPERADMIN — IC360-NEXUS (V1)
> **CENSO DE RUTAS AUTENTICADAS SUPERADMIN, INVENTARIO DE COMPONENTES, AUDITORÍA DE USABILIDAD Y MATRIZ WORKFLOW ➔ HERRAMIENTA**

---

## 1. CENSO VISUAL Y DE RUTAS AUTENTICADAS CON PLAYWRIGHT (27 RUTAS)

Todas las capturas full-page de la aplicación autenticada con rol Superadmin se encuentran archivadas en alta resolución en:  
📁 `C:\Users\Administrator\Desktop\IC360_INBOX_WF-SPECS\UX_AUDIT_SCREENSHOTS\`

### Tabulación de Pantallas Autenticadas, Componentes y Evaluación de Usabilidad

| N° | Ruta (`Route`) | Imagen Capturada (`Full-Page`) | Componentes Principales | Diagnóstico de Usabilidad y Oportunidades de Rediseño |
|---|---|---|---|---|
| 01 | `/` | `01-dashboard-auth.png` | `AppLayout`, `TopContextBar`, `HeroCard`, `StatCard`, `PortfolioNetwork`, `CurvaS` | **Dashboard Consolidado Superadmin:** Muestra el Portafolio Corporativo Consolidado (100% Avance, $245k Ejecutado, 122.640 HHT). Falta acceso rápido prioritario a firmas PTW y alertas SIHOA de campo. |
| 02 | `/login` | `02-login-auth.png` | `Login`, `Button`, `Input`, `Card` | **Acceso Corporativo:** Formulario de inicio de sesión con soporte para Google Auth (desbloqueado con `127.0.0.1` autorizado) y Modo Demo. Requiere refactorización visual para alinear con la marca corporativa. |
| 03 | `/projects` | `03-projects-auth.png` | `Projects`, `PhaseManager`, `Card`, `StatusBadge` | **Gestión de Proyectos:** Muestra la lista de obras y fases. Requiere mapa interactivo GIS integrado directamente en la tarjeta principal. |
| 04 | `/tasks` | `04-tasks-wbs-auth.png` | `Tasks`, `Column`, `TaskCard`, `TaskModal` | **Estructura WBS y Kanban:** Tablero de planificación de actividades. Densidad visual alta; los botones de edición de tareas requieren mejor contraste y área de toque. |
| 05 | `/valuations` | `05-valuations-auth.png` | `Valuations`, `MetricCard`, `StatCard`, `PageHeader` | **Valuaciones ROE PDVSA:** Control físico-financiero certificado. Requiere previsualización in situ de Actas B y C con QR de auditoría en *Split View*. |
| 06 | `/expenses` | `06-expenses-auth.png` | `Expenses`, `Card`, `Button`, `Input` | **Gestión de Costos y Gastos:** Registro de facturas e insumos. El estado inicial sin filtros debe orientar al usuario en la carga secuencial. |
| 07 | `/budget-details` | `07-budget-details-auth.png` | `BudgetDetails`, `QuantityTakeoff`, `Card` | **Detalles Presupuestarios:** Cómputos métricos. Celdas de tabla requieren congelamiento de encabezados (*Sticky Headers*) al hacer scroll. |
| 08 | `/siho-ptw` | `08-siho-ptw-auth.png` | `SihoPtw`, `AstForm`, `StatusBadge`, `Button` | **Permisología SIHO-A & PTW:** Control de permisos Frío/Caliente. El botón de Firma Aprobatoria del Emisor debe ser protagónico y separado de la edición de ART. |
| 09 | `/qa-qc-welding` | `09-qa-qc-welding-auth.png` | `QaQcWelding`, `InteractiveFlangeDiagram`, `Card` | **Control de Calidad y Soldaduras:** Trazabilidad de juntas de tubería NDT / ASME IX. Diagrama interactivo requiere conexión con torque de bridas. |
| 10 | `/field-reports` | `10-field-reports-auth.png` | `FieldReports`, `GPSPicker`, `RouteDrawer` | **Reportes Diarios de Campo:** Captura con coordenadas GPS. Interfaz debe adaptarse a pantallas táctiles de tabletas industriales. |
| 11 | `/documents` | `11-documents-auth.png` | `Documents`, `EmptyState`, `Button` | **Centro Documental:** Repositorio de planos y especificaciones. Se debe estructurar conforme al árbol inmutable ISO 19005-1 (Databook). |
| 12 | `/logistics` | `12-logistics-auth.png` | `LogisticsMap`, `FieldMap`, `Card` | **Mapa de Logística y Rutas:** Traza de transporte de equipos. Integración con Leaflet requiere mapa oscuro con capa de tuberías. |
| 13 | `/inventory` | `13-inventory-auth.png` | `ProcurementInventory`, `Card`, `StatusBadge` | **Inventario y Procura:** Control de stock de materiales. Alertamiento automático en rojo para insumos por debajo del punto de reorden. |
| 14 | `/modulos/cierre` | `14-dossier-cierre-auth.png` | `DossierCompiler`, `PageHeader`, `Button` | **Compilador Dossier & Cierre:** Ensamblador de expediente técnico. Requiere vista previa de folios de Libro de Obra (WF-075) antes de compilar PDF/A. |
| 15 | `/client-portal-builder`| `15-client-portal-builder-auth.png` | `ClientPortalBuilder`, `Card` | **Generador Portal de Clientes:** Creador de vistas ejecutivas para clientes. Debe unificarse en el panel lateral de dominios. |
| 16 | `/hot-tap` | `16-hot-tap-auth.png` | `HotTapSchemes`, `IsometricViewer` | **Esquemas Hot Tap:** Intervención en tuberías con presión. Asistente visual debe exigir verificación de presión previa antes del corte. |
| 17 | `/apu-estimation` | `17-apu-estimation-auth.png` | `ApuEstimation`, `Card`, `Button` | **Estimación APU:** Análisis de Precios Unitarios. Sugerencia de rendimientos y cuadrillas basada en la convención petrolera. |
| 18 | `/tools` | `18-engineering-tools-auth.png` | `EngineeringTools`, `FlangeAndTighteningTool` | **Herramientas de Ingeniería:** Torque de bridas y empacaduras. Traslado automático del par de apriete al renglón 14 del PTW. |
| 19 | `/project-brain` | `19-project-brain-auth.png` | `ProjectBrain`, `Card` | **Cerebro del Proyecto:** Consultor de IA del proyecto. Debe explicitar las fuentes normativas PDVSA consultadas en cada respuesta. |
| 20 | `/intelligence` | `20-intelligence-auth.png` | `Intelligence`, `Card`, `MetricCard` | **Analítica Predictiva:** Indicadores RAG y predicción de retrasos. Integración directa con el Dashboard de mando ejecutivo. |
| 21 | `/bim` | `21-bim-3d-auth.png` | `BIMViewer`, `@react-three/fiber` | **Visor 3D BIM:** Renderizado de maquetas Three.js. Carga asincrónica diferida (*Lazy Loading*) para no demorar el inicio de sesión. |
| 22 | `/loto-isolation` | `22-loto-isolation-auth.png` | `LotoIsolation`, `StatusBadge` | **Aislamiento LOTO:** Bloqueo de fuentes de energía (Anexo B). Señalización gráfica de válvulas bloqueadas sobre el P&ID. |
| 23 | `/instrumentation-control`| `23-instrumentation-auth.png` | `InstrumentationControl`, `ValveVisualizer` | **Instrumentación & Lazos:** Lazos de control P&ID. Estado de calibración (WF-052) visible directamente al pulsar sobre el instrumento. |
| 24 | `/civil-engineering`| `24-civil-engineering-auth.png` | `CivilEngineeringRegistry`, `Card` | **Ensayos Civiles:** Cono de arena (COVENIN 2000-92) y compresión de concreto (ACI 318). Registro directo de resultados en el Libro de Obra (WF-075). |
| 25 | `/environmental-management`| `25-environmental-auth.png` | `EnvironmentalManagement`, `Card` | **Gestión Ambiental:** Control de efluentes y desechos peligrosos (Decreto N° 2.635). Ingesta automática desde la Sección 13 del PTS (WF-046). |
| 26 | `/saas-console` | `26-saas-console-auth.png` | `PlatformOwnerConsole`, `Card` | **Consola SaaS Platform Owner:** Gestión multi-tenant y consumo FinOps. Visualización de costo acumulado y métricas de API. |
| 27 | `/settings` | `27-settings-auth.png` | `Settings`, `Card`, `Button` | **Ajustes del Sistema:** Configuración de banderas de marca (`showOperatorLogo`, `showContractorLogo`) para el Formato Maestro Rev 1. |

---

## 2. INVENTARIO TÉCNICO COMPLETO DEL FRONTEND

### 2.1 Análisis de Dependencias UI (`package.json`)
- **Librerías de Componentes & Animación:** `motion` (Framer Motion 12.23), `@dnd-kit/core` (6.3.1), `@dnd-kit/sortable` (10.0.0), `clsx`, `tailwind-merge`.
- **Motor de Renderizado 3D:** `@react-three/fiber` (9.5.0), `@react-three/drei` (10.7.7), `three` (0.183.2).
- **Mapeo GIS & Geometría:** `leaflet` (1.9.4), `react-leaflet` (5.0.0), `leaflet-draw` (1.0.4), `@turf/turf` (7.3.5), `tokml` (0.4.0).
- **Gráficos Estadísticos:** `recharts` (3.8.1).
- **Formatos Documentales & PDF/A:** `jspdf` (4.2.1), `html2canvas` (1.4.1), `html-to-image` (1.11.13), `exceljs` (4.4.0), `qrcode` (1.5.4).
- **Seguridad & IA:** `@sentry/react` (10.69.0), `dompurify` (3.4.12), `@google/genai` (1.29.0).

---

## 3. MATRIZ DEFINITIVA: PANTALLA ➔ WORKFLOW ➔ HERRAMIENTA

| Pantalla Autenticada | Workflow(s) Alimentador(es) | Esquemas de Datos (Lectura / Escritura) | Herramientas, MCPs & Skills Conectados |
|---|---|---|---|
| **`/siho-ptw`** | `WF-043` (PTW), `WF-044` (ART), `WF-052` (Multigas) | `ptwSchema`, `artSchema`, `multigasCertSchema` | `security-auditor`, `deliverableHash.ts`, `qrService.ts`, `firecrawl-mcp` |
| **`/qa-qc-welding`** | `WF-053` (Actas Mecánicas PIC-03-01-09) | `valuationsSchema`, `weldingJointSchema` | `pdf-official`, `deliverableLifecycle.ts`, `valuationsPreviewRenderer.ts` |
| **`/modulos/cierre`** | `WF-074` (Databook), `WF-075` (Libro Obra) | `dossierSchema`, `libroObraSchema` | `pdf-official`, `deliverableHash.ts`, `n8n-mcp` |
| **`/apu-estimation`** | `WF-065` (APU), `WF-066` (Cómputos Métrica) | `apuSchema`, `takeoffSchema` | `exceljs`, `graphify`, `opencode-mcp` |
| **`/loto-isolation`** | `WF-043` (Anexo B LOTO), `WF-046` (PTS) | `lotoSchema`, `ptsSchema` | `security-auditor`, `github-mcp` |
| **`/civil-engineering`** | `WF-075` (Sección XIV - Ensayos Civiles) | `civilTrialSchema`, `soilDensitySchema` | `pdf-official`, Playwright E2E Skill |
| **`/environmental-management`**| `WF-046` (Sección 13 - Desechos Dec. 2.635) | `environmentalSchema` | `security-auditor`, `n8n-mcp` |
| **`/saas-console`** | Sprints F-A / F-B (FinOps & Multi-tenancy) | `tenantSchema`, `finopsMetricsSchema` | `github-mcp`, `deliverableHash.ts` |
