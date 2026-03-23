# 🔑 Guía Completa: Cómo Conseguir API Keys para Auto-Research

**Actualizado:** 21 Ene 2026

Esta guía te explica paso a paso cómo conseguir las API keys necesarias para el sistema de Auto-Research.

---

## 📋 Índice

1. [Google Custom Search API (Principal)](#1-google-custom-search-api-principal)
2. [Serper API (Backup)](#2-serper-api-backup)
3. [Configuración Final](#3-configuración-final)

---

## 1. Google Custom Search API (Principal)

### Paso 1: Crear Custom Search Engine

1. **Ve a Google Custom Search:**
   - Abre: https://programmablesearchengine.google.com/
   - Inicia sesión con tu cuenta de Google

2. **Crear nuevo motor de búsqueda:**
   - Click en **"Add"** o **"Create a custom search engine"**
   - Rellena el formulario:
     ```
     Sites to search: *
     Name: Quoorum Auto-Research
     Language: Spanish (o tu idioma preferido)
     ```
   - ⚠️ **IMPORTANTE:** En "Sites to search" escribe `*` (asterisco) para buscar en todo internet
   - Click en **"Create"**

3. **Obtener Search Engine ID:**
   - Una vez creado, click en tu motor de búsqueda
   - Ve a **"Setup"** → **"Basics"**
   - Copia el **"Search engine ID"** (formato: `xxxxxxxxxxxxxxxxxxxxxxxxx:yyyyyyyyyyy`)
   - ✅ **Guarda este ID**, lo necesitarás después

### Paso 2: Habilitar Custom Search API en Google Cloud

1. **Ir a Google Cloud Console:**
   - Abre: https://console.cloud.google.com/
   - Inicia sesión con tu cuenta de Google

2. **Crear o seleccionar proyecto:**
   - Si no tienes proyecto, click en **"Select a project"** → **"New Project"**
   - Nombre: `Quoorum Auto-Research` (o el que prefieras)
   - Click en **"Create"**
   - Selecciona el proyecto recién creado

3. **Habilitar Custom Search API:**
   - En el menú lateral, ve a **"APIs & Services"** → **"Library"**
   - Busca: **"Custom Search API"**
   - Click en **"Custom Search API"**
   - Click en **"Enable"** (Habilitar)
   - Espera unos segundos a que se habilite

4. **Crear API Key:**
   - Ve a **"APIs & Services"** → **"Credentials"**
   - Click en **"Create Credentials"** → **"API Key"**
   - Se creará una API Key automáticamente
   - ⚠️ **IMPORTANTE:** Por seguridad, click en **"Restrict Key"**
   - En **"API restrictions"**, selecciona **"Restrict key"**
   - Elige **"Custom Search API"** de la lista
   - Click en **"Save"**
   - ✅ **Copia la API Key** (formato: `AIzaSy...`)

### Paso 3: Verificar que funciona

1. **Prueba rápida:**
   ```bash
   # Reemplaza con tus valores
   curl "https://www.googleapis.com/customsearch/v1?key=TU_API_KEY&cx=TU_SEARCH_ENGINE_ID&q=test"
   ```

2. **Si funciona:** Deberías ver un JSON con resultados de búsqueda
3. **Si falla:** Verifica que:
   - La API Key esté correcta
   - El Search Engine ID esté correcto
   - Custom Search API esté habilitada

---

## 2. Serper API (Backup)

### Paso 1: Crear cuenta en Serper

1. **Registrarse:**
   - Ve a: https://serper.dev/
   - Click en **"Sign Up"** o **"Get Started"**
   - Puedes usar tu email o cuenta de Google

2. **Verificar email:**
   - Revisa tu correo y click en el enlace de verificación
   - Completa el proceso de registro

### Paso 2: Obtener API Key

1. **Acceder al dashboard:**
   - Una vez registrado, serás redirigido al dashboard
   - O ve a: https://serper.dev/dashboard

2. **Ver tu API Key:**
   - En el dashboard verás tu **"API Key"** (formato: `sk-...`)
   - ✅ **Copia esta API Key**

3. **Verificar plan:**
   - El plan **Free** incluye 100 búsquedas/mes gratis
   - Perfecto para desarrollo y testing
   - Para producción, considera un plan superior

### Paso 3: Verificar que funciona

1. **Prueba rápida:**
   ```bash
   curl -X POST https://google.serper.dev/search \
     -H "X-API-KEY: TU_SERPER_KEY" \
     -H "Content-Type: application/json" \
     -d '{"q":"test"}'
   ```

2. **Si funciona:** Deberías ver un JSON con resultados de búsqueda
3. **Si falla:** Verifica que la API Key esté correcta

---

## 3. Configuración Final

### Paso 1: Añadir a `.env.local`

1. **Abre el archivo `.env.local`** en la raíz del proyecto
2. **Añade las siguientes líneas:**

```bash
# ============================================
# AUTO-RESEARCH APIs
# ============================================

# Google Custom Search API (Principal)
# Obtener en: https://console.cloud.google.com/
GOOGLE_CUSTOM_SEARCH_API_KEY=AIzaSy...tu_api_key_aqui
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=xxxxxxxxxxxxxxxxxxxxxxxxx:yyyyyyyyyyy

# Serper API (Backup automático)
# Obtener en: https://serper.dev/
SERPER_API_KEY=sk-...tu_serper_key_aqui
```

3. **Reemplaza los valores:**
   - `AIzaSy...tu_api_key_aqui` → Tu Google API Key
   - `xxxxxxxxxxxxxxxxxxxxxxxxx:yyyyyyyyyyy` → Tu Search Engine ID
   - `sk-...tu_serper_key_aqui` → Tu Serper API Key

### Paso 2: Verificar configuración

1. **Reinicia el servidor de desarrollo:**
   ```bash
   # Detén el servidor (Ctrl+C)
   # Luego reinicia
   pnpm dev
   ```

2. **Crea un nuevo debate:**
   - Ve a `/debates/new`
   - Escribe una pregunta
   - Deberías ver en los logs del servidor:

   ```
   [Auto-Research] Using Google Custom Search API
   [Auto-Research] Generated 3 queries for: "..."
   [Auto-Research] Completed 3 searches
   ```

3. **Si ves errores:**
   - Verifica que las API keys estén correctas en `.env.local`
   - Verifica que no haya espacios extra
   - Verifica que el servidor se haya reiniciado

---

## 🎯 Resumen Rápido

### Google Custom Search API
1. ✅ Crear Custom Search Engine en https://programmablesearchengine.google.com/
2. ✅ Habilitar Custom Search API en https://console.cloud.google.com/
3. ✅ Crear API Key y restringirla a Custom Search API
4. ✅ Copiar Search Engine ID y API Key

### Serper API
1. ✅ Registrarse en https://serper.dev/
2. ✅ Copiar API Key del dashboard
3. ✅ Listo (100 búsquedas/mes gratis)

### Configuración
1. ✅ Añadir ambas keys a `.env.local`
2. ✅ Reiniciar servidor
3. ✅ Probar creando un debate

---

## 🐛 Troubleshooting

### Error: "API key not valid" (Google)
- ✅ Verifica que la API Key esté correcta
- ✅ Verifica que Custom Search API esté habilitada
- ✅ Verifica que la API Key esté restringida solo a Custom Search API

### Error: "Custom Search Engine ID not found" (Google)
- ✅ Verifica que el Search Engine ID esté correcto
- ✅ Verifica que el Custom Search Engine esté activo
- ✅ Verifica que en "Sites to search" tengas `*` (asterisco)

### Error: "Serper API error: 401" (Serper)
- ✅ Verifica que la API Key esté correcta
- ✅ Verifica que no hayas excedido el límite de 100 búsquedas/mes (free tier)

### No se ejecuta Auto-Research
- ✅ Verifica que las variables estén en `.env.local` (no `.env`)
- ✅ Verifica que el servidor se haya reiniciado después de añadir las keys
- ✅ Verifica los logs del servidor para ver qué API está usando

---

## 💰 Costos

### Google Custom Search API
- **Free tier:** 100 búsquedas/día gratis
- **Después:** $5 por 1,000 búsquedas
- **Ejemplo:** 1 debate = ~3-5 búsquedas → ~20-30 debates/día gratis

### Serper API
- **Free tier:** 100 búsquedas/mes gratis
- **Starter:** $50/mes por 1,000 búsquedas
- **Ejemplo:** 1 debate = ~3-5 búsquedas → ~20 debates/mes gratis

### Recomendación
- **Desarrollo:** Solo Google Custom Search (100/día gratis)
- **Producción:** Google Custom Search + Serper como backup (máxima disponibilidad)

---

## ✅ Checklist Final

Antes de considerar que está todo configurado:

- [ ] Google Custom Search Engine creado
- [ ] Google Custom Search API habilitada en Google Cloud
- [ ] Google API Key creada y restringida
- [ ] Google Search Engine ID copiado
- [ ] Serper cuenta creada
- [ ] Serper API Key copiada
- [ ] Ambas keys añadidas a `.env.local`
- [ ] Servidor reiniciado
- [ ] Auto-Research funcionando (verificar en logs)

---

## 📚 Referencias

- [Google Custom Search Setup](https://programmablesearchengine.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Serper Dashboard](https://serper.dev/dashboard)
- [Documentación Google Custom Search API](https://developers.google.com/custom-search/v1/overview)

---

**¿Necesitas ayuda?** Revisa los logs del servidor o consulta `docs/GOOGLE-CUSTOM-SEARCH-SETUP.md` y `docs/SERPER-API-SETUP.md` para más detalles.
