import Link from "next/link"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-white font-semibold text-lg">
          OA Helper
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-neutral-400 hover:text-white text-sm transition-colors">
            DSA Sheet
          </Link>
          <Link href="/" className="text-neutral-400 hover:text-white text-sm transition-colors">
            Placement Data
          </Link>
          <Link href="/" className="text-neutral-400 hover:text-white text-sm transition-colors">
            Interview Experiences
          </Link>
          <Link href="/" className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors flex items-center gap-1">
            ✨ Upload Your Question
          </Link>
          <Link href="/" className="text-red-400 hover:text-red-300 text-sm transition-colors flex items-center gap-1">
            🚨 Report Issue
          </Link>
        </nav>

        <Link 
          href="/login"
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-full transition-colors"
        >
          Sign In
        </Link>
      </div>
    </header>
  )
}
