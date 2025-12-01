'use client';

import React, { useState, useEffect } from 'react';
import { FaSearch, FaSpinner, FaBuilding, FaCalendar, FaBriefcase, FaGraduationCap } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { API_ENDPOINTS, getApiHeaders } from '@/config/api';

interface Experience {
  id: number;
  company: string;
  role: string;
  college: string;
  interview_date: string;
  interview_type: string;
  result: string;
  difficulty: string;
  rounds: string;
  topics_asked: string;
  experience: string;
  created_at: string;
}

export default function InterviewExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async (search?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ action: 'get_all', limit: '50' });
      if (search) params.set('search', search);
      
      const response = await fetch(`${API_ENDPOINTS.INTERVIEW_EXPERIENCES}?${params}`, {
        headers: getApiHeaders()
      });
      const data = await response.json();

      if (data.status === 'success') {
        setExperiences(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExperiences(searchQuery);
  };

  const getResultColor = (result: string) => {
    switch (result?.toLowerCase()) {
      case 'selected': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Interview Experiences</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Learn from real interview experiences shared by candidates from top companies
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
          <div className="relative flex items-center bg-[#111] border border-white/10 rounded-full p-2">
            <div className="pl-4 pr-2 text-gray-400">
              <FaSearch />
            </div>
            <input
              type="text"
              placeholder="Search by company, role, or college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-white placeholder-gray-500 text-base h-10"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Experiences List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-4xl text-gray-500" />
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No experiences found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                onClick={() => setSelectedExperience(exp)}
                className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                      <FaBuilding className="text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{exp.company}</h3>
                      <p className="text-sm text-gray-400">{exp.role}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getResultColor(exp.result)}`}>
                    {exp.result}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-400 mb-4">
                  <div className="flex items-center space-x-2">
                    <FaGraduationCap className="text-xs" />
                    <span>{exp.college}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaCalendar className="text-xs" />
                    <span>{new Date(exp.interview_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaBriefcase className="text-xs" />
                    <span>{exp.interview_type}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${getDifficultyColor(exp.difficulty)}`}>
                    {exp.difficulty} Difficulty
                  </span>
                  <span className="text-xs text-gray-500">{exp.rounds} rounds</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Experience Modal */}
        {selectedExperience && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#111] border border-white/10 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{selectedExperience.company}</h2>
                    <p className="text-gray-400">{selectedExperience.role}</p>
                  </div>
                  <button
                    onClick={() => setSelectedExperience(null)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">College</p>
                    <p className="text-white font-medium">{selectedExperience.college}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Date</p>
                    <p className="text-white font-medium">{new Date(selectedExperience.interview_date).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="text-white font-medium">{selectedExperience.interview_type}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Result</p>
                    <p className={`font-medium ${selectedExperience.result === 'Selected' ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedExperience.result}
                    </p>
                  </div>
                </div>

                {selectedExperience.topics_asked && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Topics Asked</h3>
                    <p className="text-white">{selectedExperience.topics_asked}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Experience</h3>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedExperience.experience}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
