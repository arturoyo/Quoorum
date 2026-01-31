-- EMERGENCY: Restore sample debates after data loss
-- Execute this with: pnpm db:execute restore-debates.sql

-- Get the first user ID to assign debates
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get first available user
  SELECT id INTO v_user_id FROM profiles LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Please create a user first.';
  END IF;

  -- Insert sample completed debates
  INSERT INTO quoorum_debates (
    id,
    user_id,
    question,
    context,
    status,
    final_ranking,
    consensus_score,
    metadata,
    created_at
  ) VALUES
  (
    gen_random_uuid(),
    v_user_id,
    'Deberia migrar a una nueva plataforma SaaS o mantener la infraestructura actual?',
    '{"summary": "Nuestra empresa tiene 50 empleados y actualmente usa servidores propios."}'::jsonb,
    'completed',
    '[{"option": "Migrar a SaaS", "score": 85}, {"option": "Mantener actual", "score": 60}]'::jsonb,
    0.85,
    '{"title": "Estrategia de Migracion Cloud", "pattern": "consensus"}'::jsonb,
    NOW() - INTERVAL '2 days'
  ),
  (
    gen_random_uuid(),
    v_user_id,
    'Que feature deberia priorizar: movil o web?',
    '{"summary": "Startup B2B con 1000 usuarios activos mensuales."}'::jsonb,
    'completed',
    '[{"option": "Web primero", "score": 78}, {"option": "Movil primero", "score": 65}]'::jsonb,
    0.78,
    '{"title": "Priorizacion de Features", "pattern": "ranking"}'::jsonb,
    NOW() - INTERVAL '1 day'
  ),
  (
    gen_random_uuid(),
    v_user_id,
    'Como estructurar el pricing de nuestro SaaS?',
    '{"summary": "Producto SaaS B2B con 3 planes. Competencia entre $29-$199/mes."}'::jsonb,
    'completed',
    '[{"option": "Freemium + Tiers", "score": 82}, {"option": "Trial + Flat", "score": 68}]'::jsonb,
    0.82,
    '{"title": "Estrategia de Pricing", "pattern": "consensus"}'::jsonb,
    NOW() - INTERVAL '3 hours'
  );

  RAISE NOTICE 'Sample debates restored successfully for user %', v_user_id;
END $$;
