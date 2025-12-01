'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaBuilding, FaCalendar, FaLock, FaUnlock, FaArrowRight, FaTimes, FaPlus, FaCrown } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { API_ENDPOINTS, getApiHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { encryptId } from '@/utils/encryption';

interface Company {
  id: number;
  name: string;
  question_count: number;
  date: string;
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { is_premium, loading: premiumLoading } = usePremium();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreCompanies, setHasMoreCompanies] = useState(true);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const pendingRequests = useRef(new Map());

  const fetchCompanies = useCallback(async (page = 1, limit = 100) => {
    const cacheKey = `companies_page_${page}_limit_${limit}`;
    const cached = sessionStorage.getItem(cacheKey);
    const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);

    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 15 * 60 * 1000) {
        return JSON.parse(cached);
      }
    }

    if (pendingRequests.current.has(cacheKey)) {
      return pendingRequests.current.get(cacheKey);
    }

    const requestPromise = (async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.COMPANY}?page=${page}&limit=${limit}`, {
          headers: getApiHeaders()
        });
        const data = await response.json();
        
        if (data.status === 'success' && Array.isArray(data.data)) {
          const result = {
            companies: data.data,
            hasMore: data.hasMore || false,
            total: data.total || data.data.length
          };
          sessionStorage.setItem(cacheKey, JSON.stringify(result));
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
          return result;
        }
        return { companies: [], hasMore: false, total: 0 };
      } catch (error) {
        console.error('Error fetching companies:', error);
        return { companies: [], hasMore: false, total: 0 };
      } finally {
        pendingRequests.current.delete(cacheKey);
      }
    })();

    pendingRequests.current.set(cacheKey, requestPromise);
    return requestPromise;
  }, []);

  const loadInitialCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchCompanies(1, 100);
      setAllCompanies(result.companies);
      setHasMoreCompanies(result.hasMore);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  }, [fetchCompanies]);

  const loadMoreCompanies = useCallback(async () => {
    if (loadingMore || !hasMoreCompanies) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const result = await fetchCompanies(nextPage, 100);
      if (result.companies.length > 0) {
        setAllCompanies(prev => [...prev, ...result.companies]);
        setHasMoreCompanies(result.hasMore);
        setCurrentPage(nextPage);
      } else {
        setHasMoreCompanies(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreCompanies, currentPage, fetchCompanies]);

  const handleSearch = useCallback(async () => {
    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch) {
      setLoading(true);
      try {
        const response = await fetch(`${API_ENDPOINTS.COMPANY}?action=search&q=${encodeURIComponent(trimmedSearch)}`, {
          headers: getApiHeaders()
        });
        const data = await response.json();
        if (data.status === 'success' && Array.isArray(data.data)) {
          setAllCompanies(data.data);
          setHasMoreCompanies(false);
          setActiveSearchTerm(trimmedSearch);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setActiveSearchTerm('');
      loadInitialCompanies();
    }
  }, [searchTerm, loadInitialCompanies]);

  useEffect(() => {
    loadInitialCompanies();
  }, [loadInitialCompanies]);

  const handleCompanyClick = useCallback((company: Company) => {
    const encryptedId = encryptId(company.id);
    router.push(`/company-questions?id=${encryptedId}`);
  }, [router]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      {/* Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px),
            linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '45px 45px',
          maskImage: 'linear-gradient(-20deg, transparent 50%, white)',
          WebkitMaskImage: 'linear-gradient(-20deg, transparent 50%, white)',
          zIndex: 1
        }}
      />

      <div className="relative z-10">
        <Navbar />

        {/* Tagline */}
        <div className="relative z-40 animate-fade-in mt-4">
          <div className="px-2 py-1">
            <p className="text-3xl md:text-5xl text-white/90 text-center font-handwriting">
              Karlo DSA kahin se, Question ayenge yhi se.
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="mb-12 relative z-10">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white mb-8 leading-tight">
              Practice OA Questions<br />
              from Top Companies.
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
              Exclusive collection of real online assessment questions and detailed solutions to help you ace your next OA.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-24">
            <div className="relative group">
              <div className="absolute -inset-1 bg-white/5 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative flex items-center bg-[#161616] border border-white/10 rounded-full p-2 transition-all duration-300 hover:border-white/20">
                <div className="pl-6 pr-4 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search companies..."
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-gray-500 text-lg h-12"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setActiveSearchTerm('');
                      loadInitialCompanies();
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2"
                  >
                    <FaTimes className="text-gray-400 text-sm" />
                  </button>
                )}
                <button
                  onClick={handleSearch}
                  className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors text-base"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Request Company */}
            <div className="mt-8 flex justify-center">
              {isAuthenticated() ? (
                is_premium ? (
                  <button className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 text-sm font-medium">
                    <FaPlus className="text-xs" />
                    <span>Request a specific company</span>
                  </button>
                ) : (
                  <Link href="/premium" className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 text-sm font-medium">
                    <FaCrown className="text-xs text-yellow-400" />
                    <span>Get Premium to request companies</span>
                  </Link>
                )
              ) : (
                <Link href="/login" className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2 text-sm font-medium">
                  <FaPlus className="text-xs" />
                  <span>Login to request companies</span>
                </Link>
              )}
            </div>
          </div>

          {/* Companies Table */}
          <div className="max-w-6xl mx-auto">
            {activeSearchTerm && (
              <div className="mb-6 text-left">
                <p className="text-gray-400 text-sm">
                  Showing results for &quot;{activeSearchTerm}&quot; ({allCompanies.length} companies)
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : allCompanies.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg mb-4">No companies found</p>
                {activeSearchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setActiveSearchTerm('');
                      loadInitialCompanies();
                    }}
                    className="text-white hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#0a0a0a] border-b border-white/10">
                        <tr>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Date</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Questions</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Status</th>
                          <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allCompanies.map((company) => {
                          const isCompanyLocked = premiumLoading ? false : (company.question_count <= 2 && !is_premium);
                          
                          return (
                            <tr
                              key={company.id}
                              onClick={() => isCompanyLocked ? router.push('/premium') : handleCompanyClick(company)}
                              className={`group border-b border-white/5 last:border-0 transition-colors duration-200 cursor-pointer
                                ${isCompanyLocked ? 'bg-amber-900/5 hover:bg-amber-900/10' : 'hover:bg-white/5'}`}
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-inner ${
                                    isCompanyLocked ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-white group-hover:bg-white/10'
                                  }`}>
                                    <FaBuilding className="text-sm" />
                                  </div>
                                  <h3 className="text-base font-bold text-white group-hover:text-white/90 transition-colors line-clamp-1">
                                    {company.name}
                                  </h3>
                                </div>
                              </td>
                              <td className="py-4 px-6 hidden md:table-cell">
                                <div className="flex items-center text-sm font-medium text-gray-500">
                                  <FaCalendar className="mr-2 opacity-50" />
                                  {formatDate(company.date)}
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5">
                                  <span className="text-sm font-bold text-white">{company.question_count}</span>
                                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Qs</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                {isCompanyLocked ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <FaLock className="mr-1.5 text-[10px]" /> Premium
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <FaUnlock className="mr-1.5 text-[10px]" /> Available
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300
                                  ${isCompanyLocked
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 group-hover:bg-amber-500 group-hover:text-black'
                                    : 'bg-white/5 border-white/10 text-white group-hover:bg-white group-hover:text-black'
                                  }`}>
                                  {isCompanyLocked ? (
                                    <FaCrown className="text-xs" />
                                  ) : (
                                    <FaArrowRight className="text-xs -rotate-45 group-hover:rotate-0 transition-transform" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Load More */}
                {hasMoreCompanies && !activeSearchTerm && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={loadMoreCompanies}
                      disabled={loadingMore}
                      className="px-8 py-3 bg-white/5 text-white rounded-full border border-white/10 hover:bg-white/10 transition-colors font-medium disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : 'Load More Companies'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <Footer />
      </div>

      <style jsx>{`
        .font-handwriting {
          font-family: 'Caveat', cursive;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
