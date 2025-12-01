'use client';

import React, { useState, useEffect } from 'react';
import { FaSearch, FaSpinner, FaBuilding, FaCalendar, FaRupeeSign, FaGraduationCap } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { API_ENDPOINTS, getApiHeaders } from '@/config/api';

interface PlacementData {
  id: number;
  college: string;
  company: string;
  role: string;
  oa_date: string;
  oa_time?: string;
  cgpa_criteria: string;
  mtech_eligible?: string;
  ctc_base: string;
  other_info?: string;
  created_at: string;
}

export default function PlacementDataPage() {
  const [placements, setPlacements] = useState<PlacementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async (search?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ action: 'get_all', limit: '100' });
      if (search) params.set('search', search);
      
      const response = await fetch(`${API_ENDPOINTS.PLACEMENT_DATA}?${params}`, {
        headers: getApiHeaders()
      });
      const data = await response.json();

      if (data.status === 'success') {
        setPlacements(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching placements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlacements(searchQuery);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Placement Data</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Stay updated with the latest placement drives and OA schedules from top companies
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
              placeholder="Search by company, college, or role..."
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

        {/* Placements Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-4xl text-gray-500" />
          </div>
        ) : placements.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No placement data found</p>
          </div>
        ) : (
          <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-[#0a0a0a] border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">College</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">OA Date</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">CGPA</th>
                    <th className="px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">CTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {placements.map((placement) => (
                    <tr key={placement.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                            <FaBuilding className="text-gray-400 text-sm" />
                          </div>
                          <span className="font-medium text-white">{placement.company}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2 text-gray-300">
                          <FaGraduationCap className="text-xs text-gray-500" />
                          <span className="text-sm">{placement.college}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-300">{placement.role}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2 text-gray-300">
                          <FaCalendar className="text-xs text-gray-500" />
                          <span className="text-sm">
                            {new Date(placement.oa_date).toLocaleDateString()}
                            {placement.oa_time && ` ${placement.oa_time}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                          {placement.cgpa_criteria}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-1 text-green-400">
                          <FaRupeeSign className="text-xs" />
                          <span className="text-sm font-medium">{placement.ctc_base}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
