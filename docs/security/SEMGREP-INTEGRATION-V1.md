# Guía de Integración y Reglas de Seguridad Semgrep (V1)
**Proyecto:** IC360-NEXUS (`Industrial-360-App`)  
**Clasificación:** Seguridad / SAST (Static Application Security Testing)  
**Fecha:** Agosto 2026  
**Estado:** Especificación de Producción  

---

## 1. Resumen Ejecutivo y Objetivos

Semgrep es un motor de análisis estático rápido y ligero guiado por AST (Abstract Syntax Tree) que permite detectar vulnerabilidades de seguridad, violaciones de estándares de código y fugas de aislamiento multitenant.

En el ecosistema **IC360-NEXUS**, el objetivo principal de integrar Semgrep es:
1. **Detección temprana en CI/CD:** Interceptar fallos de OWASP Top 10 (XSS, Inyección de Comandos, SSRF, Deserialización insegura) en cada Pull Request.
2. **Aislamiento Multitenant:** Enforzar la inclusión del campo `tenantId` en consultas a Firestore y llamadas de backend/Cloud Functions.
3. **Seguridad en Firebase & React:** Prevenir el uso inseguro de Firebase Admin SDK, bypass de dominios CORS, o renderizado directo de HTML no desinfectado vía DOMPurify.
4. **Cero Falsos Positivos Bloqueantes:** Establecer reglas de supresión e ignorado estructurado (`.semgrepignore`).

---

## 2. Disponibilidad del Entorno e Instalación

Semgrep es una herramienta escrita principalmente en OCaml/Python. Se puede ejecutar fácilmente en entornos de desarrollo local y CI/CD mediante las siguientes alternativas:

### A. Ejecución en Entornos Windows (Local Dev)
En Windows 10/11, la forma recomendada de ejecutar Semgrep es mediante **WSL2**, **Docker** o **pip**:

#### Opción A1: WSL2 (Ubuntu / Debian)
```bash
# Dentro del terminal de WSL
python3 -m pip install semgrep
semgrep --version
```

#### Opción A2: Docker Desktop
```bash
docker run --rm -v "${PWD}:/src" returntocorp/semgrep semgrep scan --config=auto
```

#### Opción A3: Python en Windows Nativo (vía pip)
```powershell
python -m pip install semgrep
semgrep --version
```

---

## 3. Reglas de Semgrep de la Comunidad y OWASP Seleccionadas

Para el stack tecnológico de **IC360-NEXUS** (TypeScript, React 19, Node.js / Express, Firebase Admin/Client SDK), se integrarán los siguientes packs oficiales del Semgrep Registry (`returntocorp/semgrep-rules`):

| Registry / Ruleset ID | Cobertura / Propósito |
| :--- | :--- |
| `p/typescript` | Errores de tipos, promesas no manejadas, patrones asíncronos inseguros en TS |
| `p/react` | Inyecciones XSS en componentes UI, hooks mal estructurados, `dangerouslySetInnerHTML` sin sanitize |
| `p/nodejs` | Vulnerabilidades en Node.js (Path Traversal, `eval()`, prototype pollution, SSRF) |
| `p/express` | Inseguridad en Express server (`server.ts`), middlewares CORS inseguros, cookies sin flag seguro |
| `p/owasp-top-ten` | Reglas alineadas a OWASP Top 10 (A01: Broken Access Control, A03: Injection, A07: Identification and Auth Failures) |
| `p/secrets` | Detección de claves API, tokens de servicio o credenciales Firebase expuestas en código fuente |

---

## 4. Reglas Personalizadas de Seguridad para IC360-NEXUS

Se creará el directorio `.semgrep/` en la raíz del proyecto `Industrial-360-App/` con las siguientes reglas a medida (`.semgrep/ic360-security-rules.yml`):

