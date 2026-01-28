/**
 * Debates Router - Helper Functions
 *
 * Semantic analysis and smart question generation for debate context assessment.
 */

import type { BusinessAnalysis, FallbackQuestion } from './types';

/**
 * Analyze business question semantically
 * Understand WHAT decision, WHAT context is missing, WHAT's ambiguous
 */
export function analyzeBusinessQuestion(question: string, searchContext?: string): BusinessAnalysis {
  const text = question.toLowerCase();
  const analysis: BusinessAnalysis = {
    questionType: 'other',
    domain: 'unknown',
    entities: [],
    missingContext: [],
    ambiguities: [],
    stageSignals: [],
    concerns: [],
  };

  // ========== 1. QUESTION STRUCTURE ==========

  if (/^¿?debería|^¿?debo|^¿?tendría que|^¿?me conviene|^¿?vale la pena/.test(text)) {
    analysis.questionType = 'should_i';
  } else if (/^¿?cómo puedo|^¿?cómo hago|^¿?de qué forma|^¿?cuál es la mejor manera|^¿?qué estrategia/.test(text)) {
    analysis.questionType = 'how_to';
  } else if (/^¿?qué es mejor|^¿?cuál es la mejor opción|^¿?qué me recomiendan|^¿?cuál debería/.test(text)) {
    analysis.questionType = 'what_is_best';
  } else if (/\bo\b.*\?|entre.*y|elegir entre|vs\b|versus/.test(text)) {
    analysis.questionType = 'a_or_b';
  } else if (/^¿?qué opinan|^¿?qué piensan|^¿?tiene sentido/.test(text)) {
    analysis.questionType = 'opinion';
  } else if (/ayuda|necesito|no sé|estoy atascado|bloqueado/.test(text)) {
    analysis.questionType = 'help_me';
  }

  // ========== 2. BUSINESS DOMAIN ==========

  if (/producto|feature|mvp|app|plataforma|software|saas|funcionalidad|roadmap|lanzar|desarrollar/.test(text)) {
    analysis.domain = 'product';
  } else if (/marketing|ads|publicidad|seo|contenido|redes sociales|campaña|marca|branding|awareness|adquisición/.test(text)) {
    analysis.domain = 'marketing';
  } else if (/ventas|vender|comercial|pipeline|deals|cerrar|prospección|outbound|inbound|leads/.test(text)) {
    analysis.domain = 'sales';
  } else if (/contratar|equipo|talento|empleado|desarrollador|diseñador|hiring|cultura|organización/.test(text)) {
    analysis.domain = 'hiring';
  } else if (/precio|pricing|monetiz|cobrar|suscripción|plan|freemium|modelo de negocio|revenue/.test(text)) {
    analysis.domain = 'pricing';
  } else if (/invertir|inversión|funding|levantar|ronda|capital|vc|angel|inversor|valoración/.test(text)) {
    analysis.domain = 'funding';
  } else if (/estrategia|priorizar|enfoque|dirección|pivotar|pivot|visión|misión/.test(text)) {
    analysis.domain = 'strategy';
  } else if (/operaciones|procesos|escalar|automatizar|eficiencia|costes|infraestructura/.test(text)) {
    analysis.domain = 'operations';
  } else if (/crecer|growth|escalar|usuarios|retención|churn|activación|engagement/.test(text)) {
    analysis.domain = 'growth';
  } else if (/partner|alianza|integración|api|colaboración|b2b|canal|distribuidor/.test(text)) {
    analysis.domain = 'partnerships';
  }

  // ========== 3. EXTRACT BUSINESS ENTITIES ==========

  // Products/Features
  const productMatches = text.match(/mi producto|la app|el mvp|la plataforma|el software|esta feature|la funcionalidad/g);
  if (productMatches) {
    productMatches.forEach(match => {
      const isVague = !/(de|para|que) \w+/.test(text.substring(text.indexOf(match)));
      analysis.entities.push({ type: 'product', text: match, isVague });
    });
  }

  // Markets/Segments
  const marketMatches = text.match(/el mercado|mi mercado|este segmento|b2b|b2c|enterprise|pymes|startups|el sector|la industria/g);
  if (marketMatches) {
    marketMatches.forEach(match => {
      const isVague = !/(de|en) \w+/.test(text.substring(text.indexOf(match)));
      analysis.entities.push({ type: 'market', text: match, isVague });
    });
  }

  // Competitors
  const competitorMatches = text.match(/la competencia|competidores|alternativas|[A-Z][a-z]+(?= compite| vs| contra)/g);
  if (competitorMatches) {
    competitorMatches.forEach(match => {
      analysis.entities.push({ type: 'competitor', text: match, isVague: true });
    });
  }

  // Customers
  const customerMatches = text.match(/mis clientes|los usuarios|el cliente|nuestros clientes|early adopters/g);
  if (customerMatches) {
    customerMatches.forEach(match => {
      const isVague = !/(\d+|cuántos|perfil|tipo)/.test(text);
      analysis.entities.push({ type: 'customer', text: match, isVague });
    });
  }

  // Metrics
  const metricMatches = text.match(/\d+%|\d+[kK]|\d+ (usuarios|clientes|mrr|arr|revenue)|cac|ltv|churn|conversión|retención/g);
  if (metricMatches) {
    metricMatches.forEach(match => {
      analysis.entities.push({ type: 'metric', text: match, isVague: false });
    });
  }

  // Money
  const moneyMatches = text.match(/\d+[k€$]|\d+\.?\d* (euros?|dólares?|mil|millones?)|presupuesto|inversión|facturación|mrr|arr/g);
  if (moneyMatches) {
    moneyMatches.forEach(match => {
      analysis.entities.push({ type: 'money', text: match, isVague: false });
    });
  }

  // Team
  const teamMatches = text.match(/mi equipo|el equipo|\d+ personas|cofundador|cto|ceo|devs|desarrolladores/g);
  if (teamMatches) {
    teamMatches.forEach(match => {
      analysis.entities.push({ type: 'team', text: match, isVague: false });
    });
  }

  // Time
  const timeMatches = text.match(/ahora|pronto|este (mes|trimestre|año)|Q[1-4]|en \d+ (semanas?|meses?)|antes de|deadline/g);
  if (timeMatches) {
    timeMatches.forEach(match => {
      analysis.entities.push({ type: 'time', text: match, isVague: false });
    });
  }

  // ========== 4. DETECT MISSING BUSINESS CONTEXT ==========

  // No company stage mentioned
  if (!/idea|mvp|early|growth|serie|escala|establecid|matur/.test(text)) {
    analysis.missingContext.push({
      aspect: 'stage',
      why: 'No sé en qué etapa está tu negocio',
      question: '¿En qué etapa está tu empresa/proyecto?',
    });
  }

  // Mentions product but no users/traction
  if (analysis.domain === 'product' && !analysis.entities.some(e => e.type === 'customer' || e.type === 'metric')) {
    analysis.missingContext.push({
      aspect: 'traction',
      why: 'Mencionas producto pero no la tracción actual',
      question: '¿Cuántos usuarios/clientes tienes actualmente?',
    });
  }

  // Mentions pricing but no current model
  if (analysis.domain === 'pricing' && !/actual|ahora|hoy|tenemos|cobramos/.test(text)) {
    analysis.missingContext.push({
      aspect: 'current_model',
      why: 'No sé cómo monetizas actualmente',
      question: '¿Cómo monetizas actualmente (o planeas hacerlo)?',
    });
  }

  // Mentions hiring but no team context
  if (analysis.domain === 'hiring' && !analysis.entities.some(e => e.type === 'team')) {
    analysis.missingContext.push({
      aspect: 'team_context',
      why: 'No sé el tamaño o composición actual del equipo',
      question: '¿Cuántas personas hay en el equipo actualmente?',
    });
  }

  // Mentions funding but no current status
  if (analysis.domain === 'funding' && !/levantado|bootstrap|autofinanciado|pre-seed|seed|serie/.test(text)) {
    analysis.missingContext.push({
      aspect: 'funding_status',
      why: 'No sé tu situación de financiación actual',
      question: '¿Cómo estás financiado actualmente?',
    });
  }

  // Mentions marketing but no budget/resources
  if (analysis.domain === 'marketing' && !analysis.entities.some(e => e.type === 'money')) {
    analysis.missingContext.push({
      aspect: 'marketing_resources',
      why: 'No sé qué recursos tienes para marketing',
      question: '¿Qué presupuesto/recursos tienes para marketing?',
    });
  }

  // No timeline mentioned for decision
  if (!analysis.entities.some(e => e.type === 'time') && /decidir|decisión|elegir/.test(text)) {
    analysis.missingContext.push({
      aspect: 'timeline',
      why: 'No sé la urgencia de la decisión',
      question: '¿Para cuándo necesitas tomar esta decisión?',
    });
  }

  // "Should I" without alternatives
  if (analysis.questionType === 'should_i' && !/o no\b|o seguir|o mantener|la alternativa/.test(text)) {
    analysis.missingContext.push({
      aspect: 'alternatives',
      why: 'No mencionas la alternativa',
      question: 'Si decides NO hacerlo, ¿cuál es la alternativa?',
    });
  }

  // Vague entities need clarification
  analysis.entities.filter(e => e.isVague).forEach(entity => {
    if (entity.type === 'product') {
      analysis.missingContext.push({
        aspect: 'product_context',
        why: `"${entity.text}" necesita más contexto`,
        question: `Cuéntame más sobre ${entity.text}: ¿qué problema resuelve y para quién?`,
      });
    }
    if (entity.type === 'market') {
      analysis.missingContext.push({
        aspect: 'market_context',
        why: `"${entity.text}" es muy amplio`,
        question: `¿Puedes especificar más ${entity.text}? ¿Qué tamaño tiene?`,
      });
    }
    if (entity.type === 'customer') {
      analysis.missingContext.push({
        aspect: 'customer_context',
        why: `No sé detalles sobre tus clientes`,
        question: `¿Quiénes son tus clientes ideales? ¿Cuántos tienes?`,
      });
    }
  });

  // ========== 5. DETECT AMBIGUITIES ==========

  // "Escalar" can mean different things
  if (/escalar(?! \w)/.test(text)) {
    analysis.ambiguities.push({
      phrase: 'escalar',
      meanings: ['¿Escalar usuarios/clientes?', '¿Escalar el equipo?', '¿Escalar ingresos?', '¿Escalar operaciones?'],
    });
  }

  // "Crecer" is vague
  if (/crecer(?! \w)|crecimiento(?! \w)/.test(text)) {
    analysis.ambiguities.push({
      phrase: 'crecer',
      meanings: ['¿Crecer en usuarios?', '¿Crecer en ingresos?', '¿Crecer el equipo?', '¿Expansión geográfica?'],
    });
  }

  // "Lanzar" needs clarification
  if (/lanzar(?! \w)|lanzamiento/.test(text) && !/beta|público|producto|feature|campaña/.test(text)) {
    analysis.ambiguities.push({
      phrase: 'lanzar',
      meanings: ['¿Lanzar producto nuevo?', '¿Lanzar feature?', '¿Lanzar en nuevo mercado?', '¿Lanzar campaña?'],
    });
  }

  // "Invertir" from company perspective
  if (/invertir en(?! mi)/.test(text)) {
    analysis.ambiguities.push({
      phrase: 'invertir',
      meanings: ['¿Invertir tiempo/recursos propios?', '¿Invertir dinero de la empresa?', '¿Buscar inversión externa?'],
    });
  }

  // ========== 6. INFER CORE DILEMMA ==========

  if (analysis.questionType === 'a_or_b') {
    const orMatch = text.match(/(.{10,50}?)\s+o\s+(.{10,50}?)[\?\.]/);
    if (orMatch) {
      analysis.coreDilemma = `${orMatch[1].trim()} vs ${orMatch[2].trim()}`;
    }
  } else if (analysis.questionType === 'should_i') {
    const actionMatch = text.match(/debería\s+(.{10,60}?)[\?\.]/);
    if (actionMatch) {
      analysis.coreDilemma = actionMatch[1].trim();
    }
  }

  // ========== 7. DETECT STAGE SIGNALS ==========

  if (/idea|validar|problema|hipótesis|explorar/.test(text)) analysis.stageSignals.push('idea');
  if (/mvp|prototipo|beta|primeros usuarios|early adopters/.test(text)) analysis.stageSignals.push('mvp');
  if (/product.market fit|pmf|retención|primeros clientes pagando/.test(text)) analysis.stageSignals.push('early');
  if (/escalar|growth|crecer rápido|tracción|hockey stick/.test(text)) analysis.stageSignals.push('growth');
  if (/serie [abc]|expansion|internacional|enterprise/.test(text)) analysis.stageSignals.push('scale');
  if (/establecid|lider|market leader|rentable|cash flow positive/.test(text)) analysis.stageSignals.push('mature');

  // ========== 8. DETECT BUSINESS CONCERNS ==========

  if (/no sé|duda|confundido|perdido|atascado/.test(text)) {
    analysis.concerns.push('uncertainty');
  }
  if (/riesgo|arriesgar|perder|fracasar/.test(text)) {
    analysis.concerns.push('risk_aversion');
  }
  if (/competencia|competidor|nos copian|market share/.test(text)) {
    analysis.concerns.push('competitive_pressure');
  }
  if (/runway|cash|dinero|financ|quemar/.test(text)) {
    analysis.concerns.push('financial_pressure');
  }
  if (/rápido|urgente|antes que|deadline|ya/.test(text)) {
    analysis.concerns.push('time_pressure');
  }
  if (/equipo|cultura|retener talento|rotación/.test(text)) {
    analysis.concerns.push('team_concerns');
  }
  if (/clientes (se van|quejando|piden)|churn|retención/.test(text)) {
    analysis.concerns.push('customer_concerns');
  }

  // ========== 9. ENRICH FROM SEARCH CONTEXT ==========

  if (searchContext && searchContext.length > 100) {
    const ctx = searchContext.toLowerCase();

    if (/caso de estudio|ejemplo|benchmark/.test(ctx) && !analysis.concerns.includes('uncertainty')) {
      analysis.concerns.push('needs_validation');
    }
    if (/riesgo|cuidado|evitar|error común/.test(ctx)) {
      analysis.concerns.push('risks_in_context');
    }
    if (/tendencia|2024|2025|mercado está/.test(ctx)) {
      analysis.concerns.push('market_timing');
    }
  }

  return analysis;
}

