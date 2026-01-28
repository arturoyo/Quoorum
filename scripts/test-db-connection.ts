#!/usr/bin/env tsx
/**
 * Test script to verify PostgreSQL connection from Node.js
 */

import postgres from 'postgres';
import { db } from '@quoorum/db';
import { profiles, quoorumDebates } from '@quoorum/db/schema';
import { eq, sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/quoorum';

console.log('[INFO] Testing database connection...');
console.log('[INFO] Connection string:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

async function testConnection() {
  try {
    // Test 1: Direct postgres connection
    console.log('\n[Test 1] Testing direct postgres connection...');
    const sqlClient = postgres(DATABASE_URL, {
      max: 1,
      connect_timeout: 5,
    });
    
    const directResult = await sqlClient`SELECT COUNT(*) as count FROM profiles`;
    console.log('[OK] Direct connection OK:', directResult[0]);
    await sqlClient.end();

    // Test 2: Drizzle connection
    console.log('\n[Test 2] Testing Drizzle connection...');
    const profilesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(profiles);
    console.log('[OK] Drizzle connection OK:', profilesCount[0]);

    // Test 3: Query profiles
    console.log('\n[Test 3] Querying profiles...');
    const allProfiles = await db
      .select()
      .from(profiles)
      .limit(10);
    console.log(`[OK] Found ${allProfiles.length} profiles:`, allProfiles.map(p => p.email));

    // Test 4: Query debates
    console.log('\n[Test 4] Querying debates...');
    const debates = await db
      .select({
        id: quoorumDebates.id,
        question: quoorumDebates.question,
        status: quoorumDebates.status,
      })
      .from(quoorumDebates)
      .limit(5);
    console.log(`[OK] Found ${debates.length} debates:`, debates.map(d => ({ id: d.id.substring(0, 8), question: d.question.substring(0, 50) })));

    // Test 5: Query with join
    console.log('\n[Test 5] Querying debates with profile join...');
    const debatesWithProfile = await db
      .select({
        debateId: quoorumDebates.id,
        question: quoorumDebates.question,
        profileEmail: profiles.email,
      })
      .from(quoorumDebates)
      .leftJoin(profiles, eq(quoorumDebates.userId, profiles.id))
      .limit(5);
    console.log(`[OK] Found ${debatesWithProfile.length} debates with profiles:`, debatesWithProfile.map(d => ({ email: d.profileEmail, question: d.question.substring(0, 40) })));

    // Test 6: Query by email (like tRPC context does)
    console.log('\n[Test 6] Querying profile by email (test@quoorum.pro)...');
    const testProfile = await db
      .select()
      .from(profiles)
      .where(sql`LOWER(${profiles.email}) = LOWER('test@quoorum.pro')`)
      .limit(1);
    console.log('[OK] Profile found:', testProfile[0] ? { id: testProfile[0].id.substring(0, 8), email: testProfile[0].email } : 'NOT FOUND');

    if (testProfile[0]) {
      // Test 7: Query debates for this profile
      console.log('\n[Test 7] Querying debates for test@quoorum.pro...');
      const testDebates = await db
        .select()
        .from(quoorumDebates)
        .where(eq(quoorumDebates.userId, testProfile[0].id))
        .limit(5);
      console.log(`[OK] Found ${testDebates.length} debates for test user`);
    }

    console.log('\n[OK] All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n[ERROR] Connection test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

testConnection();
