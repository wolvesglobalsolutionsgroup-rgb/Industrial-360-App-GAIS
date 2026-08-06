# Guardas de Costos y Cuotas de Plataforma (Cost Guardrails) — Industrial Control 360

*Fecha de vigencia:* 2026-08-05  
*Sprint:* F-G — Costos y Cuotas (Costo Incremental $0)  
*Autor / Responsable:* FinOps Lead / Lead Architect IC360  

---

## 1. Declaración de Principios FinOps IC360

Industrial Control 360 opera bajo la premisa estricta de **Costo Incremental $0 USD** para la infraestructura base. Todas las operaciones en la nube aprovechan las capas gratuitas (*Free Tier / Spark Plan*) de Firebase y Google Cloud Platform (GCP).

### Aclaración Técnica sobre el Plan Spark de Firebase / GCP Free Tier:
> **RESTRICCIÓN CRÍTICA:** El Plan Spark de Firebase **NO** garantiza un servicio ilimitado a costo cero. El Plan Spark impone **techos y cuotas duras (*hard quotas*)**. Si el consumo de la aplicación sobrepasa los límites de la capa gratuita, Google Cloud rechaza las solicitudes adicionales (HTTP 429 / 503) o inhabilita temporalmente el servicio hasta el siguiente ciclo de facturación diaria/mensual.

Por tanto, el objetivo de las **Guardas de Costos de IC360** es monitorear, auditar y frenar proactivamente el consumo a nivel de aplicación (antes de alcanzar las cuotas duras de GCP/Firebase), garantizando la continuidad operativa y una degradación graciosa del servicio sin generar cobros imprevistos.

---

## 2. Presupuestos y Cuotas de Servicios GCP / Firebase (Spark Plan)

A continuación se detallan los límites de la capa gratuita por servicio y el presupuesto asignado por la plataforma:

| Servicio GCP / Firebase | Recurso / Métrica | Límite Máximo Spark Plan (Gratuito) | Presupuesto Asignado IC360 | Estrategia de Control |
|---|---|---|---|---|
| **Cloud Firestore** | Lecturas de Documentos | 50,000 lecturas / día | 40,000 lecturas / día (80%) | Agregación en memoria, `onSnapshot` optimizados con filtros por `orgId` |
| **Cloud Firestore** | Escrituras de Documentos | 20,000 escrituras / día | 15,000 escrituras / día (75%) | Operaciones por lote (*batch*), sincronización offline con `syncOutbox` |
| **Cloud Firestore** | Almacenamiento de Datos | 1 GiB total | 800 MB total (80%) | Purga y conservación de registros de auditoría |
| **Cloud Storage** | Almacenamiento de Archivos | 5 GB total | 4 GB total (80%) | Compresión de evidencias fotográficas previa a la subida |
| **Cloud Storage** | Ancho de Banda Saliente | 1 GB / día | 800 MB / día (80%) | Caché local y CDN del navegador |
| **Cloud Functions / Cloud Run** | Invocaciones Backend | 2,000,000 invocaciones / mes | 1,500,000 invocaciones / mes | Consolidación en Cloud Functions con reuso de caliente |
| **Gemini AI API (Proxy)** | Solicitudes IA Gemini | Cuota asignada por min/día (RPM / RPD) | 1,000 solicitudes / día (Enterprise), 50 (Standard) | Caché de respuestas estructuradas y fallback a contingencia |

---

## 3. Umbrales de Alerta y Escalado

El motor `platformMetricsEngine.ts` evalúa continuamente el consumo en relación con las cuotas asignadas. Se establecen tres niveles de umbral:

```
[ Consumption ] 0% ---------------- 50% ---------------- 80% ---------------- 95% -------- 100%
[ Status      ]      NORMAL            INFORMATIVO         ADVERTENCIA        CRÍTICO      EXCEDED
[ Action      ]    Operativo          Log de Auditoría   Grace Period      Read-Only     QuotaExceededError
```

