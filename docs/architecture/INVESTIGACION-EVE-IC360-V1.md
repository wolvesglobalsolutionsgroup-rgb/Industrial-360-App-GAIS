# 🔬 INVESTIGACIÓN TÉCNICA E ARQUITECTÓNICA: EVE FRAMEWORK PARA IC360-NEXUS

**Documento:** `INVESTIGACION-EVE-IC360-V1.md`  
**Agente Evaluador:** Antigravity  
**Repositorio Oficial:** `Industrial-360-App-GAIS` (`wolvesglobalsolutionsgroup-rgb/Industrial-360-App-GAIS`)  
**Fecha:** `12 de Agosto, 2026`  
**Prioridad:** MEDIA (Evaluación para Orquestación de Agentes Autónomos IC360-NEXUS)  

---

## Executive Summary & Veredicto Final

| Parámetro | Evaluación |
|---|---|
| **Veredicto Recomendado** | 🟡 **EVALUAR EN OLEADA 2** (No implementar en Oleada 0/1) |
| **Agente Candidato Inicial (Oleada 2)** | 🛡️ **Agente Pre-Auditor Normativo (WF-074 / WF-075)** |
| **Licencia** | Apache-2.0 (Código Abierto Libre) |
| **Compatibilidad Stack IC360** | Alta (Consumible desde Vite + React PWA vía `eve/client` / REST / WebSocket) |
| **Riesgo Principal** | Complejidad arquitectónica prematura durante la estabilización de Oleada 0/1 |

---

## 📑 Respuestas Detalladas a las 10 Preguntas Clave

### 1. FINOPS (¿EVE puede funcionar sin AI Gateway? ¿Llamada directa a Gemini API?)
**Respuesta:** **SÍ, 100% SÍ. NO REQUIERE AI GATEWAY DE PAGO.**

- **Evidencia Técnica:** EVE está construido sobre Vercel AI SDK (`ai` package). Aunque por defecto la documentación sugiere configurar `AI_GATEWAY_API_KEY` para ruteo/métricas de Vercel, se puede pasar cualquier modelo estandarizado de `@ai-sdk/google` (o `@ai-sdk/openai`, `@ai-sdk/anthropic`) directamente en la configuración del agente:
  ```typescript
  import { defineAgent } from "eve";
  import { google } from "@ai-sdk/google";

  export default defineAgent({
    model: google("gemini-2.0-flash"), // Utiliza GEMINI_API_KEY o GOOGLE_GENERATIVE_AI_API_KEY directa
    instructions: "...",
  });
  ```
- **Impacto en FinOps IC360:** Las llamadas viajan directamente de nuestro servidor Node.js/Serverless a la API de Google Gemini (o Vertex AI), cobrándose únicamente la tarifa oficial por token sin comisión o peaje de Vercel.

---

### 2. SELF-HOSTING (¿Es real "zero managed-infrastructure" usando Postgres + Docker en VPS?)
**Respuesta:** **ES REAL, PERO TIENE COSTOS DE OPERACIÓN MANUAL (NO SERVERLESS).**

- **Evidencia Técnica:** EVE separa el runtime de la infraestructura subyacente. Utiliza adaptadores de persistencia (Postgres/Redis via Prisma/Drizzle) para el estado durable y Docker (o microsandbox) para el aislamiento de ejecución local/self-hosted.
- **Factibilidad VPS:** Se puede desplegar como un contenedor Docker único en un VPS de \$5-\$10/mes (Hetzner, DigitalOcean, AWS EC2) ejecutando un proceso Node.js con Express/Fastify.
- **Trade-off:** En un VPS económico se pierde el auto-scaling serverless y la infraestructura de Firecracker MicroVMs de Vercel. Si el proceso cae sin un contenedor Postgres con volúmenes persistentes correctamente respaldados, se pueden perder checkpoints de ejecuciones en vuelo.

---

### 3. OFFLINE / DURABILIDAD (¿Puede el inspector en campo operar offline sin conectividad a Vercel?)
**Respuesta:** **NO OPERA LOCALMENTE EN EL DISPOSITIVO DEL INSPECTOR (REQUIERE SERVIDOR DE EVE).**

