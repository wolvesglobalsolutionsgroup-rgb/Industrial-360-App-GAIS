## Descripción del Cambio
<!-- Proporciona un resumen de los cambios implementados y la razón del cambio. -->

**Sprint / Sub-tarea:** SNN.N
**Formato de Titulo PR / Commit:** `feat(sNN.N): descripción breve`

---

## Lista de Verificación de Calidad y Seguridad (Release Gate)

Por favor confirma que se han cumplido los siguientes puntos antes de solicitar revisión:

- [ ] **Sin Hardcodes de Tenant:** Se verificó que no existen fallbacks hardcodeados (`semax_pino`, `PROJ-001`, etc.) mediante `npm run audit:no-hardcoded-tenant`.
- [ ] **Multi-tenant Server-Side:** Todos los endpoints y funciones en Cloud Functions validan la pertenencia a la organización (`orgId`) mediante `authorizeServerSideRequest`.
- [ ] **Sin Secretos en Código:** Se confirmó que no hay llaves API, tokens ni privados expuestos en `src/` ni en el historial de commits.
- [ ] **Verificación de Tipos & Lint:** `npm run lint` y `npx tsc --noEmit` se ejecutan sin errores.
- [ ] **Batería de Pruebas:** `npm run test:all` pasa en verde (100% de tests unitarios y reglas de Firestore/Storage).
- [ ] **Auditoría de Dependencias:** `npm audit --omit=dev --audit-level=high` finaliza con 0 vulnerabilidades no documentadas.
- [ ] **Cero Hallazgos P0/P1:** No existen problemas de seguridad críticos o altos abiertos.
