# Quoorum Debates Migration Guide

## Overview

This migration adds the complete Quoorum Dynamic System to the database, including:
- Debate storage and history
- Team collaboration (comments, reactions)
- Custom experts
- Performance tracking
- Question embeddings for similarity search

## Tables Created

### Core Tables
1. **quoorum_debates** - Main debate storage
2. **quoorum_debate_comments** - Team collaboration comments
3. **quoorum_debate_reactions** - User reactions (like, bookmark)
4. **quoorum_custom_experts** - User-created custom experts
5. **quoorum_expert_performance** - Expert performance tracking
6. **quoorum_debate_embeddings** - Question embeddings for similarity

### Enums Created
- `debate_mode`: 'static', 'dynamic'
- `debate_status`: 'pending', 'in_progress', 'completed', 'failed', 'cancelled'
- `debate_visibility`: 'private', 'team', 'public'

## Prerequisites

### Required
- PostgreSQL 14+ (for JSONB and UUID support)
- `profiles` table must exist (from previous migrations)

### Optional
- **pgvector extension** (for similarity search)
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
  
  If pgvector is not installed, the embeddings table will still work but without vector similarity search. You can install pgvector later and add the index:
  
  ```sql
  CREATE INDEX quoorum_debate_embeddings_embedding_idx 
  ON quoorum_debate_embeddings 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);
  ```

## How to Run

### Option 1: Using Drizzle Kit (Recommended)

```bash
# Set DATABASE_URL in .env
export DATABASE_URL="postgresql://user:pass@host:5432/db"

# Run all pending migrations
cd packages/db
pnpm drizzle-kit migrate
```

### Option 2: Manual SQL Execution

```bash
# Connect to your database
psql $DATABASE_URL

# Run the migration
\i packages/db/drizzle/0016_quoorum_debates.sql
```

### Option 3: Using Drizzle Push (Development Only)

```bash
cd packages/db
pnpm drizzle-kit push
```

⚠️ **Warning**: `drizzle-kit push` will drop and recreate tables. Only use in development!

## Verification

After running the migration, verify it worked:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'quoorum_%';

-- Expected output:
-- quoorum_debates
-- quoorum_debate_comments
-- quoorum_debate_reactions
-- quoorum_custom_experts
-- quoorum_expert_performance
-- quoorum_debate_embeddings

-- Check enums exist
SELECT typname 
FROM pg_type 
WHERE typname LIKE 'debate_%';

-- Expected output:
-- debate_mode
-- debate_status
-- debate_visibility
```

## Rollback

If you need to rollback this migration:

```sql
-- Drop tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS quoorum_debate_embeddings CASCADE;
DROP TABLE IF EXISTS quoorum_expert_performance CASCADE;
DROP TABLE IF EXISTS quoorum_custom_experts CASCADE;
DROP TABLE IF EXISTS quoorum_debate_reactions CASCADE;
DROP TABLE IF EXISTS quoorum_debate_comments CASCADE;
DROP TABLE IF EXISTS quoorum_debates CASCADE;

-- Drop enums
DROP TYPE IF EXISTS debate_visibility;
DROP TYPE IF EXISTS debate_status;
DROP TYPE IF EXISTS debate_mode;
```

## Data Size Estimates

Approximate storage per debate:
- **Debate record**: 5-10 KB (with full rounds and results)
- **Comments**: 1-2 KB each
- **Reactions**: 100 bytes each
- **Embeddings**: 6 KB (1536 dimensions × 4 bytes)

For 1000 debates with average activity:
- Debates: ~10 MB
- Comments (10 per debate): ~20 MB
- Reactions (5 per debate): ~500 KB
- Embeddings: ~6 MB
- **Total**: ~37 MB

## Performance Considerations

### Indexes Created
- All foreign keys are indexed
- `created_at` columns are indexed for time-based queries
- `status` is indexed for filtering active debates
- `share_token` is indexed for public debate access

### Recommended Additional Indexes

If you have high query volume, consider adding:

```sql
-- For analytics queries
CREATE INDEX quoorum_debates_user_created_idx 
ON quoorum_debates(user_id, created_at DESC);

-- For quality filtering
CREATE INDEX quoorum_debates_consensus_score_idx 
ON quoorum_debates(consensus_score) 
WHERE status = 'completed';

-- For cost tracking
CREATE INDEX quoorum_debates_cost_idx 
ON quoorum_debates(total_cost_usd) 
WHERE status = 'completed';
```

## Integration with Application

After migration, the Quoorum system will be fully functional:

### Backend (tRPC API)
- All 18 endpoints will work
- Database operations will persist data
- Real-time updates via WebSocket

### Frontend
- `/forum` page will display real debates
- Analytics will show real data
- Comments and reactions will be saved

### Services
- PDF export will include all debate data
- Email notifications will work
- Performance tracking will accumulate

## Troubleshooting

### Error: "relation profiles does not exist"
**Solution**: Run previous migrations first. The `profiles` table is required.

### Error: "type vector does not exist"
**Solution**: pgvector extension is not installed. Either:
1. Install pgvector: `CREATE EXTENSION vector;`
2. Or comment out the vector index in the migration

### Error: "permission denied to create extension"
**Solution**: You need superuser privileges to install extensions. Contact your DBA or use a managed database service that includes pgvector.

### Slow queries on embeddings
**Solution**: Make sure the vector index is created (requires pgvector). If not using similarity search, you can skip the embeddings table entirely.

## Next Steps

After successful migration:

1. **Test the system**
   ```bash
   # Create a test debate
   curl -X POST http://localhost:3000/api/trpc/forum.create \
     -H "Content-Type: application/json" \
     -d '{"question": "Test debate", "mode": "dynamic"}'
   ```

2. **Monitor performance**
   - Check query execution times
   - Monitor database size growth
   - Review index usage

3. **Configure backups**
   - Set up automated backups
   - Test restore procedures
   - Document recovery process

4. **Optional: Install pgvector**
   - For similarity search functionality
   - Requires database restart
   - See pgvector documentation

## Support

For issues or questions:
- Check logs: `packages/api/logs/`
- Review schema: `packages/db/src/schema/forum-debates.ts`
- See API docs: `packages/quoorum/API_DOCUMENTATION.md`

---

**Migration Version**: 0016  
**Created**: 2025-01-01  
**Status**: Ready for production  
**Dependencies**: profiles table (from migration 0000)
