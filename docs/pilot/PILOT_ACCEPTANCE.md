# PILOT ACCEPTANCE & OPERATIONAL CHECKLIST
## Industrial Control 360 — Tenant: `prointeca-demo`

**Documento de Aceptación Operativa y Flujo Extremo a Extremo del Piloto Industrial PROINTECA C.A.**

---

### 1. Resumen Ejecutivo del Piloto
- **Cliente / Inmueble:** PDVSA Refinación Paraguaná (Complejo Refinador Paraguaná - CRP)
- **Contratista Ejecutante:** PROINTECA C.A.
- **Tenant Multi-Tenant:** `prointeca-demo`
- **Proyecto ID:** `PROJ-PILOT-PROINTECA`
- **Especificaciones del Ducto:**
  - **Diámetro / Espesor:** 6" SCH 40 (0.280" de pared)
  - **Longitud:** 17.0 km (Tramo Cardón - Amuay)
  - **Presión Máxima de Operación (MAOP):** 2126 PSI
  - **Fluido:** Propano / Gas Licuado de Petróleo (GLP)

---

### 2. Defectos Registrados en Corrida ILI
La corrida de inspección de herramienta inteligente (Pig MFL + UT Combo) identificó 3 defectos clave:
1. **Anomalía D001 (KP 2.400 - Frente Cardón):**
   - **Pérdida de Pared:** 48% (Corrosión externa en hora 12:00)
   - **Estatus / Acción:** EVALUADO. Requiere monitoreo en próxima corrida.
2. **Anomalía D002 (KP 8.700 - Tramo Medio):**
   - **Pérdida de Pared:** 22% (Corrosión interna en hora 03:00)
   - **Estatus / Acción:** EVALUADO. Sin acción inmediata requerida.
3. **Anomalía D003 (KP 12.100 - Frente Amuay):**
   - **Pérdida de Pared:** 68% (Pérdida crítica de pared en hora 06:00, P_safe = 1650 PSI < MAOP 2126 PSI)
   - **Estatus / Acción:** **CRÍTICO - REPARACIÓN REQUERIDA**. Reparación en vivo con instalación de Camisa de Refuerzo Tipo B (API 1104 Anexo B).

---

### 3. Matriz de Roles y Usuarios del Piloto (`prointeca-demo`)

| Rol | UID de Usuario | Nombre / Cargo | Email |
|---|---|---|---|
| **Gerente** | `usr_gerente_prointeca` | Ing. Carlos Mendoza (Gerente de Proyecto) | `carlos.mendoza@prointeca-demo.com` |
| **Supervisor** | `usr_supervisor_prointeca` | Ing. Manuel Rivas (Supervisor SIHO-A) | `manuel.rivas@prointeca-demo.com` |
| **Inspector** | `usr_inspector_prointeca` | Tec. Roberto Gomez (Inspector NDT Level II) | `roberto.gomez@prointeca-demo.com` |
| **Campo** | `usr_campo_prointeca` | José R. Colmenares (Capataz / Soldador CIV-1845236) | `jose.colmenares@prointeca-demo.com` |
| **Cliente** | `usr_cliente_prointeca` | Ing. Gustavo Bolívar (Inspector Fiscal PDVSA) | `gustavo.bolivar@pdvsa-demo.com` |

---

### 4. Flujo Operativo Completo (Step-by-Step Checklist)

#### Paso 1: Configuración de Proyecto y Estructura WBS
- [x] Proyecto creado en `/organizations/prointeca-demo/projects/PROJ-PILOT-PROINTECA`.
- [x] Estructura WBS configurada con 5 tareas clave:
  - `WBS-1.1`: Permisología SIHO-A, Aislamiento LOTO y Purga Nitrógeno (`TASK-PILOT-001`, terminada).
  - `WBS-1.2`: Excavación Zanja y Descubrimiento D003 KP 12.1 (`TASK-PILOT-002`, terminada).
  - `WBS-1.3`: Instalación y Soldadura Camisa Tipo B en D003 (`TASK-PILOT-003`, en_campo).
  - `WBS-1.4`: Inspección QA/QC NDT Gammagrafía y Ultrasonido (`TASK-PILOT-004`, en_campo).
  - `WBS-1.5`: Prueba Hidrostática a 2126 PSI MAOP (`TASK-PILOT-005`, terminada).

