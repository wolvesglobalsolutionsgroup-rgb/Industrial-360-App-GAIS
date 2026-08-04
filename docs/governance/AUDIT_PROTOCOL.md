# Protocolo de Auditoría y Verificación de Entregas — IC360

## 1. Principios Fundamentales de Verificación

El ciclo de vida del software en **Industrial Control 360 (IC360)** se rige por el principio de **verificación empírica e independiente**.

1. **La comunicación no es evidencia:** Un mensaje en chat, reporte en texto o conjunto de cambios locales no equivale a una entrega ni demuestra el estado real del software.
2. **GitHub publicado es la referencia única de auditoría:** Solo los commits publicados en la rama `main` del repositorio remoto (`origin/main`) y validados por el pipeline de Integración Continua (GitHub Actions) se consideran candidatos para auditoría.
3. **Impedimentos bloqueantes (Stop-the-Line):** Cualquier vulnerabilidad P0/P1 abierta, inclusión de secretos o tokens reales, evidencia falsificada o salteo de pruebas automáticas bloquea inmediatamente el cierre de cualquier sprint o hallazgo.

---

## 2. Flujo Cannónico de 7 Etapas hacia el Estado CLOSED

```
[1. Preflight y Alcance]
         │
         ▼
[2. Implementación Local GAIS]
         │
         ▼
[3. Auto-checklist y Pruebas Reproducibles]
         │
         ▼
[4. Publicación Manual por el Fundador (Freddy)]
         │
         ▼
[5. Auditoría Independiente sobre SHA Remoto]
         │
         ▼
[6. Gate Funcional Humano / Fundador]
         │
         ▼
[7. Actualización del Ledger ──► CLOSED]
```

---

## 3. Descripción Detallada de las 7 Etapas

### Etapa 1: Preflight y Definición de Alcance
- **Responsable:** GAIS / Fundador.
- **Acción:** Inspección del árbol local y remoto, verificación de árbol limpio, confirmación de SHA base en `main` y definición estricta del alcance de archivos permitidos.

### Etapa 2: Implementación Local por GAIS
- **Responsable:** GAIS.
- **Acción:** Edición del código siguiendo estrictamente las reglas de arquitectura multi-tenant, seguridad Zero-Trust y sin datos falsos ni mockups no documentados.

### Etapa 3: Auto-Checklist y Pruebas Reproducibles
- **Responsable:** GAIS.
- **Acción:** Ejecución completa de la suite de validación local (`npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run test:rules`, `npm run build`, `npm run validate:sprint-ledger`).
- **Criterio:** Salida 100% limpia sin advertencias o errores. Se registran los resultados empíricos sin alterar el estado a `CLOSED`.

### Etapa 4: Publicación Manual por el Fundador (Freddy)
- **Responsable:** Fundador (Freddy).
- **Acción:** Revisión manual del `git diff`, staging atómico, creación del commit con mensaje estándar y `git push origin main`.
- **Resultado:** Generación de un SHA de commit de 40 caracteres en GitHub remoto y disparador de GitHub Actions CI.

### Etapa 5: Auditoría Independiente basada en SHA Remoto
- **Responsable:** Auditor Independiente / CI Remoto.
- **Acción:** Verificación de los 4/4 checks de GitHub Actions y revisión independiente del diff publicado en el SHA remoto.
- **Resultado:** Confirmación de que el código remoto cumple con todas las políticas de seguridad y calidad.

### Etapa 6: Gate Funcional Humano del Fundador
- **Responsable:** Fundador (Freddy).
- **Acción:** Verificación en el entorno desplegado de que la funcionalidad responde a las necesidades del cliente y de operación en campo.

### Etapa 7: Actualización del Ledger y Cierre (`CLOSED`)
- **Responsable:** GAIS / Auditoría.
- **Acción:** Registro final en `SPRINT_LEDGER.md` vinculando el SHA publicado, la evidencia de CI, la firma de auditoría y la aprobación del gate. Solo en este momento el estado cambia a `CLOSED`.

---

## 4. Criterios de Bloqueo Inmediato (`BLOCKED`)

El proceso se detiene y se declara `BLOCKED` de inmediato si se detecta alguno de los siguientes eventos:
- Presencia de claves privadas, API keys, tokens JWT o credenciales reales en código o documentación.
- Modificaciones no autorizadas en `firestore.rules`, `storage.rules`, `server.ts` o variables de entorno.
- Incompatibilidad en compilación o fallos en pruebas unitarias/emulador.
- Falsificación de SHAs, evidencia de CI o aseveraciones de cumplimiento normativo sin enlace de prueba.
