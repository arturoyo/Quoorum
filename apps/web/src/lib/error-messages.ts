/**
 * Convierte errores técnicos en mensajes amigables para el usuario
 */
export function getErrorMessage(error: unknown, fallback = 'Ha ocurrido un error inesperado'): string {
  if (typeof error === 'string') {
    return formatTechnicalError(error)
  }

  if (error instanceof Error) {
    return formatTechnicalError(error.message)
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return formatTechnicalError((error as { message: string }).message)
  }

  return fallback
}

function formatTechnicalError(message: string): string {
  // Errores de conexión
  if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión.'
  }

  // Errores de autenticación
  if (message.includes('UNAUTHORIZED') || message.includes('401')) {
    return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
  }

  // Errores de permisos
  if (message.includes('FORBIDDEN') || message.includes('403')) {
    return 'No tienes permisos para realizar esta acción.'
  }

  // Errores de no encontrado
  if (message.includes('NOT_FOUND') || message.includes('404')) {
    return 'El recurso solicitado no existe.'
  }

  // Errores de validación
  if (message.includes('validation') || message.includes('invalid')) {
    return 'Los datos ingresados no son válidos. Por favor, verifica los campos.'
  }

  // Errores de red
  if (message.includes('NetworkError') || message.includes('network')) {
    return 'Error de red. Por favor, verifica tu conexión a internet.'
  }

  // Errores de timeout
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return 'La operación tardó demasiado. Por favor, intenta de nuevo.'
  }

  // Errores de tRPC
  if (message.includes('TRPC_ERROR') || message.includes('TRPCClientError')) {
    return 'Error al comunicarse con el servidor. Por favor, intenta de nuevo.'
  }

  // Errores de base de datos
  if (message.includes('database') || message.includes('ECONNREFUSED :5433')) {
    return 'Error de base de datos. Por favor, contacta con soporte.'
  }

  // Si el mensaje es legible, devolverlo (sin códigos de error técnicos)
  if (message.length < 100 && !message.includes('Error:') && !message.includes('Exception')) {
    return message
  }

  // Fallback genérico
  return 'No se pudo completar la operación. Por favor, intenta de nuevo.'
}

/**
 * Mensajes de error específicos para diferentes operaciones
 */
export const ERROR_MESSAGES = {
  // Debates
  DEBATE_CREATE: 'No se pudo crear el debate. Intenta de nuevo.',
  DEBATE_UPDATE: 'No se pudo actualizar el debate. Intenta de nuevo.',
  DEBATE_DELETE: 'No se pudo eliminar el debate. Intenta de nuevo.',
  DEBATE_LOAD: 'No se pudieron cargar los debates. Intenta refrescar la página.',

  // Expertos
  EXPERT_CREATE: 'No se pudo crear el experto. Verifica los datos e intenta de nuevo.',
  EXPERT_UPDATE: 'No se pudo actualizar el experto. Intenta de nuevo.',
  EXPERT_DELETE: 'No se pudo eliminar el experto. Intenta de nuevo.',
  EXPERT_LOAD: 'No se pudieron cargar los expertos. Intenta refrescar la página.',

  // Contexto
  CONTEXT_CREATE: 'No se pudo crear el archivo de contexto. Intenta de nuevo.',
  CONTEXT_UPDATE: 'No se pudo actualizar el archivo. Intenta de nuevo.',
  CONTEXT_DELETE: 'No se pudo eliminar el archivo. Intenta de nuevo.',
  CONTEXT_LOAD: 'No se pudieron cargar los archivos de contexto. Intenta refrescar la página.',

  // Autenticación
  AUTH_LOGIN: 'No se pudo iniciar sesión. Verifica tus credenciales.',
  AUTH_LOGOUT: 'No se pudo cerrar sesión. Intenta de nuevo.',
  AUTH_SIGNUP: 'No se pudo crear la cuenta. Intenta de nuevo.',

  // General
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  UNAUTHORIZED: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
  PERMISSION_DENIED: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso no fue encontrado.',
  GENERIC: 'Ha ocurrido un error. Por favor, intenta de nuevo.',
} as const
