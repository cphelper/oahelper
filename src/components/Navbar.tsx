'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FaBars, FaTimes, FaBug, FaCode, FaSignOutAlt, 
  FaCrown, FaCoins, FaChevronDown, FaSpinner, FaSync,
  FaChartLine
} from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { usePremium } from '@/contexts/PremiumContext';
import { API_ENDPOINTS, getApiHeaders } from '@/config/api';
import ProfileAvatar from './ProfileAvatar';

interface NavbarProps {
  showSpacer?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ showSpacer = true }) => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { is_premium } = usePremium();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issue, setIssue] = useState('');
  const [oacoins, setOacoins] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const issueFormRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch OAcoins
  const fetchOAcoins = async () => {
    if (!isAuthenticated() || !user?.id) return;

    try {
      const response = await fetch(API_ENDPOINTS.OACOINS, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'get_balance',
          user_id: user.id
        })
      });
      const data = await response.json();

      if (data.status === 'success') {
        setOacoins(data.oacoins || 0);
      }
    } catch (error) {
      console.error('Error fetching OAcoins:', error);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await fetchOAcoins();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (isAuthenticated() && user?.id) {
      fetchOAcoins();
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showIssueForm && issueFormRef.current && !issueFormRef.current.contains(event.target as Node)) {
        setShowIssueForm(false);
      }
      if (showUserDropdown && userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showIssueForm, showUserDropdown]);

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'submit_issue',
          issue: issue,
          page_url: window.location.href,
          user_id: user?.id || null
        })
      });
      const data = await response.json();

      if (data.status === 'success') {
        setShowIssueForm(false);
        setIssue('');
        alert('Issue submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      alert('Failed to submit issue. Please try again.');
    }
  };

  return (
    <>
      <nav className={`fixed w-full top-0 z-50 transition-all duration-500
        ${isScrolled
          ? 'backdrop-blur-2xl bg-[#030303]/80 border-b border-white/[0.06]'
          : 'backdrop-blur-md bg-transparent border-b border-white/[0.02]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0 mr-8">
              <Link href="/" className="text-2xl font-bold tracking-tight flex items-center gap-2 text-white">
                OA<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Helper</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-3 rounded-full text-gray-400 hover:text-white hover:bg-white/5"
              >
                {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 flex-1 justify-end">
              <div className="flex items-center bg-white/[0.03] backdrop-blur-lg rounded-full border border-white/[0.06] p-1.5 space-x-1">
                <Link
                  href="/company-insights"
                  className="flex items-center space-x-2 px-4 py-2 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/10 rounded-full transition-all"
                >
                  <FaChartLine className="text-xs" />
                  <span className="text-sm font-medium">Company Insights</span>
                </Link>

                <Link
                  href="/placement-data"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <span className="text-sm font-medium">Placement Data</span>
                </Link>

                <Link
                  href="/interview-experiences"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <span className="text-sm font-medium">Interview Experiences</span>
                </Link>

                <div className="w-px h-5 bg-white/10 mx-2"></div>

                <Link
                  href="/dsa-sheet"
                  className="flex items-center space-x-2 px-4 py-2 text-blue-300 hover:text-white hover:bg-blue-500/10 rounded-full transition-all"
                >
                  <FaCode className="text-xs" />
                  <span className="text-sm font-medium">DSA Sheet</span>
                </Link>

                {/* Report Issue */}
                <div className="relative" ref={issueFormRef}>
                  <button
                    onClick={() => setShowIssueForm(!showIssueForm)}
                    className="flex items-center space-x-2 px-4 py-2 text-rose-300 hover:text-white hover:bg-rose-500/10 rounded-full transition-all"
                  >
                    <FaBug className="text-xs" />
                    <span className="text-sm font-medium">Report Issue</span>
                  </button>

                  {showIssueForm && (
                    <div className="absolute top-full mt-4 right-0 w-96 backdrop-blur-2xl bg-[#0a0a0a]/95 rounded-[2rem] border border-white/10 shadow-2xl p-6 z-50">
                      <h3 className="text-white font-bold text-lg mb-1">Report an Issue</h3>
                      <p className="text-gray-400 text-sm mb-4">Help us improve by reporting bugs</p>
                      <form onSubmit={handleIssueSubmit} className="space-y-4">
                        <textarea
                          value={issue}
                          onChange={(e) => setIssue(e.target.value)}
                          placeholder="Describe the issue..."
                          className="w-full px-4 py-3 bg-white/5 text-white rounded-2xl border border-white/10 focus:border-rose-500/30 resize-none h-32 text-sm"
                        />
                        <div className="flex space-x-3">
                          <button type="submit" className="flex-1 py-2.5 bg-white text-black rounded-full hover:bg-gray-200 font-semibold text-sm">
                            Submit
                          </button>
                          <button type="button" onClick={() => setShowIssueForm(false)} className="px-6 py-2.5 bg-white/5 text-gray-300 rounded-full hover:bg-white/10 text-sm">
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                {isAuthenticated() && !is_premium && (
                  <Link
                    href="/premium"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-300 hover:text-white rounded-full transition-all border border-yellow-500/20"
                  >
                    <FaCrown className="text-xs" />
                    <span className="text-sm font-semibold">Get Premium</span>
                  </Link>
                )}
              </div>

              {/* Auth Section */}
              {isAuthenticated() ? (
                <div className="flex items-center space-x-3 ml-2">
                  <div className={`flex items-center space-x-1 rounded-full border p-1.5 transition-all ${
                    is_premium
                      ? 'bg-gradient-to-r from-yellow-500/5 to-amber-500/5 border-yellow-500/20'
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="relative" ref={userDropdownRef}>
                      <button
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                        className={`flex items-center space-x-3 px-2 py-1 rounded-full transition-all ${
                          is_premium ? 'text-yellow-300 hover:text-yellow-200' : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        <ProfileAvatar name={user?.name || ''} size="sm" />
                        <span className="text-sm font-medium pr-1">{user?.name}</span>
                        {is_premium && <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>}
                        <FaChevronDown className={`text-xs transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {showUserDropdown && (
                        <div className="absolute top-full mt-4 right-0 w-72 backdrop-blur-2xl bg-[#0a0a0a]/95 rounded-[2rem] border border-white/10 shadow-2xl p-4 z-50">
                          <div className="px-2 py-2 border-b border-white/5 mb-3">
                            <div className="flex items-center space-x-4 mb-4">
                              <ProfileAvatar name={user?.name || ''} size="lg" />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-bold truncate">{user?.name}</p>
                                <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                              </div>
                            </div>

                            {/* OAcoins */}
                            <div className="flex items-center justify-between bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                              <div className="flex items-center space-x-2">
                                <FaCoins className="text-amber-400" />
                                <span className="text-amber-300 font-bold">{oacoins}</span>
                                <span className="text-amber-400/60 text-xs">OAcoins</span>
                              </div>
                              <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                              >
                                <FaSync className={`text-amber-400 text-xs ${isRefreshing ? 'animate-spin' : ''}`} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Link
                              href="/dashboard"
                              className="flex items-center space-x-3 px-3 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                              onClick={() => setShowUserDropdown(false)}
                            >
                              <span className="text-sm">Dashboard</span>
                            </Link>
                            <button
                              onClick={() => {
                                logout();
                                setShowUserDropdown(false);
                                router.push('/');
                              }}
                              className="w-full flex items-center space-x-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                              <FaSignOutAlt className="text-sm" />
                              <span className="text-sm">Logout</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 ml-2">
                  <Link
                    href="/login"
                    className="px-5 py-2 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors text-sm font-bold"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10">
            <div className="px-4 py-6 space-y-4">
              <Link href="/company-insights" className="block px-4 py-3 text-yellow-300 hover:bg-white/5 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Company Insights
              </Link>
              <Link href="/placement-data" className="block px-4 py-3 text-gray-300 hover:bg-white/5 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Placement Data
              </Link>
              <Link href="/interview-experiences" className="block px-4 py-3 text-gray-300 hover:bg-white/5 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                Interview Experiences
              </Link>
              <Link href="/dsa-sheet" className="block px-4 py-3 text-blue-300 hover:bg-white/5 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                DSA Sheet
              </Link>
              
              {isAuthenticated() ? (
                <>
                  <Link href="/dashboard" className="block px-4 py-3 text-gray-300 hover:bg-white/5 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { logout(); setIsMenuOpen(false); router.push('/'); }}
                    className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-4 py-3 text-gray-300 hover:bg-white/5 rounded-xl" onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/signup" className="block px-4 py-3 bg-white text-black rounded-xl text-center font-bold" onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      
      {showSpacer && <div className="h-20" />}
    </>
  );
};

export default Navbar;
