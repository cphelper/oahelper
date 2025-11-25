import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { CompanyCard } from "@/components/company-card"

interface Company {
  id: number
  name: string
  date: string
  solutions_available: boolean
  total_questions: number
}

async function getCompanies(): Promise<Company[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .rpc('get_companies_with_question_count')
  
  if (error) {
    // Fallback: fetch companies without question count
    const { data: companies } = await supabase
      .from('Companies')
      .select('id, name, date, solutions_available')
      .order('date', { ascending: false })
    
    return (companies || []).map(c => ({ ...c, total_questions: 0 }))
  }
  
  return data || []
}

export default async function Home() {
  const companies = await getCompanies()

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                id={company.id}
                name={company.name}
                date={company.date}
                totalQuestions={company.total_questions}
                solutionsAvailable={company.solutions_available}
              />
            ))}
          </div>
          
          {companies.length === 0 && (
            <div className="text-center py-20">
              <p className="text-neutral-500">No companies found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
