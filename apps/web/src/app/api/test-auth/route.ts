/**
 * Endpoint de test para establecer sesión usando usuario de PostgreSQL
 * SOLO para desarrollo/testing - NO usar en producción
 */

import { NextResponse } from 'next/server'
import { db } from '@quoorum/db'
import { profiles } from '@quoorum/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'

const TEST_EMAIL = 'test@quoorum.pro'

export async function GET() {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    // Buscar usuario en PostgreSQL
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.email, TEST_EMAIL),
    })

    if (!profile) {
      return NextResponse.json({ error: 'User not found in PostgreSQL' }, { status: 404 })
    }

    // Intentar hacer login real con Supabase Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase credentials not found' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Intentar login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: '20Quoorum25',
    })

    if (error) {
      return NextResponse.json({ 
        error: error.message,
        user_id: profile.userId,
        profile_id: profile.id,
        note: 'Login failed - email may need confirmation'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
      profile: {
        id: profile.id,
        userId: profile.userId,
        email: profile.email,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
