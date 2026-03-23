-- ============================================================================
-- Script para configurar usuario admin
-- ============================================================================
-- 
-- INSTRUCCIONES:
-- 1. Reemplaza 'TU_EMAIL_AQUI' con tu email de Supabase Auth
-- 2. Ejecuta este script en PostgreSQL
--
-- Este script:
-- - Actualiza o crea el usuario en la tabla users con 999999 créditos y tier business
-- - Crea el perfil en profiles si no existe
-- - Crea el registro en adminUsers con rol super_admin
-- ============================================================================

-- Variables (cambiar estos valores)
\set user_email 'TU_EMAIL_AQUI'  -- [WARN] CAMBIAR ESTO

-- Paso 1: Obtener o crear profile
DO $$
DECLARE
    v_profile_id uuid;
    v_user_id uuid;
    v_admin_role_id uuid;
BEGIN
    -- Buscar profile por email
    SELECT id INTO v_profile_id
    FROM profiles
    WHERE email = :'user_email'
    LIMIT 1;

    -- Si no existe, crear profile (necesitarás el userId de Supabase Auth)
    -- Por ahora, asumimos que el profile ya existe
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Profile no encontrado para email: %. Por favor, crea el profile primero o proporciona el userId de Supabase Auth.', :'user_email';
    END IF;

    -- Paso 2: Obtener o crear user en tabla users
    SELECT id INTO v_user_id
    FROM users
    WHERE email = :'user_email'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        -- Crear usuario
        INSERT INTO users (email, name, credits, tier, role)
        VALUES (
            :'user_email',
            'Admin User',
            999999,
            'business',
            'admin'
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'Usuario creado con ID: %', v_user_id;
    ELSE
        -- Actualizar usuario existente
        UPDATE users
        SET 
            credits = 999999,
            tier = 'business',
            role = 'admin',
            updated_at = NOW()
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Usuario actualizado con ID: %', v_user_id;
    END IF;

    -- Paso 3: Obtener o crear admin role "super_admin"
    SELECT id INTO v_admin_role_id
    FROM admin_roles
    WHERE slug = 'super_admin'
    LIMIT 1;

    IF v_admin_role_id IS NULL THEN
        INSERT INTO admin_roles (name, slug, description, permissions, is_active)
        VALUES (
            'Super Admin',
            'super_admin',
            'Acceso completo al sistema',
            ARRAY['*']::text[],
            true
        )
        RETURNING id INTO v_admin_role_id;
        
        RAISE NOTICE 'Rol super_admin creado con ID: %', v_admin_role_id;
    END IF;

    -- Paso 4: Crear o actualizar adminUsers
    INSERT INTO admin_users (user_id, profile_id, role_id, role, is_active)
    VALUES (
        v_profile_id,
        v_profile_id,
        v_admin_role_id,
        'super_admin',
        true
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        role_id = v_admin_role_id,
        role = 'super_admin',
        is_active = true,
        updated_at = NOW();
    
    RAISE NOTICE 'Admin user configurado correctamente';
    RAISE NOTICE 'Profile ID: %', v_profile_id;
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Admin Role ID: %', v_admin_role_id;
END $$;

-- Verificar resultado
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.credits,
    u.tier,
    u.role,
    au.role as admin_role,
    ar.name as admin_role_name
FROM users u
LEFT JOIN profiles p ON p.email = u.email
LEFT JOIN admin_users au ON au.user_id = p.id
LEFT JOIN admin_roles ar ON ar.id = au.role_id
WHERE u.email = :'user_email';
