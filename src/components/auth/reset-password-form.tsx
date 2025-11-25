'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { resetPassword } from '@/app/auth/actions'

const initialState = {
  message: '',
  error: null as any,
}

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(resetPassword as any, initialState)

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
          Set new password
        </h1>
        <p className="text-sm text-neutral-400">
          Enter your new password below
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="bg-neutral-900/50 border-neutral-800 focus:border-neutral-700 transition-colors"
            />
            {state?.error?.confirmPassword && (
              <p className="text-xs text-red-500">{state.error.confirmPassword[0]}</p>
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
          ) : (
            'Update password'
          )}
        </Button>
      </form>
    </div>
  )
}
