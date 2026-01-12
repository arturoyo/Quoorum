# 🔌 Configuración de Servidores MCP

Esta guía explica cómo configurar y mantener los servidores MCP (Model Context Protocol) para Claude Code en tu entorno local.

## 🎯 ¿Por qué esta configuración?

Los archivos `.mcp.json` y `.claude/settings.local.json` están en `.gitignore` porque:

- ✅ Contienen configuraciones locales específicas de cada desarrollador
- ✅ Los tokens de autenticación OAuth son personales y NO deben compartirse
- ✅ Evita conflictos entre diferentes configuraciones locales
- ✅ Protege credenciales sensibles

## 🚀 Setup Inicial (Primera vez o después de git pull)

### 1. Ejecutar el script de setup

```bash
pnpm mcp:setup
```

Este script:

- ✅ Copia `.mcp.json.example` → `.mcp.json` (si no existe)
- ✅ Copia `.claude/settings.local.json.example` → `.claude/settings.local.json` (si no existe)
- ✅ Muestra instrucciones de autenticación

### 2. Verificar la configuración

```bash
pnpm mcp:verify
```

Esto verificará que los endpoints MCP estén activos y correctamente configurados.

### 3. Autenticar con OAuth (solo una vez por máquina)

**Dentro de Claude Code**, ejecuta:

```
/mcp
```

Luego:

1. Selecciona "Authenticate" para **Supabase**
   - Se abrirá tu navegador
   - Inicia sesión en Supabase
   - Autoriza el acceso

2. Selecciona "Authenticate" para **Vercel**
   - Se abrirá tu navegador
   - Inicia sesión en Vercel
   - Autoriza el acceso

**🔐 Los tokens OAuth se guardan localmente y NO se pierden con git push/pull**

### 4. (Opcional) Configurar RunPod

Si necesitas usar RunPod para GPU computing, añade tu API key al `.env`:

```env
RUNPOD_API_KEY=tu_api_key_aqui
```

Obtén tu API key en: https://www.runpod.io/console/serverless/api

## 📊 Servidores MCP Disponibles

### 1. Supabase MCP

- **Tipo**: HTTP con OAuth
- **URL**: `https://mcp.supabase.com/mcp?project_ref=kcopoxrrnvogcwdwnhjr`
- **Capacidades**:
  - Ejecutar queries SQL
  - Gestionar schemas y migraciones
  - Acceder a Auth, Storage, Edge Functions

### 2. Vercel MCP

- **Tipo**: HTTP con OAuth
- **URL**: `https://mcp.vercel.com/sse`
- **Capacidades**:
  - Deploy de proyectos
  - Gestión de builds
  - Variables de entorno
  - Logs y analytics
  - Dominios

### 3. RunPod MCP (Opcional)

- **Tipo**: STDIO con API Key
- **Capacidades**:
  - Ejecutar tareas de inferencia en GPU
  - Gestionar endpoints serverless
  - Optimización de costos GPU

## 🔄 Workflow: Pull → Setup → Trabajo

```bash
# 1. Actualizar código
git pull origin main

# 2. Configurar MCP (si es primera vez o cambiaron los .example)
pnpm mcp:setup

# 3. Verificar
pnpm mcp:verify

# 4. Autenticar (si es primera vez en esta máquina)
# Dentro de Claude Code: /mcp → Authenticate

# 5. ¡Listo para trabajar!
```

## 📁 Estructura de Archivos

```
.
├── .mcp.json                              ❌ NO en git (local)
├── .mcp.json.example                      ✅ SÍ en git (template)
├── .claude/
│   ├── settings.local.json                ❌ NO en git (local)
│   └── settings.local.json.example        ✅ SÍ en git (template)
├── config/
│   └── mcp.json                           ✅ SÍ en git (documentación)
├── docs/mcp/
│   ├── README.md                          ✅ Este archivo
│   └── SETUP.md                           ✅ Guía detallada
└── scripts/
    ├── setup-mcp.ts                       ✅ Script de setup
    └── verify-mcp.ts                      ✅ Script de verificación
```

## ❓ FAQ

### ¿Qué pasa si hago `git pull` y no tengo los archivos MCP?

No pasa nada. Solo ejecuta `pnpm mcp:setup` y listo.

### ¿Los tokens OAuth se pierden con git push/pull?

**No.** Los tokens se guardan localmente en tu máquina y NO están en git.

### ¿Tengo que autenticar cada vez que abro Claude Code?

**No.** La autenticación OAuth es persistente. Solo una vez por máquina.

### ¿Qué pasa si borro `.mcp.json` por accidente?

Ejecuta `pnpm mcp:setup` para recrearlo. Luego autentica de nuevo con `/mcp`.

### ¿Puedo modificar `.mcp.json` localmente?

Sí, pero tus cambios NO se subirán a git (está en `.gitignore`).

### ¿Cómo actualizo la configuración para todo el equipo?

Edita `.mcp.json.example` y súbelo a git. Los demás ejecutarán `pnpm mcp:setup`.

## 🆘 Troubleshooting

### Error: "Failed to connect" en Vercel

**Causa**: Token OAuth expirado o no configurado.

**Solución**:

```bash
# Dentro de Claude Code
/mcp
# Selecciona "Authenticate" para Vercel
```

### Error: "Needs authentication" en Supabase

**Causa**: No autenticado con OAuth.

**Solución**:

```bash
# Dentro de Claude Code
/mcp
# Selecciona "Authenticate" para Supabase
```

### RunPod no funciona

**Causa**: `RUNPOD_API_KEY` no configurada en `.env`.

**Solución**:

```bash
# En .env
RUNPOD_API_KEY=tu_api_key
```

### Los archivos .example no existen

**Causa**: Necesitas hacer `git pull`.

**Solución**:

```bash
git pull origin main
pnpm mcp:setup
```

## 📚 Referencias

- [MCP Protocol](https://modelcontextprotocol.io/)
- [Claude Code Documentation](https://code.claude.com/docs)
- [Supabase MCP](https://mcp.supabase.com)
- [Vercel MCP](https://mcp.vercel.com)
- [RunPod API](https://docs.runpod.io)

---

**Última actualización**: 19 Dic 2024
