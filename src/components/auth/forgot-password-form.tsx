'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { forgotPassword } from '@/app/auth/actions'

const initialState = {
  message: '',
  success: false,
}

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(forgotPassword, initialState)

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
          Reset your password
        </h1>
        <p className="text-sm text-neutral-400">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {state?.success ? (
        <div className="space-y-6">
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
            <p className="text-sm text-green-400 text-center">
              Check your email for a password reset link
            </p>
          </div>
          <Link href="/login" className="block">
            <Button
              variant="outline"
              className="w-full border-neutral-700 hover:bg-neutral-800 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </div>
      ) : (
        <form action={formAction} className="space-y-6">
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
          </div>

          {state?.message && !state?.success && (
            <p className="text-sm text-red-500 text-center">{state.message}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors h-11 border border-neutral-700"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Send reset link'
            )}
          </Button>

          <div className="text-center">
            <Link href="/login" className="text-sm text-neutral-400 hover:text-white">
              <ArrowLeft className="inline h-3 w-3 mr-1" />
              Back to login
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
