# MERCADO-SENALES-V1 — Registro de Señales de Mercado (Intake)

**Fecha:** 2026-08-15
**Fuente:** Conversaciones directas del Founder con dueños de empresas contratistas (Oil & Gas, Venezuela)
**Estado:** REGISTRADO — ninguna señal es un feature aprobado. Todo entra al roadmap por el método (formatos → experto → spec → código).
**Regla rectora:** El mercado entra por la puerta del método, no por feature creep.

---

## 1. Señales registradas

| # | Señal | Quién la pidió | Qué es realmente | Mapeo técnico | Estado |
|---|-------|----------------|------------------|---------------|--------|
| S1 | Contratista primero, operador como canal | Founder (estrategia GTM) | Vendemos a contratistas; el operador PDVSA habilita su panel y puede volverse puente hacia otros operadores | Ya existe en arquitectura: `ClientPortalBuilder` / `ClientPortalView` | ✅ Arquitectura vigente — no requiere acción |
| S2 | Huella + reconocimiento facial para autorizaciones, asistencia y registro de logs | Contratista (dueño) | Identidad verificada del firmante/presente, no "seguridad de lujo" | **WebAuthn/passkeys** = biometría del dispositivo, $0, sin hardware extra ni CV custom. Mapea a Dim 16 + S16 | 📋 Ficha Célula de Stack emitida (`FICHA-STACK-WEBAUTHN`) — pendiente prueba de emulación Codex |
| S3 | "¿Puedo ver y gestionar MI base de datos? ¿Exportarla, importarla, archivarla?" | Contratista (dueño) | Portabilidad y custodia de datos del cliente: su trabajo compilado es SUYO | Dim 23 (offboarding/export) + DossierCompiler + export multi-formato (Dim 6, 90/100) | 📋 Requisito de producto registrado — alimenta spec de portabilidad |
| S4 | Custodia/almacenamiento de datos como servicio pago | Founder (derivada de S3) | **Línea de negocio candidata:** custodia documental a largo plazo del dossier histórico | Tier de almacenamiento post-proyecto (read-only archive + retrieval) | 💡 Hipótesis de negocio — validar con 2-3 contratistas más antes de spec |
| S5 | Pruebas de flexibilidad/elasticidad mecánica | Contratista | Módulo de dominio (integridad mecánica) | Cluster Mecánica/Tuberías/Tanques del corpus (619 PDFs) | 📋 Candidato a experto NotebookLM — sin spec hasta verdad de dominio |
| S6 | Simulaciones de fluidos y corridas instrumentadas | Contratista | Módulo de dominio (integridad de ductos / ILI) | Página legacy `IntegrityIli.tsx` existe (64KB, sin migrar al Kernel) | 📋 Candidato — el experto define formatos reales antes de migrar |
| S7 | Pruebas de pozos: leer registros, historial, informes, alertas | Contratista | Módulo de dominio (operaciones/pozos) | Cluster Operaciones/Pozos/Procesos del corpus (3,416 PDFs) | 📋 Candidato — post-piloto, por método |
| S8 | Servicio de monitoreo: dashboard + historial + notificaciones para que NUESTROS clientes sirvan a SUS clientes | Founder (síntesis) | IC360 como plataforma (el "sistema operativo"): multi-tenant hacia abajo | Consistente con la tesis NEXUS §4 y arquitectura multi-tenant actual (Dim 10) | 📋 Tesis de plataforma — largo plazo |
| S9 | Notificaciones (permisos por vencer, aprobaciones, alertas) | Brecha propia + señal S8 | Motor de notificaciones transversal | Dim 11 del scorecard (marcada no verificada) + S22 (alertas 80/95/100) + FinOps alerts volátiles (Dim 12 brecha) | ⚠️ **Brecha real** — Spec emitido (`SPEC-NOTIFICACIONES-V1`) |
| S10 | Réplica a otras industrias si O&G tiene éxito | Founder (visión) | Multi-industria por diseño | Ya soportado: Kernel agnóstico + catálogo de formatos por industria (método rector) | ✅ Arquitectura vigente — cada industria = su corpus + sus formatos |

---

## 2. Lectura del CTO

Las señales S3, S8 y S9 son las más valiosas porque describen **el filo competitivo**: los sistemas de registro pasivos (Procore/SAP) no le devuelven al contratista SU trabajo de forma ordenada, exportable y viva. Eso es exactamente lo que el Kernel (tablero → formatos → archivo → dossier) ya hace por diseño.

**Prioridad derivada:**
1. S9 (notificaciones) → spec ya, es brecha de scorecard Y señal de mercado.
2. S2 (biometría) → ficha de stack ya, validación técnica antes de spec.
3. S3 (portabilidad) → se materializa en el spec de portabilidad/offboarding (Dim 23).
4. S4, S8 → hipótesis de negocio, no código. Validar con más clientes.
5. S5-S7 → los expertos NotebookLM del corpus deciden formatos reales. Nosotros no adivinamos.

---

## 3. Trazabilidad

- Cada señal nueva se agrega aquí con: fecha, fuente, mapeo técnico, estado.
- Una señal solo pasa a spec cuando: (a) tiene experto/corpus que la respalde, o (b) cierra una brecha verificada del scorecard.
- Este documento NO autoriza código. Autoriza análisis.
