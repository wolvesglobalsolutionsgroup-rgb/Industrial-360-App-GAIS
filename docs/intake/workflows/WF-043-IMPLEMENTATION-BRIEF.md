# WF-043: BRIEF TÉCNICO DE ARQUITECTURA E IMPLEMENTACIÓN

**Workflow:** WF-043 — Sistema de Permisos de Trabajo  
**Documento Base:** PDVSA IR-S-04 Rev. 4 (Agosto 2013)  
**Estado:** ESPECIFICACIÓN DOCUMENTAL VERIFICABLE  

---

## 1. ESTRUCTURA DE MÓDULOS Y ENTIDADES PROPUESTAS

```text
src/
 ├── domain/
 │    └── ptw/
 │         ├── ptwDomain.ts           # Lógica pura de validaciones y estados PTW
 │         ├── ptwTypes.ts            # Tipos de dominio para Anexo A y Anexos B-L
 │         └── ptwAdvisoryRules.ts    # Reglas advisory (blocking: false)
 ├── pages/
 │    └── SihoPtwSpecView.tsx         # Vista renovada multi-paso de PTW
 └── services/
      └── ptw/
           ├── ptwDataService.ts      # Ingestión e integración Firestore / Databook
           └── ptwPdfExporter.ts      # Generador de entregable impreso ISO 19005-1
```

---

## 2. MODELO DE EVENTOS DEL DOMINIO
* `PTW_CREATED`: Permiso redactado con ART y Procedimiento adjunto.
* `GAS_TEST_RECORDED`: Prueba cuantitativa de gases registrada por Evaluador.
* `PTW_ISSUED`: Firmado y otorgado tripartitamente en sitio por Emisor, Receptor y Ejecutor.
* `PTW_EXTENDED`: Prórroga concedida por máximo 2h con re-prueba de gas.
* `PTW_CANCELLED`: Permiso anulado por variación de condiciones o emergencia.
* `PTW_CLOSED`: Permiso culminado en sitio con verificación de orden, limpieza y desaislamiento LOTO.

---

## 3. PRUEBAS REQUERIDAS DE COHERENCIA (TESTING BRIEF)
1. **Test de Regla Advisory CTL-PTW-01:** Verificar que la discrepancia entre hora de inicio y hora de gas test genera una alerta sin bloquear la interfaz.
2. **Test de Coincidencia de Anexos:** Verificar que seleccionar un certificado especial abre la estructura de datos del anexo correspondiente.
3. **Test de Trazabilidad Databook:** Confirmar que al cerrar un permiso, se genera la referencia dentro de `05.01_PERMISOS_DE_TRABAJO_PTW`.
