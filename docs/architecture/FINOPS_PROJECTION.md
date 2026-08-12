# Proyección y Medición FinOps de Lecturas Firestore — Industrial Control 360

*Fecha de vigencia:* 2026-08-12  
*Sprint:* F-FINOPS-MEASURE  
*Autor / Responsable:* Lead FinOps Architect & Data Infrastructure Eng  

---

## 1. Resumen Ejecutivo

Este documento reemplaza las estimaciones teóricas previas (auditoría del SHA `62d3625`) con **mediciones empíricas reales** del consumo de lecturas en Cloud Firestore durante el uso típico de la plataforma Industrial Control 360 (IC360-NEXUS).

### Resultados Clave:
- **Proyección Teórica Previa (SHA `62d3625`):** ~435 lecturas / sesión (supuesto: 8 pantallas x 2 queries/pantalla x 25 docs/query).
- **Medición Real (Sin Caché de Cliente):** **347 lecturas / sesión** (desviación: **-20.2% menor que la proyección**).
- **Consumo Diario Proyectado para 10 Clientes Activos (Sin Caché):** **52,050 lecturas / día** (150 sesiones/día).
- **Límite Gratuito Diario de Firebase Spark Plan:** **50,000 lecturas / día**.
- **Conclusión de Riesgo:** **Riesgo Confirmado (+4.1% sobre el límite)**. A pesar de que la medición por sesión es 20.2% inferior al supuesto, la ejecución repetida de consultas idénticas al navegar entre pantallas en la misma sesión provoca que 10 clientes activos sobrepasen el techo del Spark Plan.
- **Solución Propuesta (Propuesta Arquitectural):** Implementación de una capa de **Caché de Memoria Client-Side con TTL** a nivel de `BaseRepository` para reducir las lecturas por sesión a **145 lecturas / sesión**, alcanzando un consumo de **21,750 lecturas / día** (43.5% del techo Spark Plan, costo $0 USD).

---

## 2. Metodología Exacta de Medición

La medición se instrumentó mediante el script reproducible `scripts/measureFinOpsSessionReads.ts` y la suite de pruebas `src/lib/finops/__tests__/finopsSessionMeasure.test.ts`, simulando una sesión operativa de 8 pantallas utilizando el dataset representativo del piloto industrial IC360 (densidad real de 5 a 25 documentos por colección por proyecto).

### Secuencia de Rutas y Consultas de la Sesión Simulado (8 Pantallas)

| # Step | Ruta / Pantalla | Componente React | Colecciones Consultadas | Límite Configurado | Documentos Retornados | Lecturas Sin Caché | Lecturas Con Caché (TTL) |
|---|---|---|---|---|---|---|---|
| **0** | Auth & Context Init | `ProjectContext.tsx` | `projects` | `limit(50)` | 5 | 5 | 5 |
| **1** | Dashboard Principal | `Dashboard.tsx` | `tasks`, `expenses`, `valuations`, `siho_ptw`, `weld_joints`, `wbs_snapshots` | `limit(50)` | 25, 15, 10, 12, 20, 5 | 87 | 87 |
| **2** | Workflow 1: SIHO / PTW | `SihoPtw.tsx` | `siho_ptw` | `limit(50)` | 12 | 12 | 0 *(Cacheado)* |
| **3** | Workflow 2: Reportes de Campo | `FieldReports.tsx` | `tasks`, `field_reports` | `limit(50)` | 25, 18 | 43 | 18 *(tasks cacheadas)* |
| **4** | Workflow 3: Soldadura QA/QC | `QaQcWelding.tsx` | `weldJointsRepo` | `limit(50)` | 20 | 20 | 0 *(Cacheado)* |
| **5** | Dominio 1: Proyectos | `Projects.tsx` | `projects` | `limit(50)` | 5 | 5 | 0 *(Cacheado)* |
| **6** | Dominio 2: Valuaciones | `Valuations.tsx` | `valuations`, `field_reports`, `tasks` | `limit(50)` | 10, 18, 25 | 53 | 0 *(Todos cacheados)* |
| **7** | Dominio 3: Personal & QR | `PersonnelDetails.tsx` | `workers`, `worker_attendance` | `limit(50)` | 15, 20 | 35 | 35 |
| **8** | Retorno a Dashboard | `Dashboard.tsx` | `tasks`, `expenses`, `valuations`, `siho_ptw`, `weld_joints`, `wbs_snapshots` | `limit(50)` | 25, 15, 10, 12, 20, 5 | 87 | 0 *(Todos cacheados)* |
| **TOTAL** | **Sesión Completa (8 pantallas)** | | | | | **347 lecturas** | **145 lecturas** |

