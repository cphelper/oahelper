'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaFilter, FaSearch, FaCode, FaClock, FaFire, FaEye, FaCheckCircle, FaTimesCircle, FaCrown } from 'react-icons/fa';
import { API_ENDPOINTS, getApiHeaders } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { encryptId } from '@/utils/encryption';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface Question {
  id: number;
  title: string;
  company_id: number;
  company_name: string;
  lc_level: string;
  dsasheet_section: string;
  primary_topic: string;
  topics: string[];
  problem_statement?: string;
}

export default function DSASheetPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { is_premium, loading: premiumLoading } = usePremium();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
  const sections = [
    'All', 'Arrays & Hashing', 'Two Pointers', 'Sliding Window', 'Stack/Queue',
    'Binary Search', 'Linked List', 'Tree', 'Graph', 'Heap/Priority Queue',
    'Backtracking/Recursion', 'Greedy', 'Intervals', 'DP (1D/2D/Knapsack/LIS)',
    'Trie', 'Bit Manipulation', 'Math/Geometry', 'Union-Find (DSU)',
    'Monotonic Stack', 'Segment/Fenwick Tree', 'Design', 'Topo Sort', 'Shortest Path'
  ];

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [questions, selectedDifficulty, selectedTopic, selectedSection, searchQuery]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.DSA_SHEET}?action=get_dsa_sheet_questions`, {
        headers: getApiHeaders()
      });
      const data = await response.json();

      if (data.status === 'success') {
        setQuestions(data.data);
        const topics = new Set<string>();
        data.data.forEach((q: Question) => {
          if (q.topics && Array.isArray(q.topics)) {
            q.topics.forEach(topic => topics.add(topic));
          }
          if (q.primary_topic) {
            topics.add(q.primary_topic);
          }
        });
        setAvailableTopics(['All', ...Array.from(topics).sort()]);
      } else {
        setError(data.message || 'Failed to fetch questions');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = [...questions];

    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(q => q.lc_level === selectedDifficulty);
    }

    if (selectedTopic !== 'All') {
      filtered = filtered.filter(q => {
        if (q.primary_topic === selectedTopic) return true;
        if (q.topics && Array.isArray(q.topics)) {
          return q.topics.includes(selectedTopic);
        }
        return false;
      });
    }

    if (selectedSection !== 'All') {
      filtered = filtered.filter(q => q.dsasheet_section === selectedSection);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q =>
        q.title.toLowerCase().includes(query) ||
        (q.problem_statement && q.problem_statement.toLowerCase().includes(query))
      );
    }

    setFilteredQuestions(filtered);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'Easy': return 'text-green-400 bg-green-900/30 border-green-800/50';
      case 'Medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50';
      case 'Hard': return 'text-red-400 bg-red-900/30 border-red-800/50';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-800/50';
    }
  };

  const getDifficultyIcon = (level: string) => {
    switch (level) {
      case 'Easy': return <FaCheckCircle className="text-green-400" />;
      case 'Medium': return <FaClock className="text-yellow-400" />;
      case 'Hard': return <FaFire className="text-red-400" />;
      default: return <FaCode className="text-gray-400" />;
    }
  };

  const resetFilters = () => {
    setSelectedDifficulty('All');
    setSelectedTopic('All');
    setSelectedSection('All');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="text-center py-20">
          <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Error Loading DSA Sheet</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={fetchQuestions} className="px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 font-medium">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navbar />
      <div className="pt-8 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">
              Curated DSA Practice Sheet
            </h1>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
              Master Data Structures and Algorithms with our curated collection of {questions.length} problems.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6 justify-center">
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#111] text-white rounded-full border border-[#333] focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all placeholder-gray-600 outline-none"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-full border transition-all ${showFilters ? 'bg-white text-black border-white' : 'bg-transparent text-white border-[#333] hover:bg-white/5'}`}
              >
                <FaFilter className="text-sm" />
                <span>Filters</span>
              </button>

              <button onClick={resetFilters} className="px-6 py-3 text-gray-400 hover:text-white transition-colors font-medium">
                Clear All
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-[#111] rounded-2xl border border-[#333]">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Difficulty</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full px-4 py-3 bg-black text-white rounded-xl border border-[#333] focus:border-white/30 outline-none"
                  >
                    {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Topic</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full px-4 py-3 bg-black text-white rounded-xl border border-[#333] focus:border-white/30 outline-none"
                  >
                    {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Section</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-4 py-3 bg-black text-white rounded-xl border border-[#333] focus:border-white/30 outline-none"
                  >
                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="mb-6 px-2">
            <p className="text-gray-500 text-sm font-medium">
              Showing <span className="text-white">{filteredQuestions.length}</span> of <span className="text-white">{questions.length}</span> questions
            </p>
          </div>

          {/* Questions Table */}
          <div className={`relative ${!isAuthenticated() ? 'blur-sm pointer-events-none' : ''}`}>
            <div className="bg-[#111] rounded-2xl border border-[#333] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left">
                  <thead className="bg-[#0a0a0a] border-b border-[#333]">
                    <tr>
                      <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</th>
                      <th className="px-4 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Difficulty</th>
                      <th className="px-4 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Section</th>
                      <th className="px-4 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Topics</th>
                      <th className="px-4 py-5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {filteredQuestions.map((question) => {
                      const topics = question.topics && Array.isArray(question.topics) ? question.topics :
                        (question.primary_topic ? [question.primary_topic] : []);

                      return (
                        <tr key={question.id} className="hover:bg-[#1a1a1a] transition-colors group">
                          <td className="px-6 py-4">
                            <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                              {question.title}
                            </h3>
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-3 py-1 bg-[#222] text-gray-300 text-xs rounded-full border border-[#333]">
                              {question.company_name || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(question.lc_level)}`}>
                              {getDifficultyIcon(question.lc_level)}
                              <span className="ml-2">{question.lc_level || 'N/A'}</span>
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {question.dsasheet_section ? (
                              <span className="px-3 py-1 bg-[#222] text-gray-300 text-xs rounded-full border border-[#333]">
                                {question.dsasheet_section}
                              </span>
                            ) : (
                              <span className="text-gray-600 text-xs">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                              {topics.slice(0, 3).map((topic, index) => (
                                <span key={index} className="px-2 py-1 bg-[#222] text-gray-400 text-xs rounded border border-[#333]">
                                  {topic}
                                </span>
                              ))}
                              {topics.length > 3 && (
                                <span className="px-2 py-1 bg-[#222] text-gray-500 text-xs rounded border border-[#333]">
                                  +{topics.length - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center">
                              {isAuthenticated() && !premiumLoading && !is_premium ? (
                                <button
                                  onClick={() => router.push('/premium')}
                                  className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-full hover:bg-gray-200 text-xs font-semibold"
                                >
                                  <FaCrown className="text-sm" />
                                  <span>Premium</span>
                                </button>
                              ) : (
                                <div className="flex items-center justify-center space-x-2">
                                  <Link
                                    href={`/questions/${encryptId(question.id)}?company_id=${encryptId(question.company_id)}`}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-transparent text-white rounded-full border border-[#333] hover:bg-[#333] text-xs font-medium"
                                  >
                                    <FaEye className="text-xs" />
                                    <span>View</span>
                                  </Link>
                                  <Link
                                    href={`/question-with-editor/${encryptId(question.id)}?company_id=${encryptId(question.company_id)}`}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-white text-black rounded-full hover:bg-gray-200 text-xs font-bold"
                                  >
                                    <FaCode className="text-xs" />
                                    <span>Solve</span>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* No Results */}
          {filteredQuestions.length === 0 && (
            <div className="text-center py-20">
              <FaSearch className="text-gray-500 text-3xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No questions found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters</p>
              <button onClick={resetFilters} className="px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 text-sm font-medium">
                Clear Filters
              </button>
            </div>
          )}

          {/* Login Prompt */}
          {!isAuthenticated() && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#111] border border-[#333] p-8 max-w-lg w-full shadow-2xl rounded-3xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#222] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#333]">
                    <FaEye className="text-white text-2xl" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3">Login Required</h3>
                  <p className="text-gray-400 text-base mb-8">
                    Join now to access our curated collection and track progress.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/login" className="flex-1 bg-white text-black rounded-full py-3 px-6 text-sm font-bold hover:bg-gray-200 text-center">
                      Login to Continue
                    </Link>
                    <Link href="/signup" className="flex-1 bg-transparent text-white rounded-full py-3 px-6 text-sm font-medium border border-[#333] hover:bg-white/5 text-center">
                      Create Account
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