#### Paso 2: Permisología SIHO-A, Prueba de Gases y LOTO
- [x] Permiso de Trabajo Seguro `PTW-2026-PILOT-01` emitido por Supervisor SIHO-A.
- [x] Prueba atmosférica verificada: **0.0% LEL**, **20.9% O2**, **0 PPM H2S**.
- [x] Candado y Etiqueta LOTO asignados (`LOCK-PROINTECA-PILOT-012`), energía cero verificada.

#### Paso 3: Reporte de Campo Offline con Geolocalización y Fotografía
- [x] Reporte de campo `REP-CAMPO-PILOT-001` registrado.
- [x] Coordenadas GPS fijadas: **Lat 11.74502, Lng -70.21045** (CRP Paraguaná, Falcón).
- [x] Evidencia fotográfica adjunta y estado de sincronización `SINCRONIZADO` confirmado.

#### Paso 4: Control de Calidad QA/QC NDT de Soldaduras
- [x] Registro de junta soldada `W-PILOT-001` (Junta J-PILOT-001 en 6" SCH 40).
- [x] Soldador homologado: **José R. Colmenares (CIV-1845236)** bajo norma API 1104 Anexo B.
- [x] Ensayos No Destructivos (RT / UT): Reporte `REP-RT-2026-PILOT01` con dictamen **APROBADO**.

#### Paso 5: Valuación de Avance Físico y Finanzas
- [x] Valuación `VAL-PILOT-001` correspondiente a la Quincena 2 de Julio 2026.
- [x] **Monto Bruto:** $245,000.00 USD.
- [x] **Deducciones:**
  - Retención Fiel Cumplimiento (10%): -$24,500.00 USD
  - Retención Laboral (5%): -$12,250.00 USD
  - Amortización Anticipo (30%): -$73,500.00 USD
- [x] **Monto Neto a Pagar:** **$134,750.00 USD**.
- [x] Firmas digitales completas (Inspector, Supervisor, Gerente) y Estatus **CERTIFICADA**.

#### Paso 6: Compilación del Dossier de Calidad y Libro Final
- [x] Dossier `DOS-PILOT-001` compilado con Código PDVSA `PDVSA-PIC-01-03-05-PROINTECA`.
- [x] Secciones I (General/SIHO-A), II (Certificados NDT), III (Pruebas Hidrostáticas 2126 PSI) y IV (As-Built / ILI) aprobadas.

#### Paso 7: Portal del Cliente (PDVSA)
- [x] Acceso verificado para `usr_cliente_prointeca` con rol `cliente`.
- [x] Visualización de informe consolidado, avance físico de 68% y valuaciones certificadas.

#### Paso 8: Extensión Kernel de Workflows (Sprint F-D — Escalabilidad a 100+ Workflows)
*Nota de Extensión de Arquitectura:* Los procedimientos operativos del piloto PROINTECA C.A. ahora pueden ejecutarse a través de la infraestructura Plugin-Kernel (`WorkflowRegistry`), permitiendo agregar nuevos formularios de inspección y permisos de campo de forma dinámica sin modificar páginas estáticas.
- [x] **Piloto 1 (`wf-042-inspeccion-izaje`):** Inspección de Grúas y Aparejos bajo norma ASME B30.5 con Hard Gate de pestillo de gancho.
- [x] **Piloto 2 (`wf-043-aprobacion-ptw`):** Permiso de Trabajo Seguro PTW SIHO-A con Hard Gate de prueba atmosférica (0% LEL, 0 PPM H2S).
- [x] **Piloto 3 (`wf-044-reporte-tabular`):** Reporte Tabular NDT de trazabilidad de soldaduras con generación de `DocumentViewModel`.

---

### 5. Comandos de Verificación y Pruebas
1. **Poblar datos del Piloto (en entorno de desarrollo o emulador):**
   ```bash
   npx tsx scripts/seed-prointeca-pilot.ts
   ```
2. **Ejecutar suite de Pruebas Unitarias y Smoke Tests:**
   ```bash
   npm run test:unit
   ```
3. **Validación Estática de Tipos TypeScript:**
   ```bash
   npx tsc --noEmit
   ```
