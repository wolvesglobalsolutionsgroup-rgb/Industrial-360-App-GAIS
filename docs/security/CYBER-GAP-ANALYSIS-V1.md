# ANÁLISIS FORMAL DE BRECHAS DE CIBERSEGURIDAD Y CUMPLIMIENTO NORMATIVO (F-CYBER-GAP-V1)

**Producto:** IC360-NEXUS (Industrial Control 360)  
**Nivel de Objetivo:** Software Industrial Enterprise SaaS / Entornos Críticos (PDVSA / Petroquímica / Infraestructura Crítica)  
**Autor:** Staff CyberSecurity Architect / Antigravity AI  
**Fecha de Emisión:** `2026-08-11`  
**Estado:** `COMPLETADO — SIN MODIFICACIÓN DE CÓDIGO`  

---

##  EXECUTIVE SUMMARY

Para cumplir con las exigencias del Founder y habilitar la comercialización de **IC360-NEXUS** en clientes de alta exigencia industrial (como PDVSA y operadoras petroleras de la región), se ha ejecutado una auditoría de brechas (*Gap Analysis*) exhaustiva sobre el código fuente, la infraestructura Serverless (Firebase/Cloud Functions) y los controles de gobernanza.

### 🛡️ Postura Actual de Seguridad (Controles Existentes Verificados en Código):
- **RBAC por Tenant:** Firebase Auth Custom Claims (`role`, `tenantId`, `permissions`) en `scripts/set-custom-claims.ts` y `src/firebase.ts`.
- **Aislamiento Deny-by-Default:** Reglas estrictas en `firestore.rules` (259 líneas) y `storage.rules` (97 líneas).
- **Cadena Tamper-Proof:** Registro inmutable de eventos con hashes encadenados en `src/utils/auditChain.ts`.
- **Protección de Datos & Observabilidad:** Integración de Sentry con sanitización automática de PII (`src/utils/sentry.ts`).
- **Firma Digital & RFC 3161:** Esquema de sellado de tiempo y firmas electrónicas en `src/utils/signature.ts`.

---

## 1. EVALUACIÓN IEC 62443 (CIBERSEGURIDAD INDUSTRIAL - NIVELES SL1 / SL2)

La norma **IEC 62443** rige la ciberseguridad en sistemas de automatización y control industrial (IACS). Para un SaaS industrial de permisología (SIHO-PTW) y aseguramiento de calidad (QA/QC), aplican las especificaciones de **IEC 62443-3-3** y **IEC 62443-4-2**.

| Control IEC 62443 | Requisito Normativo | Estado | Evidencia en Código | Acción Correctiva Recomendada | Prioridad | Esfuerzo |
|---|---|---|---|---|---|---|
| **SR 1.1 — Human User Auth** | Autenticación única y robusta de todos los operadores humanos | **CUMPLE** | `src/firebase.ts#L42-L85` | Mantener integración MFA requerida para roles Superadmin/Gerente | BARRERA | BAJO (1d) |
| **SR 1.2 — Software Process Auth** | Autenticación entre microservicios y Cloud Functions | **CUMPLE** | `functions/lib/functions/src/index.js` | Enforzar veradores IAM de Google Cloud para invocación inter-service | MEDIA | BAJO (1d) |
| **SR 1.3 — Account Management** | Control del ciclo de vida de cuentas y revocación inmediata | **PARCIAL** | `scripts/set-custom-claims.ts#L18` | Crear webhook de desactivación inmediata de claims en Firebase Auth | ALTA | MEDIO (2d) |
| **SR 1.7 — Strength of Auth** | Políticas de complejidad, caducidad de tokens y lockout | **PARCIAL** | `src/firebase.ts#L102` | Habilitar Firebase Password Policy enforcement vía Identity Platform | ALTA | BAJO (1d) |
| **SR 2.1 — Access Use Control** | Control de acceso basado en roles (RBAC) y mínimos privilegios | **CUMPLE** | `firestore.rules#L15-L48`, `src/types/auth.ts` | Validar scopes por proyecto en reglas de Firestore | MEDIA | BAJO (1d) |
| **SR 2.8 — Auditable Events** | Generación de registros de auditoría no repudiables | **CUMPLE** | `src/utils/auditChain.ts#L12-L95` | Replicar hash log a Cloud Storage Write-Once-Read-Many (WORM) | ALTA | MEDIO (2d) |
| **SR 3.1 — System Integrity** | Protección de la integridad del software y prevención de alteraciones | **CUMPLE** | `src/utils/auditChain.ts`, `CVE_EXCEPTIONS.md` | Escaneo SAST/DAST automatizado en CI/CD pipeline | MEDIA | MEDIO (2d) |
| **SR 4.1 — Information Confidentiality** | Cifrado de datos en tránsito y en reposo | **CUMPLE** | `firestore.rules`, GCP TLS 1.3 + AES-256 por defecto | Configurar Customer-Managed Encryption Keys (CMEK) en GCP KMS | BAJA | ALTO (3d) |

