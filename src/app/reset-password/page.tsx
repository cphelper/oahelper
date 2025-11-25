'use client'

import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    return (
      <div className="w-full max-w-md space-y-8 p-8 text-center">
        <h1 className="text-2xl font-bold text-white">Error</h1>
        <p className="text-red-500">{errorDescription || 'Something went wrong'}</p>
      </div>
    )
  }

  return <ResetPasswordForm />
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black bg-grid-white/[0.05] relative overflow-hidden">
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      
      <div className="relative z-10 w-full flex justify-center">
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  )
}
