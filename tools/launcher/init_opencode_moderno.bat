@echo off
setlocal EnableDelayedExpansion

TITLE OpenCode Modern Project Initializer

ECHO ==========================================
ECHO     OpenCode Modern Project Initializer
ECHO ==========================================
ECHO.

REM =========================================================
REM DIRECTORIOS OFICIALES OPENCODE
REM =========================================================

IF NOT EXIST ".opencode" mkdir ".opencode"
IF NOT EXIST ".opencode\agents" mkdir ".opencode\agents"
IF NOT EXIST ".opencode\commands" mkdir ".opencode\commands"
IF NOT EXIST ".opencode\modes" mkdir ".opencode\modes"

IF NOT EXIST "docs" mkdir "docs"
IF NOT EXIST "docs\architecture" mkdir "docs\architecture"
IF NOT EXIST "docs\tasks" mkdir "docs\tasks"
IF NOT EXIST "docs\bugs" mkdir "docs\bugs"
IF NOT EXIST "docs\decisions" mkdir "docs\decisions"

REM =========================================================
REM AI_CONTEXT.md
REM =========================================================

IF NOT EXIST "AI_CONTEXT.md" (
(
ECHO # AI CONTEXT
ECHO.
ECHO Responder SIEMPRE en castellano.
ECHO.
ECHO ## Objetivo del Sistema
ECHO Proyecto compatible con:
ECHO - Python
ECHO - FastAPI
ECHO - React/Vite
ECHO - PostgreSQL/MySQL
ECHO - Flutter
ECHO - APIs REST
ECHO - SaaS multiempresa
ECHO - IA local/remota
ECHO.
ECHO ## Reglas Generales
ECHO - No romper codigo existente.
ECHO - Trabajar incrementalmente.
ECHO - Mantener coherencia multiarchivo.
ECHO - Verificar imports y dependencias.
ECHO - Mantener documentacion actualizada.
ECHO - Actualizar tasks y arquitectura.
ECHO - Evitar duplicacion de codigo.
ECHO - Priorizar mantenibilidad y rendimiento.
ECHO.
ECHO ## Flujo de Trabajo
ECHO 1. Leer contexto existente.
ECHO 2. Revisar tareas pendientes.
ECHO 3. Crear plan.
ECHO 4. Ejecutar cambios minimos.
ECHO 5. Validar cambios.
ECHO 6. Actualizar documentacion.
) > "AI_CONTEXT.md"
)

REM =========================================================
REM AGENTS.md
REM =========================================================

IF NOT EXIST "AGENTS.md" (
(
ECHO # PROJECT AGENTS RULES
ECHO.
ECHO - Trabajar siempre en castellano.
ECHO - Analizar impacto antes de modificar.
ECHO - Mantener arquitectura consistente.
ECHO - Usar cambios minimos.
ECHO - Mantener documentacion actualizada.
ECHO - Mantener compatibilidad frontend/backend/mobile.
ECHO - No duplicar logica ni servicios.
ECHO - Mantener APIs coherentes.
ECHO - No romper migraciones ni integridad relacional.
) > "AGENTS.md"
)

REM =========================================================
REM HANDOFF
REM =========================================================

IF NOT EXIST "docs\HANDOFF.md" (
(
ECHO # HANDOFF
ECHO.
ECHO ## Estado Actual
ECHO Pendiente de actualizar.
ECHO.
ECHO ## Ultimos Cambios
ECHO Pendiente.
ECHO.
ECHO ## Proximas Tareas
ECHO Pendiente.
) > "docs\HANDOFF.md"
)

REM =========================================================
REM PROJECT STATE
REM =========================================================

IF NOT EXIST "docs\project_state.json" (
(
ECHO {
ECHO   "project_name": "",
ECHO   "status": "active",
ECHO   "last_update": "",
ECHO   "current_focus": "",
ECHO   "notes": []
ECHO }
) > "docs\project_state.json"
)

REM =========================================================
REM PROJECT MAP
REM =========================================================

IF NOT EXIST "docs\architecture\project_map.json" (
(
ECHO {
ECHO   "frontend": {},
ECHO   "backend": {},
ECHO   "database": {},
ECHO   "mobile": {},
ECHO   "services": {},
ECHO   "integrations": {}
ECHO }
) > "docs\architecture\project_map.json"
)

REM =========================================================
REM TASKS
REM =========================================================