```yaml
rules:
  # --------------------------------------------------------------------------
  # 1. Multi-Tenant Guardrail: Firestore queries missing tenant filter
  # --------------------------------------------------------------------------
  - id: ic360-firestore-missing-tenant-id
    patterns:
      - pattern-either:
          - pattern: collection($DB, $COL).where(...)
          - pattern: query(collection($DB, $COL), ...)
      - pattern-not-inside: |
          ...
          where("tenantId", "==", ...)
          ...
    message: |
      [IC360-SECURITY] Consulta a Firestore sin filtro implícito o explícito de 'tenantId'.
      Riesgo: Violación del aislamiento multitenant. Asegúrese de incluir where('tenantId', '==', tenantId).
    languages: [typescript, javascript]
    severity: ERROR

  # --------------------------------------------------------------------------
  # 2. XSS Guardrail: React dangerouslySetInnerHTML without DOMPurify
  # --------------------------------------------------------------------------
  - id: ic360-react-dangerously-set-inner-html-no-sanitize
    patterns:
      - pattern: <$EL ... dangerouslySetInnerHTML={{ __html: $VAR }} ... />
      - pattern-not-inside: |
          $CLEAN = DOMPurify.sanitize($VAR);
          ...
          <$EL ... dangerouslySetInnerHTML={{ __html: $CLEAN }} ... />
    message: |
      [IC360-SECURITY] Uso de 'dangerouslySetInnerHTML' detectado sin previa desinfección con DOMPurify.sanitize().
      Riesgo: Vulnerabilidad de Cross-Site Scripting (XSS).
    languages: [typescript, javascript]
    severity: ERROR

  # --------------------------------------------------------------------------
  # 3. Firebase Admin SDK Guardrail: Unrestricted document deletes/writes
  # --------------------------------------------------------------------------
  - id: ic360-firebase-admin-unrestricted-delete
    pattern: admin.firestore().collection($COL).doc($DOC).delete()
    pattern-not-inside: |
      if (!$TENANT_ID || $TENANT_ID !== $AUTH_TENANT) { throw new Error(...); }
      ...
    message: |
      [IC360-SECURITY] Eliminación directa de documento vía Firebase Admin SDK sin verificación explícita de tenantId.
    languages: [typescript, javascript]
    severity: WARNING

  # --------------------------------------------------------------------------
  # 4. Express CORS Guardrail: Wildcard Origin with Credentials
  # --------------------------------------------------------------------------
  - id: ic360-express-wildcard-cors
    pattern: |
      cors({
        origin: "*",
        ...
      })
    message: |
      [IC360-SECURITY] Configuración de CORS permitiendo origen comodín '*'.
      Riesgo: Exposición indebida de APIs a sitios de terceros no autorizados.
    languages: [typescript, javascript]
    severity: ERROR
```

---

## 5. Integración en CI/CD (GitHub Actions)

Crear el archivo `.github/workflows/semgrep.yml` en la raíz del repositorio:

```yaml
name: Semgrep SAST Audit

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    - cron: '0 2 * * 1' # Ejecución semanal los lunes a las 02:00 UTC

jobs:
  semgrep-scan:
    name: Security Code Analysis
    runs-on: ubuntu-latest
    container:
      image: returntocorp/semgrep:latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run Semgrep Rulesets
        run: |
          semgrep scan \
            --config "p/typescript" \
            --config "p/react" \
            --config "p/nodejs" \
            --config "p/express" \
            --config "p/owasp-top-ten" \
            --config "p/secrets" \
            --config ".semgrep/" \
            --error \
            --verbose
```

---

## 6. Scripts de NPM para Ejecución Local y Auditoría

Integración en `package.json`:

```json
{
  "scripts": {
    "audit:semgrep": "semgrep scan --config p/typescript --config p/react --config p/nodejs --config .semgrep/",
    "audit:semgrep:docker": "docker run --rm -v \"%CD%:/src\" returntocorp/semgrep semgrep scan --config p/typescript --config p/react --config .semgrep/"
  }
}
```

---

## 7. Estrategia de Supresión e Ignorados (`.semgrepignore`)

Crear `.semgrepignore` en la raíz para excluir artefactos de construcción, dependencias y datasets de prueba:

```
# Ignorar dependencias y construcciones
node_modules/
dist/
build/
.venv/

# Ignorar archivos de pruebas unitarias/mock data si contienen datos sintéticos seguros
tests/fixtures/
scripts/qa/seedQaDataset.ts
```

---

## 8. Roadmap de Madurez SAST en IC360-NEXUS

1. **Fase 1 (Inmediata):** Publicar guía `SEMGREP-INTEGRATION-V1.md` y crear reglas custom `.semgrep/ic360-security-rules.yml`.
2. **Fase 2 (CI Integration):** Configurar el workflow de GitHub Actions en modo no-bloqueante (`severity: WARNING`) para crear baseline.
3. **Fase 3 (Gate de Producción):** Enforzar bloqueo en PRs (`severity: ERROR`) para violaciones multitenant y XSS.
