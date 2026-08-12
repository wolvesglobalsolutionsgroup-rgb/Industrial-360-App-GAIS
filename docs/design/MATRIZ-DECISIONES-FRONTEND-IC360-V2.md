# MATRIZ DE DECISIONES DE FRONTEND Y ARQUITECTURA UX/UI (V2)

**Producto:** IC360-NEXUS (`Industrial-360-App`)  
**Estatus:** Especificación de Producción V2 — Diseñada para Entornos Industriales  
**Fecha:** Agosto 2026  
**Enfoque de Diseño:** High Performance HMI / ISO 9241-110 / PDVSA SI-S-20  

---

## 📑 1. MATRIZ MAESTRA DE DECISIONES REFINADAS

| Área / Dominio | Decisión Elegida | Justificación Técnica & Normativa | Alternativa Descartada | Elemento de Firma Industrial (Diferenciador Exclusivo) |
|---|---|---|---|---|
| **Paleta de Colores** | **Slate Navy Base (Modo Oscuro) + Azul PDVSA Institucional (`#0066A1`) + High Performance HMI Color Standard** | Diseño de alto contraste guiado por el estándar High Performance HMI. El color se reserva exclusivamente para estados anómalos o alertas de riesgo, evitando la fatiga visual en turnos nocturnos y luz solar en campo. | Paletas genéricas con tonos brillantes no industriales (Safety Yellow / Emergency Orange extendido en toda la UI). | **ELEMENTO DE FIRMA:** Fondo Slate Navy anti-fatiga con acentos Azul PDVSA (`#0066A1`) y semáforo de riesgo circunscrito. |
| **Iconografía Industrial** | **Lucide React + Símbolos de Seguridad ISO 7010 + ISA-5.1 (P&ID) + EPP COVENIN 2240** | Iconografía técnica certificada. Los íconos de EPP y riesgos son diseñados por Spark en Figma/SVG y exportados a `src/components/icons/industrial/`. | Íconos genéricos de librería comercial (FontAwesome / Material Icons). | **ELEMENTO DE FIRMA:** Set vectorizado de Equipos de Protección Personal (Casco, Guantes, Gafas, Detección de Gas) bajo COVENIN 2240. |
| **Widgets de Instrumentación** | **Componentes de Medición Técnica Industrial:**<br>1. Gauge de Presión (0-3000 PSI)<br>2. Trend de Temperatura (24h)<br>3. Semáforo Multi-Gas (LEL, O2, H2S, CO)<br>4. Indicador de Torque en Bridas | Renderizado reactivo mediante Canvas/SVG ligero. Datos conectados en tiempo real a Firestore (`/tenants/{tenantId}/telemetry/`) con frecuencia de actualización de 1 a 5 segundos. | Gráficos genéricos de barra o pastel orientados a e-commerce/ventas. | **ELEMENTO DE FIRMA:** Widget Semáforo de Gas Cuadriverificable (LEL, O2, H2S, CO) con umbrales normativos PDVSA. |
| **Command Bar (`Ctrl+K`)** | **Paleta de Comandos Industrial con Sintaxis Estructurada:**<br>- `wbs:1.2.3`<br>- `tag:PIPING-01`<br>- `norma:SI-S-20`<br>- `ptw:2026-00412`<br>- `firma:pendiente` | Búsqueda difusa (fuzzy search) de fallback si no se ingresa prefijo, resolviendo navegaciones complejas en <200 ms. | Búsqueda simple por texto plano sin comprensión de etiquetas de ingeniería. | **ELEMENTO DE FIRMA:** Parsed Command Bar nativo que entiende la jerarquía de tags WBS y contratos petroleros. |
| **Formateo Tipográfico** | **Inter + JetBrains Mono (WBS / Tagging / Folios)** | Lectura óptica clara en pantallas de tabletas industriales rugerizadas y formateo tabular estricto para tags normativos. | Fuentes genéricas de sistema. | **ELEMENTO DE FIRMA:** Formateo monotipo estricto de código de tag `TAG-ISO-3864` y folios de contrato. |
| **Layout & Split View** | **Split View A4 WYSIWYG + Quad-Status Semaphore** | Mantiene en pantalla la hoja física del permiso A4 mientras se registran las firmas digitales en campo. | Layouts expandidos sin vista previa de documento legal. | **ELEMENTO DE FIRMA:** Document Canvas A4 interactivo con sello de tiempo RFC 3161 y QR normativo en vivo. |

---

## 🏆 2. DETALLE TÉCNICO DE WIDGETS DE INSTRUMENTACIÓN INDUSTRIAL

### A. Gauge de Presión Hidrostática / Neumática
- **Rango:** `0 - 3000 PSI`.
- **Zonas de Operación:** Verde (`0-2000 PSI` Normal), Amarillo (`2000-2500 PSI` Precaución), Rojo (`>2500 PSI` Peligro/Límite de Prueba ASME Boiler & Pressure Vessel Code).
- **Fuente de Datos:** Colección Firestore `/tenants/{tenantId}/inspections/{id}/telemetry`, campo `pressure_psi`.

### B. Trend de Temperatura de Proceso
- **Ventana:** Últimas 24 horas de operación continua.
- **Visualización:** Línea de tendencia continua con marca de Setpoint normativo.
- **Fuente de Datos:** Subcolección `/telemetry_history`, campo `temp_celsius`.

### C. Semáforo de Riesgo Atmosférico / Multi-Gas
- **Gases Monitoreados:** LEL (Límite Inferior de Explosividad %), O2 (Oxígeno %), H2S (Sulfhídrico PPM), CO (Monóxido PPM).
- **Umbrales PDVSA IR-S-04:** LEL > 0% (Rojo), O2 < 19.5% o > 23.5% (Rojo), H2S > 10 PPM (Rojo), CO > 25 PPM (Rojo).
- **Fuente de Datos:** Colección `/tenants/{tenantId}/ptw/{id}/gas_test`.

### D. Indicador de Torque de Embridado (QA/QC Piping)
- **Visualización:** Matriz circular de pernos con estado de apriete (Secuencia en Estrella conforme a ASME PCC-1).
- **Fuente de Datos:** Subcolección `/piping_joints/{jointId}/torque_log`.

---

## 🎛️ 3. SINTAXIS Y COMPORTAMIENTO DE COMMAND BAR (`Ctrl+K`)

La paleta de comandos interpreta prefijos normativos para acelerar la navegación del inspector en planta:

- `wbs:1.2.3` → Filtra instantáneamente la vista de avance físico por el ítem WBS `1.2.3`.
- `tag:PIPING-01` → Abre la ficha de integridad y pruebas del elemento marcado como `PIPING-01`.
- `norma:SI-S-20` → Despliega el visor PDF de la norma PDVSA SI-S-20 en la sección correspondiente.
- `ptw:2026-00412` → Abre directamente el Permiso de Trabajo con el número de folio especificado.
- `firma:pendiente` → Filtra la bandeja de entrada del usuario mostrando únicamente los documentos que requieren su firma digital.
- **Fallback Difuso:** Si el usuario escribe texto sin prefijo (ej. `bomba principal`), el sistema ejecuta un algoritmo de búsqueda difusa (Fuzzy Search) sobre títulos, tags y ubicaciones físicas.
