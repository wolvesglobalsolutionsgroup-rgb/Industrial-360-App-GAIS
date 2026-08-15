# FICHA-STACK-WEBAUTHN — Célula de Stack: Biometría para Autorizaciones

**Fecha:** 2026-08-15
**Origen:** Señal de mercado S2 (MERCADO-SENALES-V1) — contratista pidió huella + reconocimiento facial para autorizaciones, asistencia y registro de logs.
**Doctrina aplicada:** Ninguna librería entra por default. Toda candidata pasa la ficha y la prueba de emulación (lección zod-to-json-schema: el default de los modelos puede estar roto para nuestro stack).

---

## 1. Qué se necesita realmente (desambiguación)

El contratista NO pidió "reconocimiento facial" como tecnología — pidió **certeza de que quien firma/marca asistencia ES quien dice ser**. Eso se resuelve con **biometría del dispositivo** (huella, Face ID, Windows Hello), no con visión computarizada propia.

## 2. Candidata única: WebAuthn / Passkeys (nativo del navegador)

| Criterio | Evaluación |
|----------|-----------|
| Qué es | API **nativa del navegador** (W3C/FIDO2). `navigator.credentials.create/get`. Sin librería de terceros para el flujo básico |
| Costo | **$0.** Sin hardware extra, sin servicio de CV, sin SDK biométrico |
| Biometría | Usa la del dispositivo: huella Android, Face ID iOS, Windows Hello, Touch ID. El navegador la invoca; nosotros nunca tocamos la biometría cruda (privacidad por diseño) |
| Encaje en stack | Complementa Firebase Auth (no lo reemplaza): Firebase Auth = login; WebAuthn = **re-autorización de acción crítica** |
| Madurez | Estándar W3C, soporte universal en Chrome/Safari/Edge/Firefox modernos |
| Riesgo | Bajo. El riesgo es de UX (dispositivos sin biometría → fallback a PIN/contraseña) |

## 3. Casos de uso mapeados a la señal

| Señal del contratista | Implementación WebAuthn |
|----------------------|------------------------|
| Autorizaciones (firmar permiso, aprobar) | **Re-autenticación biométrica en el momento de la firma** — prueba de presencia del firmante. Mapea a Dim 16 (firma digital) + S16 |
| Asistencia | Check-in con biometría del dispositivo del trabajador + geolocalización (WorkerQrRegistry existente + WebAuthn) |
| Registro de logs | Cada autorización WebAuthn deja un `credentialId` + timestamp = trazo auditable de QUIÉN autorizó |

## 4. Decisión de la Célula

- ✅ **WebAuthn/passkeys** aprobado como dirección — es nativo, $0, y resuelve la señal sin CV custom.
- ❌ **Reconocimiento facial por visión computarizada** (TensorFlow.js face-api, servicios de CV) → **vetado para v1**: costo, peso de bundle (brecha Dim 7), privacidad, y no añade nada que la biometría del dispositivo no dé ya.
- ⚠️ **Pendiente obligatorio antes de spec:** prueba de emulación por **Codex** — verificar en sandbox que el flujo `navigator.credentials` + verificación server-side funciona con nuestro stack (Firebase Auth + Functions). Igual que se probó zod-to-json-schema: no se acepta por paper, se acepta por prueba.

## 5. Pregunta abierta para Codex (prueba de emulación)

> ¿El flujo WebAuthn de re-autenticación (ceremony de `assertion`) puede verificarse server-side en una Firebase Function con una librería mantenida (ej: `@simplewebauthn/server`) compatible con nuestro entorno, y persiste el `credentialId` en Firestore bajo la ruta multi-tenant canónica? Probar, no asumir. Reportar: versión de la librería, si verifica la firma correctamente, y si hay fallback para dispositivos sin biometría.

## 6. Estado

**FICHA EMITIDA — NO APROBADO PARA CÓDIGO.** Siguiente paso: prueba de emulación Codex → si pasa, spec de autorización biométrica → entonces GAIS.
