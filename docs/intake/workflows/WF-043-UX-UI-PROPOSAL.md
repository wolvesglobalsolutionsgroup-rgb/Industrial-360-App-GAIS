# Rediseño de Experiencia de Usuario (UX/UI Proposal): `wf-043`

## 1. Crítica de la Interfaz Existente

* **Problema 1: Exceso de Densidad e Invasión Visual**: En la cabecera actual se incrustó una barra horizontal flotante con 16 botones numéricos crudos (`042`, `043`, `050`...), sin nombres ni contexto, lo que confunde al usuario de campo.
* **Problema 2: Redundancia de Títulos**: El nombre del flujo aparece repetido 2 y 3 veces seguidas en bloques consecutivos en pantalla.
* **Problema 3: Falta de Flujo Progresivo por Pasos**: La captura se presenta como una sábana larga de inputs sin separación por fases (Gabinete vs Campo vs Firmas).
* **Problema 4: Experiencia Móvil Deficiente**: La tabla de prueba de gases de 8 columnas no es responsive y se desborda en dispositivos móviles/tabletas de inspección.

---

## 2. Propuesta de Rediseño de Experiencia (UX/UI Moderna)

### A. Jerarquía de Navegación por Proyecto
Se elimina la navegación por números crudos. El acceso se organiza así:
> `Proyecto Activo` ➔ `Módulo SIHO-A` ➔ `Permisos de Trabajo PTW` ➔ `Instancia Concreta`

### B. Arquitectura de Pantalla en 3 Fases (Wizard Progresivo)

```text
┌────────────────────────────────────────────────────────────────────────┐
│ HEADER LIMPIO                                                          │
│ Breadcrumb: Proyecto Cardón-Amuay > SIHO-A > Permiso PTW-2026-00412    │
│ Título: Permiso de Trabajo en Caliente - Reemplazo de Tramo            │
│ Badge Estado: [ UNDER_REVIEW ]                                         │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│ BARRA DE PASOS PROGRESIVOS (PROGRESS STEPPER)                          │
│ [1. Pre-llenado Gabinete] ──▶ [2. Inspección Campo & Gases] ──▶ [3. Firmas & Emisión] │
└────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────┐
│ PASO 2: INSPECCIÓN EN CAMPO Y PRUEBA DE GASES                          │
│                                                                        │
│ ┌──────────────────────────────┐  ┌──────────────────────────────────┐ │
│ │ 14 Condiciones a Verificar   │  │ Prueba de Gases Multigas         │ │
│ │ [✓] Fuentes aisladas LOTO    │  │ Explosividad: [ 0.0 ] % LEL [OK] │ │
│ │ [✓] EPP adecuado en sitio    │  │ Oxígeno:      [ 20.9 ] % O2 [OK] │ │
│ │ [✓] Extintor en sitio        │  │ H2S:          [ 0.0  ] PPM  [OK] │ │
│ └──────────────────────────────┘  └──────────────────────────────────┘ │
│                                                                        │
│ Panel Advisory Hard Gates:                                             │
│ 🟢 Atmósfera Segura Comprobada (PDVSA IR-S-04 Secc. 8.3)              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes y Vistas Especializadas

1. **Selector Desplegable por Módulo y Fase**: Sustituye la barra de 16 números por un selector con búsqueda inteligente: `[Fase 4: SIHO-A] wf-043 Permisos PTW ▾`.
2. **Tablero Móvil de Prueba de Gases**: Vista de tarjetas con semáforos numéricos (Verde/Amarillo/Rojo) para lecturas de multigas adaptada a pantallas táctiles.
3. **Modal de Previsualización y Co-Branding**: Antes de firmar, el usuario previsualiza el documento con el doble membrete oficial (Operador a la izquierda, Contratista a la derecha) y el código QR de trazabilidad.
4. **Firma Digital Biométrica/Criptográfica**: Módulo táctil seguro para estampar la firma en sitio con sello de fecha, hora y georreferenciación GPS.
