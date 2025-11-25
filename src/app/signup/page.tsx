import { AuthForm } from '@/components/auth/auth-form'
import { signup } from '@/app/auth/actions'

export default function SignupPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black bg-grid-white/[0.05] relative overflow-hidden">
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      
      <div className="relative z-10 w-full flex justify-center">
        <AuthForm type="signup" action={signup} />
      </div>
    </div>
  )
}