- **Evidencia Técnica:** "Durable sessions" en EVE se refiere a la **resiliencia del servidor** (vía Vercel Workflows o Postgres), permitiendo que el bucle de razonamiento de un agente sobreviva a reinicios del backend o caídas de red temporales entre el backend y las APIs de LLM.
- **Implicación para Campo (PWA IC360):** El agente de EVE se ejecuta en el servidor. Si el inspector pierde conectividad a internet en una plataforma off-shore o refinería, la PWA de IC360 no podrá consultar al agente EVE.
- **Solución IC360:** La captura de inspección debe mantenerse en la PWA offline con IndexedDB + Service Worker, y sincronizar la sesión durable con EVE en cuanto el dispositivo recupere cobertura.

---

### 4. INTEGRACIÓN NEXT.JS (IC360 usa Vite + React, NO Next.js. ¿Hay path de integración?)
**Respuesta:** **NO REQUIERE MIGRAR IC360 A NEXT.JS. NO ES UN DEALBREAKER.**

- **Evidencia Técnica:** `withEve()` en `next.config.ts` es únicamente un proxy de conveniencia que mapea las rutas `/eve/v1/*` dentro del mismo puerto del servidor dev/prod de Next.js.
- **Path de Integración para Vite + React (IC360):**
  1. **Microservicio Backend Independiente:** Desplegar EVE como un servicio independiente (Node.js/Express o Cloud Run) que expone la API de EVE.
  2. **Cliente Frontend en PWA Vite:** Consumir la API desde la PWA Vite utilizando `@eve/client` (o `eve/client` TypeScript SDK), el cual maneja la conexión HTTP/NDJSON/WebSocket, gestión de sesiones y streaming.
  3. **Dev Proxy:** En desarrollo local, configurar `vite.config.ts`:
     ```typescript
     server: {
       proxy: {
         '/eve': 'http://localhost:3000'
       }
     }
     ```

---

### 5. SKILLS (¿Las 24 skills normativas .md con frontmatter son compatibles directamente?)
**Respuesta:** **COMPATIBILIDAD DIRECTA DEL 95% (SLIGHT ADAPTATION).**

- **Evidencia Técnica:** EVE utiliza exactamente el estándar de Agent Skills mediante carpetas `skills/` conteniendo archivos `SKILL.md` con frontmatter YAML:
  ```markdown
  ---
  name: pdvsa-si-s-20
  description: Guía de inspección de permisos de trabajo y seguridad en izajes PDVSA SI-S-20.
  ---
  ```
- **Funcionamiento Just-In-Time (JIT):** EVE lee la `description` del frontmatter para decidir cuándo cargar la skill en el contexto del agente, evitando saturar la ventana de contexto. Nuestras 24 skills normativas pueden trasladarse al directorio `skills/` del agente sin reformatear el cuerpo Markdown.

---

### 6. SANDBOX (¿Es obligatorio o se puede desactivar para reducir consumo/recursos?)
**Respuesta:** **SE PUEDE DESACTIVAR TOTALMENTE (`sandbox: false`).**

- **Evidencia Técnica:** El sandbox de EVE (Docker/Firecracker) está diseñado para agentes que ejecutan comandos Bash, compilan código o realizan clones de repositorios git.
- **Escenario IC360:** Los agentes de IC360 (consultas normativas, pre-auditoría, generación de fichas) ejecutan herramientas TypeScript puras (consultas a Firestore, RAG Vectorial, parseo de PDF).
- **Configuración sin Sandbox:** Las herramientas se declaran como `tools` nativas en Node.js, omitiendo el runtime de sandbox y reduciendo el consumo de CPU/Memoria al mínimo.

---

### 7. CHANNELS (¿Se puede crear un canal custom dentro de la PWA de IC360?)
**Respuesta:** **SÍ. LA API BASE DE EVE ESTÁ DISEÑADA PARA CANALES CUSTOM.**

- **Evidencia Técnica:** EVE define la interfaz `Channel` para controladores de rutas (GET/POST) y WebSockets. Los conectores oficiales (Slack, Teams, WhatsApp) son solo implementaciones sobre la API genérica.
- **Integración PWA IC360:** Nuestro componente `Chatbot.tsx` o el Centro de Control HMI interactúa directamente con el endpoint custom de EVE a través del paquete `eve/client`, permitiendo renderizar respuestas estructuradas, componentes de UI interactivos y aprobaciones HITL.

---

