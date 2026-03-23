-- ====================================================================
-- INITIALIZE CREDITS SYSTEM
-- Inicializa el sistema de créditos para usuarios existentes
-- ====================================================================

-- 1. Resetear refresh timestamp para permitir actualización diaria
UPDATE users 
SET 
  last_daily_credit_refresh = NULL,
  updated_at = NOW()
WHERE last_daily_credit_refresh IS NOT NULL;

-- 2. Asegurar que los usuarios tengan valores iniciales sensatos
UPDATE users 
SET 
  credits = CASE 
    WHEN tier = 'free' THEN 100
    WHEN tier = 'pro' THEN 500
    WHEN tier = 'business' THEN 1000
    ELSE 100
  END,
  updated_at = NOW()
WHERE credits < 50 OR credits IS NULL;

-- 3. Verificar estado actual
SELECT 
  id,
  email,
  tier,
  credits,
  last_daily_credit_refresh,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;
