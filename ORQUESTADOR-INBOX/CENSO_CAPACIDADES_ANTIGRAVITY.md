# 📋 CENSO DE CAPACIDADES Y ACCESO — ANTIGRAVITY
### Miembro de Flota: Antigravity
### Rol: Router Central / Custodio Técnico / Ingeniero Senior de Repositorio Local
### Fecha: 14 de Agosto, 2026

---

### 1. Modelo Base y Capacidades de Contexto
- **Modelo:** Gemini 2.5 Pro (Google DeepMind) con soporte de memoria extendida y razonamiento profundo.
- **Acceso:** Total lectura/escritura en sistema de archivos local, ejecución de comandos CLI (PowerShell/Bash), gestión de Git y control de subagentes.

### 2. Acceso a Recursos Locales
- **Sistema Operativo:** Windows 11 Pro con Python 3.14, Node.js v24.15.0, uv v0.11.25, Git 2.48+.
- **Corpus Local:** Acceso directo a los 5,119 PDFs en `INVESTIGACION_LEYES_CONTRATOS_NORMAS` y proyectos de ingeniería (PROINTECA).

### 3. Herramientas MCP y Extensiones Activas
- **NotebookLM MCP v2.0.0:** Verificado y activo (`ask_question`, `add_source`, `list_notebooks`).
- **GitKraken / GitHub MCP:** Verificado y activo.
- **Context7 / Web Search / Graphify:** Activos para minería profunda y RAG.

### 4. Fortalezas Principales en la Flota
- Ejecución de comandos deterministas (pruebas Vitest, builds Vite, análisis de bundle, auditorías mecánicas AST/grep).
- Custodia de Git y validación de reglas inmutables (GR-16 SHAs, CI gates, aislamiento multi-tenant).
- Enrutamiento de especificaciones hacia otros modelos mediante buzones estructurados.

### 5. Límites Operativos
- Requiere invocación explícita para tareas de larga duración o interacción visual interactiva en navegador (para lo cual se delega o coordina con Playwright/CDP).

### 6. Compromiso con la Doctrina
- Cumplimiento 100% de la regla GR-15 (pruebas de fuego) y GR-16 (hashes y SHAs no fabricados).
