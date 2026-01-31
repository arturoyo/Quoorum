-- Verificar si la tabla de comentarios existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'quoorum_debate_comments'
);

-- Si no existe, crearla
CREATE TABLE IF NOT EXISTS "quoorum_debate_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "debate_id" uuid NOT NULL REFERENCES "quoorum_debates"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "parent_id" uuid REFERENCES "quoorum_debate_comments"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS "idx_quoorum_debate_comments_debate" ON "quoorum_debate_comments" USING btree ("debate_id");
CREATE INDEX IF NOT EXISTS "idx_quoorum_debate_comments_user" ON "quoorum_debate_comments" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_quoorum_debate_comments_parent" ON "quoorum_debate_comments" USING btree ("parent_id");

-- Verificar que se creó correctamente
SELECT COUNT(*) as comment_count FROM "quoorum_debate_comments";