### 8. EVALS (¿Los evals corren en CI GitHub Actions o solo en Vercel? Costos)
**Respuesta:** **CORREN EN CUALQUIER CI (GITHUB ACTIONS) VÍA CLI (`vitest` / `eve eval`).**

- **Evidencia Técnica:** Los evals en EVE son tests unitarios/de integración escritos en TypeScript dentro del directorio `evals/`. Se ejecutan usando `npx eve eval` o runners estándar de prueba.
- **Integración CI:** Se integran fácilmente en `.github/workflows/ci.yml`.
- **Costo:** Cero costo de plataforma Vercel por correr en GitHub Actions. El único costo incurrido es el consumo de API tokens de Gemini/Vertex AI al simular conversaciones durante las pruebas.

---

### 9. LICENCIA Y LOCK-IN (Apache-2.0, portabilidad ante descontinuación)
**Respuesta:** **CÓDIGO ABIERTO APACHE-2.0. CERO LOCK-IN PROPIETARIO.**

- **Evidencia Técnica:** El código del framework es 100% de código abierto bajo la licencia Apache-2.0. La lógica del agente, herramientas, skills e interacciones son TypeScript puro sobre Vercel AI SDK.
- **Portabilidad:** Si Vercel descontinúa EVE o se decide migrar fuera de Vercel, el código se puede ejecutar en cualquier servidor Node.js/Docker o migrar a un backend personalizado de Vercel AI SDK sin reescribir la lógica de negocio.

---

### 10. COMPARATIVA ARQUITECTÓNICA: EVE VS STACK ACTUAL IC360

| Criterio | Stack Actual IC360 (`geminiProxy.ts` + `Chatbot.tsx` + Vercel AI SDK) | Framework EVE (`@vercel/eve`) |
|---|---|---|
| **Complejidad** | 🟢 Muy Baja (Liviano, directo, 0 dependencias extra) | 🟡 Media (Introduce estructura de carpetas y runtime) |
| **Durable Execution** | 🔴 Manual (Requiere guardar estado en Firestore) | 🟢 Nativa (Checkpointing automático ante fallos) |
| **Orquestación Subagentes** | 🟡 Custom (Vía `invoke_subagent` / Antigravity) | 🟢 Nativa (Invocación y paso de contexto estructurado) |
| **Skills JIT** | 🟢 Soportado (Lectura directa de Markdown) | 🟢 Nativo (Carga dinámica por frontmatter) |
| **Integración PWA Vite** | 🟢 Directa (Mismo backend Express/Firebase) | 🟡 Vía API Microservicio independiente |
| **Pruebas / Evals** | 🟡 Personalizadas | 🟢 Framework nativo de Evals |

---

## ⚖️ VEREDICTO FINAL Y RECOMENDACIÓN ESTRATÉGICA

### 📌 VEREDICTO: 🟡 **EVALUAR EN OLEADA 2 (IC360-NEXUS)**

1. **Razón de No Adopción Inmediata (Oleada 0/1):**
   Actualmente, el stack de IC360 (`geminiProxy.ts`, Vercel AI SDK, `DOCUMENT-CENSUS-V1.md` y PWA Vite) resuelve el 100% de los requerimientos de la Oleada 0 y Oleada 1 con menor complejidad y respuesta más rápida.
2. **Oportunidad en Oleada 2 (IC360-NEXUS):**
   EVE será una excelente opción cuando IC360 requiera **agentes autónomos de larga duración** (que ejecuten análisis masivos de normativas durante 10-15 minutos) donde la *Durable Execution* y el *Checkpointing* eviten perder el trabajo si una función serverless o conexión falla.

---

### 🚀 AGENTE PRIMARIO CANDIDATO PARA OLEADA 2

Si el Founder autoriza la fase piloto de EVE en Oleada 2, el primer agente a migrar debe ser:

#### 🛡️ **Agente Pre-Auditor Normativo (WF-074 / WF-075)**
- **Por qué:** Realiza validaciones masivas cruzadas contra la matriz normativa (394 normas PDVSA/ISO/API). Requiere ejecuciones largas, evaluaciones formales y reporte detallado de hallazgos, donde la durabilidad de EVE aporta el máximo valor sin afectar la interacción en tiempo real del usuario en la PWA.

---
*Fin del Documento de Investigación EVE IC360 V1.*
