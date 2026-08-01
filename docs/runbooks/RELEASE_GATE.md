# RELEASE GATE RUNBOOK — INDUSTRIAL CONTROL 360

## 1. Propósito y Alcance
Este documento define los criterios estrictos y no negociables que todo cambio de código debe cumplir antes de ser promovido y desplegado en el entorno de producción de Industrial Control 360 (IC360).

---

## 2. Criterios Bloqueantes de Liberación (Release Gates)

Para autorizar cualquier despliegue o merge a la rama principal (`main`), el cambio debe aprobar al 100% las siguientes compuertas:

### 🛑 Gate 1: Cero Hallazgos P0/P1 Abiertos
- **Regla Inmutable:** Ningún commit ni versión puede promocionarse a producción si existe una vulnerabilidad o defecto clasificado como **P0 (Crítico)** o **P1 (Alto)** abierto en las auditorías de código o análisis estáticos.
- En caso de encontrar un hallazgo P0/P1, el despliegue queda cancelado inmediatamente hasta que el hallazgo sea resuelto y verificado.

### 🛡️ Gate 2: Pipeline de Integración Continua (CI) Verde
El flujo de GitHub Actions (`CI Hardened Pipeline`) debe ejecutarse exitosamente en su totalidad sin ningún `continue-on-error: true` ni silenciador de errores:
1. **Instalación limpia (`npm ci`):** Verificación de integridad del árbol de dependencias (`package-lock.json`).
2. **Análisis Estático y Tipos (`npm run lint` & `tsc --noEmit`):** Cero errores de compilación de TypeScript tanto en root como en Cloud Functions.
3. **Auditoría de Hardcodes de Tenant & Secretos (`npm run audit:no-hardcoded-tenant`):** Verificación automatizada contra `semax_pino`, `PROJ-001`, fallbacks de tenant y llaves API expuestas.
4. **Auditoría de Seguridad de Dependencias (`npm audit --omit=dev --audit-level=high`):** Cero vulnerabilidades de severidad Alta o Crítica en dependencias de producción (salvo las explícitamente documentadas en `CVE_EXCEPTIONS.md`).
5. **Escaneo de Secretos (Gitleaks):** Detección automatizada de credenciales o tokens en el historial de commits.
6. **Batería de Pruebas (`npm run test:all`):** 100% de pruebas unitarias, reglas de Firestore y reglas de Storage pasando en verde en los emuladores locales.
7. **Generación de SBOM:** Exportación obligatoria del Inventario de Software (`sbom.json`) como artefacto de auditoría.

---

## 3. Política y Procedimiento de Rollback

En caso de detectarse un comportamiento anómalo en producción tras la liberación:

1. **Invalidez Inmediata:** Deshabilitar los tokens o portales de clientes afectados vía `revokeClientPortalToken`.
2. **Reversión de Commit:** Ejecutar un rollback limpio mediante revert en el repositorio sin alterar la historia canónica.
3. **Notificación:** Registrar el incidente en los logs de auditoría server-side (`organizations/{orgId}/audit_logs`).
