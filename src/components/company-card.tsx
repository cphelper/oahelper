import Link from "next/link"
import { Calendar, Building2 } from "lucide-react"

interface CompanyCardProps {
  id: number
  name: string
  date: string
  totalQuestions: number
  solutionsAvailable: boolean
}

export function CompanyCard({ id, name, date, totalQuestions, solutionsAvailable }: CompanyCardProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-neutral-400" />
        </div>
        {solutionsAvailable && (
          <span className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
            ✓ AVAILABLE
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{name}</h3>
      
      <div className="flex items-center gap-1.5 text-neutral-500 text-sm mb-5">
        <Calendar className="w-4 h-4" />
        <span>{formattedDate}</span>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider">Total Questions</p>
          <p className="text-xs text-neutral-600">OA Problems</p>
        </div>
        <span className="text-3xl font-bold text-white">{totalQuestions}</span>
      </div>

      <Link 
        href={`/company/${id}`}
        className="flex items-center justify-center gap-2 w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        View Problems
        <span>→</span>
      </Link>
    </div>
  )
}
