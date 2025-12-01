import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaFilter, FaTimes, FaSearch, FaCode, FaClock, FaFire, FaBookmark, FaEye, FaCheckCircle, FaTimesCircle, FaSpinner, FaCrown } from 'react-icons/fa';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';
import { encryptId } from '../utils/encryption';
import Navbar from './Navbar';

// State persistence utilities
const STORAGE_KEY = 'dsa_sheet_state';

const saveStateToStorage = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save state to localStorage:', error);
  }
};

const loadStateFromStorage = () => {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    return savedState ? JSON.parse(savedState) : null;
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error);
    return null;
  }
};

const getDefaultState = () => ({
  selectedDifficulty: 'All',
  selectedTopic: 'All',
  selectedSection: 'All',
  searchQuery: '',
  showFilters: false,
});

// Enhanced blur protection for non-authenticated users
const applyBlurProtection = (targetElement) => {
  if (!targetElement) return;

  // Apply multiple layers of CSS protection with reduced intensity
  const protectionStyles = [
    'filter: blur(2px) !important',
    'pointer-events: none !important',
    'user-select: none !important',
    '-webkit-user-select: none !important',
    '-moz-user-select: none !important',
    '-ms-user-select: none !important',
    'position: relative !important'
  ];

  targetElement.style.cssText += protectionStyles.join('; ') + ';';

  // Add multiple overlay layers for extra protection with reduced opacity
  for (let i = 0; i < 3; i++) {
    let overlay = targetElement.querySelector(`.blur-overlay-${i}`);
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = `blur-overlay-${i}`;
      overlay.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0, 0, 0, ${0.15 + i * 0.05}) !important;
        backdrop-filter: blur(${1 + i}px) !important;
        z-index: ${9999 + i} !important;
        pointer-events: auto !important;
        cursor: default !important;
        border-radius: inherit !important;
      `;
      targetElement.appendChild(overlay);
    }
  }
};

const BlurProtectionManager = {
  observers: new Set(),
  intervals: new Set(),

  start(targetElement, isAuthenticated) {
    this.stop(); // Clear any existing protection

    if (isAuthenticated) return;

    // Apply initial protection
    applyBlurProtection(targetElement);

    // Use MutationObserver to detect and prevent removal of blur
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          // Reapply protection if style was changed
          setTimeout(() => applyBlurProtection(targetElement), 10);
        } else if (mutation.type === 'childList') {
          // Check if overlays were removed and recreate them
          for (let i = 0; i < 3; i++) {
            if (!targetElement.querySelector(`.blur-overlay-${i}`)) {
              setTimeout(() => applyBlurProtection(targetElement), 10);
              break;
            }
          }
        }
      });
    });

    // Observe the container for changes
    observer.observe(targetElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      childList: true,
      subtree: true
    });

    this.observers.add(observer);

    // Use periodic checks as backup (multiple intervals for redundancy)
    const intervals = [
      setInterval(() => {
        if (!isAuthenticated && targetElement) {
          applyBlurProtection(targetElement);
        } else {
          this.stop();
        }
      }, 500),
      setInterval(() => {
        if (!isAuthenticated && targetElement) {
          applyBlurProtection(targetElement);
        } else {
          this.stop();
        }
      }, 1000),
      setInterval(() => {
        if (!isAuthenticated && targetElement) {
          applyBlurProtection(targetElement);
        } else {
          this.stop();
        }
      }, 2000)
    ];

    intervals.forEach(interval => this.intervals.add(interval));
  },

  stop() {
    this.observers.forEach(observer => observer.disconnect());
    this.intervals.forEach(interval => clearInterval(interval));
    this.observers.clear();
    this.intervals.clear();
  }
};

const DSASheet = () => {
  const { isAuthenticated, user } = useAuth();
  const { is_premium, loading: premiumLoading } = usePremium();
  const navigate = useNavigate();

  // Load saved state or use defaults
  const [savedState] = useState(() => {
    const state = loadStateFromStorage();
    return state ? { ...getDefaultState(), ...state } : getDefaultState();
  });

  // Main data states
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);




  // Filter states with persistence
  const [selectedDifficulty, setSelectedDifficultyState] = useState(savedState.selectedDifficulty);
  const [selectedTopic, setSelectedTopicState] = useState(savedState.selectedTopic);
  const [selectedSection, setSelectedSectionState] = useState(savedState.selectedSection);
  const [searchQuery, setSearchQueryState] = useState(savedState.searchQuery);
  const [showFilters, setShowFiltersState] = useState(savedState.showFilters);

  // Removed mode state - only DSA Sheet mode now
  // Removed pagination states - not needed for DSA Sheet only

  const [availableTopics, setAvailableTopics] = useState([]);

  // Available filters
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  // State persistence functions
  const saveCurrentState = () => {
    const currentState = {
      selectedDifficulty,
      selectedTopic,
      selectedSection,
      searchQuery,
      showFilters,
    };
    saveStateToStorage(currentState);
  };

  // Wrapper functions for state setters that also save state
  const setSelectedDifficulty = (value) => {
    setSelectedDifficultyState(value);
    saveCurrentState();
  };

  const setSelectedTopic = (value) => {
    setSelectedTopicState(value);
    saveCurrentState();
  };

  const setSelectedSection = (value) => {
    setSelectedSectionState(value);
    saveCurrentState();
  };

  const setSearchQuery = (value) => {
    setSearchQueryState(value);
    saveCurrentState();
  };

  const setShowFilters = (value) => {
    setShowFiltersState(value);
    saveCurrentState();
  };



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


  // Enhanced blur protection for non-authenticated users
  useEffect(() => {
    const questionsContainer = document.querySelector('.questions-container');
    if (questionsContainer) {
      if (!isAuthenticated()) {
        BlurProtectionManager.start(questionsContainer, isAuthenticated());
      } else {
        BlurProtectionManager.stop();
      }
    }

    // Cleanup on unmount
    return () => {
      BlurProtectionManager.stop();
    };
  }, [isAuthenticated, questions.length]);

  // Additional protection layer using ResizeObserver to handle container changes
  useEffect(() => {
    if (!isAuthenticated()) {
      const questionsContainer = document.querySelector('.questions-container');
      if (!questionsContainer) return;

      const resizeObserver = new ResizeObserver(() => {
        // Reapply protection when container is resized
        setTimeout(() => applyBlurProtection(questionsContainer), 100);
      });

      resizeObserver.observe(questionsContainer);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [isAuthenticated]);

  // Add global CSS protection rules to prevent bypass attempts
  useEffect(() => {
    if (!isAuthenticated()) {
      const styleId = 'blur-protection-styles';
      let styleElement = document.getElementById(styleId);

      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = `
          /* Global protection rules - only target questions container */
          .questions-container:not(.navbar) {
            filter: blur(2px) !important;
            pointer-events: none !important;
          }

          .questions-container:not(.navbar) * {
            pointer-events: none !important;
            user-select: none !important;
          }

          .blur-overlay-0, .blur-overlay-1, .blur-overlay-2 {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }

          /* Prevent common bypass methods */
          .questions-container:not(.navbar)::before,
          .questions-container:not(.navbar)::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.15);
            backdrop-filter: blur(1px);
            z-index: 9999;
            pointer-events: auto;
          }
        `;
        document.head.appendChild(styleElement);
      }

      return () => {
        if (styleElement && styleElement.parentNode) {
          styleElement.parentNode.removeChild(styleElement);
        }
      };
    }
  }, [isAuthenticated]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);

      const url = `${API_ENDPOINTS.BASE_URL}/api.php?action=get_dsa_sheet_questions`;
      
      const response = await fetch(url, {
        headers: getApiHeaders()
      });
      const data = await response.json();

      if (data.status === 'success') {
        setQuestions(data.data);

        // Extract unique topics for filter
        const topics = new Set();
        data.data.forEach(q => {
          if (q.topics && Array.isArray(q.topics)) {
            q.topics.forEach(topic => topics.add(topic));
          }
          if (q.primary_topic) {
            topics.add(q.primary_topic);
          }
        });
        setAvailableTopics(['All', ...Array.from(topics).sort()]);
      } else {
        setError(data.message || 'Failed to fetch DSA sheet questions');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = [...questions];

    // Filter by difficulty
    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(q => q.lc_level === selectedDifficulty);
    }

    // Filter by topic
    if (selectedTopic !== 'All') {
      filtered = filtered.filter(q => {
        // Check primary_topic first
        if (q.primary_topic === selectedTopic) return true;

        // Check topics array
        if (q.topics && Array.isArray(q.topics)) {
          return q.topics.includes(selectedTopic);
        }

        return false;
      });
    }

    // Filter by section
    if (selectedSection !== 'All') {
      filtered = filtered.filter(q => q.dsasheet_section === selectedSection);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.title.toLowerCase().includes(query) ||
        (q.problem_statement && q.problem_statement.toLowerCase().includes(query))
      );
    }

    setFilteredQuestions(filtered);
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'Easy': return 'text-green-400 bg-green-900/30 border-green-800/50';
      case 'Medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50';
      case 'Hard': return 'text-red-400 bg-red-900/30 border-red-800/50';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-800/50';
    }
  };

  const getDifficultyIcon = (level) => {
    switch (level) {
      case 'Easy': return <FaCheckCircle className="text-green-400" />;
      case 'Medium': return <FaClock className="text-yellow-400" />;
      case 'Hard': return <FaFire className="text-red-400" />;
      default: return <FaCode className="text-gray-400" />;
    }
  };

  const resetFilters = () => {
    setSelectedDifficultyState('All');
    setSelectedTopicState('All');
    setSelectedSectionState('All');
    setSearchQueryState('');
    saveCurrentState();
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Error Loading DSA Sheet</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={fetchQuestions}
              className="px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-all duration-300 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Navbar />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">
            Curated DSA Practice Sheet
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
            Master Data Structures and Algorithms with our curated collection of {questions.length} problems designed for your journey.
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
              className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-full border transition-all duration-300 min-w-fit ${showFilters ? 'bg-white text-black border-white' : 'bg-transparent text-white border-[#333] hover:bg-white/5'}`}
            >
              <FaFilter className="text-sm" />
              <span>Filters</span>
            </button>

            <button
              onClick={resetFilters}
              className="px-6 py-3 text-gray-400 hover:text-white transition-colors min-w-fit font-medium"
            >
              Clear All
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 bg-[#111] rounded-2xl border border-[#333] animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-4 py-3 bg-black text-white rounded-xl border border-[#333] focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all text-sm outline-none appearance-none cursor-pointer hover:bg-[#050505]"
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </div>

              {/* Topic Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">Topic</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full px-4 py-3 bg-black text-white rounded-xl border border-[#333] focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all text-sm outline-none appearance-none cursor-pointer hover:bg-[#050505]"
                >
                  {availableTopics.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>

              {/* Section Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">DSA Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-4 py-3 bg-black text-white rounded-xl border border-[#333] focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all text-sm outline-none appearance-none cursor-pointer hover:bg-[#050505]"
                >
                  {sections.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-6 px-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-gray-500 text-sm font-medium">
              Showing <span className="text-white">{filteredQuestions.length}</span> of <span className="text-white">{questions.length}</span> questions
            </p>
            {(selectedDifficulty !== 'All' || selectedTopic !== 'All' || selectedSection !== 'All') && (
              <div className="flex flex-wrap gap-2">
                {selectedDifficulty !== 'All' && (
                  <span className="px-3 py-1 bg-[#222] text-white text-xs rounded-full border border-[#333]">
                    {selectedDifficulty}
                  </span>
                )}
                {selectedTopic !== 'All' && (
                  <span className="px-3 py-1 bg-[#222] text-white text-xs rounded-full border border-[#333]">
                    {selectedTopic}
                  </span>
                )}
                {selectedSection !== 'All' && (
                  <span className="px-3 py-1 bg-[#222] text-white text-xs rounded-full border border-[#333]">
                    {selectedSection}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Questions Table */}
        <div className={`questions-container relative ${!isAuthenticated() ? 'blur-[2px] pointer-events-none' : ''}`}>
          <div className="bg-[#111] rounded-2xl border border-[#333] overflow-hidden shadow-sm">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
              <table className="w-full min-w-[1200px] text-left border-collapse">
              <thead className="bg-[#0a0a0a] border-b border-[#333]">
                <tr>
                  <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[250px]">Title</th>
                  <th className="px-4 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[150px]">Company</th>
                  <th className="px-4 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[120px]">Difficulty</th>
                  <th className="px-4 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[180px]">Section</th>
                  <th className="px-4 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[200px]">Topics</th>
                  <th className="px-4 py-5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[150px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {filteredQuestions.map((question) => {
                  const topics = question.topics && Array.isArray(question.topics) ? question.topics :
                    (question.primary_topic ? [question.primary_topic] : []);

                  return (
                    <tr
                      key={question.id}
                      className="hover:bg-[#1a1a1a] transition-colors duration-200 group"
                    >
                      {/* Title */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors leading-tight">
                            {question.title}
                          </h3>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-4 py-4">
                        <span className="px-3 py-1 bg-[#222] text-gray-300 text-xs rounded-full border border-[#333] inline-block">
                          {question.company_name || 'Unknown'}
                        </span>
                      </td>

                      {/* Difficulty */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(question.lc_level)}`}>
                          {getDifficultyIcon(question.lc_level)}
                          <span className="ml-2">{question.lc_level || 'N/A'}</span>
                        </span>
                      </td>

                      {/* Section */}
                      <td className="px-4 py-4">
                        {question.dsasheet_section ? (
                          <span className="px-3 py-1 bg-[#222] text-gray-300 text-xs rounded-full border border-[#333] inline-block">
                            {question.dsasheet_section}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">N/A</span>
                        )}
                      </td>

                      {/* Topics */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {topics.slice(0, 3).map((topic, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-[#222] text-gray-400 text-xs rounded border border-[#333]"
                            >
                              {topic}
                            </span>
                          ))}
                          {topics.length > 3 && (
                            <span className="px-2 py-1 bg-[#222] text-gray-500 text-xs rounded border border-[#333]">
                              +{topics.length - 3}
                            </span>
                          )}
                          {topics.length === 0 && (
                            <span className="text-gray-600 text-xs">No topics</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          {isAuthenticated() && !premiumLoading && !is_premium ? (
                            // Non-premium user - show premium purchase button
                            <button
                              onClick={() => navigate('/premium')}
                              className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition-all duration-300 text-xs font-semibold"
                            >
                              <FaCrown className="text-sm" />
                              <span>Premium</span>
                            </button>
                          ) : (
                            // Premium or loading user - show normal actions
                            <div className="flex items-center justify-center space-x-2">
                              <a
                                href={`/questions/${encryptId(question.id)}?company_id=${encryptId(question.company_id)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-1 px-3 py-1.5 bg-transparent text-white rounded-full border border-[#333] hover:bg-[#333] transition-all duration-300 text-xs font-medium"
                              >
                                <FaEye className="text-xs" />
                                <span>View</span>
                              </a>

                              <a
                                href={`/question-with-editor/${encryptId(question.id)}?company_id=${encryptId(question.company_id)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-1 px-3 py-1.5 bg-white text-black rounded-full border border-white hover:bg-gray-200 transition-all duration-300 text-xs font-bold"
                              >
                                <FaCode className="text-xs" />
                                <span>Solve</span>
                              </a>
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
            <div className="text-center py-12 sm:py-20">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#111] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#333]">
                  <FaSearch className="text-gray-500 text-2xl sm:text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No questions found</h3>
                <p className="text-gray-500 mb-6 text-base">Try adjusting your filters or search query.</p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition-all duration-300 text-sm font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Login prompt overlay for non-authenticated users */}
        {!isAuthenticated() && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="relative bg-[#111] border border-[#333] p-8 m-4 max-w-lg w-full shadow-2xl rounded-3xl animate-in zoom-in-95 duration-300">
              
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-[#222] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#333]">
                  <FaEye className="text-white text-2xl" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">
                  Login Required
                </h3>
                <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-sm mx-auto">
                  Join now to access our curated collection and track progress.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/login"
                    className="flex-1 bg-white text-black rounded-full border-0 py-3 px-6 transition-all duration-300 text-sm font-bold hover:bg-gray-200 hover:scale-105 text-center"
                  >
                    Login to Continue
                  </Link>
                  <Link
                    to="/signup"
                    className="flex-1 bg-transparent text-white rounded-full border border-[#333] py-3 px-6 transition-all duration-300 text-sm font-medium hover:bg-white/5 hover:border-white/20 hover:scale-105 text-center"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>


    </div>
  );
};

export default DSASheet;
