import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

const SESSION_COOKIE = 'user_session'
const SESSION_EXPIRY = 60 * 60 * 24 * 7 // 7 days in seconds

export interface User {
  id: number
  name: string | null
  email: string
  college: string | null
  verified: boolean
  role: string
  oacoins: number
}

export interface SessionUser extends User {
  isPremium: boolean
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: number): Promise<void> {
  const cookieStore = await cookies()
  const sessionData = {
    userId,
    expiresAt: Date.now() + SESSION_EXPIRY * 1000,
  }
  
  cookieStore.set(SESSION_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY,
    path: '/',
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<{ userId: number } | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)
  
  if (!sessionCookie) return null
  
  try {
    const sessionData = JSON.parse(sessionCookie.value)
    if (sessionData.expiresAt < Date.now()) {
      await destroySession()
      return null
    }
    return { userId: sessionData.userId }
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession()
  if (!session) return null
  
  const supabase = await createClient()
  
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, college, verified, role, oacoins')
    .eq('id', session.userId)
    .single()
  
  if (!user) return null
  
  // Check premium status
  const { data: subscription } = await supabase
    .from('premium_subscriptions')
    .select('end_date')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('end_date', new Date().toISOString())
    .limit(1)
    .maybeSingle()
  
  return {
    ...user,
    isPremium: !!subscription,
  }
}
