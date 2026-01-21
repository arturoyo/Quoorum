# Serper API Setup

## ¿Qué es Serper API?

Serper API es un servicio de búsqueda web que permite obtener resultados de Google de forma programática. Quoorum lo usa para el sistema de **Auto-Research** que enriquece automáticamente los debates con información real de internet.

## ¿Es obligatorio?

**NO.** Serper API es completamente opcional:

- ✅ **Con Serper API:** Auto-Research usa datos reales de búsquedas de Google
- ✅ **Sin Serper API:** Auto-Research funciona con conocimiento de AI únicamente (fallback automático)

**Recomendación:** Usa el free tier (100 búsquedas/mes) para probar, luego decide si necesitas más.

## Cómo obtener la API Key

### 1. Crear cuenta en Serper.dev

1. Ve a [https://serper.dev](https://serper.dev)
2. Click en "Sign Up"
3. Crea cuenta con email o Google

### 2. Obtener API Key

1. Una vez logueado, ve al Dashboard
2. En la sección "API Keys", click en "Create API Key"
3. Copia la API key (empieza con algo como `sk_...`)

### 3. Configurar en Quoorum

1. Abre tu archivo `.env.local` (o `.env`)
2. Añade la línea:
   ```bash
   SERPER_API_KEY=tu_api_key_aqui
   ```
3. Guarda el archivo
4. Reinicia el servidor dev (`pnpm dev`)

## Pricing

| Plan | Búsquedas/mes | Precio |
|------|---------------|--------|
| **Free** | 100 | $0 |
| **Starter** | 1,000 | $50/mo |
| **Pro** | 5,000 | $200/mo |
| **Enterprise** | Custom | Contact |

**Nota:** Con el free tier (100 búsquedas), puedes ejecutar ~20-30 debates con Auto-Research antes de agotar la cuota.

## Verificar que funciona

1. Ejecuta un debate con Auto-Research activado
2. Revisa los logs del servidor
3. Deberías ver logs como:
   ```
   [Serper] Searching: "SaaS CRM market size 2024"
   [Serper] Found 10 results
   ```

4. Si ves `[Serper] SERPER_API_KEY not set, web search disabled`:
   - Significa que está usando fallback a AI-only
   - Verifica que la API key esté configurada correctamente

## Rate Limiting

Serper API tiene límites de rate:
- **Requests/segundo:** 1 req/s en free tier
- **Requests/mes:** 100 en free tier

Quoorum ya implementa rate limiting automático:
- Delay de 250ms entre búsquedas
- Máximo 5 búsquedas por debate

## Troubleshooting

### Error: "Invalid API Key"

- Verifica que copiaste la API key completa
- Asegúrate de que no tiene espacios al inicio/final
- Verifica en Serper.dev que la key está activa

### Error: "Quota exceeded"

- Has agotado las 100 búsquedas del free tier
- Opciones:
  1. Espera a que se resetee el mes
  2. Upgrade a plan paid
  3. Usa el fallback AI-only (Quoorum automáticamente lo hace)

### No veo mejora con Serper vs AI-only

- Serper es útil para:
  - Datos recientes (últimos meses)
  - Estadísticas de mercado actualizadas
  - Información de competidores específicos
- Serper NO es necesario para:
  - Preguntas generales
  - Temas teóricos
  - Debates sin datos específicos de mercado

## ¿Cuándo vale la pena pagar?

Considera upgrade a paid si:
- ✅ Ejecutas 30+ debates/mes con Auto-Research
- ✅ Necesitas datos ultra actualizados (noticias, market trends)
- ✅ Tus debates son B2B o requieren benchmarking de competidores

NO necesitas paid si:
- ❌ Solo haces debates ocasionales (<30/mes)
- ❌ Tus preguntas son más estratégicas que data-driven
- ❌ El fallback AI-only te da resultados suficientes

## Más información

- **Docs oficiales:** [https://serper.dev/docs](https://serper.dev/docs)
- **Dashboard:** [https://serper.dev/dashboard](https://serper.dev/dashboard)
- **Pricing:** [https://serper.dev/pricing](https://serper.dev/pricing)
