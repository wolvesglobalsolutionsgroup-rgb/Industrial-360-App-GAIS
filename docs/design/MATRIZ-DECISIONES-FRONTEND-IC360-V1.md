# MATRIZ DE DECISIONES DE FRONTEND Y ARQUITECTURA UX/UI (V1)

**Producto:** IC360-NEXUS (Industrial Control 360)  
**Marco de Referencia:** Sincronización entre Spark V2, Antigravity V1 y Análisis Competitivo V1  
**Autor:** Antigravity AI / Staff UX Architect  
**Fecha:** `2026-08-11`  
**Estatus:** `APROBADO PARA SPRINT DE CONVERGENCIA UX/UI`  

---

## 📑 MATRIZ MAESTRA DE DECISIONES FRONTEND CON ELEMENTO DE FIRMA INDUSTRIAL

| Área / Dominio | Decisión Elegida | Justificación Técnica | Alternativa Descartada | Elemento de Firma Industrial (Diferenciador vs SaaS Genérico) |
|---|---|---|---|---|
| **Design Tokens & Palette** | **Tailwind v4 (CSS-first) + HSL Tailored (Slate + Steel Blue + Industrial Amber)** | Cero overhead en JS runtime, dynamic dark mode, contraste AAA para exteriores soleados de refinería. | Tailwind predeterminado con colores genéricos (blue-500/red-500). | **COMMODITY ELEVADO:** Sistema de paleta con códigos ISO 3864 de contraste industrial (Safety Yellow / Emergency Orange). |
| **Typography System** | **Inter + JetBrains Mono (Código / WBS / Tagging)** | Lectura óptica clara en pantallas industriales y formateo tabular estricto para tags normativos. | System UI Fonts por defecto. | **ELEMENTO DE FIRMA:** Formateo monotipo de código de tag `TAG-ISO-3864` y folios de contrato. |
| **Component Architecture** | **Shadcn/UI Base + Headless UI + Custom Industrial Widgets** | Control total del DOM, accesibilidad ARIA nativa y empaquetado ultra ligero (<15 KB). | Ant Design / MUI (librerías pesadas monolithic >300 KB). | **ELEMENTO DE FIRMA:** Widgets propios de instrumentación, cuadrantes SIHO-PTW y visor de dosimetría de soldadura. |
| **Dashboard Layout** | **Density Compact (8px Grid) + Split View A4 Canvas** | Maximiza la densidad de información operativa reduciendo scroll en laptops en campo. | Layouts expandidos tipo landing page con tarjetas gigantes. | **ELEMENTO DE FIRMA:** Split View A4 WYSIWYG interactivo con previsualización de firma y QR normativo en tiempo real. |
| **State Management** | **Zustand + TanStack Query v5** | Estado global ultra eficiente sin re-renders innecesarios en tablas de 1,000+ renglones. | Redux Toolkit / Context API directo. | **ELEMENTO DE FIRMA:** Caché desacoplada offline-first de firmas encriptadas y estados de permiso en campo. |
| **Form & Validation** | **React Hook Form + Zod Schemas Strict** | Validación reactiva al instante con cero lag en entradas complejas de ingeniería. | Formik / Validación JS sin tipos. | **ELEMENTO DE FIRMA:** Schemas de validación normativos integrados con rangos ASME/API (e.g., presión PSI en prueba hidrostática). |
| **Auditoría & Trazabilidad** | **Cryptographic Audit Chain (SHA-256 Hashes)** | Garantiza el no repudio de aprobaciones de seguridad en sitio. | Logs de base de datos tradicionales mutables. | **ELEMENTO DE FIRMA:** Bloque de firma inmutable con sello de tiempo RFC 3161 y hash visible en pie de página A4. |
| **Iconography** | **Lucide React + Custom Industrial SVG Icons** | Iconografía uniforme, configurable por CSS y peso mínimo en bundle. | FontAwesome completo (bundle excesivo). | **ELEMENTO DE FIRMA:** Íconos de EPP (Equipos de Protección Personal) e iso-símbolos de riesgo caliente/frío. |

---

## 🏆 COMPONENTES DE FIRMA IC360 (INVENTARIO EXCLUSIVO PROPIETARIO)

Componentes de interfaz y flujo verificados contra `COMPETITIVE-ANALYSIS-IC360-V1.md` que **NO existen en ningún software competidor del mercado**:

### 1. Split View A4 WYSIWYG con Hash SHA-256 + QR en Vivo
- **Qué lo hace único:** Permite visualizar en el panel derecho exactamente la hoja de permiso A4 o acta APU foliada a escala real mientras se completa el formulario a la izquierda, generando el código QR dinámico y el Hash SHA-256 de verificación en tiempo real.
- **Estándar Normativo de Respaldo:** Ley de Mensajes de Datos y Firmas Electrónicas (VE) + ISO 27001.
- **Sprint UX de Construcción:** `Sprint UX-1`.

### 2. Semáforo Quad-Status Normativo
- **Qué lo hace único:** Sustituye el badge de estado binario por un indicador visual de 4 cuadrantes (Verde: Aprobado | Amarillo: En Revisión | Rojo: Suspendido/Peligro | Azul: Cerrado/Concluido) que responde a la matriz de riesgo SIHO-A.
- **Estándar Normativo de Respaldo:** PDVSA SI-S-20 / ISO 3864.
- **Sprint UX de Construcción:** `Sprint UX-1`.

### 3. Modal Tríada PTS → ART → PTW Interconectado
- **Qué lo hace único:** Modal unificado que encadena de manera dependiente el Procedimiento Técnico de Trabajo Seguro (PTS), el Análisis de Riesgo en el Trabajo (ART) y el Permiso de Trabajo (PTW). No se puede emitir el PTW sin las firmas previas del ART.
- **Estándar Normativo de Respaldo:** PDVSA IR-S-04 y IR-S-17.
- **Sprint UX de Construcción:** `Sprint UX-2`.

### 4. Libro de Obra Foliado Digital con Firmas Bipartitas
- **Qué lo hace único:** Cuaderno digital con folios correlativos infalsificables, captura de geolocalización GPS, firma del Inspector PDVSA y del Gerente de Obra Contratista, y trazabilidad inmutable.
- **Estándar Normativo de Respaldo:** COVENIN 2000 y Manual de Construcción PDVSA.
- **Sprint UX de Construcción:** `Sprint UX-2`.

### 5. Command Bar con Comprensión de WBS / Tags / Normas PDVSA (`Ctrl+K`)
- **Qué lo hace único:** Paleta de comandos omnipresente que interpreta expresiones como `wbs 1.2.3`, `tag PIPING-01` o `norma SI-S-20`, llevando al operador directamente a la vista o documento específico en menos de 200 ms.
- **Estándar Normativo de Respaldo:** Criterios de Usabilidad Industrial Nielsen-Norman.
- **Sprint UX de Construcción:** `Sprint UX-3`.
