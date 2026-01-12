# Configuración de Servidores MCP (Model Context Protocol)

Esta guía explica cómo configurar correctamente los servidores MCP para que `claude-code` pueda interactuar con los servicios del proyecto: Supabase, Vercel y RunPod.

## 1. Archivo de Configuración `mcp.json`

El sistema espera un archivo de configuración en la siguiente ruta: `config/mcp.json`.

Asegúrate de que el archivo `config/mcp.json` exista y tenga el siguiente contenido:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=kcopoxrrnvogcwdwnhjr",
      "notes": "Para acceso a la base de datos a través de Claude Code. La autenticación se realiza vía OAuth (login en el navegador)."
    },
    "vercel": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@robinson_ai_systems/vercel-mcp"],
      "env": {
        "VERCEL_TOKEN": "${VERCEL_TOKEN}"
      },
      "notes": "For Vercel project and deployment management. Requires VERCEL_TOKEN environment variable (get from https://vercel.com/account/tokens)."
    },
    "runpod": {
      "type": "stdio",
      "command": "npx",
      "args": ["@runpod/mcp-server@latest"],
      "env": {
        "RUNPOD_API_KEY": "${RUNPOD_API_KEY}"
      },
      "notes": "For running GPU inference tasks on RunPod serverless endpoints."
    }
  }
}
```

## 2. Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto si no existe (puedes copiarlo desde `.env.example`). Debes configurar las siguientes variables:

### a. Supabase (OAuth)

**No se requieren variables de entorno** para la configuración del servidor MCP de Supabase.

Cuando `claude-code` necesite acceder a Supabase, automáticamente iniciará un flujo de autenticación OAuth:

1.  La herramienta te pedirá que abras una URL en tu navegador.
2.  Iniciarás sesión con tu cuenta de Supabase.
3.  Autorizarás el acceso para que la herramienta pueda interactuar con tu proyecto.

**Nota Importante:** Otras partes del proyecto (como Drizzle ORM) todavía pueden requerir la variable `DATABASE_URL` en tu `.env` para operaciones directas de base de datos fuera del flujo de MCP. La configuración de MCP, sin embargo, no la utiliza.

### b. RunPod

1.  Ve a tu consola de RunPod: `https://www.runpod.io/console/serverless/api`
2.  Genera o copia una API Key existente.
3.  Pega la clave en la variable `RUNPOD_API_KEY` en tu `.env`.

```dotenv
# .env
RUNPOD_API_KEY=TU_API_KEY_DE_RUNPOD
```

### c. Vercel

Necesitas un token de acceso personal para verificar la conexión.

1.  Ve a la configuración de tu cuenta de Vercel: `https://vercel.com/account/tokens`
2.  Crea un nuevo token. Dale un nombre descriptivo (ej. "Claude Code CLI").
3.  Copia el token y pégalo en la variable `VERCEL_TOKEN` en tu `.env`.

```dotenv
# .env
VERCEL_TOKEN=TU_TOKEN_DE_VERCEL
```

## 3. Verificación

Para confirmar que todos los servidores están configurados correctamente, puedes usar el script de verificación. Este script leerá tu archivo `.env` y intentará conectar con cada servicio.

Ejecuta el siguiente comando desde la raíz de tu proyecto:

```bash
pnpm tsx ./scripts/verify-mcp.ts
```

**Salida Esperada:**

El script te mostrará el estado de la conexión para cada servicio:

- ✅ **Éxito:** Si la conexión y autenticación fueron correctas.
- ❌ **Error:** Si hubo un problema, mostrando un mensaje de error específico.
- ⚠️ **Advertencia:** Si una variable de entorno no fue encontrada y se omitió la prueba.

```
--- Iniciando verificación de servidores MCP ---
✅ Archivo de configuración mcp.json encontrado en C:\_WALLIE\config\mcp.json
ℹ️ Verificando endpoint de Supabase MCP (OAuth)...
✅ Endpoint de Supabase MCP está activo y esperando autenticación OAuth.
-------------------------------------------------
ℹ️ Verificando Vercel...
✅ Autenticación con Vercel exitosa para el usuario: tu-email@ejemplo.com
-------------------------------------------------
ℹ️ Verificando RunPod...
✅ Autenticación con RunPod API exitosa.
--- Verificación de servidores MCP completada ---
```

## 4. Troubleshooting Común

- **Error con Supabase:**
  - Si el CLI no puede iniciar el login, asegúrate de que no haya un firewall bloqueando el acceso a `https://mcp.supabase.com`.
  - Si el login en el navegador falla, verifica que tienes los permisos correctos en el proyecto de Supabase.
- **Error de autenticación con Vercel:**
  - Confirma que el `VERCEL_TOKEN` es válido y no ha expirado.
- **Error de autenticación con RunPod:**
  - Confirma que la `RUNPOD_API_KEY` es correcta.