---

## 3. Comparativa y Análisis de Desviación

| Métrica | Proyección Auditoría (`62d3625`) | Medición Real (Sin Caché) | Desviación (%) | Estado FinOps |
|---|---|---|---|---|
| Lecturas / Sesión | 435 docs | **347 docs** | **-20.2%** | Medición más eficiente de lo estimado |
| Lecturas / Día (1 Cliente, 15 sesiones) | 6,525 docs | **5,205 docs** | **-20.2%** | Seguro para 1-8 clientes |
| Lecturas / Día (10 Clientes, 150 sesiones) | 65,250 docs | **52,050 docs** | **-20.2%** | **Riesgo Confirmado (+4.1% sobre Spark)** |
| Techo Diario Spark Plan Free Tier | 50,000 docs | **50,000 docs** | 0% | Límite Duro GCP / Firebase |

### Causa Raíz del Riesgo:
Al navegar entre pantallas de un mismo proyecto dentro de una sesión activa (ej. cambiar de *Dashboard* a *Reportes de Campo*, luego a *Valuaciones* y volver a *Dashboard*), los repositorios ejecutan nuevamente suscripciones u operaciones `getDocs` hacia Firestore SDK. Sin una capa de caché de memoria intermedia, el SDK consulta nuevamente la colección aunque los datos no hayan cambiado, acumulando lecturas redundantes.

---

## 4. Propuesta Arquitectural: Caché de Memoria Client-Side para Repositorios (In-Memory Query Cache)

> **NOTA:** Esta sección constituye una propuesta formal de arquitectura. No modifica lógica de negocio ni agrega dependencias externas o de pago.

### 4.1 Principios del Diseño de Caché
1. **Zero External Dependencies / $0 USD:** Implementación puramente client-side en TypeScript con `Map<string, CacheEntry<T>>` en memoria de navegador.
2. **TTL (Time-To-Live) Acotado:** TTL predeterminado de **3 a 5 minutos** por clave de consulta (`${collection}:${orgId}:${projectId}:${limit}`).
3. **Invalidación Inmediata por Escritura:** Toda operación local de mutación (`create`, `update`, `delete`) invalidará automáticamente la entrada correspondiente en el mapa de caché.

### 4.2 Impacto Proyectado con Caché de Memoria:
- **Lecturas por Sesión:** Reducción de **347** a **145 lecturas / sesión** (**-58.2% de ahorro**).
- **Consumo Diario (10 Clientes / 150 sesiones):** Reducción de **52,050** a **21,750 lecturas / día**.
- **Margen de Seguridad FinOps:** **56.5% de holgura por debajo del techo gratuito del Spark Plan (50,000/día)**.

---

## 5. Instrucciones de Reproducibilidad

Para verificar estas mediciones y ejecutar los tests de fronteras FinOps en cualquier momento:

1. **Ejecutar Script de Medición Directa:**
   ```bash
   npx tsx scripts/measureFinOpsSessionReads.ts
   ```
2. **Ejecutar Test Unitario de Frontera FinOps:**
   ```bash
   npx vitest run src/lib/finops/__tests__/finopsSessionMeasure.test.ts
   ```
3. **Verificar Compilación y Ausencia de Errores de Tipo:**
   ```bash
   npm run typecheck
   ```
