# GUÍA DE INTEGRACIÓN Y REGLAS DE SEGURIDAD SEMGREP (V2)

**Proyecto:** IC360-NEXUS (`Industrial-360-App`)  
**Estatus:** Especificación de Producción V2  
**Fecha:** Agosto 2026  

---

## 1. INTEGRACIÓN EN PIPELINE DE CI/CD (GITHUB ACTIONS)

Se implementa el workflow automatizado `.github/workflows/semgrep.yml` para auditar cada Pull Request y push a las ramas `main` y `develop`.

- **Umbral de Bloqueo:**  
  - Findings de gravedad `ERROR` (Fugas de Tenant, XSS, Secretos expuestos): **Bloquean el Merge automáticamente (exit code 1)**.
  - Findings de gravedad `WARNING` (Malas prácticas, console.log): **Generan anotaciones de advertencia sin detener la compilación**.

---

## 2. REGLAS PERSONALIZADAS ANTI-VIBE-CODING (.semgrep/ic360-security-rules.yml)

Se incorporan 5 reglas estrictas para evitar patrones frágiles de desarrollo asistido por IA (Vibe Coding):

```yaml
rules:
  # 1. No console.log in Production
  - id: ic360-no-console-log-in-production
    pattern: console.log(...)
    paths:
      exclude:
        - "src/tests/**"
        - "scripts/**"
    message: "[IC360-ANTI-VIBE] Uso no permitido de console.log en código de producción. Utilizar el logger estructurado o Sentry."
    languages: [typescript, javascript]
    severity: WARNING

  # 2. No Hardcoded Secrets
  - id: ic360-no-hardcoded-secrets
    pattern-regex: '(?i)(api_key|secret|password|bearer_token)\s*[:=]\s*["''][A-Za-z0-9_\-]{16,}["'']'
    paths:
      exclude:
        - "tests/**"
        - "src/tests/**"
    message: "[IC360-SECURITY] Posible secreto o API Key codificada directamente en código. Utilizar import.meta.env o GCP Secret Manager."
    languages: [typescript, javascript]
    severity: ERROR

  # 3. No Direct Firestore Import in UI Components
  - id: ic360-no-direct-firestore-import-in-components
    patterns:
      - pattern: import { ... } from 'firebase/firestore'
      - pattern-inside: |
          // Scope inside UI components directory
          ...
    paths:
      include:
        - "src/components/**"
    message: "[IC360-ARCHITECTURE] Importación directa de Firebase SDK en componentes UI. Toda interacción con base de datos debe pasar por la capa de servicios (src/services/)."
    languages: [typescript, javascript]
    severity: ERROR

  # 4. Zod Schema Required for Writes
  - id: ic360-zod-schema-required-for-writes
    patterns:
      - pattern: setDoc($REF, $DATA, ...)
      - pattern-not-inside: |
          const $DATA = $SCHEMA.parse(...);
          ...
    message: "[IC360-SECURITY] Operación de escritura en Firestore sin previa validación estricta con schema de Zod."
    languages: [typescript, javascript]
    severity: WARNING

  # 5. No Unsanitized User Input in HTML
  - id: ic360-no-unsanitized-user-input-in-html
    patterns:
      - pattern: <$EL ... dangerouslySetInnerHTML={{ __html: $VAR }} ... />
      - pattern-not-inside: |
          $CLEAN = DOMPurify.sanitize($VAR);
          ...
          <$EL ... dangerouslySetInnerHTML={{ __html: $CLEAN }} ... />
    message: "[IC360-SECURITY] Renderizado directo de HTML sin desinfectar con DOMPurify. Risk: XSS."
    languages: [typescript, javascript]
    severity: ERROR
```

---

## 3. BASELINE DE FALSOS POSITIVOS Y CONFIGURACIÓN DE IGNORADOS (.semgrepignore)

Para mantener una integración fluida en CI/CD sin bloqueos por falsos positivos en entornos de prueba, se define el archivo `.semgrepignore`:

```
# Excluir dependencias y builds
node_modules/
dist/
build/
.venv/
coverage/

# Excluir datos sintéticos y scripts de testing
scripts/qa/
src/tests/fixtures/
**/*.test.ts
**/*.spec.ts
```

### Supresión de Falsos Positivos Documentada
Si una línea de código genera un reporte no aplicable justificado, se suprime indicando el ID exacto:
```typescript
// nosemgrep: ic360-no-direct-firestore-import-in-components
// Justificación: Componente de diagnóstico directo de red para soporte técnico.
```
