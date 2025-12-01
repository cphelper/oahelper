'use client';

import React, { useState, useEffect } from 'react';
import { FaSpinner, FaBuilding, FaChartLine, FaThumbsUp } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { API_ENDPOINTS, getApiHeaders } from '@/config/api';

interface CompanyInsight {
  id: number;
  company_name: string;
  canonical_name: string;
  question_count: number;
  insight_text: string;
  topics: string[];
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  likes: number;
  created_at: string;
}

export default function CompanyInsightsPage() {
  const [insights, setInsights] = useState<CompanyInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<CompanyInsight | null>(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.COMPANY_INSIGHTS}?limit=50`, {
        headers: getApiHeaders()
      });
      const data = await response.json();

      if (data.status === 'success') {
        setInsights(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-6">
            <FaChartLine className="text-yellow-400" />
            <span className="text-yellow-300 text-sm font-medium">AI-Powered Insights</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Company Insights</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AI-generated analysis of company assessment patterns, common topics, and difficulty trends
          </p>
        </div>

        {/* Insights Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-4xl text-gray-500" />
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No insights available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map((insight) => (
              <div
                key={insight.id}
                onClick={() => setSelectedInsight(insight)}
                className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-yellow-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                      <FaBuilding className="text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{insight.company_name}</h3>
                      <p className="text-sm text-gray-400">{insight.question_count} questions analyzed</p>
                    </div>
                  </div>
                </div>

                {/* Difficulty Distribution */}
                {insight.difficulty_distribution && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex-1 h-2 bg-[#222] rounded-full overflow-hidden">
                        <div className="h-full flex">
                          <div 
                            className="bg-green-500" 
                            style={{ width: `${insight.difficulty_distribution.easy}%` }}
                          />
                          <div 
                            className="bg-yellow-500" 
                            style={{ width: `${insight.difficulty_distribution.medium}%` }}
                          />
                          <div 
                            className="bg-red-500" 
                            style={{ width: `${insight.difficulty_distribution.hard}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span className="text-green-400">Easy {insight.difficulty_distribution.easy}%</span>
                      <span className="text-yellow-400">Medium {insight.difficulty_distribution.medium}%</span>
                      <span className="text-red-400">Hard {insight.difficulty_distribution.hard}%</span>
                    </div>
                  </div>
                )}

                {/* Topics */}
                {insight.topics && insight.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {insight.topics.slice(0, 4).map((topic, index) => (
                      <span key={index} className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded border border-white/10">
                        {topic}
                      </span>
                    ))}
                    {insight.topics.length > 4 && (
                      <span className="px-2 py-1 text-gray-500 text-xs">
                        +{insight.topics.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <FaThumbsUp className="text-xs" />
                    <span className="text-sm">{insight.likes || 0} helpful</span>
                  </div>
                  <span className="text-yellow-400 text-sm font-medium group-hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Insight Modal */}
        {selectedInsight && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#111] border border-white/10 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                      <FaBuilding className="text-yellow-400 text-xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedInsight.company_name}</h2>
                      <p className="text-gray-400">{selectedInsight.question_count} questions analyzed</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedInsight(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Difficulty Distribution */}
                {selectedInsight.difficulty_distribution && (
                  <div className="bg-white/5 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Difficulty Distribution</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 h-4 bg-[#222] rounded-full overflow-hidden">
                        <div className="h-full flex">
                          <div 
                            className="bg-green-500" 
                            style={{ width: `${selectedInsight.difficulty_distribution.easy}%` }}
                          />
                          <div 
                            className="bg-yellow-500" 
                            style={{ width: `${selectedInsight.difficulty_distribution.medium}%` }}
                          />
                          <div 
                            className="bg-red-500" 
                            style={{ width: `${selectedInsight.difficulty_distribution.hard}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-green-400">Easy: {selectedInsight.difficulty_distribution.easy}%</span>
                      <span className="text-yellow-400">Medium: {selectedInsight.difficulty_distribution.medium}%</span>
                      <span className="text-red-400">Hard: {selectedInsight.difficulty_distribution.hard}%</span>
                    </div>
                  </div>
                )}

                {/* Topics */}
                {selectedInsight.topics && selectedInsight.topics.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Common Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedInsight.topics.map((topic, index) => (
                        <span key={index} className="px-3 py-1.5 bg-white/5 text-gray-300 text-sm rounded-lg border border-white/10">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Insight */}
                {selectedInsight.insight_text && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">AI Analysis</h3>
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                      <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {selectedInsight.insight_text}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
