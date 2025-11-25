'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface AuthFormProps {
  type: 'login' | 'signup'
  action: (state: any, formData: FormData) => Promise<any>
}

const initialState = {
  message: '',
  error: null,
}

export function AuthForm({ type, action }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState)
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google', // Using Google as the provider based on user configuration
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error(error)
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 p-8">
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 mb-4"
        />
        <h1 className="text-3xl font-bold tracking-tight text-white">
          {type === 'login' ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-sm text-neutral-400">
          {type === 'login'
            ? 'Enter your credentials to access your account'
            : 'Enter your email to get started'}
        </p>
      </div>

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 bg-white text-black hover:bg-neutral-200 border-0"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isPending}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26c.13-.18.27-.37.42-.58z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
              Continue with Google
            </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black px-2 text-neutral-400">Or continue with email</span>
          </div>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              className="bg-neutral-900/50 border-neutral-800 focus:border-neutral-700 transition-colors"
            />
            {state?.error?.email && (
              <p className="text-xs text-red-500">{state.error.email[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="bg-neutral-900/50 border-neutral-800 focus:border-neutral-700 transition-colors"
            />
            {state?.error?.password && (
              <p className="text-xs text-red-500">{state.error.password[0]}</p>
            )}
          </div>
        </div>

        {state?.message && (
          <p className="text-sm text-red-500 text-center">{state.message}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors h-11 border border-neutral-700"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : type === 'login' ? (
            'Sign In'
          ) : (
            'Sign Up'
          )}
        </Button>
      </form>

      <div className="text-center text-sm text-neutral-500">
        {type === 'login' ? (
          <>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-white hover:underline underline-offset-4">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="text-white hover:underline underline-offset-4">
              Sign in
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
