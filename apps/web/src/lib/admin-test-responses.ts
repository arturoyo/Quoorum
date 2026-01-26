/**
 * Admin Test Responses
 * 
 * Pre-made responses for admin users to quickly test the debate system.
 * These responses are contextually appropriate for common questions.
 */

export interface AdminTestResponse {
  id: string
  text: string
  description?: string // Optional description of when to use this response
}

/**
 * Get pre-made responses for a specific question
 * Returns 3 contextually appropriate responses based on question content
 */
export function getAdminTestResponses(question: string): AdminTestResponse[] {
  const questionLower = question.toLowerCase()

  // Respuestas genéricas para cualquier pregunta
  const genericResponses: AdminTestResponse[] = [
    {
      id: 'generic-1',
      text: 'Sí, estoy considerando esta opción y necesito evaluar todas las implicaciones antes de tomar una decisión final.',
      description: 'Respuesta afirmativa con contexto',
    },
    {
      id: 'generic-2',
      text: 'No estoy seguro aún, por eso quiero analizar esta decisión desde múltiples perspectivas para entender mejor los pros y contras.',
      description: 'Respuesta de incertidumbre',
    },
    {
      id: 'generic-3',
      text: 'Tengo algunas restricciones de tiempo y presupuesto que debo considerar, pero estoy abierto a explorar diferentes alternativas.',
      description: 'Respuesta con restricciones',
    },
  ]

  // Respuestas específicas para preguntas sobre objetivos
  if (
    questionLower.includes('objetivo') ||
    questionLower.includes('meta') ||
    questionLower.includes('propósito') ||
    questionLower.includes('quieres lograr')
  ) {
    return [
      {
        id: 'objective-1',
        text: 'Mi objetivo principal es maximizar el crecimiento de la empresa mientras mantengo la calidad del producto y la satisfacción del equipo.',
        description: 'Objetivo de crecimiento',
      },
      {
        id: 'objective-2',
        text: 'Busco optimizar los procesos internos para mejorar la eficiencia y reducir costos operativos sin comprometer la calidad del servicio.',
        description: 'Objetivo de optimización',
      },
      {
        id: 'objective-3',
        text: 'Quiero expandir la presencia en el mercado y aumentar la base de clientes, pero necesito asegurarme de que tenemos la capacidad operativa para soportar ese crecimiento.',
        description: 'Objetivo de expansión',
      },
    ]
  }

  // Respuestas específicas para preguntas sobre restricciones
  if (
    questionLower.includes('restricción') ||
    questionLower.includes('limitación') ||
    questionLower.includes('presupuesto') ||
    questionLower.includes('tiempo') ||
    questionLower.includes('recurso')
  ) {
    return [
      {
        id: 'constraint-1',
        text: 'Tengo un presupuesto limitado de aproximadamente 50,000€ y necesito implementar esto en los próximos 3 meses.',
        description: 'Restricción de presupuesto y tiempo',
      },
      {
        id: 'constraint-2',
        text: 'El tiempo es crítico, necesito una solución que pueda implementarse rápidamente sin comprometer la calidad.',
        description: 'Restricción de tiempo',
      },
      {
        id: 'constraint-3',
        text: 'Tengo recursos limitados en el equipo, así que necesito una solución que no requiera contratar personal adicional.',
        description: 'Restricción de recursos humanos',
      },
    ]
  }

  // Respuestas específicas para preguntas sobre contexto/background
  if (
    questionLower.includes('contexto') ||
    questionLower.includes('situación') ||
    questionLower.includes('background') ||
    questionLower.includes('historial')
  ) {
    return [
      {
        id: 'context-1',
        text: 'Somos una empresa en crecimiento con 50 empleados, operando en el sector tecnológico desde hace 5 años. Hemos experimentado un crecimiento del 200% en los últimos 2 años.',
        description: 'Contexto de empresa en crecimiento',
      },
      {
        id: 'context-2',
        text: 'Estamos en una fase de transición, migrando de un modelo de negocio tradicional a uno más digital y necesitamos tomar decisiones estratégicas importantes.',
        description: 'Contexto de transición',
      },
      {
        id: 'context-3',
        text: 'Tenemos un equipo consolidado y experiencia en el mercado, pero enfrentamos nuevos desafíos competitivos que requieren adaptación rápida.',
        description: 'Contexto competitivo',
      },
    ]
  }

  // Respuestas específicas para preguntas sobre riesgos
  if (
    questionLower.includes('riesgo') ||
    questionLower.includes('preocupación') ||
    questionLower.includes('desafío') ||
    questionLower.includes('problema')
  ) {
    return [
      {
        id: 'risk-1',
        text: 'Mi principal preocupación es el impacto en la satisfacción del cliente y la posible pérdida de confianza si la implementación no sale bien.',
        description: 'Riesgo de satisfacción del cliente',
      },
      {
        id: 'risk-2',
        text: 'Estoy preocupado por los costos ocultos y el tiempo que podría tomar más de lo esperado, afectando otros proyectos importantes.',
        description: 'Riesgo de costos y tiempo',
      },
      {
        id: 'risk-3',
        text: 'El mayor desafío es asegurar que el equipo esté preparado para el cambio y que tengamos el soporte necesario durante la transición.',
        description: 'Riesgo de adopción del equipo',
      },
    ]
  }

  // Respuestas específicas para preguntas sobre prioridades
  if (
    questionLower.includes('prioridad') ||
    questionLower.includes('importante') ||
    questionLower.includes('crítico') ||
    questionLower.includes('urgente')
  ) {
    return [
      {
        id: 'priority-1',
        text: 'Esta es una prioridad alta porque afecta directamente nuestros objetivos trimestrales y la satisfacción del cliente.',
        description: 'Prioridad alta',
      },
      {
        id: 'priority-2',
        text: 'Es importante pero no urgente, puedo permitirme tomar el tiempo necesario para hacer una decisión bien informada.',
        description: 'Prioridad media',
      },
      {
        id: 'priority-3',
        text: 'Es crítico resolver esto pronto, pero quiero asegurarme de tomar la mejor decisión posible considerando todas las opciones.',
        description: 'Prioridad crítica',
      },
    ]
  }

  // Por defecto, devolver respuestas genéricas
  return genericResponses
}
