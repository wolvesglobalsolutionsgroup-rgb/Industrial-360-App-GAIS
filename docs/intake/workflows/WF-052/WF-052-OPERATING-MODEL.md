# Modelo Operativo Detallado: WF-052

**ID Workflow**: wf-052-instrumentacion-lazos-pid  
**Nombre Operativo**: Control, Calibración de Instrumentos y Prueba de Lazos P&ID  
**Estado**: PROPOSED_SPECIFICATION

---

## 1. Problema Operativo que Resuelve
Garantiza que la instrumentación de campo (transmisores de presión, temperatura, flujo, nivel, válvulas de control y alivio) funcione dentro de las tolerancias de precisión del diseño antes del arranque del proceso, evitando disparos en falso, fallas de salvaguarda o accidentes operacionales.

---

## 2. Actores y Roles

| Rol | Función | Responsabilidad |
|---|---|---|
| **INSTRUMENT_TECHNICIAN** | Técnico de Instrumentación | Realiza la calibración física en banco o campo y registra las lecturas de los 5 puntos. |
| **INC_ENGINEER** | Especialista I&C | Revisa los cálculos de error %FS, patrones utilizados y curvas de histéresis. |
| **QAQC_INSPECTOR** | Inspector de Calidad | Valida la prueba del lazo P&ID, sellos de calibración y firman el certificado. |
| **OPERATOR_CUSTODIAN** | Custodio Operativo | Recibe el lazo calibrado y firma la aceptación para integración al sistema DCS/SCADA. |

---

## 3. Manejo de Excepciones
* **Fuera de Tolerancia**: Si el error medido supera la tolerancia %FS, el sistema marca WARNING_OUT_OF_TOLERANCE. El técnico puede ajustar el cero/span con comunicador HART y re-ensayar sin cancelar la instancia.
