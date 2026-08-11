# Especificación del Dashboard de Permisos y QA/QC 360°

**Ruta Buffer**: `docs/inbox_specs/dashboard_qaqc_ptw/DASHBOARD_QAQC_PTW_SPEC.md`  
**Estado**: PROPOSED_SPECIFICATION  
**Propósito**: Definir la pantalla consolidada de permisoría, seguridad industrial (SIHO-A) y control de calidad (QA/QC) organizada por proyecto y WBS.

---

## 1. Arquitectura de Pantalla y Componentes

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ BARRA SUPERIOR DE FILTROS & KPIS                                                      │
│ Proyecto Activo: Reemplazo Propanoducto Cardón-Amuay | Work Package: PKG-MEC-2026-01   │
│ KPIs: [8 Permisos Activos]  [24 Calibraciones/NDT]  [0 Bloqueos SIHO]                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TABLA DE CONTROL CON SEMÁFOROS QUAD-STATUS                                             │
│                                                                                        │
│ WBS | Equipo | PTS (SI-S-20) | ART (IR-S-17) | Calibración (WF-052) | PTW (IR-S-04) | Acciones
│ ────────────────────────────────────────────────────────────────────────────────────── │
│ ACT-101 | PT-101A | 🟢 Aprobado | 🟢 Divulgado | 🟢 Conforme (0.12%FS)| 🟢 Emitido   | [Ver Tríada] [Preview]
│ ACT-102 | LOTO-02 | 🟢 Aprobado | 🟢 Divulgado | 🟢 Conforme          | 🟡 En Revisión| [Revisar]
│ ACT-103 | P-01    | 🟢 Aprobado | 🟡 Cambios   | 🔴 Descalibrado (>0.5)| 🔴 Bloqueado | [Ver Alerta]
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Código de Colores y Significado de Semáforos

* **🟢 VERDE (Conforme / Aprobado)**: PTS aprobado, ART divulgado a cuadrilla (100% firmas), Calibración dentro de tolerancia %FS, Permiso PTW emitido con 0% LEL.
* **🟡 AMARILLO (Advertencia / En Revisión)**: Cambios en campo registrados en ART (Preguntas 25.A-E en 'SI'), Permiso en prórroga (<2h), Calibración cerca del límite de tolerancia.
* **🔴 ROJO (Bloqueo / Desviación Crítica)**: Gas inflamable detectado (>0% LEL), Oxígeno fuera de rango, Instrumento fuera de tolerancia (%FS > max), ART sin divulgación.
* **⚪ GRIS (No Aplica)**: Especialidad no requerida para la actividad.

---

## 3. Modal Unificado de Tríada de Seguridad y Calidad (`[ Ver Tríada ]`)

Despliega un contenedor de pestañas con navegación fluida:
* `[ 1. PTS (SI-S-20) ]`: Procedimiento técnico de ejecución.
* `[ 2. ART (IR-S-17) ]`: Matriz de peligros y firmas de la cuadrilla en sitio.
* `[ 3. Calibración (WF-052) ]`: Tabla de 5 puntos e histéresis.
* `[ 4. Permiso (IR-S-04) ]`: Permiso impreso con prueba de gases y firmas tripartitas.
