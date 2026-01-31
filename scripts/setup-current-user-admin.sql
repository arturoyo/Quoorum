-- ============================================================================
-- Script para configurar el usuario actual como admin
-- ============================================================================
-- 
-- INSTRUCCIONES:
-- 1. Ejecuta este script DESPUÉS de iniciar sesión en la aplicación
-- 2. El script buscará tu email de Supabase Auth desde la tabla profiles
-- 3. Si tienes múltiples perfiles, ajusta el WHERE clause
--
-- Este script:
-- - Actualiza o crea el usuario en la tabla users con 999999 créditos y tier business
-- - Crea el registro en adminUsers con rol super_admin
-- ============================================================================

-- Paso 1: Obtener el profile más reciente (probablemente el tuyo)
DO $$
DECLARE
    v_profile_id uuid;
    v_profile_user_id uuid; -- userId de Supabase Auth
    v_user_id uuid;
    v_admin_role_id uuid;
    v_user_email text;
BEGIN
    -- Obtener el profile más reciente (ajusta esto si tienes múltiples usuarios)
    SELECT id, user_id, email INTO v_profile_id, v_profile_user_id, v_user_email
    FROM profiles
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró ningún profile. Por favor, inicia sesión primero.';
    END IF;

    RAISE NOTICE 'Profile encontrado: ID=%, Email=%, UserId=%', v_profile_id, v_user_email, v_profile_user_id;

    -- Paso 2: Buscar o crear user en tabla users
    -- Primero intentar por email
    SELECT id INTO v_user_id
    FROM users
    WHERE email = v_user_email
    LIMIT 1;

    -- Si no existe, crear usuario
    IF v_user_id IS NULL THEN
        INSERT INTO users (email, name, credits, tier, role)
        VALUES (
            v_user_email,
            COALESCE((SELECT name FROM profiles WHERE id = v_profile_id), 'Admin User'),
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
    
    RAISE NOTICE '[OK] Configuración completada';
    RAISE NOTICE 'Profile ID: %', v_profile_id;
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Admin Role ID: %', v_admin_role_id;
    RAISE NOTICE 'Email: %', v_user_email;
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
    ar.name as admin_role_name,
    p.id as profile_id
FROM profiles p
LEFT JOIN users u ON u.email = p.email
LEFT JOIN admin_users au ON au.user_id = p.id
LEFT JOIN admin_roles ar ON ar.id = au.role_id
ORDER BY p.created_at DESC
LIMIT 1;
