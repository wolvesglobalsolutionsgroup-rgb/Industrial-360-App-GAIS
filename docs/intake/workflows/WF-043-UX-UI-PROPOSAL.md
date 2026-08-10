# Propuesta UX/UI — WF-043: Permiso de Trabajo Seguro PTW (PDVSA IR-S-04)

## 1. Asistente Multi-paso Asistido (Wizard de 9 Capas)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 🛡️ IC360 NEXUS — PERMISOS DE TRABAJO (PDVSA IR-S-04 / SI-S-04)        │
├─────────────────────────────────────────────────────────────────────────┤
│ PASOS: [1. Elegibilidad] ➔ [2. Pre-Inicio] ➔ [3. Anexo A] ➔ [4. Anexos B-L] ➔ [5. Firmas]│
├─────────────────────────────────────────────────────────────────────────┤
│ CONTRATISTA: CONTRATISTA VENEZUELA C.A.   ESTATUS: [🟢 APTA (Validez 2027)]│
│ PLAN SIHOA: [✓ Aprobado 2026-08-01]       NOTIFICACIÓN HO-H-16: [✓ Compl]│
├─────────────────────────────────────────────────────────────────────────┤
│ TIPO PERMISO: [🔴 EN CALIENTE]   ORDEN SAP: 4500123891   N°: PTW-2026-0089│
│ UBICACIÓN: Planta Compresora Jusepín / Tren A / K-101                   │
├─────────────────────────────────────────────────────────────────────────┤
│ 🧪 PRUEBA DE GASES EN SITIO:                                            │
│   • Explosividad: [ 0.0 % LEL ] ➔ (Verificado 0% LEL - HARD BLOCK)      │
│   • Oxígeno:      [ 20.9 % v/v ] ➔ (Rango Seguro 19.5 - 23.5%)          │
│   • H2S:          [ 0 ppm ]     ➔ (Límite < 10 ppm)                     │
│   • Evaluador: Carlos Pérez (C.I. 14.521.890) - Calibración Exp: 2026-09│
├─────────────────────────────────────────────────────────────────────────┤
│ 📋 CERTIFICADOS ESPECIALES ACTIVOS (DESPLIEGUE DINÁMICO):               │
│   [✓] Anexo B (Espacios Confinados) ➔ [Tab Anexo B: Recipiente K-101]    │
│   [✓] Anexo L (Soldadura Específica) ➔ [Tab Anexo L: EPS-WELD-04]       │
├─────────────────────────────────────────────────────────────────────────┤
│ ✍️ FIRMAS TRIPARTITAS EN SITIO:                                          │
│   [ Firma Emisor: J. Silva ] [ Firma Receptor: M. Torres ] [ Firma Ejecutor: R. Gómez ]│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. ESPECIFICACIÓN UX/UI DE PREVISUALIZACIÓN DOCUMENTAL Y BRAND KIT

### 3.1 Vista Previa de Permiso de Trabajo (Anexo A)
El asistente Wizard incluye la pestaña **[👁️ Previsualizar Documento Oficial]** antes del paso de firma.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 👁️ PREVISUALIZACIÓN OFICIAL — ANEXO A (PDVSA IR-S-04 REV 4)            │
├─────────────────────────────────────────────────────────────────────────┤
│ [LOGOS]                                                                 │
│   • Logo Operador (PDVSA): [🟢 VISIBLE POR DEFECTO]                     │
│   • Logo Contratista:      [🔴 OCULTO POR DEFECTO (Configurable)]       │
├─────────────────────────────────────────────────────────────────────────┤
│ [VISTA PREVIA COMPARTIDA EN TIEMPO REAL - VISTA EMISOR Y AUDITOR]       │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ [LOGO OPERADOR]   ANEXO A: PERMISO EN CALIENTE   [RESERVADO]     │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ 1. EN CALIENTE  2. ORDEN SAP: 4500123891  3. N°: PTW-2026-0089   │  │
│  │ 4. UBICACIÓN: Planta Compresora Jusepín / Tren A                │  │
│  │ 5. TRABAJO: Interconexión y soldadura de línea de 30"           │  │
│  │ 6. ART N°: ART-2026-088  7. PROC N°: PR-SOL-04                   │  │
│  │ 12. GASES: 0% LEL | 20.9% O2 | H2S 0ppm | Evaluador: C. Pérez    │  │
│  │ 17-19. FIRMAS TRIPARTITAS: [Emisor] [Receptor] [Ejecutor]          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│ ACCIONES: [✏️ Editar Datos]  [🖨️ Imprimir Borrador]  [✍️ Ir a Firma Final]│
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Variables de Estilo CSS para Plantilla de Previsualización (Brand Kit)
```css
:root {
  --brand-primary: #1e3a8a;       /* Color de títulos y barras principales */
  --brand-secondary: #0284c7;     /* Color de acentos o bordes destacados */
  --brand-bg-header: #e2e8f0;     /* Fondo de encabezados de tablas/secciones */
  --brand-text: #0f172a;          /* Color de texto principal */
  --show-operator-logo: block;    /* Visible por defecto */
  --show-contractor-logo: none;   /* Oculto por defecto en Anexo A */
}
```
