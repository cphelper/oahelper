'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaBuilding, FaArrowLeft, FaLock, FaEye, FaCode, FaCrown, FaSpinner } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { API_ENDPOINTS, getApiHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { decryptId, encryptId } from '@/utils/encryption';

interface Company {
  id: number;
  name: string;
  question_count: number;
  date: string;
}

interface Question {
  id: number;
  title: string;
  premium_required: boolean;
  lc_level?: string;
  primary_topic?: string;
}

function CompanyQuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { is_premium, loading: premiumLoading } = usePremium();

  const [company, setCompany] = useState<Company | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const encryptedId = searchParams.get('id');
    if (encryptedId) {
      const companyId = decryptId(encryptedId);
      if (companyId) {
        fetchCompanyData(companyId);
      } else {
        setError('Invalid company ID');
        setLoading(false);
      }
    } else {
      setError('No company ID provided');
      setLoading(false);
    }
  }, [searchParams]);

  const fetchCompanyData = async (companyId: number) => {
    try {
      setLoading(true);
      
      // Fetch company details
      const companyResponse = await fetch(`${API_ENDPOINTS.COMPANY}?id=${companyId}`, {
        headers: getApiHeaders()
      });
      const companyData = await companyResponse.json();

      if (companyData.status === 'success') {
        setCompany(companyData.data);
      } else {
        setError('Company not found');
        return;
      }

      // Fetch questions
      const questionsResponse = await fetch(`/api/questions?action=get_questions_by_company&company_id=${companyId}`, {
        headers: getApiHeaders()
      });
      const questionsData = await questionsResponse.json();

      if (questionsData.status === 'success') {
        setQuestions(questionsData.data || []);
      }
    } catch (err) {
      console.error('Error fetching company data:', err);
      setError('Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-900/30 border-green-800/50';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50';
      case 'hard': return 'text-red-400 bg-red-900/30 border-red-800/50';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-800/50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-4xl text-gray-500" />
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">{error || 'Company not found'}</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-gray-200"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <FaArrowLeft />
          <span>Back to Companies</span>
        </button>

        {/* Company Header */}
        <div className="bg-[#111] border border-white/10 rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center">
              <FaBuilding className="text-2xl text-gray-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{company.name}</h1>
              <p className="text-gray-400">{company.question_count} questions available</p>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Questions</h2>
          </div>

          {questions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">No questions available for this company yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {questions.map((question, index) => {
                const needsPremium = !is_premium && question.premium_required;

                return (
                  <div
                    key={question.id}
                    className="p-6 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          {question.lc_level && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getDifficultyColor(question.lc_level)}`}>
                              {question.lc_level}
                            </span>
                          )}
                          {needsPremium && (
                            <span className="flex items-center space-x-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full text-xs border border-yellow-500/20">
                              <FaLock className="text-[10px]" />
                              <span>Premium</span>
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">{question.title}</h3>
                        {question.primary_topic && (
                          <span className="text-sm text-gray-500">{question.primary_topic}</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {needsPremium ? (
                          <Link
                            href="/premium"
                            className="flex items-center space-x-2 px-4 py-2 bg-yellow-500/10 text-yellow-400 rounded-full text-sm font-medium border border-yellow-500/20 hover:bg-yellow-500/20"
                          >
                            <FaCrown className="text-xs" />
                            <span>Get Premium</span>
                          </Link>
                        ) : (
                          <>
                            <Link
                              href={`/questions/${encryptId(question.id)}?company_id=${encryptId(company.id)}`}
                              className="flex items-center space-x-1 px-3 py-2 bg-white/5 text-white rounded-full text-sm font-medium border border-white/10 hover:bg-white/10"
                            >
                              <FaEye className="text-xs" />
                              <span>View</span>
                            </Link>
                            <Link
                              href={`/question-with-editor/${encryptId(question.id)}?company_id=${encryptId(company.id)}`}
                              className="flex items-center space-x-1 px-3 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-gray-200"
                            >
                              <FaCode className="text-xs" />
                              <span>Solve</span>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function CompanyQuestionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-4xl text-gray-500" />
        </div>
      </div>
    }>
      <CompanyQuestionsContent />
    </Suspense>
  );
}
