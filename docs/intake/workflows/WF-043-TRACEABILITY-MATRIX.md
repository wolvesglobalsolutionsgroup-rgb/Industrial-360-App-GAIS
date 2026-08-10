# WF-043: MATRIZ DE TRAZABILIDAD FUENTE vs CÓDIGO & CONFLICTOS

**Documento Base:** PDVSA IR-S-04 — *Sistema de Permisos de Trabajo*, Rev. 4 (Agosto 2013).  
**Código Auditado en GitHub:** `Industrial-360-App-GAIS` (`src/pages/SihoPtw.tsx`, `src/pages/LotoIsolation.tsx`, `src/lib/domain/`).

---

## 1. AUDITORÍA DE TRAZABILIDAD Y ESTADOS DE HALLAZGO

| Elemento / Campo Auditado | Exigencia en PDF PDVSA IR-S-04 | Estado en Repo GitHub GAIS | Estado de Trazabilidad | Conflicto / Riesgo Detectado |
|---|---|---|:---:|---|
| **Formato Anexo A Renglones 1-23** | 23 renglones específicos normados (§8.8, Pág. 33) | `SihoPtw.tsx` tiene campos genéricos simplificados | `CONFLICTED` | Faltan campos normados (MDC, Desvíos Tag, pruebas tóxicas completas). |
| **Duración Máxima Permiso** | Max 8h continuo / Max 12h paradas (§8.4.1, 8.4.2) | Campo de texto de horas libre sin restricción | `CONFLICTED` | Riesgo de emisión de permisos con validez excesiva sin alerta. |
| **Prórroga Única (Max 2h)** | Max 1 prórroga por max 2 horas (§8.5) | Sin lógica de control de prórroga única | `CONFLICTED` | Permite extensión indeterminada de vigencia. |
| **Prueba de Gas Explosividad** | Premisa 0% LEL en caliente (§8.3.6) | Entrada numérica sin validación de umbral | `CONFLICTED` | No emite advertencia si LEL >0%. |
| **Certificados Especiales B-L** | 11 Anexos específicos normados (Págs. 36-69) | `SihoPtw.tsx` muestra lista estática sin sub-formularios | `CONFLICTED` | No captura los renglones específicos de excavación, izamiento, etc. |
| **Firma Tripartita (Emisor/Receptor/Ejecutor)** | Obligatoria en Otorgamiento, Prórroga y Cierre (§8.1.2.g) | Un solo botón de aprobación sin rol diferenciado | `CONFLICTED` | Rompe la corresponsabilidad tripartita requerida por la norma. |
| **Notificación a Trabajadores** | Constancia escrita requerida (§8.1.2.f) | Ausente en la UI actual | `CONFLICTED` | Falta evidencia de divulgación de riesgos en sitio. |
| **Prerrequisito Calificación Contratista SI-S-04** | Calificación APTA + Plan Específico SIHOA aprobados antes de inicio (§6.6, §7.5.4) | Sin validación previa de estatus de contratista en UI | `CONFLICTED` | Riesgo de emisión de PTW a contratistas sin calificación APTA o sin Plan SIHOA. |
