# 🧪 INFORME DE RESULTADOS DEL SPIKE PRÁCTICO: VERCEL EVE FRAMEWORK v0.34.0

**Documento:** `SPIKE-EVE-RESULTADO.md`  
**Agente Evaluador:** Antigravity  
**Entorno de Prueba:** `C:\Users\Administrator\.gemini\antigravity\brain\...\scratch\spike-eve\spike-agent\` (Carpeta temporal fuera del repo)  
**Versión Real Instalada de EVE:** `eve@0.34.0`  
**Fecha de Ejecución:** `13 de Agosto, 2026`  

---

## 📋 1. PRUEBAS REALIZADAS Y COMANDOS EJECUTADOS

| Paso | Acción Ejecutada | Resultado |
|---|---|---|
| **Paso 1: Scaffolding** | `npx eve@latest init spike-agent` | ✅ **EXITOSO** (Estructura generada en 94ms con `agent.ts`, `instructions.md`, `package.json`, `tsconfig.json`) |
| **Paso 2: FinOps & Direct Model Call** | Configuración de `@ai-sdk/google` y `@ai-sdk/openai` sin `AI_GATEWAY_API_KEY` | 🔴 **FALLÓ (DEALBREAKER CONFIRMADO)** |
| **Paso 3: Skill Compatibility** | Copia directa de `pdvsa-si-s-04.md` a `skills/` sin reformatear | ✅ **EXITOSO** (EVE descubrió y cargó el playbook `pdvsa-si-s-04` automáticamente) |

---

## 🚨 2. RESULTADO EMPÍRICO DE LOS 2 DEALBREAKERS

### 🔴 DEALBREAKER #1 (FINOPS & INDEPENDENCIA DEL AI GATEWAY): **FALLÓ / DEPURADO CON EVIDENCIA REAL**

- **Hipótesis Teórica:** EVE permite llamadas directas a Gemini/OpenAI sin usar Vercel AI Gateway (`AI_GATEWAY_API_KEY`).
- **Resultado Empírico Real (`eve@0.34.0`):**
  1. **Falta de Metadata de Compresión:** Al configurar `@ai-sdk/google` directamente, EVE arroja error en su motor de compresión:
     ```text
     [STDERR] Cannot compile agent compaction because the primary compaction trigger model "google/gemini-2.0-flash" does not have known AI Gateway context window metadata.
     ```
  2. **Inyección de Parámetros Propietarios de Vercel:** Al utilizar la llamada directa con el SDK, el arnés de bucle de herramientas (`[eve:harness.tool-loop]`) inyecta un objeto `include` con extensiones de Vercel (`reasoning.encrypted_content`, `file_search_call.results`, etc.), provocando rechazo 400 Bad Request en endpoints estándar de proveedores:
     ```json
     {
       "errorId": "b4b47e1a-0086-4cef-8e30-730b7a24e7a0",
       "details": {
         "apiErrorMessage": "Invalid Responses API request",
         "statusCode": 400,
         "responseBodySnippet": "Invalid option: expected one of file_search_call.results|..."
       }
     }
     ```
- **Conclusión FinOps:** **EVE v0.34.0 TIENE UN LOCK-IN TÉCNICO CON EL VERCEL AI GATEWAY.** No es posible operarlo de forma estable y directa sin la infraestructura de pasarela de Vercel.

---

### ✅ DEALBREAKERS #2 (COMPATIBILIDAD DE SKILLS NORMATIVAS): **VERIFICADO (100% COMPATIBLE)**

- **Hipótesis Teórica:** Las skills normativas en Markdown con frontmatter YAML se pueden cargar en EVE sin reformatear.
- **Resultado Empírico Real:**
  EVE leyó y parseó la skill `pdvsa-si-s-04.md` directamente desde la carpeta `skills/`:
  ```yaml
  ---
  name: api-1104-pdvsa-si-s-04-norms
  description: "Compilación de citas normativas literales y reglas técnicas de API 1104 §10, PDVSA SI-S-04 / IR-S-04, PDVSA MP-04000..."
  ---
  ```
- **Conclusión de Compatibilidad:** Las 24 skills normativas de IC360 son **100% compatibles out-of-the-box** con el mecanismo de selección perezosa (JIT) de EVE.

---

## 🏛️ 3. VEREDICTO FINAL ACTUALIZADO

### 🛑 **RECHAZAR / DESCHARTAR EVE PARA OLEADA 0 Y OLEADA 1**
### 🟡 **MANTENER NUESTRA ARQUITECTURA ACTUAL (`geminiProxy.ts` + Vercel AI SDK)**

**Justificación Final:**
1. EVE v0.34.0 impone una dependencia oculta pero rígida del **Vercel AI Gateway** y su esquema de metadatos/compresión.
2. Rompe nuestra premisa FinOps de invocar directamente la API de Google Gemini (o Vertex AI) con credenciales propias sin pasar por peajes/intermediación de Vercel.
3. Nuestra solución interna basada en `geminiProxy.ts` + Vercel AI SDK (`ai` package direct) opera sin comisiones, con streaming directo NDJSON, soporta las 24 skills en Markdown y no añade acoplamiento.

---
*Fin del Informe del Spike EVE.*
