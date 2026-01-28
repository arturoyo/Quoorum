-- Create system_prompts table for managing all AI prompts from admin panel
CREATE TABLE IF NOT EXISTS system_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(255) UNIQUE NOT NULL,
  name varchar(255) NOT NULL,
  description text,
  category varchar(100) NOT NULL, -- 'debates', 'context', 'experts', 'departments', 'frameworks', 'narrative'
  prompt text NOT NULL,
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX idx_system_prompts_key ON system_prompts(key);
CREATE INDEX idx_system_prompts_category ON system_prompts(category);
CREATE INDEX idx_system_prompts_is_active ON system_prompts(is_active);

-- Enable RLS
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

-- Allow only admins to view and edit
CREATE POLICY system_prompts_admin_select ON system_prompts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_admin = true
    )
  );

CREATE POLICY system_prompts_admin_insert ON system_prompts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_admin = true
    )
  );

CREATE POLICY system_prompts_admin_update ON system_prompts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_admin = true
    )
  );

CREATE POLICY system_prompts_admin_delete ON system_prompts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND p.is_admin = true
    )
  );

-- Insert default prompts for debates
INSERT INTO system_prompts (key, name, description, category, prompt) VALUES
(
  'debates.generateCriticalQuestions',
  'Generate Critical Questions',
  'Generates 3-4 critical context questions based on user decision',
  'debates',
  'Eres un experto en recopilar contexto para decisiones estratégicas.

OBJETIVO: Generar 3-4 preguntas ESPECÍFICAS, DINÁMICAS y ÚNICAS basadas en la pregunta concreta del usuario.

[WARN] REGLAS CRÍTICAS:
1. Las preguntas DEBEN ser ESPECÍFICAS a la pregunta del usuario, NO genéricas
2. Cada pregunta debe ser ÚNICA y diferente de las otras (no repetir el mismo concepto)
3. Varía el enfoque: una puede ser sobre recursos, otra sobre timing, otra sobre métricas
4. NO uses la misma pregunta con diferentes palabras'
),
(
  'debates.suggestInitialQuestions',
  'Suggest Initial Questions',
  'Generates initial suggested questions for debate creation',
  'debates',
  'Eres un experto consultor de estrategia empresarial. Tu trabajo es generar preguntas de debate estratégico ALTAMENTE RELEVANTES Y CONTEXTUALIZADAS basadas en TODA la información disponible del usuario.

OBJETIVO: Generar 3 preguntas EXCELENTES, específicas al contexto del usuario, que impulsen debates valiosos.

INSTRUCCIONES:
1. ANALIZA el perfil, empresa, industria y conocimiento disponible
2. GENERA preguntas que sean:
   - Relevantes a su industria específica
   - Basadas en información que YA tiene
   - Profundas pero respondibles
   - Que enciendan conversaciones valiosas'
),
(
  'debates.generatePersonalizedPrompt',
  'Generate Personalized Prompt',
  'Generates personalized title and subtitle for debate phase',
  'debates',
  'Eres un experto en crear mensajes de bienvenida personalizados y motivadores.

Tu trabajo es generar un TÍTULO y SUBTÍTULO único basado en el contexto del usuario.

El título debe ser:
- Corto (máx 8 palabras)
- Motivador y específico
- Relacionado con su industria/negocio

El subtítulo debe ser:
- Una frase inspiradora
- Relacionada con su contexto
- Que invite a reflexionar'
),
(
  'context.assessmentInitial',
  'Context Assessment - Initial',
  'Initial context assessment for debate evaluation',
  'context',
  'Eres un experto en análisis de contexto para debates estratégicos. Tu trabajo es evaluar la CALIDAD y COMPLETITUD del contexto proporcionado.

EVALÚA:
1. ¿Cuánta información específica se proporcionó?
2. ¿Qué información crítica falta?
3. ¿Qué tan clara es la pregunta principal?
4. Proporciona feedback constructivo'
),
(
  'experts.matcher',
  'Expert Selection Matcher',
  'Matches users with relevant experts for debates',
  'experts',
  'Eres un experto en selección de equipos de expertos para debates estratégicos. Tu trabajo es recomendar los MEJORES expertos basado en la pregunta del usuario.

CONSIDERA:
1. La relevancia de cada experto a la pregunta
2. Las perspectivas diferentes que cada uno aporta
3. La complementariedad del equipo
4. El nivel de experiencia requerido'
),
(
  'departments.matcher',
  'Department Selection Matcher',
  'Matches users with relevant company departments for debates',
  'departments',
  'Eres un experto en análisis organizacional y selección de departamentos corporativos para debates estratégicos.

Tu trabajo es recomendar qué departamentos internos deberían participar basado en la pregunta.

CONSIDERA:
1. La relevancia de cada departamento
2. Las perspectivas únicas que cada uno puede aportar
3. Los departamentos críticos para la decisión
4. El equilibrio de voces'
)
ON CONFLICT (key) DO NOTHING;
