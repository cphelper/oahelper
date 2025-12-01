import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { PremiumProvider } from '@/contexts/PremiumContext'

const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OAHelper - Online Assessment Questions from Top Companies',
  description: 'Practice coding OA questions from top companies. Exclusive collection of real online assessment questions and detailed solutions to help you ace your next OA.',
  keywords: 'online assessment, coding OA, OA questions, programming challenges, tech OA prep, interview preparation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={plusJakarta.className}>
        <AuthProvider>
          <PremiumProvider>
            <div className="min-h-screen bg-black">
              {children}
            </div>
          </PremiumProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