### 3.1 Nivel Informativo (50% de Cuota)
- **Criterio:** El consumo acumulado diario alcanza el 50% de la cuota asignada.
- **Acción:** Registro en el log de telemetría FinOps (`logger.info`).
- **Impacto al Usuario:** Ninguno. La aplicación funciona al 100% de su capacidad.

### 3.2 Nivel Advertencia / Grace Period (80% de Cuota)
- **Criterio:** El consumo alcanza el 80% del límite de cuota o del entitlement del plan.
- **Acción:**
  - Emisión de `FinOpsAlert` con severidad `warning`.
  - Activación del estado `GRACE_PERIOD` en la organización si aplica.
  - Notificación preventiva en la consola de administración.
- **Impacto al Usuario:** Continuidad operacional, aviso preventivo para optimizar exportaciones o consultas masivas.

### 3.3 Nivel Crítico / Modos de Protección (95% - 100% de Cuota)
- **Criterio:** El consumo alcanza o supera el 95% del límite asignado.
- **Acción:**
  - Emisión de `FinOpsAlert` con severidad `critical`.
  - Bloqueo preventivo de operaciones intensivas no esenciales mediante `checkQuota` / `enforceQuotaGuard`.
  - Si el almacenamiento o usuarios superan el 95%, el plan transiciona a `READ_ONLY` para preservar la evidencia de auditoría sin permitir escrituras pesadas.
  - Rechazo controlado con error de dominio `QuotaExceededError`.
- **Impacto al Usuario:** Mensaje claro de cuotas alcanzadas con degradación graciosa (fallback local o lectura).

---

## 4. Procedimiento de Respuesta ante Exceso de Cuota

Cuando un usuario u organización intenta ejecutar una operación que supera su cuota asignada, el sistema aplica el siguiente protocolo de respuesta:

1. **Intercepción Temprana (`checkQuota` / Guardas FinOps):**
   Antes de invocar el servidor o procesar la exportación/IA, la guarda de dominio verifica el consumo actual contra la política de cuotas de la organización.

2. **Lanzamiento de `QuotaExceededError`:**
   El motor lanza un error tipado de dominio con información estructurada:
   - `operation`: Tipo de operación intentada (`EXPORT_DOCUMENT`, `IA_INVOCATION`, `FIRESTORE_WRITE`, etc.).
   - `limit`: Límite máximo configurado para el plan.
   - `currentUsage`: Consumo actual registrado.
   - `orgId`: Identificador de la organización.
   - `recoverable`: `true` (indica que el sistema sigue operando y no es un fallo catastrófico del servidor).

3. **Degradación Graciosa e Interfaz de Usuario:**
   - **Para IA (Gemini Proxy):** Retorna respuesta de contingencia predeterminada ("Información temporalmente no disponible por restricción de cuota en servicio AI. Operación en modo local.").
   - **Para Exportaciones:** Deshabilita temporalmente el botón de descarga masiva con una sugerencia de exportar por lotes más pequeños o consultar el informe en pantalla.
   - **Para Escrituras / Registros:** Permite la creación de borradores locales en IndexedDB a través de `offlineEngine` hasta que se restablezca la cuota diaria.

4. **Procedimiento de Restablecimiento:**
   - **Automático:** Las cuotas diarias se restablecen a las 00:00 UTC cada día mediante el ciclo diario.
   - **Administrativo:** Un administrador de plataforma puede ajustar la política con `setCustomQuotaPolicy` o resetear cuotas en entornos de prueba usando `resetQuotaUsage`.

---

## 5. Responsable de Monitoreo y Gobernanza

- **Rol Responsable:** FinOps Lead / Platform Owner / Lead Architect IC360.
- **Herramienta de Monitoreo:** Consola FinOps de Plataforma (`PlatformOwnerConsole.tsx`) alimentada por `platformMetricsEngine.ts`.
- **Frecuencia de Revisión:** Monitoreo automatizado en tiempo real + revisión semanal de tendencias de lectura/escritura en Firestore.
