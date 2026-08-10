# WF-043: BRIEF TÉCNICO DE ARQUITECTURA E IMPLEMENTACIÓN

**Workflow:** WF-043 — Sistema de Permisos de Trabajo  
**Documento Base:** PDVSA IR-S-04 Rev. 4 (Agosto 2013)  
**Estado:** `BLOCKED_PENDING_SOURCE_RECONCILIATION`  

> [!WARNING]
> **ESTADO DE BLOQUEO DE IMPLEMENTACIÓN:**  
> La implementación de código de producción para los Certificados Especiales (Anexos B a L) se encuentra **BLOQUEADA** hasta completar la conciliación de fuentes primarias faltantes (`PDVSA HO-H-06`, `PDVSA SI-S-27/31`, `COVENIN 2247`, `PDVSA SI-S-29/32`). No se redactará ni modificará código hasta la recepción o aprobación formal de los umbrales normativos.

---

## 1. CLASIFICACIÓN DE COMPONENTES DEL DOMINIO

### A. REQUISITOS CONFIRMADOS (NORMATIVOS NORMA A NORMA)
* Formulario Anexo A (Renglones 1 al 23).
* Firma tripartita obligatoria (Emisor, Receptor, Ejecutor).
* Duración máxima de 8h continuas (ó 12h en paradas de planta).
* Prórroga única por máximo 2h.
* Regla de hora de inicio igual a la hora de prueba de gas.
* Límite de $0\% \text{ LEL}$ para trabajos en caliente.
* Prerrequisito de Contratista Calificado "APTA" y Plan SIHOA aprobado (PDVSA SI-S-04).

### B. PROPUESTAS DE PRODUCTO (IC360-NEXUS)
* Interfaz de asistente multi-paso (Wizard Planificación → Gas Test → Firmas → Cierre).
* Paquete digital inmutable en PDF/A para el Databook de Infraestructura (`05.01_PERMISOS_DE_TRABAJO_PTW`).
* Sistema de alertas Advisory para calibración de instrumentos multigas.

### C. INFERENCIAS TÉCNICAS
* La prueba de gas debe ser re-ejecutada en sitio si el trabajo en caliente se interrumpe por más de 1 hora o trabajo en frío por más de 2 horas (basado en §8.6.2).

### D. PUNTOS PENDIENTES (REQUIEREN FUENTE PRIMARIA)
* Umbrales numéricos de contaminantes tóxicos específicos en espacios confinados (`PDVSA HO-H-06`).
* Requisitos dimensionales y ángulos de talud en excavaciones (`COVENIN 2247`).
* Factores de seguridad de carga en andamios (`PDVSA SI-S-27/31`).
