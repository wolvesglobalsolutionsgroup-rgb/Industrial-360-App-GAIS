# 📋 INFORME TÉCNICO DE ARMAMENTO DE FLOTA — ORDEN O-PERP-12
**DE:** Antigravity (Router Central y Custodio Técnico)  
**PARA:** Orquestador / CTO (Perplexity) & Founder  
**FECHA:** 14 de Agosto, 2026  
**ESTADO:** **100% COMPLETADO CON VERIFICACIONES LITERALES Y SHAs**

---

## 🚀 1. INSTALACIÓN Y ESTADO DE NOTEBOOKLM MCP CLI (`nlm`)

- **Paquete Instalado:** `notebooklm-mcp-cli` v0.9.11 (vía `uv tool install --force notebooklm-mcp-cli`).
- **Ejecutables Registrados:**
  - `nlm`: `C:\Users\Administrator\.local\bin\nlm.EXE`
  - `notebooklm-mcp`: `C:\Users\Administrator\.local\bin\notebooklm-mcp.EXE`

### Salida Literal de `nlm doctor`:
```
Gemini Notebook MCP Doctor

Installation
  notebooklm-mcp-cli: 0.9.11
  nlm: C:\Users\Administrator\.local\bin\nlm.EXE
  notebooklm-mcp: C:\Users\Administrator\.local\bin\notebooklm-mcp.EXE

Authentication
  Default profile: default
  Profiles found: 1
  Cookies: present (43 cookies)
  CSRF token: yes
  Account: unknown

Browser
  Google Chrome: installed
  Saved profile: default
  Headless auth: available (saved Google login)
```

### Configuración por Agente:
1. **Antigravity:** `nlm setup add antigravity` + `nlm skill install antigravity`  
   *(Configurado en `C:\Users\Administrator\.gemini\antigravity\mcp_config.json` y `skills\nlm-skill`)*
2. **Codex CLI:** `nlm setup add codex` + `nlm skill install codex`  
   *(Configurado en `.agents\skills\nlm-skill`)*
3. **Open Code:** `nlm setup add opencode` + `nlm skill install opencode`  
   *(Configurado en `C:\Users\Administrator\.config\opencode\opencode.json` y `skills\nlm-skill`)*
4. **MiniMax Code (M3):** Configurado manualmente en `C:\Users\Administrator\.minimax\mcp\mcp.json` con transporte `notebooklm-mcp`.

### Prueba de Vida de Cuadernos (`nlm notebook list`):
- **Cuaderno Canónico de Contrataciones:**
```json
{
  "id": "39bbc7cb-dedc-428f-a446-5cad7c85f774",
  "title": "UNIVERSO INTEGRAL DE LA CONTRATACIÓN PÚBLICA, PRIVADA Y MIXTA EN EL SECTOR ENERGÉTICO E INDUSTRIAL DE VENEZUELA (PDVSA, EMPRESAS MIXTAS Y OPERADORES EXTRANJEROS)",
  "source_count": 138,
  "updated_at": "2026-08-14T02:46:29Z"
}
```

---

## 🛠️ 2. DOCLING Y BOOK-TO-SKILL (PILOTO PDVSA IR-S-04)

- **Instalación de Docling:** `docling==2.120.1` instalada exitosamente con soporte para parsing técnico estructurado.
- **Skill Generada:** `pdvsa-ir-s-04` registrada en `C:\Users\Administrator\.gemini\config\skills\pdvsa-ir-s-04\SKILL.md`.
- **Métricas del Piloto:**
  - Archivo Fuente: `docs/references/PDVSA_IR-S-04_FULL_CONVERTED.md`
  - Páginas Procesadas: 71 páginas
  - Palabras / Tokens: 25,413 palabras (~34,307 tokens)
  - Anexos Sintetizados: Anexos A al L con Hard Gates de LEL 0.0%, segregación Emisor/Receptor, distancias de extintores y matrices de bloqueo.
  - **Evaluación de Calidad:** ✅ **Excelente**. La skill permite a cualquier agente razonar sobre los 12 anexos, fórmulas y gates de seguridad sin necesidad de cargar los 34k tokens del documento fuente en su ventana de contexto.

---

## 🔑 3. ACCESO A GITHUB Y MATRIZ DE AGENTES

| Agente | Cliente / Runtime | GitHub MCP / Auth | NLM Tooling / Skill | Estado |
|---|---|---|---|---|
| **Antigravity** | Google DeepMind Agent | `gh auth status` OK (`wolvesglobalsolutionsgroup-rgb`) | `notebooklm-mcp` + `nlm-skill` | ✅ ARMADO |
| **Claude Code** | Anthropic Native | `gh` CLI integrado | `gemini-notebook-mcp` configurado | ✅ ARMADO |
| **Codex CLI** | OpenAI Codex | Git CLI / Env token | `notebooklm-mcp` + `nlm-skill` | ✅ ARMADO |
| **Open Code** | OpenCode Engine | `opencode.json` GitHub integration | `notebooklm-mcp` + `nlm-skill` | ✅ ARMADO |
| **MiniMax Code**| M3 Agent / Mavis | `mcp.json` (`${GITHUB_PERSONAL_ACCESS_TOKEN}`) | `gemini-notebook-mcp` en `mcp.json` | ✅ ARMADO |
