# 🎁 Forum Bonus Features - Documentación

## 1. Utilidades de Debate (`debate-utils.ts`)

20+ funciones helper para formatear, analizar y comparar debates.

### Formateo
- `formatDebateDuration()`: Duración en formato humano (e.g., "5m 12s")
- `formatConsensusScore()`: Score con emoji (e.g., "🎯 95%")
- `formatCost()`: Costo en USD con precisión (e.g., "$0.123")
- `getStatusEmoji()`: Emoji para cada estado (e.g., "✅")

### Análisis
- `calculateDebateStats()`: Rondas, mensajes, palabras, tiempo de lectura
- `getTopContributors()`: Expertos con más mensajes
- `extractKeyQuotes()`: Mensajes más largos y sustanciales
- `calculateAgreementScore()`: Score de acuerdo entre expertos

### Comparación
- `compareDebates()`: Diferencias entre dos debates
- `findSimilarOptions()`: Opciones similares en otros debates

### Expertos
- `getExpertDisplayName()`: Nombre completo del experto
- `getExpertAvatar()`: Emoji de avatar por expertise
- `groupExpertsByCategory()`: Agrupar expertos por categoría

### Validación
- `validateDebateResult()`: Validar estructura del debate
- `needsIntervention()`: Detectar si un debate necesita intervención

### Exportación
- `generateDebateSummary()`: Resumen para compartir
- `generateMarkdownSummary()`: Resumen en formato Markdown

### Búsqueda y Filtro
- `searchDebates()`: Buscar debates por keyword
- `filterDebates()`: Filtrar por consenso, costo, rondas
- `sortDebates()`: Ordenar por consenso, costo, rondas, reciente

## 2. React Hooks (`use-forum.ts`)

15+ hooks para integrar el sistema de Forum en React de forma sencilla.

### Hooks de Debate
- `useDebateList()`: Lista de debates con auto-refresh
- `useDebate()`: Un debate con updates en tiempo real (WebSocket)
- `useCreateDebate()`: Crear debates con optimistic updates
- `useStartDebate()`: Ejecutar debates

### Hooks de Analytics
- `useForumAnalytics()`: Analytics del usuario
- `useExpertPerformance()`: Performance de un experto

### Hooks de Interacción
- `useAddComment()`: Añadir comentarios
- `useAddReaction()`: Añadir reacciones

### Hooks de Expertos
- `useCustomExperts()`: CRUD completo para expertos personalizados

### Hooks de Utilidad
- `useRateLimit()`: Verificar límites de uso
- `useSimilarDebates()`: Encontrar debates similares
- `useDebateSearch()`: Búsqueda con debounce
- `useWebSocket()`: Conexión WebSocket genérica
- `useLocalStorage()`: Persistencia en local storage
- `useDebateProgress()`: Tracking de progreso del debate

## 3. Componentes de UI (`loading-states.tsx`)

Componentes para mejorar la experiencia de usuario.

### Loading States
- `DebateListSkeleton()`: Skeleton para lista de debates
- `DebateViewerSkeleton()`: Skeleton para visor de debates
- `AnalyticsSkeleton()`: Skeleton para dashboard de analytics
- `Spinner()`: Spinner de carga
- `LoadingOverlay()`: Overlay de carga

### Progress Indicators
- `DebateProgress()`: Barra de progreso para rondas
- `ConsensusProgress()`: Barra de progreso para consenso

### Empty States
- `EmptyDebateList()`: Cuando no hay debates
- `EmptySearchResults()`: Cuando no hay resultados de búsqueda
- `NoExperts()`: Cuando no hay expertos personalizados

### Error States
- `ErrorState()`: Mensaje de error genérico
- `NetworkError()`: Mensaje de error de red

### Success States
- `SuccessMessage()`: Mensaje de éxito
- `InfoMessage()`: Mensaje de información
- `WarningMessage()`: Mensaje de advertencia

## 4. Atajos de Teclado (`keyboard-shortcuts.tsx`)

Sistema de atajos de teclado para power users.

- `useKeyboardShortcuts()`: Hook para registrar atajos
- `KeyboardShortcutsModal()`: Modal con lista de atajos
- `ForumKeyboardShortcuts()`: Provider para habilitar atajos

**Atajos por defecto:**
- `?`: Ver ayuda de atajos
- `Ctrl+N`: Nuevo debate
- `Ctrl+K`: Buscar
- `Ctrl+S`: Guardar
- `Ctrl+E`: Exportar

## 5. CLI Tool (`cli.ts`)

Interfaz de línea de comandos para operaciones de Forum.

**Comandos:**
- `forum create <question>`: Crear y ejecutar un debate
- `forum list`: Listar expertos disponibles
- `forum export <id> [format]`: Exportar debate (pdf, json, md)
- `forum analyze <id>`: Analizar resultados de un debate
- `forum benchmark`: Benchmark de performance de expertos
- `forum cleanup [days]`: Limpiar debates antiguos
- `forum migrate`: Ejecutar migraciones de datos
- `forum help`: Ver ayuda

## 6. Scripts de Automatización (`automation.sh`)

Scripts para automatizar tareas comunes de desarrollo y deployment.

**Comandos:**
- `./automation.sh setup`: Configurar entorno, dependencias y DB
- `./automation.sh build`: Compilar todos los paquetes
- `./automation.sh test`: Ejecutar todos los tests
- `./automation.sh typecheck`: Verificar TypeScript
- `./automation.sh deploy:staging`: Deploy a staging
- `./automation.sh deploy:prod`: Deploy a producción
- `./automation.sh cleanup`: Limpiar debates antiguos
- `./automation.sh backup`: Backup de la base de datos
- `./automation.sh restore <file>`: Restaurar desde backup
- `./automation.sh health`: Verificar salud del sistema
- `./automation.sh logs <service>`: Ver logs (api, ws, all)

## 7. Debugging y Monitoreo (`debug.ts`)

Herramientas avanzadas para debugging y monitoreo.

### Debug Logger
- `logger`: Logger con niveles (DEBUG, INFO, WARN, ERROR)
- `logger.getLogs()`: Obtener logs en memoria
- `logger.export()`: Exportar logs a JSON

### Performance Monitor
- `perfMonitor`: Monitoreo de performance de funciones
- `perfMonitor.start(label)`: Iniciar timer
- `perfMonitor.end(label)`: Finalizar timer y registrar métrica
- `perfMonitor.getAllStats()`: Obtener estadísticas (min, max, avg, p95, p99)

### Debate Debugger
- `DebateDebugger`: Clase para analizar y debuggear debates
- `debugger.validate()`: Validar estructura del debate
- `debugger.analyzeQuality()`: Analizar calidad del debate
- `debugger.findIssues()`: Encontrar problemas potenciales
- `debugger.generateReport()`: Generar reporte de debug

### Error Tracker
- `errorTracker`: Tracking de errores en la aplicación
- `errorTracker.track(error, context)`: Registrar un error
- `errorTracker.getErrors()`: Obtener errores registrados
- `errorTracker.export()`: Exportar errores a JSON

### Health Check
- `healthCheck()`: Verificar salud de la base de datos, WebSocket y API

### Debug Utilities
- `prettyPrintDebate()`: Imprimir debate en consola
- `exportDebugData()`: Exportar todos los datos de debug
