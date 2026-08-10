# WF-053: PROPUESTA UX/UI MODERNA Y ASISTIDA (WIZARD DE CIERRE)

**Documentos Base:** PDVSA PIC-03-01-09, PIC-03-01-16, PIC-03-01-19, PIC-03-01-13.

---

## 1. VISTA DE ASISTENTE PASO A PASO (WIZARD DE 9 CAPAS)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 🏗️ IC360 NEXUS — COMPLETACIÓN MECÁNICA Y VALUACIONES (PDVSA PIC)       │
├─────────────────────────────────────────────────────────────────────────┤
│ PASOS: [1. Libro Obra] ➔ [2. Cómputos] ➔ [3. ACCC] ➔ [4. HES SAP] ➔ [5. Actas A/B/C]│
├─────────────────────────────────────────────────────────────────────────┤
│ CONTRATO: CT-2026-0045   OBRA: REEMPLAZO TRAMO OLEODUCTO 30" BAHÍA JUSEPÍN│
│ CONTRATISTA: PROINTECA N.V.              ESTATUS LIBRO: [🟢 AL DÍA (Folio 145)]│
├─────────────────────────────────────────────────────────────────────────┤
│ 📊 VALUACIÓN N°: [ Valuación N° 04 - Parcial ]                          │
│   • Período: 2026-07-01 al 2026-07-31                                   │
│   • Monto Valuado Bruto: [ $ 145,200.00 USD ]                          │
│   • Retención 5% Fiel Cumplimiento: [ $ 7,260.00 USD ]                  │
│   • HES SAP Liberada: [ HES # 100458921 ] ➔ (Firmado por Administrador) │
├─────────────────────────────────────────────────────────────────────────┤
│ 🔩 PUNCH LIST DE COMPLETACIÓN MECÁNICA (PIC-03-01-09):                  │
│   • Pendientes Catálogo A (Operativos): [ 0 PENDIENTES - PUNCH LIST CERO ] │
│   • Pendientes Catálogo B (Pintura/Limpieza): [ 2 Ítems Programados ]   │
│   • Memorandum Anexo A: [✓ Enviado 2026-08-05]                          │
│   • Acta Anexo B (Completación): [✓ Firmada 2026-08-08]                 │
│   • Acta Anexo C (Recepción Provisional): [✓ Firmada 2026-08-10]        │
├─────────────────────────────────────────────────────────────────────────┤
│ 📐 PLANOS AS-BUILT (PIC-03-01-13):                                      │
│   • Planos Cotejados contra RFI PIC-03-01-12: [ 100% Ratificados ]     │
├─────────────────────────────────────────────────────────────────────────┤
│ ✍️ FIRMAS TRIPARTITAS DE CIERRE EN SITIO:                                │
│   [ Firma Residente: J. Silva ] [ Firma Inspector: M. Torres ] [ Firma Custodio: R. Gómez ]│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. ESPECIFICACIÓN UX/UI DE PREVISUALIZACIÓN DOCUMENTAL Y BRAND KIT

### 2.1 Vista Previa de Valuaciones y Actas A, B, C
El asistente de cierre incluye la pestaña **[👁️ Previsualizar Expediente / PDF/A]** antes de la firma.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 👁️ PREVISUALIZACIÓN OFICIAL — DOSSIER Y ACTAS (PDVSA PIC-03-01-09/19)  │
├─────────────────────────────────────────────────────────────────────────┤
│ [LOGOS]                                                                 │
│   • Logo Operador (PDVSA): [🟢 VISIBLE POR DEFECTO]                     │
│   • Logo Contratista:      [🔴 OCULTO POR DEFECTO (Configurable)]       │
├─────────────────────────────────────────────────────────────────────────┤
│ [VISTA PREVIA COMPARTIDA EN TIEMPO REAL - RESIDENTE, INSPECTOR Y CUSTODIO]│
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ [LOGO OPERADOR]   ACTA DE RECEPCIÓN PROVISIONAL (ANEXO C)         │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ CONTRATO N°: CT-2026-0045   EMPRESA: PROINTECA N.V.              │  │
│  │ OBRA: REEMPLAZO TRAMO OLEODUCTO 30" BAHÍA JUSEPÍN                │  │
│  │ COMPLETACIÓN MECÁNICA: 100% ALCANZADA (PUNCH LIST CATÁLOGO A CERO)│  │
│  │ FIRMAS: [Ingeniero Inspector] [Custodio de Obra] [Contratista]   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│ ACCIONES: [✏️ Editar Datos]  [🖨️ Imprimir Borrador]  [✍️ Firmar y Inmutabilizar]│
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Variables de Estilo CSS para Plantilla de Previsualización (Brand Kit)
```css
:root {
  --brand-primary: #1e3a8a;       /* Color de títulos y barras principales */
  --brand-secondary: #0284c7;     /* Color de acentos o bordes destacados */
  --brand-bg-header: #e2e8f0;     /* Fondo de encabezados de tablas/secciones */
  --brand-text: #0f172a;          /* Color de texto principal */
  --show-operator-logo: block;    /* Visible por defecto */
  --show-contractor-logo: none;   /* Oculto por defecto */
}
```
