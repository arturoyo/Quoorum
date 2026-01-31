-- ====================================================================
-- EMERGENCY RESTORE SCRIPT
-- Restaura datos de ejemplo en todas las tablas afectadas por TRUNCATE
-- ====================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_finance_dept_id UUID;
  v_marketing_dept_id UUID;
  v_engineering_dept_id UUID;
BEGIN
  -- ========================================
  -- 1. GET OR CREATE TEST USER
  -- ========================================
  SELECT id INTO v_user_id FROM profiles WHERE email = 'info@imprent.es' LIMIT 1;
  
  IF v_user_id IS NULL THEN
    -- Use a consistent UUID for testing
    v_user_id := 'a0c0998c-17bb-4ef7-874e-08a6d685e81b'::uuid;
    
    INSERT INTO profiles (id, email, full_name, created_at)
    VALUES (v_user_id, 'info@imprent.es', 'Arturo Rayo', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE '[INFO] User ID: %', v_user_id;

  -- ========================================
  -- 2. GET OR CREATE COMPANY
  -- ========================================
  SELECT id INTO v_company_id FROM companies WHERE name = 'Imprenta Demo' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    v_company_id := gen_random_uuid();
    
    INSERT INTO companies (id, user_id, name, industry, description, context, is_active, created_at)
    VALUES (
      v_company_id,
      v_user_id,
      'Imprenta Demo',
      'Printing & Media',
      'Empresa de demostración para pruebas de Quoorum',
      '{"founded": 2015, "employees": 50, "location": "Madrid"}'::jsonb,
      true,
      NOW()
    );
  END IF;

  RAISE NOTICE '[INFO] Company ID: %', v_company_id;

  -- ========================================
  -- 3. RESTORE DEPARTMENTS
  -- ========================================
  DELETE FROM departments WHERE company_id = v_company_id AND is_predefined = false;

  -- Create finance department
  v_finance_dept_id := gen_random_uuid();
  INSERT INTO departments (
    id,
    company_id,
    parent_id,
    name,
    type,
    department_context,
    base_prompt,
    custom_prompt,
    agent_role,
    temperature,
    description,
    icon,
    is_active,
    is_predefined,
    created_at,
    updated_at
  ) VALUES (
    v_finance_dept_id,
    v_company_id,
    NULL,
    'Finanzas',
    'finance',
    'KPIs: Margen neto 15%, ROI > 20%. Procesos: Presupuestos mensuales, Análisis de rentabilidad. Restricciones: Cumplimiento fiscal, Auditoría externa Q4.',
    'Eres un analista financiero con 10 años de experiencia. Analiza decisiones desde perspectiva de flujo de caja, rentabilidad y riesgo fiscal.',
    'Considera siempre el impacto en el cash flow y la capacidad de deuda de la empresa.',
    'analyst',
    '0.7',
    'Departamento de análisis financiero y contabilidad',
    'wallet',
    true,
    false,
    NOW(),
    NOW()
  );

  -- Create marketing department
  v_marketing_dept_id := gen_random_uuid();
  INSERT INTO departments (
    id,
    company_id,
    parent_id,
    name,
    type,
    department_context,
    base_prompt,
    custom_prompt,
    agent_role,
    temperature,
    description,
    icon,
    is_active,
    is_predefined,
    created_at,
    updated_at
  ) VALUES (
    v_marketing_dept_id,
    v_company_id,
    NULL,
    'Marketing',
    'marketing',
    'KPIs: CAC < $50, LTV > $500, Conversión > 3%. Canales: Google Ads, LinkedIn, Email. Budget: $10K/mes. Target: Startups B2B.',
    'Eres un director de marketing digital con expertise en growth hacking. Piensa en términos de métricas, segmentación y optimización de conversión.',
    'Enfócate en estrategias que maximicen el ROI publicitario y generen leads calificados.',
    'analyst',
    '0.75',
    'Departamento de marketing y demand generation',
    'chart',
    true,
    false,
    NOW(),
    NOW()
  );

  -- Create engineering department
  v_engineering_dept_id := gen_random_uuid();
  INSERT INTO departments (
    id,
    company_id,
    parent_id,
    name,
    type,
    department_context,
    base_prompt,
    custom_prompt,
    agent_role,
    temperature,
    description,
    icon,
    is_active,
    is_predefined,
    created_at,
    updated_at
  ) VALUES (
    v_engineering_dept_id,
    v_company_id,
    NULL,
    'Ingeniería',
    'engineering',
    'Tech Stack: Next.js, PostgreSQL, TypeScript. Procesos: Sprint de 2 semanas, CI/CD automatizado. Deuda técnica: ~15% backlog. Performance: Latencia P95 < 200ms.',
    'Eres un CTO con 12 años de experiencia en arquitectura de sistemas distribuidos. Enfatiza escalabilidad, mantenibilidad y deuda técnica.',
    'Siempre considera el costo de mantenimiento a largo plazo y la facilidad de onboarding de nuevos desarrolladores.',
    'analyst',
    '0.65',
    'Departamento de desarrollo e infraestructura',
    'settings',
    true,
    false,
    NOW(),
    NOW()
  );

  RAISE NOTICE '[OK] Departments created: Finance (%), Marketing (%), Engineering (%)', v_finance_dept_id, v_marketing_dept_id, v_engineering_dept_id;

  -- ========================================
  -- 4. RESTORE PROFESSIONALS (Workers)
  -- ========================================
  DELETE FROM workers WHERE user_id = v_user_id;

  INSERT INTO workers (
    id,
    user_id,
    department_id,
    name,
    role,
    type,
    expertise,
    description,
    responsibilities,
    system_prompt,
    ai_config,
    is_active,
    created_at,
    updated_at
  ) VALUES
  (
    gen_random_uuid(),
    v_user_id,
    v_finance_dept_id,
    'Carlos Mendez',
    'cfo',
    'internal',
    'Finanzas corporativas, Analisis de inversiones, Gestion de tesoreria',
    'CFO con 15 anos de experiencia en empresas de tecnologia',
    'Gestiona presupuestos, analiza ROI, supervisa auditorias externas',
    'Eres un CFO experimentado. Evalua decisiones desde perspectiva de impacto en cash flow, retorno de inversion y riesgo fiscal.',
    '{"provider": "openai", "model": "gpt-4o", "temperature": 0.7}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    v_user_id,
    v_marketing_dept_id,
    'Elena Garcia Lopez',
    'vp_product',
    'internal',
    'Estrategia de producto, Growth, Go-to-market',
    'VP de Producto responsable de roadmap y estrategia',
    'Define roadmap trimestral, ejecuta launches de features, analiza user feedback',
    'Eres un VP de Producto data-driven. Priorizas features basado en impacto esperado, esfuerzo y feedback de usuarios.',
    '{"provider": "openai", "model": "gpt-4o", "temperature": 0.75}'::jsonb,
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    v_user_id,
    v_engineering_dept_id,
    'David Chen',
    'cto',
    'internal',
    'Arquitectura de sistemas, DevOps, Escalabilidad',
    'CTO y co-fundador de plataforma SaaS actual',
    'Lidera arquitectura tecnica, supervisa code reviews, gestiona deuda tecnica',
    'Eres un CTO con visión de largo plazo. Considerias escalabilidad, mantenibilidad, deuda tecnica y costo operativo en decisiones tecnicas.',
    '{"provider": "openai", "model": "gpt-4o", "temperature": 0.65}'::jsonb,
    true,
    NOW(),
    NOW()
  );

  RAISE NOTICE '[OK] Professionals (workers) restored for all departments';

  -- ========================================
  -- 5. RESTORE LIBRARY EXPERTS
  -- ========================================
  DELETE FROM experts WHERE user_id IS NULL;

  INSERT INTO experts (
    id,
    user_id,
    name,
    expertise,
    description,
    system_prompt,
    ai_config,
    category,
    is_active,
    library_expert_id,
    created_at,
    updated_at
  ) VALUES
  -- SAAS & STARTUPS
  (
    gen_random_uuid(),
    NULL,
    'April Dunford',
    'Posicionamiento, Go-to-market, Mensajería',
    'Experta en posicionamiento y diferenciación de productos. Ha ayudado a 100+ startups a clarificar su propuesta de valor.',
    'Eres April Dunford, consultora experta en posicionamiento de productos. Tu enfoque es ayudar a empresas a clarificar su propuesta de valor única y diferenciarse en mercados competitivos. Haces preguntas profundas sobre el público objetivo, los problemas que resuelves vs. competidores.',
    '{"provider": "openai", "model": "gpt-4o", "temperature": 0.8}'::jsonb,
    'empresa',
    true,
    NULL,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    NULL,
    'Patrick Campbell',
    'Pricing, SaaS Economics, Monetización',
    'Fundador de ProfitWell. Experto en modelos de precios y métricas de SaaS (MRR, Churn, LTV).',
    'Eres Patrick Campbell, CEO de ProfitWell y experto global en pricing de SaaS. Tu expertise es ayudar a empresas a optimizar sus modelos de precios, analizar métricas de retención (churn) y maximizar el lifetime value (LTV). Piensas en términos de recurring revenue, cohort analysis y psychology del pricing.',
    '{"provider": "openai", "model": "gpt-4o", "temperature": 0.7}'::jsonb,
    'empresa',
    true,
    NULL,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    NULL,
    'Alex Hormozi',
    'Crecimiento, Storytelling, Negocios',
    'Emprendedor exitoso con múltiples negocios de 8 y 9 dígitos. Especialista en growth y copywriting.',
    'Eres Alex Hormozi, emprendedor y coach de negocios. Tu fortaleza es identificar oportunidades de crecimiento, mejorar procesos de sales y marketing, y contar historias convincentes. Tienes experiencia directa escalando múltiples negocios de 7 a 8 dígitos. Tu enfoque es práctico, obsesionado con resultados medibles.',
    '{"provider": "openai", "model": "gpt-4o", "temperature": 0.85}'::jsonb,
    'empresa',
    true,
    NULL,
    NOW(),
    NOW()
  ),
  -- GENERAL PURPOSE
  (
    gen_random_uuid(),
    NULL,
    'Critical Thinker',
    'Análisis crítico, Cuestionamiento, Juicio independiente',
    'Experto en pensamiento crítico e identificación de puntos débiles en argumentos. Cuestiona suposiciones y busca evidencia.',
    'Eres un pensador crítico experimentado. Tu rol es cuestionar suposiciones, identificar falacias lógicas, buscar pruebas y señalar riesgos no considerados. No buscas estar de acuerdo, buscas la verdad. Haces preguntas incómodas pero necesarias.',
    '{"provider": "openai", "model": "gpt-4o", "temperature": 0.6}'::jsonb,
    'general',
    true,
    NULL,
    NOW(),
    NOW()
  );

  RAISE NOTICE '[OK] Library experts restored (4 global experts)';

  -- ========================================
  -- 6. SUCCESS MESSAGE
  -- ========================================
  RAISE NOTICE '[SUCCESS] ========================================';
  RAISE NOTICE '[SUCCESS] All tables restored successfully!';
  RAISE NOTICE '[SUCCESS] ========================================';
  RAISE NOTICE '[SUCCESS] User: % (info@imprent.es)', v_user_id;
  RAISE NOTICE '[SUCCESS] Company: % (Imprenta Demo)', v_company_id;
  RAISE NOTICE '[SUCCESS] Departments: 3 (Finance, Marketing, Engineering)';
  RAISE NOTICE '[SUCCESS] Professionals: 3 (CFO, VP Product, CTO)';
  RAISE NOTICE '[SUCCESS] Library Experts: 4 global experts';
  RAISE NOTICE '[SUCCESS] ========================================';

END $$;
