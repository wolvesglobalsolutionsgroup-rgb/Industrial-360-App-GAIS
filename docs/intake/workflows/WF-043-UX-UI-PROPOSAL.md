# WF-043: PROPUESTA DE UX/UI MODERNA Y USABLE (RESPETANDO EL PROCESO REAL)

**Documento Base:** PDVSA IR-S-04 — *Sistema de Permisos de Trabajo*, Rev. 4 (Agosto 2013).

---

## 1. EVALUACIÓN DE UX/UI ACTUAL EN REPOSITORIO GITHUB (`src/pages/SihoPtw.tsx`)
* **Problema 1 (Formulario Plano):** Muestra un formulario extenso monolítico que no guía al usuario según las 7 etapas del proceso real (Planificación → Preparación → Gas Test → Firma → Cierre).
* **Problema 2 (Sin Contexto de Certificados Especiales):** Marcar un certificado especial (ej. Excavación Anexo E) no despliega el sub-formulario correspondiente con las firmas de los supervisores de servicios.
* **Problema 3 (Falta de Visibilidad de Roles):** No diferencia claramente las acciones del Emisor, Receptor y Ejecutor en las distintas fases del ciclo de vida.

---

## 2. PROPUESTA DE UX/UI RECONSTRUIDA PARA IC360-NEXUS

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 🛡️ IC360 NEXUS — SISTEMA DE PERMISOS DE TRABAJO (PDVSA IR-S-04)        │
├─────────────────────────────────────────────────────────────────────────┤
│ PASOS: [1. Planificación] ➔ [2. Preparación & Gas] ➔ [3. Firmas] ➔ [4. Cierre]│
├─────────────────────────────────────────────────────────────────────────┤
│ TIPO: [🔴 EN CALIENTE]   ORDEN SAP: 4500123891   N° PERMISO: PTW-2026-0089│
│ UBICACIÓN: Planta Compresora Jusepín / Tren A / K-101                   │
├─────────────────────────────────────────────────────────────────────────┤
│ 📄 DOCUMENTOS ASOCIADOS:                                                │
│   • ART No: ART-2026-0412 (PDVSA IR-S-17) [✓ Verificado]                │
│   • Procedimiento No: PROC-MEC-014 (PDVSA SI-S-20) [✓ Verificado]        │
│   • LOTO No: LOTO-LOCK-014 (PDVSA SI-S-28) [✓ Verificado]               │
├─────────────────────────────────────────────────────────────────────────┤
│ 🧪 PRUEBA DE GASES (EN SITIO):                                          │
│   • Explosividad: [ 0.0 % LEL ] ➔ (Verificado 0% LEL)                   │
│   • Oxígeno:      [ 20.9 % v/v ] ➔ (Rango Seguro 19.5 - 23.5%)          │
│   • H2S:          [ 0 ppm ]     ➔ (Límite < 10 ppm)                     │
│   • Evaluador: Carlos Pérez (C.I. 14.521.890) - Calibración Exp: 2026-09│
├─────────────────────────────────────────────────────────────────────────┤
│ 📋 CERTIFICADOS ESPECIALES REQUERIDOS:                                  │
│   [✓] Anexo B (Espacios Confinados) ➔ [Abrir Sub-formulario Anexo B]     │
│   [✓] Anexo C (Izamiento de Cargas) ➔ [Abrir Sub-formulario Anexo C]     │
├─────────────────────────────────────────────────────────────────────────┤
│ ✍️ OTORGAMIENTO Y FIRMAS EN SITIO (TRIPARTITO):                         │
│   [ Firma Emisor: J. Silva ] [ Firma Receptor: M. Torres ] [ Firma Ejecutor: R. Gómez ]│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. MEJORAS DE USABILIDAD (RESPETANDO LA NORMA REQUISITO A REQUISITO)
1. **Asistente Paso a Paso (Wizard):** Navegación fluida por etapas normativas evitando omisión de campos obligatorios.
2. **Despliegue Dinámico de Anexos B-L:** Al activar un certificado especial, el sub-formulario del anexo se precarga automáticamente en pestañas paralelas.
3. **Indicador de Estado Advisory:** Avisos visuales flotantes (Advisory, `blocking: false`) para alertar sobre pruebas de gas fuera de rango o vencimiento de vigencia.
