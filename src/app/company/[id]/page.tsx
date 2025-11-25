import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, Building2, FileCode, Lock } from "lucide-react"

interface Question {
  id: number
  title: string
  difficulty: string
  question_type: string
  premium_required: boolean
}

interface Company {
  id: number
  name: string
  date: string
  solutions_available: boolean
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: company, error: companyError } = await supabase
    .from("Companies")
    .select("*")
    .eq("id", id)
    .single()

  if (companyError || !company) {
    notFound()
  }

  const { data: { user } } = await supabase.auth.getUser()
  let isPremium = false

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("mysql_user_id, is_premium")
      .eq("id", user.id)
      .single()

    if (profile) {
      if (profile.is_premium) {
        isPremium = true
      } else if (profile.mysql_user_id) {
        const { data: subscription } = await supabase
          .from("premium_subscriptions")
          .select("end_date")
          .eq("user_id", profile.mysql_user_id)
          .gt("end_date", new Date().toISOString())
          .limit(1)
          .maybeSingle()

        if (subscription) {
          isPremium = true
        }
      }
    }
  }

  let questionsQuery = supabase
    .from("Questions")
    .select("id, title, difficulty, question_type, premium_required")
    .eq("company_id", id)
    .order("id", { ascending: true })

  if (!isPremium) {
    questionsQuery = questionsQuery.limit(1)
  }

  const { data: questions } = await questionsQuery

  const formattedDate = new Date(company.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'hard': return 'text-red-400 bg-red-500/10 border-red-500/20'
      default: return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'coding': return 'Coding'
      case 'mcq': return 'MCQ'
      case 'sql': return 'SQL'
      case 'api': return 'API'
      default: return type
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 pt-24">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-neutral-800 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-neutral-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{company.name}</h1>
                {company.solutions_available && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                    Solutions Available
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-neutral-500 text-sm">
                <Calendar className="w-4 h-4" />
                <span>OA Date: {formattedDate}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{questions?.length || 0}</p>
              <p className="text-sm text-neutral-500">Questions</p>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-white mb-4">Problems</h2>
        
        <div className="space-y-3">
          {questions && questions.length > 0 ? (
            questions.map((question: Question, index: number) => (
              <div
                key={question.id}
                className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-neutral-600 text-sm font-mono w-8">{index + 1}.</span>
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-neutral-500" />
                      <span className="text-white font-medium">{question.title}</span>
                      {question.premium_required && (
                        <Lock className="w-3.5 h-3.5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 text-xs font-medium text-neutral-400 bg-neutral-800 rounded">
                      {getTypeLabel(question.question_type)}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-neutral-500">
              No questions found for this company.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
