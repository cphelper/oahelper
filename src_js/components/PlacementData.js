import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';
import Navbar from './Navbar';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus, FaCoins, FaCheck, FaChevronDown, FaChevronUp } from 'react-icons/fa';

// Separate memoized modal component to prevent parent re-renders
const AddEntryModal = React.memo(({ isOpen, onClose, userEmail }) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    college: '',
    company: '',
    role: '',
    oa_date: '',
    oa_time: '',
    cgpa_criteria: '',
    mtech_eligible: '',
    ctc_base: '',
    other_info: ''
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
      alert('Please login to submit upcoming company info');
      return;
    }

    setSubmitting(true);

    try {
      const url = `${API_ENDPOINTS.BASE_URL}/placement-data.php?action=submit`;

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
          college: '',
          company: '',
          role: '',
          oa_date: '',
          oa_time: '',
          cgpa_criteria: '',
          mtech_eligible: '',
          ctc_base: '',
          other_info: ''
        });

        setTimeout(() => {
          onClose();
          setSubmitSuccess(false);
        }, 3000);
      } else {
        alert(data.message || 'Failed to submit data');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit data.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => !submitting && onClose()}></div>
      <div className="relative backdrop-blur-xl bg-zinc-900 border border-white/10 rounded-[2rem] shadow-2xl max-w-2xl mx-4 w-full my-8 overflow-hidden">
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
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                  <FaCheck className="text-3xl text-green-400" />
                </div>
              </div>
              <h3 className="text-3xl font-medium text-white mb-3">
                Submission Received!
              </h3>
              <p className="text-gray-400 mb-6">
                Thank you for contributing! Your data is under review.
              </p>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 inline-block">
                <div className="flex items-center justify-center space-x-2">
                  <FaCoins className="text-amber-400" />
                  <span className="text-amber-300 font-medium">You'll earn 1-10 OACoins once verified!</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-3xl font-medium text-white mb-2 text-center">
                Add Upcoming Info
              </h3>

              <p className="text-gray-400 mb-8 text-center text-base">
                Share upcoming company info and earn OACoins.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      College Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="college"
                      value={formData.college}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30
                               placeholder-gray-600 transition-all"
                      placeholder="e.g., IIT Delhi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Company Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30
                               placeholder-gray-600 transition-all"
                      placeholder="e.g., Google"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Role <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30
                               placeholder-gray-600 transition-all"
                      placeholder="e.g., Software Engineer Intern"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      OA Date
                    </label>
                    <input
                      type="text"
                      name="oa_date"
                      value={formData.oa_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30
                               placeholder-gray-600 transition-all"
                      placeholder="e.g., 15 Dec 2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      OA Time
                    </label>
                    <input
                      type="text"
                      name="oa_time"
                      value={formData.oa_time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30
                               placeholder-gray-600 transition-all"
                      placeholder="e.g., 10:00 AM"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      CGPA Criteria
                    </label>
                    <input
                      type="text"
                      name="cgpa_criteria"
                      value={formData.cgpa_criteria}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30
                               placeholder-gray-600 transition-all"
                      placeholder="e.g., 7.0+"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      MTech Eligible
                    </label>
                    <select
                      name="mtech_eligible"
                      value={formData.mtech_eligible}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      CTC (Base)
                    </label>
                    <input
                      type="text"
                      name="ctc_base"
                      value={formData.ctc_base}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30
                               placeholder-gray-600 transition-all"
                      placeholder="e.g., 15 LPA"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Additional Information
                    </label>
                    <textarea
                      name="other_info"
                      value={formData.other_info}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white
                               focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30
                               placeholder-gray-600 resize-none transition-all"
                      placeholder="Any additional details about the placement process..."
                    />
                  </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-amber-300 text-xs text-center font-medium">
                    💡 Your submission will be reviewed within 2 hours.
                  </p>
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="flex-1 px-6 py-4 bg-white/5 text-white rounded-full font-medium
                             hover:bg-white/10 transition-all duration-300
                             border border-white/5 hover:border-white/10 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-4 bg-white text-black rounded-full font-bold
                             hover:bg-gray-200 transition-all duration-300
                             disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <FaPlus />
                        <span>Submit Data</span>
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

AddEntryModal.displayName = 'AddEntryModal';

const PlacementData = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [placementData, setPlacementData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Fetch placement data from API with pagination and search
  const fetchPlacementData = async (offset = 0, append = false, search = '') => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const limit = 10;
      let url = `${API_ENDPOINTS.BASE_URL}/placement-data.php?action=get_all&limit=${limit}&offset=${offset}`;

      // Add search parameter if provided
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }



      const response = await fetch(url, {
        headers: getApiHeaders()
      });

      const data = await response.json();


      if (data.status === 'success') {
        // Transform API data to match component structure
        const transformedData = data.data.map(item => ({
          timestamp: item.timestamp,
          college: item.college,
          company: item.company,
          role: item.role,
          oaDate: item.oa_date,
          oaTime: item.oa_time,
          cgpa: item.cgpa_criteria,
          mtechEligible: item.mtech_eligible,
          ctc: item.ctc_base,
          otherInfo: item.other_info
        }));

        if (append) {
          setPlacementData(prev => [...prev, ...transformedData]);
        } else {
          setPlacementData(transformedData);
        }

        setTotalCount(data.total);
        setHasMore(data.has_more);
        setError(null);
      } else {
        console.error('API error:', data.message);
        setError(data.message || 'Failed to fetch placement data');
      }
    } catch (err) {
      console.error('Error fetching placement data:', err);
      setError(`Failed to load placement data: ${err.message}`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPlacementData(0, false, '');
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPlacementData(0, false, searchTerm);
  };

  // Load more handler
  const loadMore = () => {
    const currentOffset = placementData.length;
    fetchPlacementData(currentOffset, true, searchTerm);
  };

  // Data is already filtered by server, just display it
  const displayedData = placementData;
  const showLoadMore = hasMore;

  // Toggle card expansion
  const toggleCardExpansion = React.useCallback((index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
      <Navbar />

      {/* Subtle Background Pattern - Dots instead of grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        {/* Clean Heading Section */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-medium tracking-tight mb-6 text-white">
            Upcoming Company Info
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed mb-10">
            Real-time placement insights from top colleges across India.
          </p>

          {/* Add Entry Button */}
          <button
            onClick={() => {
              if (!isAuthenticated) {
                alert('Please login to submit upcoming company info');
                return;
              }
              setShowAddEntryModal(true);
            }}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <FaPlus className="text-sm" />
            <span>Add Company Info</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-black/10 text-xs font-bold">
              Earn OACoins
            </span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-500/20 text-red-300 px-6 py-4 rounded-2xl mb-8 text-center max-w-2xl mx-auto">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && (
          <>

            {/* Search Bar - Minimalist */}
            <div className="mb-12">
              <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search companies, roles, colleges..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-8 py-4 bg-zinc-900/50 border border-white/10 rounded-full text-white placeholder-gray-500 
                       focus:border-white/30 focus:outline-none transition-all backdrop-blur-md
                         text-base hover:border-white/20"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        fetchPlacementData(0, false, '');
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors shadow-lg whitespace-nowrap"
                >
                  Search
                </button>
              </form>
              {totalCount > 0 && (
                <div className="text-center mt-4 text-sm text-gray-500">
                  Showing {placementData.length} of {totalCount} entries
                </div>
              )}
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedData.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                    <span className="text-4xl grayscale opacity-50">📊</span>
                  </div>
                  <p className="text-gray-400 text-lg font-medium">No placement data found</p>
                </div>
              ) : (
                displayedData.map((item, index) => {
                  const isUpcoming = item.oaDate && new Date(item.oaDate.split('/').reverse().join('-')) > new Date();
                  const isExpanded = expandedCards[index];
                  const hasLongInfo = item.otherInfo && item.otherInfo.length > 100;

                  return (
                    <div key={index} className="group relative flex flex-col h-full">
                      <div className={`relative flex flex-col h-full rounded-[2.5rem] border transition-all duration-300 p-8 ${isUpcoming
                          ? 'bg-[#111] border-white/10 hover:border-amber-500/30'
                          : 'bg-[#111] border-white/10 hover:border-white/20'
                        }`}>

                        {/* Badge & Date */}
                        <div className="flex justify-between items-start mb-8">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide border ${isUpcoming
                              ? 'bg-amber-500/10 text-amber-200 border-amber-500/20'
                              : 'bg-white/5 text-zinc-400 border-white/5'
                            }`}>
                            {isUpcoming ? 'Upcoming' : 'Entry'}
                          </span>
                          <span className="text-zinc-600 text-xs font-medium">{item.timestamp}</span>
                        </div>

                        {/* Header Info */}
                        <div className="mb-8">
                          <h3 className="text-3xl font-medium text-white mb-2 tracking-tight leading-tight">
                            {item.company}
                          </h3>
                          <p className="text-lg text-zinc-400 mb-1">{item.role}</p>
                          <p className="text-sm text-zinc-600">{item.college}</p>
                        </div>

                        {/* Action Button for Details */}
                        {hasLongInfo ? (
                          <button
                            onClick={() => toggleCardExpansion(index)}
                            className="w-full py-3.5 rounded-full bg-white text-black font-medium mb-8 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            {isExpanded ? 'Show Less' : 'View Details'}
                            {isExpanded ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                          </button>
                        ) : (
                          <div className="h-4"></div> // Spacer if no button
                        )}

                        {/* Features / Stats List */}
                        <div className="mt-auto space-y-4">
                          {item.oaDate && (
                            <div className="flex items-start gap-3">
                              <div className="mt-1 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <FaCheck className="text-[10px] text-white" />
                              </div>
                              <div>
                                <p className="text-zinc-300 text-sm font-medium">OA Date</p>
                                <p className="text-zinc-500 text-sm">{item.oaDate} {item.oaTime && `at ${item.oaTime}`}</p>
                              </div>
                            </div>
                          )}
                          {item.ctc && (
                            <div className="flex items-start gap-3">
                              <div className="mt-1 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <FaCheck className="text-[10px] text-white" />
                              </div>
                              <div>
                                <p className="text-zinc-300 text-sm font-medium">CTC</p>
                                <p className="text-zinc-500 text-sm">{item.ctc}</p>
                              </div>
                            </div>
                          )}
                          {item.cgpa && (
                            <div className="flex items-start gap-3">
                              <div className="mt-1 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <FaCheck className="text-[10px] text-white" />
                              </div>
                              <div>
                                <p className="text-zinc-300 text-sm font-medium">CGPA Criteria</p>
                                <p className="text-zinc-500 text-sm">{item.cgpa}</p>
                              </div>
                            </div>
                          )}
                          {item.mtechEligible && (
                            <div className="flex items-start gap-3">
                              <div className="mt-1 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                <FaCheck className="text-[10px] text-white" />
                              </div>
                              <div>
                                <p className="text-zinc-300 text-sm font-medium">MTech Eligible</p>
                                <p className="text-zinc-500 text-sm">{item.mtechEligible}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Expanded Info */}
                        {(isExpanded || (!hasLongInfo && item.otherInfo)) && item.otherInfo && (
                          <div className="mt-6 pt-6 border-t border-white/10 animate-fadeIn">
                            <p className="text-sm text-zinc-400 leading-relaxed">
                              {item.otherInfo}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Load More Button */}
            {showLoadMore && (
              <div className="mt-16 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center px-8 py-4 bg-zinc-900 border border-white/10 text-white rounded-full font-medium hover:bg-zinc-800 transition-all disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}

          </>
        )}
      </div>

      {/* Add Entry Modal */}
      <AddEntryModal
        isOpen={showAddEntryModal}
        onClose={() => setShowAddEntryModal(false)}
        userEmail={user?.email}
      />
    </div>
  );
};

export default PlacementData;
