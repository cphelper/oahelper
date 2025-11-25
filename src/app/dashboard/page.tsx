import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { PasswordCheckWrapper } from '@/components/auth/password-check-wrapper'
import { checkUserHasPassword } from '@/app/auth/actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { hasPassword } = await checkUserHasPassword()

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <PasswordCheckWrapper hasPassword={hasPassword}>
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black bg-grid-white/[0.05] relative overflow-hidden">
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        
        <div className="relative z-10 w-full max-w-4xl px-4 py-8">
          <div className="rounded-xl border border-white/10 bg-black/50 backdrop-blur-xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <form action={signOut}>
                <Button variant="outline" className="border-white/10 hover:bg-white/10 hover:text-white gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </form>
            </div>
            
            <p className="text-neutral-400 mb-8">
              Welcome back, <span className="text-white font-medium">{user.email}</span>
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-lg bg-white/5 border border-white/10 p-4">
                  <div className="h-8 w-8 rounded-full bg-white/10 mb-4 animate-pulse" />
                  <div className="h-4 w-2/3 rounded bg-white/10 mb-2 animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-white/10 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PasswordCheckWrapper>
  )
}
