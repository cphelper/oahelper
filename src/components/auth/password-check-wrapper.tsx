'use client'

import * as React from 'react'
import { SetPasswordModal } from './set-password-modal'

interface PasswordCheckWrapperProps {
  hasPassword: boolean
  children: React.ReactNode
}

export function PasswordCheckWrapper({ hasPassword, children }: PasswordCheckWrapperProps) {
  const [showModal, setShowModal] = React.useState(!hasPassword)

  return (
    <>
      {children}
      <SetPasswordModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