IF NOT EXIST "docs\tasks\todo.md" (
(
ECHO # TODO
ECHO.
ECHO - Pendiente
) > "docs\tasks\todo.md"
)

IF NOT EXIST "docs\tasks\sprint-current.md" (
(
ECHO # CURRENT SPRINT
ECHO.
ECHO - Pendiente
) > "docs\tasks\sprint-current.md"
)

REM =========================================================
REM BUILD AGENT
REM =========================================================

IF NOT EXIST ".opencode\agents\build.md" (
(
ECHO ---
ECHO model: opencode/minimax-m2.5-free
ECHO description: Build and implementation agent
ECHO ---
ECHO.
ECHO - Implementar cambios minimos.
ECHO - No romper compatibilidad.
ECHO - Verificar imports.
ECHO - Mantener arquitectura.
ECHO - No duplicar codigo.
) > ".opencode\agents\build.md"
)

REM =========================================================
REM PLAN AGENT
REM =========================================================

IF NOT EXIST ".opencode\agents\plan.md" (
(
ECHO ---
ECHO model: opencode/nemotron-3-super-free
ECHO description: Planning and architecture agent
ECHO ---
ECHO.
ECHO - Analizar arquitectura.
ECHO - Dividir tareas.
ECHO - Detectar impacto.
ECHO - Generar roadmap.
ECHO - Verificar dependencias.
) > ".opencode\agents\plan.md"
)

REM =========================================================
REM OPENCODE CONFIG
REM =========================================================

IF NOT EXIST "opencode.jsonc" (
(
ECHO {
ECHO   "$schema": "https://opencode.ai/config.json",
ECHO.
ECHO   "model": "opencode/minimax-m2.5-free",
ECHO.
ECHO   "small_model": "opencode/deepseek-v4-flash-free",
ECHO.
ECHO   "agent": {
ECHO     "build": {
ECHO       "model": "opencode/minimax-m2.5-free"
ECHO     },
ECHO.
ECHO     "plan": {
ECHO       "model": "opencode/nemotron-3-super-free"
ECHO     }
ECHO   },
ECHO.
ECHO   "instructions": [
ECHO     "AI_CONTEXT.md",
ECHO     "AGENTS.md",
ECHO     "docs/**/*.md"
ECHO   ],
ECHO.
ECHO   "permission": {
ECHO     "edit": "ask",
ECHO     "bash": "ask",
ECHO     "webfetch": "ask"
ECHO   },
ECHO.
ECHO   "compaction": {
ECHO     "auto": true,
ECHO     "prune": true
ECHO   },
ECHO.
ECHO   "shell": "pwsh",
ECHO.
ECHO   "watcher": {
ECHO     "ignore": [
ECHO       "node_modules/**",
ECHO       "dist/**",
ECHO       ".git/**",
ECHO       ".next/**",
ECHO       "build/**",
ECHO       "__pycache__/**"
ECHO     ]
ECHO   }
ECHO }
) > "opencode.jsonc"
)

REM =========================================================
REM VSCODE
REM =========================================================

IF NOT EXIST ".vscode" mkdir ".vscode"

IF NOT EXIST ".vscode\settings.ai.json" (
(
ECHO {
ECHO   "editor.inlineSuggest.enabled": true,
ECHO   "editor.tabCompletion": "on",
ECHO   "editor.suggestSelection": "first",
ECHO   "editor.wordBasedSuggestions": "off",
ECHO   "editor.formatOnSave": true,
ECHO   "editor.minimap.enabled": false,
ECHO.
ECHO   "files.autoSave": "afterDelay",
ECHO   "files.autoSaveDelay": 1500,
ECHO.
ECHO   "git.openRepositoryInParentFolders": "always",
ECHO.
ECHO   "python.analysis.typeCheckingMode": "basic",
ECHO   "python.analysis.autoImportCompletions": true,
ECHO   "python.analysis.completeFunctionParens": true,
ECHO.
ECHO   "terminal.integrated.defaultProfile.windows": "PowerShell"
ECHO }
) > ".vscode\settings.ai.json"
)

ECHO.
ECHO ==========================================
ECHO   OpenCode Environment Configured
ECHO ==========================================
ECHO.
ECHO IMPORTANTE:
ECHO.
ECHO 1. Ejecuta: opencode
ECHO 2. Ejecuta: /connect
ECHO 3. Selecciona Zen
ECHO 4. Ejecuta: /models
ECHO 5. Verifica los modelos FREE
ECHO.
ECHO Configuracion finalizada.
ECHO.

PAUSE
