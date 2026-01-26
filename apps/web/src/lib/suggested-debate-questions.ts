/**
 * Suggested Debate Questions
 * 
 * Pool de 50 preguntas de ejemplo para ayudar a los usuarios a empezar.
 * Se seleccionan 3 aleatorias cada vez que se muestra la pantalla inicial.
 */

export const SUGGESTED_DEBATE_QUESTIONS: string[] = [
  // Estrategia y Negocio
  '¿Debería lanzar mi producto ahora o esperar 3 meses?',
  '¿Cuál es la mejor estrategia de pricing para mi SaaS?',
  '¿Debería contratar más personal o automatizar procesos?',
  '¿Es el momento adecuado para expandir a nuevos mercados?',
  '¿Debería pivotar mi modelo de negocio o mantener el actual?',
  '¿Cuál es la mejor estrategia de marketing para mi audiencia?',
  '¿Debería buscar inversión ahora o esperar a tener más tracción?',
  '¿Es mejor crecer rápido o de forma sostenible?',
  '¿Debería asociarme con otra empresa o ir solo?',
  '¿Cuál es la mejor estrategia de retención de clientes?',
  
  // Producto y Desarrollo
  '¿Qué feature debería priorizar en mi roadmap?',
  '¿Debería construir esta funcionalidad internamente o usar una solución externa?',
  '¿Es mejor lanzar un MVP rápido o esperar a tener más features?',
  '¿Qué tecnología debería usar para este proyecto?',
  '¿Debería migrar a una nueva plataforma o mantener la actual?',
  '¿Cómo puedo mejorar la experiencia de usuario de mi producto?',
  '¿Qué métricas debería rastrear para medir el éxito?',
  '¿Debería enfocarme en nuevos usuarios o retener los existentes?',
  '¿Cuál es la mejor estrategia de onboarding para nuevos usuarios?',
  '¿Debería desarrollar para móvil o web primero?',
  
  // Equipo y Recursos
  '¿Debería contratar un equipo interno o trabajar con freelancers?',
  '¿Qué perfil de persona debería contratar para este rol?',
  '¿Cómo puedo mejorar la productividad de mi equipo?',
  '¿Debería implementar trabajo remoto o presencial?',
  '¿Qué estructura organizacional funciona mejor para mi empresa?',
  '¿Cómo puedo retener mejor a mis empleados clave?',
  '¿Debería externalizar esta función o mantenerla interna?',
  '¿Qué habilidades necesito desarrollar en mi equipo?',
  '¿Cómo puedo mejorar la comunicación interna?',
  '¿Debería crear un departamento nuevo o redistribuir responsabilidades?',
  
  // Finanzas y Operaciones
  '¿Cómo puedo reducir costos sin afectar la calidad?',
  '¿Debería invertir en marketing o en desarrollo de producto?',
  '¿Cuál es la mejor estrategia de pricing para maximizar ingresos?',
  '¿Debería buscar financiación externa o bootstrappear?',
  '¿Cómo puedo optimizar mi cadena de suministro?',
  '¿Qué modelo de suscripción funciona mejor para mi negocio?',
  '¿Debería diversificar mis fuentes de ingresos?',
  '¿Cómo puedo mejorar mi margen de beneficio?',
  '¿Qué inversión dará el mejor ROI?',
  '¿Debería expandir vertical u horizontalmente?',
  
  // Marketing y Ventas
  '¿Cuál es el mejor canal de adquisición para mi producto?',
  '¿Debería enfocarme en inbound o outbound marketing?',
  '¿Cómo puedo mejorar mi tasa de conversión?',
  '¿Qué estrategia de contenido funciona mejor para mi audiencia?',
  '¿Debería invertir en publicidad pagada o marketing orgánico?',
  '¿Cómo puedo aumentar el valor promedio de mis clientes?',
  '¿Qué mensaje de marketing resuena más con mi audiencia?',
  '¿Debería expandir a nuevos canales de distribución?',
  '¿Cómo puedo mejorar mi proceso de ventas?',
  '¿Qué estrategia de pricing maximiza mis ventas?',
]

/**
 * Selecciona preguntas aleatorias del pool
 * @param count - Número de preguntas a seleccionar (por defecto 3)
 * @returns Array de preguntas únicas seleccionadas aleatoriamente
 */
export function getRandomSuggestedQuestions(count: number = 3): string[] {
  // Crear una copia del array para no modificar el original
  const available = [...SUGGESTED_DEBATE_QUESTIONS]
  const selected: string[] = []
  
  // Seleccionar preguntas aleatorias sin repetir
  for (let i = 0; i < count && available.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * available.length)
    selected.push(available[randomIndex]!)
    available.splice(randomIndex, 1) // Remover la pregunta seleccionada
  }
  
  return selected
}
