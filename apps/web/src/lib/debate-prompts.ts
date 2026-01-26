/**
 * Debate Creation Prompts
 * 
 * Lista de títulos y subtítulos variados para la pantalla inicial de creación de debates.
 * Se selecciona aleatoriamente uno cada vez que se inicia un nuevo debate.
 */

export interface DebatePrompt {
  title: string
  subtitle: string
}

/**
 * Lista de prompts para la pantalla inicial de creación de debates
 */
export const DEBATE_PROMPTS: DebatePrompt[] = [
  {
    title: '¿Qué decisión quieres tomar?',
    subtitle: 'Describe tu pregunta o decisión y te guiaremos paso a paso',
  },
  {
    title: '¿En qué necesitas ayuda?',
    subtitle: 'Cuéntanos tu situación y te ayudaremos a encontrar la mejor solución',
  },
  {
    title: '¿Qué desafío quieres resolver?',
    subtitle: 'Comparte tu pregunta y nuestros expertos te guiarán hacia la mejor decisión',
  },
  {
    title: '¿Qué te preocupa?',
    subtitle: 'Describe tu situación y te ayudaremos a analizarla desde múltiples perspectivas',
  },
  {
    title: '¿Qué quieres explorar?',
    subtitle: 'Plantea tu pregunta y te acompañaremos en el proceso de decisión',
  },
  {
    title: '¿Qué necesitas validar?',
    subtitle: 'Comparte tu idea o decisión y obtén feedback de expertos en tiempo real',
  },
  {
    title: '¿Qué quieres mejorar?',
    subtitle: 'Describe tu situación actual y te ayudaremos a encontrar oportunidades de mejora',
  },
  {
    title: '¿Qué estrategia quieres evaluar?',
    subtitle: 'Cuéntanos tu plan y analizaremos sus pros y contras con diferentes expertos',
  },
  {
    title: '¿Qué oportunidad quieres analizar?',
    subtitle: 'Comparte tu idea y evaluaremos su viabilidad desde múltiples ángulos',
  },
  {
    title: '¿Qué camino quieres tomar?',
    subtitle: 'Describe tus opciones y te ayudaremos a elegir la mejor ruta',
  },
  {
    title: '¿Qué problema quieres resolver?',
    subtitle: 'Explica tu desafío y te guiaremos hacia la solución más efectiva',
  },
  {
    title: '¿Qué quieres optimizar?',
    subtitle: 'Comparte tu situación y te ayudaremos a encontrar la mejor estrategia',
  },
]

/**
 * Selecciona un prompt aleatorio de la lista
 * @returns Un prompt aleatorio (título + subtítulo)
 */
export function getRandomDebatePrompt(): DebatePrompt {
  const randomIndex = Math.floor(Math.random() * DEBATE_PROMPTS.length)
  return DEBATE_PROMPTS[randomIndex]!
}

/**
 * Selecciona un prompt aleatorio pero evita repetir el último usado
 * (útil si quieres evitar mostrar el mismo dos veces seguidas)
 * @param lastUsedIndex - Índice del último prompt usado (opcional)
 * @returns Un prompt aleatorio diferente al último usado
 */
export function getRandomDebatePromptAvoidingLast(lastUsedIndex?: number): DebatePrompt {
  if (lastUsedIndex === undefined || DEBATE_PROMPTS.length <= 1) {
    return getRandomDebatePrompt()
  }
  
  // Si solo hay un prompt, devolverlo
  if (DEBATE_PROMPTS.length === 1) {
    return DEBATE_PROMPTS[0]!
  }
  
  // Seleccionar un índice diferente al último usado
  let randomIndex: number
  do {
    randomIndex = Math.floor(Math.random() * DEBATE_PROMPTS.length)
  } while (randomIndex === lastUsedIndex && DEBATE_PROMPTS.length > 1)
  
  return DEBATE_PROMPTS[randomIndex]!
}
