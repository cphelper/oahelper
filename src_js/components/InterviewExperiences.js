import React, { useState, useMemo, useEffect } from 'react';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';
import Navbar from './Navbar';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus, FaCoins, FaBuilding, FaBriefcase, FaCalendar, FaStar, FaCheckCircle, FaTimesCircle, FaGraduationCap, FaLightbulb, FaArrowRight } from 'react-icons/fa';
import useScrollToTop from '../hooks/useScrollToTop';
import DOMPurify from 'dompurify';

// Add Entry Modal Component
const AddExperienceModal = React.memo(({ isOpen, onClose, userEmail }) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    college: '',
    interview_date: '',
    interview_type: '',
    result: '',
    difficulty: '',
    rounds: '',
    topics_asked: '',
    experience: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userEmail) {
      alert('Please login to submit interview experience');
      return;
    }

    setSubmitting(true);

    try {
      const url = `${API_ENDPOINTS.INTERVIEW_EXPERIENCES}?action=submit`;


      const submissionData = {
        ...formData,
        user_email: userEmail
      };



      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders()
        },
        body: JSON.stringify(submissionData)
      });

      const responseText = await response.text();


      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);

        alert('Server error: Invalid response format.');
        return;
      }

      if (data.status === 'success') {
        setSubmitSuccess(true);
        setFormData({
          company: '',
          role: '',
          college: '',
          interview_date: '',
          interview_type: '',
          result: '',
          difficulty: '',
          rounds: '',
          topics_asked: '',
          experience: ''
        });

        setTimeout(() => {
          onClose();
          setSubmitSuccess(false);
        }, 3000);
      } else {
        console.error('Submission failed:', data);
        alert(data.message || 'Failed to submit experience');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit experience: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !submitting && onClose()}></div>
      <div className="relative bg-[#202124] border border-white/10 rounded-3xl shadow-2xl max-w-3xl mx-4 w-full my-8 overflow-hidden">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full disabled:opacity-50 z-10"
        >
          ✕
        </button>

        <div className="p-8 md:p-10">
          {submitSuccess ? (
            <div className="text-center py-8">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                  <span className="text-5xl text-green-400">✓</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#e8eaed] mb-3">
                Experience Submitted! 🎉
              </h3>
              <p className="text-[#9aa0a6] mb-6">
                Thank you for sharing! Your experience is under review.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 inline-block">
                <div className="flex items-center justify-center space-x-2">
                  <FaCoins className="text-amber-400" />
                  <span className="text-amber-300 font-bold">You'll earn 5-15 OACoins once verified!</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-3xl font-normal text-[#e8eaed] mb-2 text-center">
                Share experience
              </h3>

              <p className="text-[#9aa0a6] mb-8 leading-relaxed text-center text-sm max-w-lg mx-auto">
                Help others prepare! Share your interview experience and earn 5-15 OACoins after verification.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#e8eaed] mb-2">
                      Company Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-[#303134] border border-transparent rounded-xl text-[#e8eaed]
                               focus:outline-none focus:border-[#8ab4f8] focus:bg-[#303134] transition-all
                               placeholder-[#5f6368]"
                      placeholder="e.g., Google"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#e8eaed] mb-2">
                      Role <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-[#303134] border border-transparent rounded-xl text-[#e8eaed]
                               focus:outline-none focus:border-[#8ab4f8] focus:bg-[#303134] transition-all
                               placeholder-[#5f6368]"
                      placeholder="e.g., SDE Intern"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#e8eaed] mb-2">
                      College Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="college"
                      value={formData.college}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-[#303134] border border-transparent rounded-xl text-[#e8eaed]
                               focus:outline-none focus:border-[#8ab4f8] focus:bg-[#303134] transition-all
                               placeholder-[#5f6368]"
                      placeholder="e.g., IIT Delhi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#e8eaed] mb-2">
                      Interview Date
                    </label>
                    <input
                      type="text"
                      name="interview_date"
                      value={formData.interview_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#303134] border border-transparent rounded-xl text-[#e8eaed]
                               focus:outline-none focus:border-[#8ab4f8] focus:bg-[#303134] transition-all
                               placeholder-[#5f6368]"
                      placeholder="e.g., Dec 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#e8eaed] mb-2">
                      Interview Type <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="interview_type"
                      value={formData.interview_type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-[#303134] border border-transparent rounded-xl text-[#e8eaed]
                               focus:outline-none focus:border-[#8ab4f8] focus:bg-[#303134] transition-all"
                    >
                      <option value="">Select Type</option>
                      <option value="On-Campus">On-Campus</option>
                      <option value="Off-Campus">Off-Campus</option>
                      <option value="Internship">Internship</option>
                      <option value="Full-Time">Full-Time</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#e8eaed] mb-2">
                      Result <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="result"
                      value={formData.result}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-[#303134] border border-transparent rounded-xl text-[#e8eaed]
                               focus:outline-none focus:border-[#8ab4f8] focus:bg-[#303134] transition-all"
                    >
                      <option value="">Select Result</option>
                      <option value="Selected">Selected</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#e8eaed] mb-2">
                      Difficulty Level
                    </label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#303134] border border-transparent rounded-xl text-[#e8eaed]
                               focus:outline-none focus:border-[#8ab4f8] focus:bg-[#303134] transition-all"
                    >
                      <option value="">Select Difficulty</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#e8eaed] mb-2">
                      Number of Rounds
                    </label>
                    <input
                      type="text"
                      name="rounds"
                      value={formData.rounds}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#303134] border border-transparent rounded-xl text-[#e8eaed]
                               focus:outline-none focus:border-[#8ab4f8] focus:bg-[#303134] transition-all
                               placeholder-[#5f6368]"
                      placeholder="e.g., 3 rounds"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#e8eaed] mb-2">
                      Topics Asked
                    </label>
                    <input
                      type="text"
                      name="topics_asked"
                      value={formData.topics_asked}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#303134] border border-transparent rounded-xl text-[#e8eaed]
                               focus:outline-none focus:border-[#8ab4f8] focus:bg-[#303134] transition-all
                               placeholder-[#5f6368]"
                      placeholder="e.g., DSA, System Design, DBMS"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#e8eaed] mb-2">
                      Detailed Experience <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      required
                      rows="5"
                      className="w-full px-4 py-3 bg-[#303134] border border-transparent rounded-xl text-[#e8eaed]
                               focus:outline-none focus:border-[#8ab4f8] focus:bg-[#303134] transition-all
                               placeholder-[#5f6368] resize-none"
                      placeholder="Share your complete interview experience, questions asked, tips for others..."
                    />
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-amber-300 text-xs text-center">
                    💡 Your experience will be reviewed within 24 hours. OACoins will be credited after verification.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="flex-1 px-6 py-3.5 bg-[#303134] text-[#e8eaed] rounded-full font-medium
                             hover:bg-[#3c4043] transition-all duration-300
                             disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3.5 bg-[#8ab4f8] text-[#202124] rounded-full font-bold
                             hover:bg-[#aecbfa] transition-all duration-300
                             disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#202124]/30 border-t-[#202124] rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <FaPlus />
                        <span>Submit Experience</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

AddExperienceModal.displayName = 'AddExperienceModal';

// View Experience Modal
const ViewExperienceModal = ({ experience, onClose }) => {
  if (!experience) return null;

  const sanitizedExperience = experience.experience ? DOMPurify.sanitize(experience.experience, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'code', 'pre', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  }) : '';

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-[#202124] rounded-[32px] max-w-4xl w-full my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 pb-6 border-b border-white/5 flex justify-between items-start bg-[#202124] sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${experience.result === 'Selected' ? 'bg-green-400/10 text-green-400' :
                  experience.result === 'Rejected' ? 'bg-red-400/10 text-red-400' :
                    'bg-yellow-400/10 text-yellow-400'
                }`}>
                {experience.result}
              </span>
              <span className="text-[#9aa0a6] text-sm flex items-center gap-1">
                <FaCalendar className="text-[#8ab4f8]" size={12} />
                {experience.interview_date}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-medium text-[#e8eaed] mb-2">{experience.company}</h2>
            <p className="text-xl text-[#9aa0a6]">{experience.role}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#303134] text-[#e8eaed] hover:bg-[#3c4043] transition-colors"
          >
            <FaTimesCircle size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          <div className="flex flex-wrap gap-4 mb-8">
            {experience.college && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#303134] text-[#e8eaed] text-sm">
                <FaGraduationCap className="text-[#8ab4f8]" />
                {experience.college}
              </div>
            )}
            {experience.difficulty && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#303134] text-[#e8eaed] text-sm">
                <FaStar className={
                  experience.difficulty === 'Easy' ? 'text-green-400' :
                    experience.difficulty === 'Hard' ? 'text-red-400' : 'text-yellow-400'
                } />
                {experience.difficulty}
              </div>
            )}
            {experience.rounds && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#303134] text-[#e8eaed] text-sm">
                <FaCheckCircle className="text-[#8ab4f8]" />
                {experience.rounds} Rounds
              </div>
            )}
          </div>

          {experience.topics_asked && (
            <div className="mb-8 p-6 bg-[#303134]/50 rounded-2xl border border-white/5">
              <h4 className="text-[#8ab4f8] text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                <FaLightbulb /> Topics Covered
              </h4>
              <p className="text-[#e8eaed] leading-relaxed">{experience.topics_asked}</p>
            </div>
          )}

          <div className="prose prose-invert prose-lg max-w-none
               prose-headings:text-[#e8eaed] prose-headings:font-medium
               prose-p:text-[#bdc1c6] prose-p:leading-loose
               prose-strong:text-[#e8eaed]
               prose-a:text-[#8ab4f8]
               prose-li:text-[#bdc1c6]
               prose-code:text-[#f28b82] prose-code:bg-[#f28b82]/10 prose-code:px-1 prose-code:rounded
               prose-pre:bg-[#000] prose-pre:border prose-pre:border-white/10"
            dangerouslySetInnerHTML={{ __html: sanitizedExperience }}
          />
        </div>
      </div>
    </div>
  );
};


const InterviewExperiences = () => {
  useScrollToTop();
  const { isAuthenticated, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Fetch experiences from API
  const fetchExperiences = async (offset = 0, append = false, search = '') => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const url = `${API_ENDPOINTS.INTERVIEW_EXPERIENCES}?action=get_all&limit=12&offset=${offset}${searchParam}`;

      const response = await fetch(url, {
        headers: getApiHeaders()
      });

      const data = await response.json();

      if (data.status === 'success') {
        if (append) {
          setExperiences(prev => [...prev, ...(data.data || [])]);
        } else {
          setExperiences(data.data || []);
        }
        setTotalCount(data.total || 0);
        setHasMore(data.hasMore || false);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch experiences');
      }
    } catch (err) {
      console.error('Error fetching experiences:', err);
      setError(`Failed to load experiences: ${err.message}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchExperiences(0, false, searchTerm);
  };

  useEffect(() => {
    fetchExperiences(0, false);
  }, []);

  // Load more handler - fetches next batch from server
  const loadMore = () => {
    fetchExperiences(experiences.length, true, searchTerm);
  };


  return (
    <div className="min-h-screen bg-black text-[#e8eaed] font-sans selection:bg-[#8ab4f8]/30">
      <Navbar />

      {/* Subtle ambient light for depth only, no strong gradients */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-normal tracking-tight text-[#e8eaed] mb-6">
            Interview Experiences
          </h2>
          <p className="text-xl text-[#9aa0a6] leading-relaxed mb-8">
            Choose the perfect plan for your journey. Real interview experiences shared by students from top companies to help you prepare.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                if (!isAuthenticated()) {
                  alert('Please login to share your interview experience');
                  return;
                }
                setShowAddModal(true);
              }}
              className="px-8 py-4 rounded-full bg-[#e8eaed] text-black font-medium hover:bg-white transition-all duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <FaPlus />
              <span>Share Experience</span>
            </button>
            {!isAuthenticated() && (
              <span className="text-[#9aa0a6] text-sm">Login to earn OACoins</span>
            )}
          </div>
        </div>

        {/* Search Bar - Minimal */}
        {!loading && (
          <form onSubmit={handleSearch} className="mb-16 max-w-3xl mx-auto relative flex gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#9aa0a6]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <input
                type="text"
                placeholder="Search companies, roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-[#202124] border border-transparent rounded-full text-[#e8eaed] placeholder-[#5f6368] 
                         focus:bg-[#303134] focus:outline-none transition-all shadow-lg"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    fetchExperiences(0, false, '');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9aa0a6] hover:text-[#e8eaed] transition-colors p-2"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-[#8ab4f8] text-[#202124] rounded-full font-bold hover:bg-[#aecbfa] transition-colors shadow-lg whitespace-nowrap"
            >
              Search
            </button>
          </form>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8ab4f8]"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-6 py-4 rounded-2xl mb-8 max-w-2xl mx-auto text-center">
            <p>{error}</p>
          </div>
        )}

        {/* Experiences Grid */}
        {!loading && (
          <>
            {experiences.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-[#202124] rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaBriefcase className="text-3xl text-[#5f6368]" />
                </div>
                <p className="text-[#e8eaed] text-xl font-medium mb-2">No experiences found</p>
                <p className="text-[#9aa0a6]">Be the first to share one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {experiences.map((exp, index) => (
                  <div
                    key={index}
                    className="group flex flex-col bg-[#202124] rounded-[28px] p-8 border border-transparent hover:border-[#5f6368] transition-all duration-300 hover:-translate-y-1 relative"
                  >
                    <div className="mb-6 flex justify-between items-start">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${exp.result === 'Selected' ? 'bg-[#34a853]/10 text-[#34a853]' :
                          exp.result === 'Rejected' ? 'bg-[#ea4335]/10 text-[#ea4335]' :
                            'bg-[#fbbc04]/10 text-[#fbbc04]'
                        }`}>
                        {exp.result || 'Pending'}
                      </span>
                      {exp.interview_type && (
                        <span className="text-[#9aa0a6] text-xs font-medium border border-[#5f6368] px-2 py-0.5 rounded-full">
                          {exp.interview_type}
                        </span>
                      )}
                    </div>

                    <div className="mb-1">
                      <h3 className="text-3xl font-normal text-[#e8eaed] tracking-tight leading-tight">{exp.company}</h3>
                    </div>
                    <div className="mb-8">
                      <p className="text-lg text-[#9aa0a6] font-normal">{exp.role}</p>
                    </div>

                    <button
                      onClick={() => setSelectedExperience(exp)}
                      className="w-full py-3 rounded-full bg-[#8ab4f8] text-[#202124] font-medium hover:bg-[#aecbfa] transition-colors mb-8 mt-auto"
                    >
                      Read Experience
                    </button>

                    <div className="space-y-4 border-t border-[#3c4043] pt-6">
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="mt-0.5 text-[#8ab4f8] flex-shrink-0" size={16} />
                        <span className="text-[#e8eaed] text-sm">
                          {exp.difficulty || 'Medium'} Difficulty
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <FaCheckCircle className="mt-0.5 text-[#8ab4f8] flex-shrink-0" size={16} />
                        <span className="text-[#e8eaed] text-sm">
                          {exp.rounds || 'N/A'} Rounds
                        </span>
                      </div>
                      {exp.topics_asked && (
                        <div className="flex items-start gap-3">
                          <FaCheckCircle className="mt-0.5 text-[#8ab4f8] flex-shrink-0" size={16} />
                          <span className="text-[#e8eaed] text-sm line-clamp-1" title={exp.topics_asked}>
                            {exp.topics_asked}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center mt-16">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-4 rounded-full border border-[#5f6368] text-[#e8eaed] hover:bg-[#303134] transition-all disabled:opacity-50 font-medium"
                >
                  {loadingMore ? 'Loading...' : 'Load More Experiences'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AddExperienceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        userEmail={user?.email}
      />

      <ViewExperienceModal
        experience={selectedExperience}
        onClose={() => setSelectedExperience(null)}
      />
    </div>
  );
};

export default InterviewExperiences;
