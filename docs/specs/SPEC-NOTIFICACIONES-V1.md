# SPEC-NOTIFICACIONES-V1 — Motor de Notificaciones IC360

**Fecha:** 2026-08-15
**Origen (Sección 0):** Brecha de scorecard Dim 11 (no verificada) + Dim 12 brecha (alertas FinOps volátiles en memoria, no persisten) + Señal de mercado S9 (MERCADO-SENALES-V1) + S22 (alertas 80/95/100).
**Principio rector:** $0 en infraestructura nueva. Todo sobre lo que ya pagamos: Firebase (FCM + Firestore + Functions).

---

## 1. Qué es (y qué no es)

Un motor transversal que convierte **eventos del Kernel** en **notificaciones entregadas y persistidas**. NO es un chat, NO es un centro de mensajería social, NO requiere servicios externos pagos.

## 2. Eventos que disparan notificación (fuentes reales del repo)

| Evento | Origen en código | Prioridad |
|--------|------------------|-----------|
| Permiso por vencer / vencido | Ciclo de vida de workflows (wf-043 PTW, wf-051 LOTO) | Alta |
| Aprobación pendiente / otorgada | Transiciones de estado de workflows | Alta |
| Hard gate violado | Zod schema rejection en captura | Media |
| Cuota FinOps 80/95/100 | `platformMetricsEngine.checkQuota` — hoy genera `FinOpsAlert` **en memoria, se pierde** | Alta |
| Entregable listo para exportar | `exportDocument` / DocumentViewModel | Media |
| Asignación de tarea en tablero | Kernel tablero | Baja |

## 3. Arquitectura ($0)

```
Evento del Kernel
   → NotificationService (src/lib/notifications/)
       1. PERSISTE en Firestore: organizations/{orgId}/projects/{projectId}/notifications
          (garantía: nada se pierde aunque el usuario esté offline — cierra la brecha Dim 12)
       2. DESPACHA por canales según preferencia del usuario:
          - In-app: campana + badge (listener Firestore con limit — doctrina F-C-bis)
          - Push: FCM (Firebase Cloud Messaging — gratis, ya tenemos Firebase)
          - Email: extensión "Trigger Email" de Firebase o Function + SendGrid free tier (100/día)
```

**Regla de oro:** persistir PRIMERO, despachar DESPUÉS. Si el push falla, la notificación sigue en la bandeja. Esto corrige directamente la brecha de las alertas FinOps volátiles.

## 4. Contrato de datos (Zod primero)

```typescript
const NotificationSchema = z.object({
  id: z.string(),
  type: z.enum(['PERMIT_EXPIRING','APPROVAL_PENDING','APPROVAL_GRANTED',
               'HARD_GATE_VIOLATION','QUOTA_THRESHOLD','DELIVERABLE_READY','TASK_ASSIGNED']),
  priority: z.enum(['LOW','MEDIUM','HIGH','CRITICAL']),
  title: z.string().max(120),
  body: z.string().max(500),
  actorId: z.string(),          // quién lo generó (o 'system')
  targetUserIds: z.array(z.string()).min(1),
  entityRef: z.object({         // deep link al objeto
    kind: z.enum(['workflow_instance','deliverable','quota','task']),
    id: z.string(),
  }),
  channels: z.array(z.enum(['IN_APP','PUSH','EMAIL'])),
  readAt: z.record(z.string(), z.number()).default({}),  // userId → timestamp
  createdAt: z.number(),
})
```

## 5. Multi-tenancy y costos

- Ruta canónica `organizations/{orgId}/projects/{projectId}/notifications` — sin fallback hardcodeado.
- `guardFirestoreWrite` en cada persistencia; `checkQuota` antes de despachar push masivo.
- Listener in-app con `limit(50)` + paginación (doctrina F-C-bis: 0 listeners sin límite).
- Preferencias de canal por usuario: `users/{userId}/notificationPrefs`.

## 6. Criterios de aceptación

1. Test Zod de frontera del schema (válido, tipo inválido, targetUserIds vacío).
2. Test: alerta FinOps al 80% **persiste en Firestore** (regresión de la brecha Dim 12).
3. Test de aislamiento tenant.
4. E2E: evento → persistencia → bandeja in-app visible en ≤3 clics (Dim 9).
5. 0 listeners sin `limit`. Sin `Math.random`, sin mocks.

## 7. Fuera de alcance (v1)

- WhatsApp/Telegram/SMS (canales de la visión NEXUS — requieren APIs pagas; fase posterior).
- Notificaciones push masivas segmentadas (marketing).
- Centro de preferencias con UI completa (v1: toggles básicos por canal).

## 8. Dependencias

- Ninguna bloqueante. Usa Firebase ya presente. La UI de campana se monta en el shell existente (CommandPalette ya es global).