/**
 * Generate business-focused questions based on semantic analysis
 */
export function generateSmartFallbackQuestions(
  question: string,
  mode: 'quick' | 'deep',
  searchContext?: string
): FallbackQuestion[] {
  const analysis = analyzeBusinessQuestion(question, searchContext);
  const questions: FallbackQuestion[] = [];
  const maxQuestions = mode === 'quick' ? 1 : 4;

  // ========== PRIORITY 1: RESOLVE AMBIGUITIES ==========

  for (const ambiguity of analysis.ambiguities) {
    if (questions.length >= maxQuestions) break;
    questions.push({
      type: "question",
      questionType: "multiple_choice",
      content: `Cuando dices "${ambiguity.phrase}", ¿a qué te refieres?`,
      options: ambiguity.meanings.slice(0, 4),
    });
  }

  // ========== PRIORITY 2: CRITICAL BUSINESS CONTEXT ==========

  // Sort by business importance
  const prioritizedMissing = analysis.missingContext.sort((a, b) => {
    const priority: Record<string, number> = {
      'stage': 1,
      'traction': 2,
      'product_context': 2,
      'customer_context': 3,
      'current_model': 3,
      'team_context': 4,
      'funding_status': 4,
      'marketing_resources': 5,
      'alternatives': 5,
      'timeline': 6,
      'market_context': 6,
    };
    return (priority[a.aspect] || 99) - (priority[b.aspect] || 99);
  });

  for (const missing of prioritizedMissing) {
    if (questions.length >= maxQuestions) break;

    if (missing.aspect === 'stage') {
      questions.push({
        type: "question",
        questionType: "multiple_choice",
        content: missing.question,
        options: ["Idea/Validación", "MVP/Primeros usuarios", "Product-Market Fit", "Growth/Escalando"],
      });
    } else if (missing.aspect === 'traction') {
      questions.push({
        type: "question",
        questionType: "multiple_choice",
        content: missing.question,
        options: ["0 (aún no lanzo)", "1-100 usuarios", "100-1,000 usuarios", "1,000+ usuarios"],
      });
    } else if (missing.aspect === 'current_model') {
      questions.push({
        type: "question",
        questionType: "multiple_choice",
        content: missing.question,
        options: ["Aún no monetizo", "Suscripción/SaaS", "Pago único/Transaccional", "Freemium", "Otro modelo"],
      });
    } else if (missing.aspect === 'team_context') {
      questions.push({
        type: "question",
        questionType: "multiple_choice",
        content: missing.question,
        options: ["Solo yo", "2-5 personas", "6-15 personas", "15+ personas"],
      });
    } else if (missing.aspect === 'funding_status') {
      questions.push({
        type: "question",
        questionType: "multiple_choice",
        content: missing.question,
        options: ["Bootstrap/Autofinanciado", "FFF/Pre-seed", "Seed", "Serie A+"],
      });
    } else if (missing.aspect === 'marketing_resources') {
      questions.push({
        type: "question",
        questionType: "multiple_choice",
        content: missing.question,
        options: ["< €1K/mes", "€1K-5K/mes", "€5K-20K/mes", "> €20K/mes"],
      });
    } else if (missing.aspect === 'timeline') {
      questions.push({
        type: "question",
        questionType: "multiple_choice",
        content: missing.question,
        options: ["Esta semana", "Este mes", "Este trimestre", "Sin urgencia"],
      });
    } else if (missing.aspect === 'alternatives') {
      questions.push({
        type: "question",
        questionType: "free_text",
        content: missing.question,
      });
    } else {
      // Generic context questions
      questions.push({
        type: "question",
        questionType: "free_text",
        content: missing.question,
      });
    }
  }

  // ========== PRIORITY 3: BUSINESS CONCERNS ==========

  if (questions.length < maxQuestions && analysis.concerns.length > 0) {
    if (analysis.concerns.includes('competitive_pressure')) {
      questions.push({
        type: "question",
        questionType: "multiple_choice",
        content: "¿Cómo ves tu posición frente a la competencia?",
        options: ["Somos líderes/diferenciados", "Estamos a la par", "Vamos por detrás", "No tenemos competencia directa"],
      });
    } else if (analysis.concerns.includes('financial_pressure')) {
      questions.push({
        type: "question",
        questionType: "multiple_choice",
        content: "¿Cuál es tu situación de runway/caja?",
        options: ["Somos rentables", "Runway > 12 meses", "Runway 6-12 meses", "Runway < 6 meses"],
      });
    } else if (analysis.concerns.includes('time_pressure')) {
      questions.push({
        type: "question",
        questionType: "multiple_choice",
        content: "¿Por qué la urgencia?",
        options: ["Ventana de mercado", "Presión de inversores", "Competencia moviéndose", "Deadline interno"],
      });
    } else if (analysis.concerns.includes('uncertainty')) {
      questions.push({
        type: "question",
        questionType: "multiple_choice",
        content: "¿Qué te ayudaría a tener más claridad?",
        options: ["Datos/métricas", "Feedback de clientes", "Opinión de expertos", "Casos de otras empresas"],
      });
    } else if (analysis.concerns.includes('needs_validation')) {
      questions.push({
        type: "assumption",
        questionType: "multiple_choice",
        content: "He encontrado casos similares en mi búsqueda. ¿Quieres que los analicemos?",
        options: ["Sí, veamos ejemplos", "Ya conozco el mercado", "Prefiero ir al grano"],
      });
    } else if (analysis.concerns.includes('risks_in_context')) {
      questions.push({
        type: "assumption",
        questionType: "multiple_choice",
        content: "Encontré algunos riesgos o consideraciones relevantes. ¿Los exploramos?",
        options: ["Sí, quiero verlos", "Ya los tengo mapeados", "Centrémonos en oportunidades"],
      });
    }
  }

  // ========== PRIORITY 4: DECISION FRAMEWORK ==========

  if (questions.length < maxQuestions && analysis.coreDilemma) {
    questions.push({
      type: "question",
      questionType: "multiple_choice",
      content: "¿Qué criterio pesa más en esta decisión?",
      options: [
        "Impacto en revenue/crecimiento",
        "Riesgo y recursos necesarios",
        "Velocidad de ejecución",
        "Alineación con visión largo plazo",
      ],
    });
  }

  // ========== PRIORITY 5: DOMAIN-SPECIFIC QUESTIONS ==========

  if (questions.length < maxQuestions) {
    if (analysis.domain === 'product' && !questions.some(q => q.content.includes('usuarios'))) {
      questions.push({
        type: "question",
        questionType: "free_text",
        content: "¿Qué problema específico resuelve y qué feedback tienes de usuarios?",
      });
    } else if (analysis.domain === 'marketing' && !questions.some(q => q.content.includes('canal'))) {
      questions.push({
        type: "question",
        questionType: "multiple_choice",
        content: "¿Qué canales has probado hasta ahora?",
        options: ["Ninguno aún", "Orgánico (SEO, contenido)", "Paid (ads)", "Outbound (email, LinkedIn)"],
      });
    } else if (analysis.domain === 'pricing' && !questions.some(q => q.content.includes('compet'))) {
      questions.push({
        type: "question",
        questionType: "free_text",
        content: "¿Cómo se comparan tus precios con la competencia?",
      });
    } else if (analysis.domain === 'hiring') {
      questions.push({
        type: "question",
        questionType: "multiple_choice",
        content: "¿Qué es más crítico para ti ahora?",
        options: ["Velocidad (contratar ya)", "Calidad (el mejor fit)", "Coste (dentro de presupuesto)", "Cultura (que encaje)"],
      });
    } else if (analysis.domain === 'funding') {
      questions.push({
        type: "question",
        questionType: "multiple_choice",
        content: "¿Para qué necesitas el capital principalmente?",
        options: ["Desarrollo de producto", "Crecimiento/Marketing", "Contratación", "Runway/Supervivencia"],
      });
    }
  }

  // ========== FALLBACK: UNIVERSAL BUSINESS QUESTIONS ==========

  if (questions.length === 0) {
    questions.push({
      type: "question",
      questionType: "free_text",
      content: "Cuéntame más contexto: ¿qué negocio tienes, en qué etapa está, y qué te ha llevado a considerar esto?",
    });
  }

  if (mode === 'deep' && questions.length < maxQuestions) {
    questions.push({
      type: "question",
      questionType: "multiple_choice",
      content: "¿Cuál sería el impacto si esta decisión sale bien?",
      options: ["Incremental (mejora)", "Significativo (game changer)", "Existencial (make or break)", "No estoy seguro"],
    });
  }

  return questions.slice(0, maxQuestions);
}
