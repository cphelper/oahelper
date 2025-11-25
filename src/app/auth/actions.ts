'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, signupSchema, resetPasswordSchema, forgotPasswordSchema } from '@/lib/schemas'

export async function login(prevState: any, formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validatedFields = loginSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword(validatedFields.data)

  if (error) {
    return {
      message: error.message,
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(prevState: any, formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validatedFields = signupSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp(validatedFields.data)

  if (error) {
    return {
      message: error.message,
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}



export async function forgotPassword(prevState: any, formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
  }

  const validatedFields = forgotPasswordSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      message: validatedFields.error.flatten().fieldErrors.email?.[0] || 'Invalid email',
      success: false,
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(validatedFields.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return {
      message: error.message,
      success: false,
    }
  }

  return {
    message: 'Check your email for a password reset link',
    success: true,
  }
}

export async function resetPassword(prevState: any, formData: FormData) {
  const rawData = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const validatedFields = resetPasswordSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: validatedFields.data.password,
  })

  if (error) {
    return {
      message: error.message,
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function setPassword(prevState: any, formData: FormData) {
  const rawData = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const validatedFields = resetPasswordSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
      success: false,
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: validatedFields.data.password,
  })

  if (error) {
    return {
      message: error.message,
      success: false,
    }
  }

  return {
    message: 'Password set successfully',
    success: true,
  }
}

export async function checkUserHasPassword() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { hasPassword: true }
  
  // Check if user has any identities that are not OAuth providers
  // If user only has OAuth identities and no email identity, they don't have a password
  const identities = user.identities || []
  const hasEmailIdentity = identities.some(identity => identity.provider === 'email')
  
  return { hasPassword: hasEmailIdentity }
}
