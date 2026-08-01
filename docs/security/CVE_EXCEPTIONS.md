# EXCEPCIONES Y VULNERABILIDADES EVALUADAS (CVE EXCEPTIONS)

## 1. Política de Excepciones de Seguridad

Todas las dependencias de producción de Industrial Control 360 son auditadas mediante `npm audit --omit=dev --audit-level=high`. 

Cualquier vulnerabilidad clasificada como **High** o **Critical** bloquea automáticamente el pipeline de CI, excepto si existe una excepción justificada y registrada formalmente en este documento por el Oficial de Seguridad / Arquitecto de Software.

---

## 2. Plantilla de Registro de Excepción

Toda excepción debe registrarse obligatoriamente con los siguientes campos:

```markdown
### [CVE-YYYY-XXXXX] - Nombre del Paquete
- **Paquete Afectado:** `nombre-del-paquete` @ `x.y.z`
- **Severidad:** High | Critical
- **CVSS Score:** X.X
- **Justificación Técnica:** Descripción detallada de por qué la vulnerabilidad no es explotable en la arquitectura actual de IC360 (ej. método no utilizado, entorno aislado, etc.).
- **Controles Mitigantes:** Validaciones o firewalls adicionales en lugar.
- **Fecha de Excepción:** YYYY-MM-DD
- **Fecha Límite de Revisión:** YYYY-MM-DD
- **Aprobado Por:** Rol / Nombre del Responsable
```

---

## 3. Excepciones Vigentes

### [GHSA-qwww-vcr4-c8h2] - react-router / react-router-dom
- **Paquete Afectado:** `react-router` @ `7.18.2` (`react-router-dom` @ `7.18.2`)
- **Severidad:** High
- **CVSS Score:** 7.5
- **Justificación Técnica:** La vulnerabilidad GHSA-qwww-vcr4-c8h2 afecta únicamente el modo de componentes de servidor de React (React Server Components / RSC Mode) cuando se usa la transmisión de acciones de servidor. Industrial Control 360 es una aplicación de página única (SPA) cliente pura empaquetada mediante Vite y servida en Express sin RSC ni Server Actions de React Router. Por lo tanto, el vector de ataque no es ejecutable en la arquitectura de IC360.
- **Controles Mitigantes:** La arquitectura es una SPA cliente servida mediante Vite y API REST en Express (`server.ts`). Todos los endpoints backend de IC360 pasan por la validación de tokens Bearer Firebase Auth y middleware de tasa de peticiones `rateLimit` y `authorizeServerSideRequest`.
- **Fecha de Excepción:** 2026-08-01
- **Fecha Límite de Revisión:** 2026-11-01
- **Aprobado Por:** Oficial de Seguridad / Arquitecto IC360

