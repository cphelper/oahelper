'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { X, Loader2, ShieldAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { setPassword } from '@/app/auth/actions'

interface SetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

const initialState = {
  message: '',
  error: null as any,
  success: false,
}

export function SetPasswordModal({ isOpen, onClose }: SetPasswordModalProps) {
  const [state, formAction, isPending] = useActionState(setPassword as any, initialState)

  React.useEffect(() => {
    if (state?.success) {
      onClose()
    }
  }, [state?.success, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
            <ShieldAlert className="h-6 w-6 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Set a Password</h2>
          <p className="text-sm text-neutral-400 mt-2">
            For better security, please set a password for your account
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modal-password">Password</Label>
            <Input
              id="modal-password"
              name="password"
              type="password"
              required
              className="bg-neutral-800/50 border-neutral-700 focus:border-neutral-600 transition-colors"
            />
            {state?.error?.password && (
              <p className="text-xs text-red-500">{state.error.password[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="modal-confirmPassword">Confirm Password</Label>
            <Input
              id="modal-confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="bg-neutral-800/50 border-neutral-700 focus:border-neutral-600 transition-colors"
            />
            {state?.error?.confirmPassword && (
              <p className="text-xs text-red-500">{state.error.confirmPassword[0]}</p>
            )}
          </div>

          {state?.message && !state?.success && (
            <p className="text-sm text-red-500 text-center">{state.message}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-neutral-700 hover:bg-neutral-800"
            >
              Later
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-yellow-600 text-white hover:bg-yellow-700"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Set Password'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