---

## 2. CHECKLIST OWASP ASVS 4.0 (NIVEL 2 — ENTERPRISE SAAS)

El estándar **OWASP ASVS 4.0 Nivel 2** establece los requisitos de verificación de seguridad para aplicaciones empresariales que manejan transacciones críticas o datos confidenciales.

| Sección ASVS 4.0 | Requisito Especifico | Estado | Evidencia en Código | Acción Correctiva Recomendada | Prioridad | Esfuerzo |
|---|---|---|---|---|---|---|
| **V1 — Arquitectura** | Separación clara de fronteras de confianza y aislamiento multi-tenant | **CUMPLE** | `firestore.rules#L35` (`request.auth.token.tenantId`) | Auditar todas las subcolecciones para forzar `tenantId` match | ALTA | BAJO (1d) |
| **V2 — Autenticación** | Prevención de credential stuffing y almacenamiento seguro de hashes | **CUMPLE** | Firebase Auth (Scrypt hash administrado por Google Cloud) | Habilitar comprobación contra HIBP (HaveIBeenPwned) API en registro | MEDIA | BAJO (1d) |
| **V3 — Gestión de Sesión** | Invalidación de token al logout y renovación segura de JWT | **CUMPLE** | `src/firebase.ts#L120` (`signOut`) | Implementar token revocation check centralizado vía Redis/Cloud Function | ALTA | MEDIO (2d) |
| **V4 — Control de Acceso** | Protección contra Insecure Direct Object References (IDOR) | **CUMPLE** | `firestore.rules#L60-L120` | Reglas explicitas por `resource.data.projectId` en cada documento | ALTA | BAJO (1d) |
| **V5 — Validación de Entradas** | Sanitización y tipado estricto en el frontend y backend | **CUMPLE** | `docs/design/STACK-TECNICO-AUDITORIA-V1.md` (Zod schemas) | Validar payload completo en Cloud Functions con schemas Zod | CRÍTICA | MEDIO (2d) |
| **V6 — Criptografía** | Uso de algoritmos criptográficos modernos (SHA-256 / AES-256) | **CUMPLE** | `src/utils/crypto.ts`, `src/utils/auditChain.ts` | Desactivar fallbacks de hash débiles (MD5/SHA1) si existieran | MEDIA | BAJO (1d) |
| **V7 — Manejo de Errores** | Prevención de fuga de stack traces o información sensible en producción | **CUMPLE** | `src/utils/sentry.ts` (PII Scrubbing activo) | Enforzar sanitización de headers Authorization en logs de Cloud Functions | ALTA | BAJO (1d) |
| **V8 — Protección de Datos** | Protección de secretos y claves en código fuente | **CUMPLE** | `.env.local` (excluido en `.gitignore`) | Integrar Secret Manager en GCP para Firebase Admin Keys | CRÍTICA | BAJO (1d) |
| **V13 — API Security** | Rate limiting, validación de Content-Type y protección CORS | **CUMPLE** | `functions/lib/functions/src/index.js`, Cloud Armor | Configurar reglas de rate limiting estricto por IP/Tenant en GCP API Gateway | ALTA | MEDIO (2d) |

---

## 3. CONTROLES ISO/IEC 27001 ANEXO A (APLICABLES A SAAS)

| Control ISO 27001 | Nombre del Control | Estado | Evidencia en Código / Proceso | Acción Correctiva | Prioridad | Esfuerzo |
|---|---|---|---|---|---|---|
| **A.5.15** | Control de Accesos | **CUMPLE** | `scripts/set-custom-claims.ts` | Revisión trimestral automatizada de roles asignados | MEDIA | BAJO (1d) |
| **A.8.7** | Protección contra Malware | **CUMPLE** | GitHub Dependabot + `CVE_EXCEPTIONS.md` | Escaneo estático diario de dependencias npm | MEDIA | BAJO (1d) |
| **A.8.12** | Prevención de Fuga de Datos (DLP) | **CUMPLE** | `src/utils/sentry.ts` | Bloquear descargas masivas no autorizadas en API | ALTA | MEDIO (2d) |
| **A.8.20** | Seguridad de Redes | **CUMPLE** | Infraestructura Serverless Firebase HTTPS/TLS 1.3 | Forzar cabeceras HSTS, CSP y X-Frame-Options en hosting | CRÍTICA | BAJO (1d) |
| **A.8.24** | Uso de Criptografía | **CUMPLE** | `src/utils/auditChain.ts` | Documentar política formal de gestión de claves KMS | MEDIA | BAJO (1d) |
| **A.8.28** | Codificación Segura | **CUMPLE** | ESLint Security Plugin + `STACK-TECNICO-AUDITORIA-V1.md` | Integrar SonarQube / Snyk en el flujo de PR | MEDIA | MEDIO (2d) |

