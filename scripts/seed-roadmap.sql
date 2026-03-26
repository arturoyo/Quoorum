-- Seed roadmap_items table with real pending items from QUE-FALTA.md and ROADMAP.md
-- Run after the roadmap_items table has been created via Drizzle migration.
--
-- Usage: psql -d quoorum -f scripts/seed-roadmap.sql

-- From QUE-FALTA.md
INSERT INTO roadmap_items (id, title, description, status, priority, category, due_date, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Schema validation automatica', 'Script que valida automaticamente que el schema Drizzle coincide con PostgreSQL. Detecta columnas faltantes, enums incorrectos, foreign keys rotas. Se ejecuta en pre-flight checks.', 'planned', 'high', 'infra', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Fix email placeholders RESEND_API_KEY', 'Si falta RESEND_API_KEY, ningun email se envia. Validar que existe al iniciar app, fallar explicitamente si falta, no usar placeholders silenciosos.', 'planned', 'critical', 'bugfix', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Tests para 5 routers sin cobertura', 'Routers sin tests: gmail.ts, integrations.ts, referrals.ts, tools.ts, usage.ts. Crear tests de validacion Zod minimos y tests de autorizacion (userId filtering).', 'planned', 'high', 'bugfix', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Controles interactivos de debate', 'Pausar/Reanudar debate en curso, saltar ronda actual, anadir contexto durante el debate, forzar consenso anticipado, seleccion manual de expertos.', 'planned', 'medium', 'feature', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Notificaciones email on completion', 'Email cuando debate completa, notificacion in-app en tiempo real, preferencias de notificaciones.', 'planned', 'medium', 'feature', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Tests de integracion automaticos', 'Tests que verifican flujos completos (crear debate, ejecutar, ver resultado). Ejecutados automaticamente en CI/CD.', 'planned', 'medium', 'infra', NULL, NOW(), NOW());

-- From ROADMAP.md
INSERT INTO roadmap_items (id, title, description, status, priority, category, due_date, created_at, updated_at) VALUES
  (gen_random_uuid(), 'A/B testing de landing pages', 'Implementar A/B testing para las landing pages de frameworks para optimizar conversion rates.', 'planned', 'low', 'feature', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'SEO optimization + link building', 'Optimizar SEO de landing pages existentes y comenzar estrategia de link building para frameworks.', 'planned', 'medium', 'infra', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Performance Lighthouse 90+', 'Optimizar performance de todas las paginas para alcanzar Lighthouse score 90+ en todas las metricas.', 'planned', 'medium', 'infra', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Framework results sharing', 'Social media cards para compartir resultados de frameworks. Generar OG images dinamicas con el resumen del analisis.', 'planned', 'low', 'feature', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Deploy a produccion', 'Desplegar la aplicacion completa a produccion. Requiere configurar dominio, SSL, y CI/CD pipeline.', 'blocked', 'critical', 'infra', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'Configurar Vercel token para CI/CD', 'Configurar el token de Vercel para el pipeline de CI/CD automatico. Necesario antes del deploy a produccion.', 'planned', 'high', 'infra', NULL, NOW(), NOW());
