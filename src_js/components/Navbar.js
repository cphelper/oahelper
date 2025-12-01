// src/components/Navbar.js

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes, FaBug, FaHeart, FaCode, FaSignInAlt, FaSignOutAlt, FaUser, FaPaperPlane, FaClock, FaCrown, FaBookmark, FaFileCode, FaListAlt, FaWhatsapp, FaCoins, FaUserCircle, FaChevronDown, FaSpinner, FaCheck, FaSync, FaBriefcase, FaCheckCircle, FaChartLine } from 'react-icons/fa';
import UserUploadQuestion from './UserUploadQuestion';
import ProfileAvatar from './ProfileAvatar';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';

const Navbar = ({ showSpacer = true }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { is_premium } = usePremium();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issue, setIssue] = useState('');
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [requestCount, setRequestCount] = useState({ request_count: 0, remaining_requests: 3 });
  const [hasSeenNewFeatures, setHasSeenNewFeatures] = useState(false);
  const [activationTimeRemaining, setActivationTimeRemaining] = useState(null);
  const [oacoins, setOacoins] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showExtendPremiumModal, setShowExtendPremiumModal] = useState(false);
  const [extendDays, setExtendDays] = useState(1);
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendError, setExtendError] = useState('');
  const [extendSuccess, setExtendSuccess] = useState('');
  const [showEarnCoinsModal, setShowEarnCoinsModal] = useState(false);
  const issueFormRef = useRef(null);
  const activationTimerRef = useRef(null);
  const userDropdownRef = useRef(null);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  // Request deduplication and caching
  const pendingOAcoinsRequest = useRef(null);
  const pendingRequestCountRequest = useRef(null);
  const pendingSolvedCountRequest = useRef(null);

  // Function to fetch user's OAcoins balance with caching
  const fetchOAcoins = async () => {
    if (!isAuthenticated() || !user?.id) return;

    // Check cache first (2 minute cache)
    const cacheKey = `oacoins_${user.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);

    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 2 * 60 * 1000) { // 2 minutes
        setOacoins(parseInt(cached));
        return;
      }
    }

    // Prevent duplicate requests
    if (pendingOAcoinsRequest.current) {
      return pendingOAcoinsRequest.current;
    }

    pendingOAcoinsRequest.current = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(API_ENDPOINTS.OACOINS, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            action: 'get_balance',
            user_id: user.id
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (data.status === 'success') {
          const balance = data.oacoins || 0;
          setOacoins(balance);

          // Cache the result
          sessionStorage.setItem(cacheKey, balance.toString());
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        }
      } catch (error) {
        if (error.name !== 'AbortError') {

        }
      } finally {
        pendingOAcoinsRequest.current = null;
      }
    })();

    return pendingOAcoinsRequest.current;
  };

  // Function to fetch user's daily request count with caching
  const fetchRequestCount = async () => {
    if (!isAuthenticated() || !user?.id) return;

    // Check cache first (2 minute cache)
    const cacheKey = `request_count_${user.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);

    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 2 * 60 * 1000) { // 2 minutes
        setRequestCount(JSON.parse(cached));
        return;
      }
    }

    // Prevent duplicate requests
    if (pendingRequestCountRequest.current) {
      return pendingRequestCountRequest.current;
    }

    pendingRequestCountRequest.current = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(`${API_ENDPOINTS.SOLUTION_REQUESTS}?action=get_daily_request_count&user_id=${user.id}`, {
          headers: getApiHeaders(),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (data.status === 'success') {
          setRequestCount(data.data);

          // Cache the result
          sessionStorage.setItem(cacheKey, JSON.stringify(data.data));
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        }
      } catch (error) {
        if (error.name !== 'AbortError') {

        }
      } finally {
        pendingRequestCountRequest.current = null;
      }
    })();

    return pendingRequestCountRequest.current;
  };

  // Function to fetch user's solved questions count
  const fetchSolvedCount = async () => {
    if (!isAuthenticated() || !user?.id) return;

    // Check cache first (2 minute cache)
    const cacheKey = `solved_count_${user.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);

    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < 2 * 60 * 1000) { // 2 minutes
        setSolvedCount(parseInt(cached));
        return;
      }
    }

    // Prevent duplicate requests
    if (pendingSolvedCountRequest.current) {
      return pendingSolvedCountRequest.current;
    }

    pendingSolvedCountRequest.current = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(`${API_ENDPOINTS.USER_SOLVED_QUESTIONS}?action=get_solved_count&user_id=${user.id}`, {
          headers: getApiHeaders(),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (data.status === 'success') {
          setSolvedCount(data.count);

          // Cache the result
          sessionStorage.setItem(cacheKey, data.count.toString());
          sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        }
      } catch (error) {
        if (error.name !== 'AbortError') {

        }
      } finally {
        pendingSolvedCountRequest.current = null;
      }
    })();

    return pendingSolvedCountRequest.current;
  };

  // Combined refresh function for both OAcoins and request count
  const handleRefresh = async () => {
    if (isRefreshing || refreshCooldown > 0) return;

    setIsRefreshing(true);

    // Clear cache before refreshing
    if (user?.id) {
      sessionStorage.removeItem(`oacoins_${user.id}`);
      sessionStorage.removeItem(`oacoins_${user.id}_time`);
      sessionStorage.removeItem(`request_count_${user.id}`);
      sessionStorage.removeItem(`request_count_${user.id}_time`);
      sessionStorage.removeItem(`solved_count_${user.id}`);
      sessionStorage.removeItem(`solved_count_${user.id}_time`);
    }
    
    try {
      await Promise.all([fetchOAcoins(), fetchRequestCount(), fetchSolvedCount()]);
      
      // Set cooldown (e.g., 3 minutes)
      const cooldownTime = 180;
      setRefreshCooldown(cooldownTime);
      const now = Date.now();
      sessionStorage.setItem(`last_refresh_${user?.id}`, now.toString());
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Cooldown timer effect
  useEffect(() => {
    let interval;
    if (refreshCooldown > 0) {
      interval = setInterval(() => {
        setRefreshCooldown((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [refreshCooldown]);

  // Initialize cooldown from storage
  useEffect(() => {
    if (user?.id) {
        const lastRefresh = sessionStorage.getItem(`last_refresh_${user.id}`);
        if (lastRefresh) {
            const elapsed = Math.floor((Date.now() - parseInt(lastRefresh)) / 1000);
            const remaining = 180 - elapsed; // 3 minutes cooldown
            if (remaining > 0) {
                setRefreshCooldown(remaining);
            }
        }
    }
  }, [user?.id]);

  // Expose refresh function globally for other components to use
  React.useEffect(() => {
    window.refreshRequestCount = fetchRequestCount;
    return () => {
      delete window.refreshRequestCount;
    };
  }, [user, isAuthenticated]);

  // Auto-refresh request count every 5 minutes
  useEffect(() => {
    if (!isAuthenticated() || !user?.id) return;

    const interval = setInterval(fetchRequestCount, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated() && user?.id) {
      fetchRequestCount();
      fetchOAcoins();
      fetchSolvedCount();
    }
  }, [user, isAuthenticated]);

  // Check if user has seen the new features
  useEffect(() => {
    const seenNewFeatures = localStorage.getItem('hasSeenNewFeatures');
    if (seenNewFeatures === 'true') {
      setHasSeenNewFeatures(true);
    }
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  // Check for activation timer
  useEffect(() => {
    const checkActivationTimer = () => {
      if (!user?.id) {
        setActivationTimeRemaining(null);
        return;
      }

      const storedActivationData = localStorage.getItem('premiumActivationTime');
      if (storedActivationData) {
        try {
          const activationData = JSON.parse(storedActivationData);

          // Check if timer is for current user
          if (activationData.userId === user.id) {
            const activationTimestamp = activationData.timestamp;
            const now = Date.now();
            const timeLeft = Math.max(0, activationTimestamp - now);

            if (timeLeft > 0) {
              setActivationTimeRemaining(Math.ceil(timeLeft / 1000));
            } else {
              setActivationTimeRemaining(null);
              localStorage.removeItem('premiumActivationTime');
            }
          } else {
            // Timer is for different user, clear it and don't show timer
            localStorage.removeItem('premiumActivationTime');
            setActivationTimeRemaining(null);
          }
        } catch (error) {
          // Invalid data format, clear it
          localStorage.removeItem('premiumActivationTime');
          setActivationTimeRemaining(null);
        }
      } else {
        setActivationTimeRemaining(null);
      }
    };

    // Check immediately
    checkActivationTimer();

    // Update every second
    activationTimerRef.current = setInterval(checkActivationTimer, 1000);

    return () => {
      if (activationTimerRef.current) {
        clearInterval(activationTimerRef.current);
      }
    };
  }, [user]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Mark new features as seen when tooltip is opened
  const markNewFeaturesAsSeen = () => {
    setHasSeenNewFeatures(true);
    localStorage.setItem('hasSeenNewFeatures', 'true');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showIssueForm && issueFormRef.current && !issueFormRef.current.contains(event.target)) {
        setShowIssueForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIssueForm]);

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_ISSUES, {
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
        setShowThankYouModal(true);
        setIssue('');

        // Auto-hide thank you modal after 3 seconds
        setTimeout(() => {
          setShowThankYouModal(false);
        }, 3000);
      } else {
        alert(data.message || 'Failed to submit issue. Please try again.');
      }
    } catch (error) {

      // Add user feedback for error
      if (error.response) {
        // Server responded with error status
        alert(`Server error: ${error.response.data?.message || 'Failed to submit issue. Please try again.'}`);
      } else if (error.request) {
        // Network error
        alert('Network error: Please check your internet connection and try again.');
      } else {
        // Other error
        alert('Failed to submit issue. Please try again.');
      }
    }
  };

  const handleExtendPremium = async () => {
    if (!user?.id) return;

    setExtendLoading(true);
    setExtendError('');
    setExtendSuccess('');

    try {
      const response = await fetch(API_ENDPOINTS.EXTEND_PREMIUM, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          user_id: user.id,
          days: extendDays
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        setExtendSuccess(`Successfully extended premium by ${extendDays} day(s)! New balance: ${data.data.new_balance} coins`);
        // Update user's OACoins balance
        setOacoins(data.data.new_balance);

        // Close modal after 2 seconds
        setTimeout(() => {
          setShowExtendPremiumModal(false);
          setExtendSuccess('');
          setExtendDays(1);
          // Reload page to update premium status
          window.location.reload();
        }, 2000);
      } else {
        setExtendError(data.message || 'Failed to extend premium');
      }
    } catch (error) {

      setExtendError('An error occurred while extending premium');
    } finally {
      setExtendLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fira+Code:wght@600;700&family=JetBrains+Mono:wght@700&family=Source+Code+Pro:wght@700&display=swap");
          
          body {
            font-family: "Plus Jakarta Sans", sans-serif;
          }

          .animated-title {
            font-family: "Plus Jakarta Sans", sans-serif;
            font-weight: 800;
            color: #fff;
            letter-spacing: -0.5px;
            position: relative;
          }

          .animated-title span {
            background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          @keyframes heartBeat {
            0% { transform: scale(1); }
            14% { transform: scale(1.1); }
            28% { transform: scale(1); }
            42% { transform: scale(1.1); }
            70% { transform: scale(1); }
          }

          .heart-beat {
            animation: heartBeat 2s infinite;
          }

          @keyframes pulse-subtle {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.02); }
          }

          .animate-pulse-subtle {
            animation: pulse-subtle 3s infinite ease-in-out;
          }

          @keyframes fade-in {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }

          @keyframes bounce-in {
            0% {
              opacity: 0;
              transform: scale(0.9) translateY(10px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          @keyframes fade-up {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }

          .animate-bounce-in {
            animation: bounce-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .animate-fade-up {
            animation: fade-up 0.5s ease-out;
          }

          .animation-delay-200 {
            animation-delay: 0.2s;
          }

          .animation-delay-400 {
            animation-delay: 0.4s;
          }

          @keyframes blink {
            0%, 50% { opacity: 1; transform: scale(1); }
            51%, 100% { opacity: 0.3; transform: scale(0.8); }
          }

          .blink-indicator {
            animation: blink 2s infinite;
          }

          .new-feature-badge {
            position: absolute;
            top: 0;
            right: 0;
            width: 8px;
            height: 8px;
            background: #ef4444;
            border-radius: 50%;
            border: 2px solid #1a1a1a;
            z-index: 10;
          }
        `}
      </style>

      <nav className={`fixed w-full top-0 z-50 transition-all duration-500 mb-16
                    ${isScrolled
          ? 'backdrop-blur-2xl bg-[#030303]/80 border-b border-white/[0.06]'
          : 'backdrop-blur-md bg-transparent border-b border-white/[0.02]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0 mr-8">
              <Link to="/" className="animated-title text-2xl tracking-tight flex items-center gap-2">
                OA<span>Helper</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-3 rounded-full text-gray-400 hover:text-white hover:bg-white/5 focus:outline-none transition-colors"
              >
                {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-4 flex-1 justify-end">
              {/* Activation Timer - Show when active */}
              {activationTimeRemaining !== null && activationTimeRemaining > 0 && (
                <div className="flex items-center bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5">
                  <FaClock className="text-blue-400 mr-2 text-sm" />
                  <span className="text-xs text-blue-300 font-medium mr-2">Activating in</span>
                  <span className="text-sm font-bold text-blue-200 font-mono">{formatTime(activationTimeRemaining)}</span>
                </div>
              )}

              {/* Main Actions Group */}
              <div className="flex items-center bg-white/[0.03] backdrop-blur-lg rounded-full border border-white/[0.06] p-1.5 space-x-1">
                {/* Company Insights Button */}
                <Link
                  to="/company-insights"
                  className="flex items-center space-x-2 px-4 py-2 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/10 rounded-full transition-all duration-300 whitespace-nowrap"
                >
                  <span className="text-sm font-medium">Company Insights</span>
                </Link>

                <Link
                  to="/placement-data"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 whitespace-nowrap"
                >
                  <span className="text-sm font-medium">Placement Data</span>
                </Link>

                {/* Interview Experiences Button */}
                <Link
                  to="/interview-experiences"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 whitespace-nowrap"
                >
                  <span className="text-sm font-medium">Interview Experiences</span>
                </Link>

                {/* Divider */}
                <div className="w-px h-5 bg-white/10 mx-2"></div>

                {/* Get Question Solved Button */}
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-blue-300 hover:text-white hover:bg-blue-500/10 rounded-full transition-all duration-300 whitespace-nowrap"
                >
                  <FaCode className="text-xs" />
                  <span className="text-sm font-medium">Upload Your Question</span>
                </button>

                {/* Report Issue Button */}
                <div className="relative" ref={issueFormRef}>
                  <button
                    onClick={() => setShowIssueForm(!showIssueForm)}
                    className="flex items-center space-x-2 px-4 py-2 text-rose-300 hover:text-white hover:bg-rose-500/10 rounded-full transition-all duration-300 whitespace-nowrap"
                  >
                    <FaBug className="text-xs" />
                    <span className="text-sm font-medium">Report Issue</span>
                  </button>

                  {/* Issue Form Dropdown */}
                  {showIssueForm && (
                    <div className="absolute top-full mt-4 right-0 w-96 backdrop-blur-2xl bg-[#0a0a0a]/95 rounded-[2rem]
                                 border border-white/10 shadow-2xl p-6 transform origin-top transition-all duration-300 z-50">
                      <div className="mb-4">
                        <h3 className="text-white font-bold text-lg mb-1">Report an Issue</h3>
                        <p className="text-gray-400 text-sm">Help us improve by reporting bugs</p>
                      </div>
                      <form onSubmit={handleIssueSubmit} className="space-y-4">
                        <textarea
                          value={issue}
                          onChange={(e) => setIssue(e.target.value)}
                          placeholder="Describe the issue you're facing..."
                          className="w-full px-4 py-3 bg-white/5 text-white rounded-2xl
                                   border border-white/10 focus:border-rose-500/30
                                   focus:ring-4 focus:ring-rose-500/10 transition-all
                                   placeholder-gray-600 resize-none h-32 text-sm"
                        />
                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            className="flex-1 py-2.5 bg-white text-black rounded-full
                                     hover:bg-gray-200 font-semibold text-sm
                                     transition-all duration-300"
                          >
                            Submit Issue
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowIssueForm(false)}
                            className="px-6 py-2.5 bg-white/5 text-gray-300 rounded-full
                                     hover:bg-white/10 font-medium text-sm
                                     transition-all duration-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                {/* Get Premium Button - Show only for non-premium authenticated users */}
                {isAuthenticated() && !is_premium && (
                  <Link
                    to="/premium"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-300 hover:text-white hover:from-yellow-500/20 hover:to-amber-500/20 rounded-full transition-all duration-300 whitespace-nowrap border border-yellow-500/20"
                  >
                    <FaCrown className="text-xs" />
                    <span className="text-sm font-semibold">Get Premium</span>
                  </Link>
                )}
              </div>


              {/* Authentication Section */}
              {isAuthenticated() ? (
                <div className="flex items-center space-x-3 ml-2">
                  {/* User Profile & Request Counter */}
                  <div className={`flex items-center space-x-1 rounded-full border p-1.5 transition-all duration-300 ${is_premium
                    ? 'bg-gradient-to-r from-yellow-500/5 to-amber-500/5 border-yellow-500/20 hover:border-yellow-500/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}>
                    {/* User Dropdown */}
                    <div className="relative" ref={userDropdownRef}>
                      <button
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                        className={`flex items-center space-x-3 px-2 py-1 rounded-full transition-all duration-300 whitespace-nowrap ${is_premium
                          ? 'text-yellow-300 hover:text-yellow-200'
                          : 'text-gray-300 hover:text-white'
                          }`}
                      >
                        <ProfileAvatar name={user?.name} size="sm" />
                        <span className="text-sm font-medium pr-1">{user?.name}</span>
                        {is_premium && (
                          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                        )}
                        <FaChevronDown className={`text-xs transition-transform duration-300 ${showUserDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {/* User Dropdown Menu */}
                      {showUserDropdown && (
                        <div className="absolute top-full mt-4 right-0 w-72 backdrop-blur-2xl bg-[#0a0a0a]/95 rounded-[2rem]
                                     border border-white/10 shadow-2xl p-4 transform origin-top transition-all duration-300 z-50 animate-fade-in">
                          {/* User Info Header */}
                          <div className="px-2 py-2 border-b border-white/5 mb-3">
                            <div className="flex items-center space-x-4 mb-4">
                              <div className="relative">
                                <ProfileAvatar name={user?.name} size="lg" />
                                {is_premium && (
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-4 border-[#0a0a0a] animate-pulse"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-base truncate">{user?.name}</p>
                                <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                              </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-2">
                              {/* OAcoins Display */}
                              <div className="relative group/coin overflow-hidden rounded-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 opacity-50 group-hover/coin:opacity-100 transition-opacity"></div>
                                <div className="relative flex flex-col items-center justify-center border border-amber-500/20 rounded-2xl py-3">
                                  <div className="flex items-center space-x-1.5 mb-0.5">
                                    <FaCoins className="text-amber-400 text-xs" />
                                    <span className="text-white font-bold text-lg">{oacoins}</span>
                                  </div>
                                  <span className="text-gray-400 text-[10px] font-semibold tracking-wider uppercase">OAcoins</span>
                                </div>
                              </div>

                              {/* Request Count or Premium Badge */}
                              {is_premium ? (
                                <div className="relative group/request overflow-hidden rounded-2xl">
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-50 group-hover/request:opacity-100 transition-opacity"></div>
                                  <div className="relative flex flex-col items-center justify-center border border-blue-500/20 rounded-2xl py-3">
                                    <div className="flex items-center space-x-1.5 mb-0.5">
                                      <FaPaperPlane className="text-blue-400 text-xs" />
                                      <span className="text-white font-bold text-lg">{requestCount.remaining_requests}</span>
                                    </div>
                                    <span className="text-gray-400 text-[10px] font-semibold tracking-wider uppercase">Requests</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative overflow-hidden rounded-2xl">
                                  <div className="absolute inset-0 bg-white/5"></div>
                                  <div className="relative flex flex-col items-center justify-center border border-white/10 rounded-2xl py-3">
                                    <div className="flex items-center space-x-1.5 mb-0.5">
                                      <FaCrown className="text-gray-400 text-xs" />
                                      <span className="text-gray-300 font-bold text-sm">Free</span>
                                    </div>
                                    <span className="text-gray-500 text-[10px] font-semibold tracking-wider uppercase">Account</span>
                                  </div>
                                </div>
                              )}

                              {/* Solved Questions Count */}
                              <div className="relative group/solved overflow-hidden rounded-2xl col-span-2">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-50 group-hover/solved:opacity-100 transition-opacity"></div>
                                <div className="relative flex flex-col items-center justify-center border border-green-500/20 rounded-2xl py-3">
                                  <div className="flex items-center space-x-1.5 mb-0.5">
                                    <FaCheckCircle className="text-green-400 text-xs" />
                                    <span className="text-white font-bold text-lg">{solvedCount}</span>
                                  </div>
                                  <span className="text-gray-400 text-[10px] font-semibold tracking-wider uppercase">Questions Solved</span>
                                </div>
                              </div>
                            </div>

                            {/* Refresh Button */}
                            <button
                              onClick={handleRefresh}
                              disabled={isRefreshing || refreshCooldown > 0}
                              className={`w-full flex items-center justify-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 group ${isRefreshing || refreshCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <FaSync className={`w-3 h-3 text-gray-500 group-hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : (refreshCooldown === 0 ? 'group-hover:rotate-180 duration-500' : '')}`} />
                              <span className="text-xs text-gray-500 group-hover:text-white transition-colors font-medium">
                                {isRefreshing ? 'Refreshing...' : (refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : 'Refresh Balance')}
                              </span>
                            </button>
                          </div>

                          {/* Menu Items */}
                          <div className="space-y-1">
                            <Link
                              to="/dashboard"
                              onClick={() => setShowUserDropdown(false)}
                              className="flex items-center space-x-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                            >
                              <FaUserCircle className="text-sm" />
                              <span className="text-sm font-medium">Profile</span>
                            </Link>

                            <Link
                              to="/dashboard"
                              onClick={() => {
                                setShowUserDropdown(false);
                                // Set active tab to subscription after navigation
                                setTimeout(() => {
                                  const event = new CustomEvent('setDashboardTab', { detail: 'subscription' });
                                  window.dispatchEvent(event);
                                }, 100);
                              }}
                              className="flex items-center space-x-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                            >
                              <FaCrown className="text-sm" />
                              <span className="text-sm font-medium">Premium</span>
                            </Link>

                            {/* How to Earn OACoins */}
                            <button
                              onClick={() => {
                                setShowUserDropdown(false);
                                setShowEarnCoinsModal(true);
                              }}
                              className="flex items-center space-x-3 px-4 py-2.5 text-yellow-300/80 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-xl transition-all duration-200 w-full text-left"
                            >
                              <FaCoins className="text-sm" />
                              <span className="text-sm font-medium">How to Earn OACoins</span>
                            </button>

                            {/* Extend Premium - Show only for premium users */}
                            {is_premium && (
                              <button
                                onClick={() => {
                                  setShowUserDropdown(false);
                                  setShowExtendPremiumModal(true);
                                }}
                                className="flex items-center space-x-3 px-4 py-2.5 text-amber-300/80 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl transition-all duration-200 w-full text-left"
                              >
                                <FaClock className="text-sm" />
                                <span className="text-sm font-medium">Extend Premium</span>
                              </button>
                            )}


                            {/* Join WhatsApp Group - Show only for premium users */}
                            {is_premium && (
                              <a
                                href="https://chat.whatsapp.com/L5aPuSsWD0x5u5gAn6bVuP"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setShowUserDropdown(false)}
                                className="flex items-center space-x-3 px-4 py-2.5 text-green-300/80 hover:text-green-300 hover:bg-green-500/10 rounded-xl transition-all duration-200"
                              >
                                <FaWhatsapp className="text-sm" />
                                <span className="text-sm font-medium">Join WhatsApp Group</span>
                              </a>
                            )}

                            {/* Upgrade Plan - Show only for premium users */}
                            {is_premium && (
                              <button
                                onClick={() => {
                                  setShowUserDropdown(false);
                                  setShowUpgradeModal(true);
                                }}
                                className="flex items-center space-x-3 px-4 py-2.5 text-purple-300/80 hover:text-purple-300 hover:bg-purple-500/10 rounded-xl transition-all duration-200 w-full text-left"
                              >
                                <FaCrown className="text-sm" />
                                <span className="text-sm font-medium">Upgrade Plan</span>
                              </button>
                            )}

                            {/* Get Premium - Show only for non-premium users */}
                            {!is_premium && (
                              <Link
                                to="/premium"
                                onClick={() => setShowUserDropdown(false)}
                                className="flex items-center space-x-3 px-4 py-2.5 text-yellow-300/80 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-xl transition-all duration-200"
                              >
                                <FaCrown className="text-sm" />
                                <span className="text-sm font-medium">Get Premium</span>
                              </Link>
                            )}

                            {/* What's New */}
                            <div className="relative group/whats-new">
                              <button
                                onClick={markNewFeaturesAsSeen}
                                className="relative flex items-center space-x-3 px-4 py-2.5 text-blue-300/80 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition-all duration-200 w-full text-left"
                              >
                                <FaHeart className="text-sm" />
                                <span className="text-sm font-medium">What's New</span>
                                {!hasSeenNewFeatures && (
                                  <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                )}
                              </button>

                              {/* What's New Tooltip */}
                              <div className="absolute right-full mr-4 top-0 opacity-0 group-hover/whats-new:opacity-100 pointer-events-none transition-all duration-200 z-50 hidden group-hover/whats-new:block">
                                <div className="backdrop-blur-2xl bg-[#0a0a0a]/95 border border-white/10 rounded-2xl p-5 shadow-2xl w-80">
                                  <div className="space-y-5">

                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <FaFileCode className="text-purple-400 text-sm" />
                                        <h4 className="text-white font-semibold text-sm">Multi-Language Editor</h4>
                                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded-full border border-purple-500/20">
                                          NEW
                                        </span>
                                      </div>
                                      <p className="text-gray-400 text-xs leading-relaxed">
                                        Run code in any language with built-in test case execution.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Logout Button */}
                          <div className="border-t border-white/5 mt-2 pt-2">
                            <button
                              onClick={() => {
                                setShowUserDropdown(false);
                                logout();
                              }}
                              className="flex items-center space-x-3 px-4 py-2.5 text-red-300/80 hover:text-white hover:bg-red-500/20 rounded-xl transition-all duration-200 w-full text-left"
                            >
                              <FaSignOutAlt className="text-sm" />
                              <span className="text-sm font-medium">Logout</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center ml-4">
                  <Link
                    to="/login"
                    className="flex items-center space-x-2 px-6 py-2.5 bg-white text-black rounded-full
                             hover:bg-gray-200 transition-all duration-300 font-bold text-sm whitespace-nowrap shadow-lg shadow-white/5"
                  >
                    <FaSignInAlt className="text-xs" />
                    <span>Login</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden bg-black/95 backdrop-blur-xl border-b border-white/5`}>
          <div className="px-4 pt-4 pb-6 space-y-4">
            {/* Activation Timer - Mobile */}
            {activationTimeRemaining !== null && activationTimeRemaining > 0 && (
              <div className="flex items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-2xl px-4 py-3">
                <FaClock className="text-blue-400 mr-2" />
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-blue-300 font-medium">Activating in</span>
                  <span className="text-sm font-bold text-blue-200 font-mono">{formatTime(activationTimeRemaining)}</span>
                </div>
              </div>
            )}

            {/* Links */}
            <div className="space-y-2">
              <Link
                to="/company-insights"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/10 rounded-2xl transition-all duration-200"
              >
                <FaChartLine className="text-sm" />
                <span className="text-sm font-medium">Company Insights</span>
              </Link>

              <Link
                to="/placement-data"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-200"
              >
                <FaBriefcase className="text-sm" />
                <span className="text-sm font-medium">Placement Data</span>
              </Link>

              <Link
                to="/interview-experiences"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-2xl transition-all duration-200"
              >
                <FaUserCircle className="text-sm" />
                <span className="text-sm font-medium">Interview Experiences</span>
              </Link>

              <button
                onClick={() => {
                  setShowUploadModal(true);
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 text-blue-300 hover:text-white hover:bg-blue-500/10 rounded-2xl transition-all duration-200 w-full text-left"
              >
                <FaCode className="text-sm" />
                <span className="text-sm font-medium">Upload Questions</span>
              </button>
            </div>

            {/* Mobile Authentication */}
            <div className="border-t border-white/10 pt-4">
              {isAuthenticated() ? (
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="flex items-center space-x-3 px-4">
                    <ProfileAvatar name={user?.name} size="sm" />
                    <div>
                      <p className="text-white font-medium text-sm">{user?.name}</p>
                      <p className="text-gray-500 text-xs">{user?.email}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 px-4">
                    <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center justify-center">
                      <span className="text-amber-400 font-bold text-lg">{oacoins}</span>
                      <span className="text-gray-500 text-[10px] uppercase font-bold">OAcoins</span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center justify-center">
                      <span className="text-blue-400 font-bold text-lg">{requestCount.remaining_requests}</span>
                      <span className="text-gray-500 text-[10px] uppercase font-bold">Requests</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-300 bg-red-500/10 rounded-2xl font-medium text-sm"
                  >
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 px-4">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 bg-white text-black rounded-full font-bold text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 bg-white/10 text-white rounded-full font-bold text-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Thank You Modal */}
      {showThankYouModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowThankYouModal(false)}></div>
          <div className="relative bg-[#0a0a0a] border border-white/10 p-8 rounded-[2.5rem] shadow-2xl
                         transform animate-bounce-in text-center max-w-sm mx-4">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                <FaCheck size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
            <p className="text-gray-400 mb-6">Your feedback helps us improve.</p>
          </div>
        </div>
      )}

      {/* User Upload Question Modal */}
      <UserUploadQuestion
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowUpgradeModal(false)}></div>
          <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl
                         transform animate-bounce-in max-w-5xl mx-4 w-full my-8 p-8">

            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">Upgrade Plan</h3>
                <p className="text-gray-400">Unlock premium features and unlimited access</p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Plans... I will keep it simple for now to save space, user can expand */}
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-colors">
                <h4 className="text-xl font-bold text-white mb-2">Basic</h4>
                <div className="text-3xl font-bold text-white mb-4">₹99<span className="text-base font-normal text-gray-500">/mo</span></div>
                <ul className="space-y-3 text-gray-400 text-sm mb-6">
                  <li className="flex items-center"><FaCheck className="text-green-400 mr-2 text-xs" /> Unlimited Access</li>
                  <li className="flex items-center"><FaCheck className="text-green-400 mr-2 text-xs" /> 5 Solutions/day</li>
                </ul>
                <a href="https://wa.me/919274985691?text=Hi,%20I%20want%20Basic%20Plan" target="_blank" rel="noreferrer" className="block w-full py-3 text-center rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-colors font-semibold">Select Basic</a>
              </div>

              <div className="bg-white/[0.05] border border-purple-500/30 rounded-3xl p-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">POPULAR</div>
                <h4 className="text-xl font-bold text-white mb-2">Pro</h4>
                <div className="text-3xl font-bold text-white mb-4">₹199<span className="text-base font-normal text-gray-500">/mo</span></div>
                <ul className="space-y-3 text-gray-400 text-sm mb-6">
                  <li className="flex items-center"><FaCheck className="text-purple-400 mr-2 text-xs" /> Unlimited Access</li>
                  <li className="flex items-center"><FaCheck className="text-purple-400 mr-2 text-xs" /> 15 Solutions/day</li>
                  <li className="flex items-center"><FaCheck className="text-purple-400 mr-2 text-xs" /> Priority Support</li>
                </ul>
                <a href="https://wa.me/919274985691?text=Hi,%20I%20want%20Pro%20Plan" target="_blank" rel="noreferrer" className="block w-full py-3 text-center rounded-full bg-white text-black hover:bg-gray-200 transition-colors font-bold">Select Pro</a>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-colors">
                <h4 className="text-xl font-bold text-white mb-2">Unlimited</h4>
                <div className="text-3xl font-bold text-white mb-4">₹299<span className="text-base font-normal text-gray-500">/45d</span></div>
                <ul className="space-y-3 text-gray-400 text-sm mb-6">
                  <li className="flex items-center"><FaCheck className="text-orange-400 mr-2 text-xs" /> Unlimited Access</li>
                  <li className="flex items-center"><FaCheck className="text-orange-400 mr-2 text-xs" /> Unlimited Solutions</li>
                </ul>
                <a href="https://wa.me/919274985691?text=Hi,%20I%20want%20Unlimited%20Plan" target="_blank" rel="noreferrer" className="block w-full py-3 text-center rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-colors font-semibold">Select Unlimited</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extend Premium Modal */}
      {showExtendPremiumModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowExtendPremiumModal(false)}></div>
          <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl">
            <button
              onClick={() => setShowExtendPremiumModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
            >
              <FaTimes size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaClock className="text-amber-400 text-2xl" />
              </div>
              <h3 className="text-2xl font-bold text-white">Extend Premium</h3>
              <p className="text-gray-400 mt-2 text-sm">Use OACoins to extend your access</p>
            </div>

            <div className="bg-white/5 rounded-3xl p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 text-sm">Balance</span>
                <span className="text-white font-bold flex items-center"><FaCoins className="text-yellow-400 mr-2" /> {oacoins}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Extend by</span>
                <div className="flex items-center bg-black rounded-full border border-white/10 px-3 py-1">
                  <input
                    type="number"
                    min="1"
                    value={extendDays}
                    onChange={(e) => setExtendDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-transparent text-white w-12 text-center focus:outline-none font-bold"
                  />
                  <span className="text-gray-500 text-xs ml-1">days</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-gray-400 text-sm">Cost</span>
                <span className="text-white font-bold">{(extendDays * 3.5).toFixed(1)} coins</span>
              </div>
            </div>

            {extendError && <p className="text-red-400 text-sm text-center mb-4">{extendError}</p>}
            {extendSuccess && <p className="text-green-400 text-sm text-center mb-4">{extendSuccess}</p>}

            <button
              onClick={handleExtendPremium}
              disabled={extendLoading || (oacoins - (extendDays * 3.5)) < 0}
              className="w-full py-3.5 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {extendLoading ? 'Processing...' : 'Extend Now'}
            </button>
          </div>
        </div>
      )}

      {/* Earn Coins Modal */}
      {showEarnCoinsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowEarnCoinsModal(false)}></div>
          <div className="relative bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl text-center">
            <button
              onClick={() => setShowEarnCoinsModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
            >
              <FaTimes size={20} />
            </button>

            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCoins className="text-yellow-400 text-2xl" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Earn OACoins</h3>
            <p className="text-gray-400 text-sm mb-8">Share questions with us to earn coins.</p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center bg-white/5 p-4 rounded-2xl text-left">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm mr-3">1</div>
                <span className="text-gray-300 text-sm">Share OA questions</span>
              </div>
              <div className="flex items-center bg-white/5 p-4 rounded-2xl text-left">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm mr-3">2</div>
                <span className="text-gray-300 text-sm">We verify the content</span>
              </div>
              <div className="flex items-center bg-white/5 p-4 rounded-2xl text-left">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm mr-3">3</div>
                <span className="text-gray-300 text-sm">Receive OACoins</span>
              </div>
            </div>

            <a
              href="https://wa.me/919274985691?text=Hi,%20I%20want%20to%20share%20OA%20questions"
              target="_blank"
              rel="noreferrer"
              className="block w-full py-3.5 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
            >
              Start Sharing
            </a>
          </div>
        </div>
      )}

      {/* Spacer div */}
      {showSpacer && <div className="h-20 mb-8"></div>}

    </>
  );
};

export default Navbar;
