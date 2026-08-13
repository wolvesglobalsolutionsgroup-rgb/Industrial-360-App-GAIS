# Informe de Investigación Técnica: Framework Vercel EVE para IC360-NEXUS (v1.0)

**Aplicación**: IC360-NEXUS (`Industrial-360-App-GAIS`)  
**Repositorio**: [wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS](https://github.com/wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS)  
**Ruta de Especificación**: `docs/architecture/INVESTIGACION-EVE-IC360-V1.md`  
**Estado**: INFORME DE ARQUITECTURA TÉCNICA Y EVALUACIÓN DE ESTRATEGIA  
**Prioridad**: MEDIA (Evaluación de arquitectura sin bloqueo para Oleada 0)  
**Fuentes Verificadas**: [eve.dev](https://eve.dev), [Vercel EVE GitHub Docs](https://github.com/vercel/eve), [Platformatic EVE Guide](https://blog.platformatic.dev/run-durable-eve-agents-on-kubernetes-with-platformatic), [Assistant UI EVE Runtime](https://www.assistant-ui.com/docs/runtimes/eve/overview), [Upstash EVE RAG Guide](https://upstash.com/blog/ask-hackernews-with-vercel-eve).

---

## Resumen Ejecutivo y Veredicto Final

* **VEREDICTO OFICIAL**: **EVALUAR EN OLEADA 2** (No adoptar en Oleada 0 / Oleada 1).
* **Justificación Estratégica**:
  1. **Incompatibilidad con el Modo Offline de Campo (Oleada 0/1)**: EVE es un runtime de agentes que ejecuta el bucle del modelo en el servidor (`/eve/v1/session`). Los inspectores en plantas de proceso u obras sin conectividad a internet no pueden ejecutar agentes EVE en la PWA local sin conexión activa al backend. IC360-NEXUS requiere que la toma de datos y validaciones de campo operen de forma local con IndexedDB en Oleada 0/1.
  2. **Compatibilidad con Vite + React (Resuelto)**: EVE no exige migrar IC360 a Next.js. El agente EVE puede correr como un microservicio Node.js independiente (servido por Nitro) y proxyado desde el servidor de desarrollo de Vite o Nginx en producción.
  3. **Cero Lock-in Financiero en Modelos**: Es posible invocar Gemini API directamente desde `agent.ts` sin usar Vercel AI Gateway.
* **Primer Candidato de Agente en Oleada 2**: **Agente Compilador de Databook / Dossier QA-QC** (o **Agente Auditor Normativo Background**), para orquestar tareas asíncronas de larga duración y compilación de PDF multi-capítulo en el servidor.

---

## Respuestas Detalladas a las 10 Preguntas de Investigación

---

### 1. FINOPS: ¿EVE puede funcionar sin AI Gateway y llamar Gemini API directamente?

* **Respuesta**: **SÍ, 100% FACTIBLE**.
* **Evidencia Técnica**:
  EVE utiliza por debajo el Vercel AI SDK (`@ai-sdk/google`). Aunque la configuración por defecto usa cadenas de ruteo de modelos de AI Gateway (`google/gemini-2.5-flash`), la configuración del agente en `agent.ts` permite instanciar directamente los proveedores de modelos importando la API de Google AI Studio con la clave de entorno propia (`process.env.GEMINI_API_KEY`).

```typescript
// agent/agent.ts - Ejemplo de Invocación Directa sin AI Gateway
import { defineAgent } from 'eve';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY, // Llamada directa a Gemini API
});

export default defineAgent({
  model: google('gemini-2.5-flash'),
});
```

* **Evidencia en Fuentes**: Documentación oficial de [eve.dev](https://eve.dev) y [LyonWJ EVE Agent Guide](https://lyonwj.com/blog/agent-memory-with-eve-and-nams). No existe dependencia obligatoria de pago con Vercel AI Gateway.

---

### 2. SELF-HOSTING: ¿Qué tan real es el autohospedaje con Postgres + Docker en un VPS económico?

* **Respuesta**: **REAL CON MATICES DE INFRAESTRUCTURA**.
* **Evidencia Técnica**:
  El motor HTTP de EVE es **Nitro** (el mismo motor open-source de Nuxt/Unjs). Cuando se ejecuta `eve build` fuera del entorno de Vercel, genera una salida estándar de Node.js que se ejecuta con `eve start` o `node .output/server/index.mjs`.
* **Uso en VPS Barato ($10-$20 USD/mes en Hetzner / DigitalOcean)**:
  * **Hospedaje del Agente**: Se ejecuta perfectamente en un contenedor Docker con Node.js 24+.
  * **Persistencia de Sesiones**: Utiliza el `Local World` del Workflow SDK guardando estados de sesión en una base de datos PostgreSQL propia.
  * **Limitación en VPS Simple**: Sin Vercel Workflows o Platformatic (`@platformatic/world`), el `Local World` procesa pasos uno a uno localmente y carece de colas distribuidas o escalado horizontal automático.
* **Evidencia en Fuentes**: Repositorio oficial de Vercel EVE [github.com/vercel/eve/blob/main/docs/guides/deployment.md](https://github.com/vercel/eve/blob/main/docs/guides/deployment.md) y [Platformatic Kubernetes Guide](https://blog.platformatic.dev/run-durable-eve-agents-on-kubernetes-with-platformatic).

---

### 3. OFFLINE / DURABILIDAD: ¿El agente opera localmente sin conexión a Vercel en campo?

* **Respuesta**: **NO OPERA OFFLINE EN EL DISPOSITIVO MÓVIL**.
* **Evidencia Técnica**:
  La durabilidad de EVE (*Durable Sessions*) es **durabilidad en el servidor**, no resiliencia sin internet en el navegador. Cuando la conexión se interrumpe o el servidor se reinicia, Vercel Workflows / Postgres recupera el estado exacto del bucle del agente desde el último checkpoint.
  Sin embargo, el cliente de navegador usa el hook `useEveAgent()` de `eve/react`, el cual requiere transmisión continua de eventos HTTP/NDJSON con los endpoints `/eve/v1/session`. Si un inspector en planta no tiene internet, la llamada al agente falla.
* **Impacto en IC360-NEXUS**: IC360 debe mantener su arquitectura PWA de almacenamiento local en IndexedDB para la toma de datos en campo sin internet, sincronizando contra el servidor al recuperar señal.
* **Evidencia en Fuentes**: [Vercel EVE Frontend Overview](https://github.com/vercel/eve/blob/main/docs/guides/frontend/overview.mdx).

---

### 4. INTEGRACIÓN NEXT.JS vs VITE + REACT: ¿Se exige migrar IC360 a Next.js?

* **Respuesta**: **NO ES UN DEALBREAKER, NO REQUIERE MIGRAR A NEXT.JS**.
* **Evidencia Técnica**:
  `withEve()` en `next.config.ts` es únicamente un proxy de conveniencia en desarrollo para compartir el mismo puerto en Next.js.
  El SDK de frontend `eve/react` permite pasar un parámetro de host explícito a `useEveAgent({ host: "http://localhost:3001" })` o conectar contra rutas proxy de Nitro.
* **Patrón de Integración en IC360 (Vite + React)**:
  1. El agente EVE se desarrolla en la carpeta `/agent` y se ejecuta como un microservicio independiente en la puerto `3001` (`eve dev`).
  2. En Vite se añade un proxy en `vite.config.ts`:
     ```typescript
     server: {
       proxy: {
         '/eve': 'http://localhost:3001'
       }
     }
     ```
  3. La SPA en React consume `useEveAgent()` apuntando a las rutas de mismo origen sin problemas de CORS.
* **Evidencia en Fuentes**: [Vercel EVE Frontend Overview](https://github.com/vercel/eve/blob/main/docs/guides/frontend/overview.mdx) ("On any other stack the hook talks to same-origin /eve/v1/* routes directly, or you pass an explicit host").

---

### 5. SKILLS: ¿Se pueden cargar las 24 skills normativas existentes sin reformatear?

* **Respuesta**: **SÍ, 100% COMPATIBLES SIN REFORMATEO**.
* **Evidencia Técnica**:
  EVE utiliza una arquitectura *Filesystem-First*. Las habilidades se colocan como archivos Markdown en el directorio `agent/skills/` con encabezado YAML frontmatter (`name`, `description`).
  Dado que las 24 skills normativas de IC360 (ej. `user:pdvsa-ir-s-04-ptw`, `user:pdvsa-ir-s-17-art`, `user:pdvsa-si-s-20-pts`) ya están escritas en Markdown con metadatos frontmatter, se pueden copiar directamente al directorio `agent/skills/` y EVE las cargará bajo demanda cuando el modelo las necesite.
* **Evidencia en Fuentes**: [Note.com EVE Architecture Analysis](https://note.com/snake_dragon/n/n94e8c1f38bcf?hl=en) y [Vercel EVE Guide](https://cahidarda.github.io/articles/vercel-eve-guide.html).

---

### 6. SANDBOX: ¿El Sandbox es obligatorio o se puede desactivar para reducir consumo de cuota?

* **Respuesta**: **ES OPCIONAL Y SE PUEDE DESACTIVAR**.
* **Evidencia Técnica**:
  El Sandbox en EVE (Docker en desarrollo local, Vercel Sandbox en producción) está diseñado para ejecutar código bash/Python generado por la IA o controlar navegadores remotos (`browser-use`).
  Para agentes normativos de IC360 que únicamente realizan consultas RAG, verifican reglas de Hard Gates o construyen documentos en TypeScript mediante `defineTool`, el Sandbox no se invoca y las herramientas se ejecutan directamente en el proceso Node.js del backend sin generar cargos adicionales de Sandbox.
* **Evidencia en Fuentes**: [Vercel EVE Deployment Guide](https://github.com/vercel/eve/blob/main/docs/guides/deployment.md) ("defaultBackend() selects a sandbox backend; plain TypeScript tools execute in the Node process directly").

---

### 7. CHANNELS: ¿Puedo crear un channel custom dentro de la PWA de IC360?

* **Respuesta**: **SÍ, TOTALMENTE COMPATIBLE**.
* **Evidencia Técnica**:
  EVE expone canales por HTTP/Web (`eve/react`), Slack, Discord y Teams. La interfaz de chat o componente personalizado dentro de la PWA de IC360 consume las sesiones a través de HTTP/NDJSON con `useEveAgent()` o integrando `@assistant-ui/react` (`useEveAgentRuntime`).
* **Evidencia en Fuentes**: [Assistant UI EVE Integration](https://www.assistant-ui.com/docs/runtimes/eve/overview).

---

### 8. EVALS: ¿Los evals corren en CI (GitHub Actions) o solo en Vercel?

* **Respuesta**: **CORREN LOCALMENTE Y EN CI (GITHUB ACTIONS)**.
* **Evidencia Técnica**:
  EVE incluye el comando de CLI `eve eval` que ejecuta conjuntos de prueba definidos en `agent/evals/`. Las evaluaciones ejecutan pruebas de aserción sobre las respuestas del modelo e invitan herramientas utilizando trazabilidad OpenTelemetry. Se pueden integrar en cualquier pipeline de CI/CD (GitHub Actions) ejecutando `pnpm verify` sin costo de infraestructura en Vercel.
* **Evidencia en Fuentes**: [AI Design Canvas Template](https://github.com/kyh/ai-design-canvas) (`AGENTS.md` pipeline) y [Note.com EVE Analysis](https://note.com/snake_dragon/n/n94e8c1f38bcf?hl=en).

---

### 9. LICENCIA Y LOCK-IN: ¿Qué pasa si Vercel descontinúa EVE?

* **Respuesta**: **CÓDIGO 100% PORTABLE (LICENCIA APACHE-2.0 / MIT)**.
* **Evidencia Técnica**:
  Un agente EVE se compone de archivos de texto estándar: `instructions.md`, `agent.ts`, `tools/*.ts` y `skills/*.md`.
  El servidor HTTP usa Nitro (open-source MIT) y la durabilidad se apoya en el SDK abierto `@workflow/sdk`. Si Vercel descontinúa EVE o se requiere migrar a infraestructura local, el código del agente se puede ejecutar de forma autónoma en Node.js, Express, Fastify, Docker o Kubernetes (vía Platformatic) sin modificar la lógica interna de herramientas o habilidades.
* **Evidencia en Fuentes**: [Platformatic Kubernetes Integration](https://blog.platformatic.dev/run-durable-eve-agents-on-kubernetes-with-platformatic) y [Vercel EVE Deployment Guide](https://github.com/vercel/eve/blob/main/docs/guides/deployment.md).

---

### 10. COMPARATIVA: Ventajas Reales de EVE vs. Stack Actual de IC360

| Criterio de Comparación | Stack Actual IC360 (`geminiProxy.ts` + `Chatbot.tsx`) | Framework Vercel EVE |
|---|---|---|
| **Arquitectura de Invocación** | Proxy directo a Gemini API en cliente/servidor | Bucle de agente duradero en servidor Vercel/Nitro |
| **Persistencia de Sesiones** | Memoria efímera en estado React / IndexedDB local | Sesiones duraderas en servidor (reanudación post-reinicio) |
| **Pausas Human-in-the-Loop (HITL)** | Manual mediante estados en base de datos Firestore | Pausas nativas de sesión en Workflows esperando aprobación |
| **Operación Offline en Campo** | **Excelente** (PWA + cola de transacciones IndexedDB) | **Nula** (Exige conexión HTTP constante al servidor) |
| **Multi-Agente / Subagentes** | Manual por código | Nativo mediante delegación `subagents/` y OpenTelemetry |
| **Estructura de Código / DX** | TypeScript tradicional | *Filesystem-First* (`agent/instructions.md`, `tools/`) |
| **Costo de Infraestructura** | **$0 USD** (Servidor propio o Firebase básico) | $0 en desarrollo / Costo por ejecución en Vercel |

* **Conclusión de Comparativa**: Para la toma de datos e inspecciones de campo en Oleada 0/1, el stack actual de IC360 es superior por su capacidad offline y ligereza. EVE ofrece ventajas reales únicamente para procesos asíncronos complejos del servidor que requieren pausas de aprobación de varios días o ejecuciones multi-agente masivas.

---

## Plan de Implementación Recomendado (Si se adopta en Oleada 2)

Si en Oleada 2 se decide activar EVE para servicios de backend asíncronos:

1. **Agente Candidato Inicial**: **Agente Compilador de Databook / Dossier QA-QC** (`agent-databook-builder`).
   * *Razón*: La compilación de un Databook abarca la lectura de cientos de PDFs, verificación de certificados MTR, ensayos NDT e instrumentación. Es una tarea pesada de backend que se beneficia de las *Durable Sessions* de EVE para correr en segundo plano sin interrumpir al usuario.
2. **Arquitectura de Despliegue**:
   * Mantener el frontend Vite + React PWA de IC360.
   * Desplegar el agente EVE como microservicio en el servidor backend (Docker + Postgres).
   * Consumir las sesiones del agente mediante llamadas de API asíncronas desde la PWA.
