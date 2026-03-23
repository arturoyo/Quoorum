# Google Custom Search API Setup - Auto-Research Web Search

## 🎯 ¿Qué es Google Custom Search API?

Google Custom Search API es la **API oficial de Google** para realizar búsquedas web programáticamente. Es una alternativa a Serper API que usa directamente los servicios de Google.

## ✅ Ventajas vs Serper

- ✅ **API oficial de Google** (no terceros)
- ✅ **100 búsquedas/día gratis** (límite diario)
- ✅ **$5 por 1,000 búsquedas** después del límite gratuito
- ✅ **Mismos resultados que Google Search**

## ⚠️ Desventajas vs Serper

- ⚠️ Requiere configurar un "Custom Search Engine" (más pasos)
- ⚠️ Límite diario más bajo (100 vs 100+ de Serper free tier)
- ⚠️ Más caro a escala (Serper es más económico)

## 📋 Setup Paso a Paso

### 1. Crear Custom Search Engine

1. Ve a [Google Custom Search](https://programmablesearchengine.google.com/)
2. Click en **"Add"** o **"Create a custom search engine"**
3. Configura:
   - **Sites to search**: `*` (buscar en todo internet)
   - **Name**: `Quoorum Auto-Research`
   - **Language**: Tu idioma preferido
4. Click en **"Create"**

### 2. Obtener API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** → **Library**
4. Busca **"Custom Search API"**
5. Click en **"Enable"**
6. Ve a **APIs & Services** → **Credentials**
7. Click en **"Create Credentials"** → **"API Key"**
8. Copia la API Key

### 3. Obtener Custom Search Engine ID

1. Ve a [Google Custom Search](https://programmablesearchengine.google.com/)
2. Click en tu motor de búsqueda creado
3. Ve a **"Setup"** → **"Basics"**
4. Copia el **"Search engine ID"** (formato: `xxxxxxxxxxxxxxxxxxxxxxxxx:yyyyyyyyyyy`)

### 4. Configurar en el Proyecto

Añade a tu `.env.local`:

```bash
# Google Custom Search API (Prioridad 1 - Se usa antes que Serper)
GOOGLE_CUSTOM_SEARCH_API_KEY=tu_api_key_aqui
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=tu_search_engine_id_aqui

# Serper API (Fallback si Google no está configurado)
SERPER_API_KEY=tu_serper_key_aqui
```

## 🔄 Sistema de Prioridad y Fallback

El sistema usa un **sistema robusto de fallback automático**:

1. **Google Custom Search API** (Principal)
   - Se intenta primero si está configurada
   - Si falla o retorna vacío → fallback automático a Serper
   - Si excede límite diario → fallback automático a Serper

2. **Serper API** (Backup/Fallback)
   - Se usa si Google no está configurada
   - Se usa si Google falla o retorna sin resultados
   - Se usa si Google excede su límite diario

3. **AI-only mode** (Último recurso)
   - Solo si ninguna API está configurada
   - O si ambas APIs fallan simultáneamente

## 🧪 Probar la Configuración

1. Reinicia el servidor de desarrollo
2. Crea un nuevo debate en `/debates/new`
3. Escribe una pregunta
4. Deberías ver en los logs:

```
[Auto-Research] Using Google Custom Search API
[Auto-Research] Generated 3 queries for: "..."
[Auto-Research] Completed 3 searches
```

## 📊 Límites y Costos

### Free Tier (Google Custom Search)
- **100 búsquedas/día** gratis
- Después: **$5 por 1,000 búsquedas**

### Ejemplo de Uso
- 1 debate = ~3-5 búsquedas
- 100 búsquedas/día = ~20-30 debates/día gratis
- Después: ~$0.005 por debate adicional

## ⚙️ Configuración Avanzada

### Restringir Búsquedas a Dominios Específicos

En tu Custom Search Engine:
1. Ve a **"Setup"** → **"Basics"**
2. En **"Sites to search"**, puedes especificar:
   - `*.crunchbase.com/*` (solo Crunchbase)
   - `*.techcrunch.com/*` (solo TechCrunch)
   - O múltiples: `*.crunchbase.com/*,*.techcrunch.com/*`

### Configurar Región

El código ya soporta región via `location` parameter:
```typescript
searchWeb(query, { location: 'es' }) // España
searchWeb(query, { location: 'us' }) // USA
```

## 🐛 Troubleshooting

### Error: "API key not valid"
- Verifica que la API Key esté correcta en `.env.local`
- Asegúrate de que **Custom Search API** esté habilitada en Google Cloud Console

### Error: "Custom Search Engine ID not found"
- Verifica que el Search Engine ID esté correcto
- Asegúrate de que el Custom Search Engine esté activo

### No se encuentran resultados
- Verifica que el Custom Search Engine esté configurado para buscar en `*` (todo internet)
- Si restringiste a dominios específicos, verifica que esos dominios tengan contenido relevante

### Límite diario excedido
- Google Custom Search tiene límite de 100 búsquedas/día en free tier
- **El sistema automáticamente usará Serper API como fallback** si está configurada
- No necesitas hacer nada, el fallback es transparente
- O puedes esperar hasta el día siguiente (el límite se resetea a medianoche PST)

### Google falla pero Serper funciona
- Esto es normal y esperado
- El sistema automáticamente detecta el fallo y usa Serper
- Verás en los logs: `[Auto-Research] Google Custom Search failed, trying Serper fallback`
- No necesitas intervención manual

## 📚 Referencias

- [Google Custom Search API Docs](https://developers.google.com/custom-search/v1/overview)
- [Google Custom Search Setup](https://programmablesearchengine.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)

## 💡 Recomendación

**Configuración ideal para producción:**

```bash
# Google Custom Search (Principal) - 100 búsquedas/día gratis
GOOGLE_CUSTOM_SEARCH_API_KEY=tu_google_key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=tu_engine_id

# Serper API (Backup automático) - Fallback si Google falla o excede límite
SERPER_API_KEY=tu_serper_key
```

**Ventajas de esta configuración:**
- ✅ Usas 100 búsquedas/día gratis de Google
- ✅ Si Google falla o excede límite, Serper toma el relevo automáticamente
- ✅ Sin interrupciones para el usuario
- ✅ Máxima disponibilidad y robustez

**Para desarrollo/testing**: Solo Google Custom Search es suficiente (100/día gratis)

El sistema automáticamente usará la mejor opción disponible y hará fallback transparente.