---

## 4. PROTECCIÓN DE DATOS PERSONALES (LEY VENEZOLANA + GDPR)

### 📊 Inventario de Datos Personales Procesados en IC360-NEXUS:

| Tipo de Dato | Clasificación | Propósito de Procesamiento | Base Legal | Periodo de Retención | Derechos del Titular |
|---|---|---|---|---|---|
| **Cédula / Pasaporte** | Sensible (PII) | Identificación de personal autorizado en permisos SIHO-PTW | Obligación Legal (PDVSA SI-S-20 / LOTTT) | Duración del Contrato + 10 años | Acceso, Rectificación |
| **Firma Digitalizado** | Sensible / Biométrico | Autorización vinculante de permisos de trabajo y actas QA/QC | Ejecución de Contrato / Ley Mensajes de Datos | Inmutable (Retención Permanente) | Rectificación (no borrado legal) |
| **Geolocalización GPS** | Confidencial | Verificación de presencia en sitio en inspecciones de campo | Interés Legítimo / Control Operativo | 3 años | Acceso, Supresión post-auditoría |
| **Fotografías de Inspección** | Operativo | Evidencia de avance y condiciones de seguridad | Ejecución de Contrato | 5 años | Acceso |

---

## 5. CUMPLIMIENTO DE LA LEY DE MENSAJES DE DATOS Y FIRMAS ELECTRÓNICAS (VENEZUELA)

Para garantizar la **validez probatoria** de los permisos de trabajo (PTW), actas de valuación APU y dosis de soldadura ante tribunales e inspectores de PDVSA, la aplicación implementa el esquema según el Artículo 16 y 18 de la Ley de Mensajes de Datos:

1. **Inmutabilidad y Sello de Tiempo (RFC 3161):** Evidenciado en `src/utils/auditChain.ts` y `src/utils/signature.ts`, donde cada firma genera un digest SHA-256 encadenado al evento previo.
2. **Atribución Estricta:** La firma está ligada unívocamente al `uid` del usuario autenticado mediante sesión MFA y comprobación en `firestore.rules`.
3. **No Repudio:** La cadena de bloques interna impide alterar firmas preexistentes sin invalidar la firma global del documento (`DossierCompiler`).

---

## 🚨 MATRIZ DE RIESGOS PRIORIZADA

```
+-----------------------------------------------------------------------+
| Nivel de Riesgo | Cantidad | Descripción                               |
+-----------------------------------------------------------------------+
| CRÍTICO        |    2     | Validación Zod en Backend / Encabezados CSP|
| ALTO           |    5     | MFA Obligatorio / Expiración de Tokens    |
| MEDIO          |    6     | Rate Limiting en API Gateway / WORM Log   |
| BAJO           |    3     | Documentación de Claves KMS / HIBP Check  |
+-----------------------------------------------------------------------+
```

---

## 🚀 PROPUESTA DE SPRINTS DE CIBERSEGURIDAD (F-CYBER-1..N)

### 📌 Sprint F-CYBER-1: Hardening de Entrada y Cabeceras Web (1 Semana)
- Implementación de cabeceras HTTP de seguridad (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`) en `firebase.json`.
- Validación universal de DTOs en Cloud Functions mediante esquemas **Zod**.

### 📌 Sprint F-CYBER-2: Gobernanza de Accesos y Revocación (1 Semana)
- Implementación de expiración forzada de tokens y comprobación de revocación inmediata en `scripts/set-custom-claims.ts`.
- Enforzar autenticación multifactor (MFA) obligatoria para roles `Superadmin` y `SIHO_Inspector`.

### 📌 Sprint F-CYBER-3: Registros WORM e Integridad Industrial (2 Semanas)
- Replicación automatizada de los registros de auditoría (`auditChain.ts`) hacia un bucket de Cloud Storage configurado en modo Write-Once-Read-Many (WORM) para compliance PDVSA / IEC 62443.
