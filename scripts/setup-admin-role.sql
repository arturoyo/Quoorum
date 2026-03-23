-- Create admin role if not exists
INSERT INTO admin_roles (name, slug, description, permissions, is_active)
VALUES (
  'Super Admin',
  'super_admin',
  'Acceso completo al sistema',
  '["*"]'::jsonb,
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Verify role was created
SELECT id, name, slug FROM admin_roles WHERE slug = 'super_admin';
