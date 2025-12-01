import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiX, FiSearch, FiHeart, FiCode, FiClock, FiTrendingUp } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS, getApiHeaders } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';

const PLAN_TIERS = [
    { label: 'Starter', min: 0, max: 5, color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' },
    { label: 'Popular', min: 6, max: 14, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
    { label: 'Hot', min: 15, max: Infinity, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
];

const getTierInfo = (count) => {
    return PLAN_TIERS.find(({ min, max }) => count >= min && count <= max) || PLAN_TIERS[0];
};

const formatDate = (dateString) => {
    if (!dateString) return 'Recently updated';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return 'Recently updated';
    }
};

// Clean HTML content: remove emojis and fix double bullets
const cleanHtmlContent = (html) => {
    if (!html) return null;
    
    // Remove emojis (covers most emoji ranges)
    let cleaned = html.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu, '');
    
    // Fix double bullets: remove bullet characters at start of li content since CSS adds them
    cleaned = cleaned.replace(/<li>\s*[•·‣⁃◦▪▸►]\s*/gi, '<li>');
    cleaned = cleaned.replace(/<li>\s*[-–—]\s*/gi, '<li>');
    
    // Remove standalone bullet/dot characters that might cause double dots
    cleaned = cleaned.replace(/^\s*[•·]\s*/gm, '');
    
    // Clean up any extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
};

const CompanyInsightsShowcase = ({ limit = 60, minQuestions = 1, showNavbar = true }) => {
    const { user } = useAuth();
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [likeCounts, setLikeCounts] = useState({});
    const [likedCompanies, setLikedCompanies] = useState(new Set());

    // Fetch like counts
    const fetchLikeCounts = async () => {
        try {
            const response = await fetch(`${API_ENDPOINTS.COMPANY_INSIGHT_LIKES}?action=get_likes`, {
                headers: getApiHeaders(),
            });
            const data = await response.json();
            if (data.status === 'success') {
                setLikeCounts(data.data || {});
            }
        } catch (err) {
            console.error('Failed to fetch likes:', err);
        }
    };

    const fetchInsights = async () => {
        setError(null);
        setLoading(true);
        try {
            const url = `${API_ENDPOINTS.COMPANY_INSIGHTS}?limit=${limit}&min_questions=${minQuestions}`;
            const response = await fetch(url, {
                headers: getApiHeaders(),
            });

            const payload = await response.json();
            if (!response.ok || payload.status !== 'success') {
                throw new Error(payload.message || 'Unable to load insights');
            }

            setInsights(payload.data || []);
        } catch (err) {
            setError(err.message || 'Unexpected error while fetching insights');
            setInsights([]);
        } finally {
            setLoading(false);
        }
    };

    // Toggle like for a company
    const handleLike = async (e, companyName) => {
        e.stopPropagation();
        
        try {
            const response = await fetch(API_ENDPOINTS.COMPANY_INSIGHT_LIKES, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    action: 'toggle_like',
                    company_name: companyName,
                    user_id: user?.id || null
                })
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                setLikeCounts(prev => ({
                    ...prev,
                    [companyName]: data.like_count
                }));
                
                setLikedCompanies(prev => {
                    const newSet = new Set(prev);
                    if (data.liked) {
                        newSet.add(companyName);
                    } else {
                        newSet.delete(companyName);
                    }
                    return newSet;
                });
            }
        } catch (err) {
            console.error('Failed to toggle like:', err);
        }
    };

    useEffect(() => {
        fetchInsights();
        fetchLikeCounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit, minQuestions]);

    const formattedInsights = useMemo(() => {
        const mapped = (insights || []).map((insight, index) => {
            const aiSummary = insight.ai_summary || {};
            const questionCount = insight.question_count || (insight.question_ids?.length ?? 0);
            const tierInfo = getTierInfo(questionCount);
            const companyName = insight.company_name;
            
            // Extract top 3 topics for card preview
            const topics = aiSummary.recurring_topics || [];
            const topTopics = topics.slice(0, 3).map(t => typeof t === 'string' ? t : t?.topic || '').filter(Boolean);
            
            // Create a short summary for card preview (first 100 chars)
            const fullSummary = aiSummary.high_level_summary || 'Fresh insights are on the way.';
            const shortSummary = fullSummary.length > 100 ? fullSummary.substring(0, 100) + '...' : fullSummary;

            return {
                id: `${companyName}-${index}`,
                companyName,
                canonicalName: insight.canonical_name,
                questionCount,
                topics,
                topTopics,
                patterns: aiSummary.question_patterns || [],
                tips: aiSummary.actionable_tips || [],
                summary: fullSummary,
                shortSummary,
                htmlContent: aiSummary.html_insights || null,
                signal: aiSummary.external_signal || '',
                tierInfo,
                updatedAt: insight.updated_at,
                primaryLink: (insight.question_links && insight.question_links[0]?.url) || null,
                allQuestions: insight.question_links || [],
                likeCount: likeCounts[companyName] || 0,
                isLiked: likedCompanies.has(companyName),
            };
        });

        // Sort by likes (descending)
        mapped.sort((a, b) => b.likeCount - a.likeCount);

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return mapped.filter(insight => 
                insight.companyName.toLowerCase().includes(query) ||
                insight.canonicalName?.toLowerCase().includes(query)
            );
        }
        return mapped;
    }, [insights, searchQuery, likeCounts, likedCompanies]);

    const selectedInsight = useMemo(() => 
        formattedInsights.find(i => i.id === selectedId), 
    [selectedId, formattedInsights]);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setSelectedId(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const headlineCopy =
        formattedInsights.length > 0
            ? 'Select a company to reveal OA insights'
            : 'Insights to guide every online assessment';

    return (
        <>
            {showNavbar && <Navbar />}
            <section className={`bg-black text-white py-16 px-4 sm:px-6 lg:px-8 relative z-0 ${showNavbar ? 'pt-24' : ''}`}>
                <div className="max-w-6xl mx-auto space-y-12">
                    <header className="text-center space-y-4">
                        <p className="text-xs tracking-[0.3em] uppercase text-white/50">Company OA Insights</p>
                        <h2 className="text-3xl sm:text-4xl font-semibold text-white">
                            {headlineCopy}
                        </h2>
                        <p className="text-white/60 max-w-3xl mx-auto text-base">
                             Tap any card to unlock the full breakdown: repeat chances, platforms used (HackerRank, CodeSignal), and every question we have on file.
                        </p>
                    </header>

                    {/* Search Bar */}
                    <div className="max-w-md mx-auto">
                        <div className="relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search companies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                                >
                                    <FiX size={16} />
                                </button>
                            )}
                        </div>
                        {searchQuery && (
                            <p className="text-center text-white/50 text-sm mt-2">
                                {formattedInsights.length} {formattedInsights.length === 1 ? 'company' : 'companies'} found
                            </p>
                        )}
                    </div>

               

                {error && (
                    <div className="max-w-3xl mx-auto text-center bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {loading
                        ? Array.from({ length: 6 }).map((_, idx) => (
                              <div key={idx} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
                          ))
                        : formattedInsights.map((insight) => (
                              <motion.div
                                  layoutId={`card-${insight.id}`}
                                  key={insight.id}
                                  onClick={() => setSelectedId(insight.id)}
                                  className="group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 flex flex-col"
                                  whileHover={{ y: -6, scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                              >
                                  {/* Card Header */}
                                  <div className="p-5 pb-3 border-b border-white/5">
                                      <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1 min-w-0">
                                              <motion.div 
                                                layoutId={`tier-${insight.id}`} 
                                                className="flex items-center gap-2 mb-2"
                                              >
                                                  <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-semibold ${insight.tierInfo.bg} ${insight.tierInfo.color} ${insight.tierInfo.border} border`}>
                                                      {insight.tierInfo.label}
                                                  </span>
                                                  {insight.questionCount >= 15 && (
                                                      <FiTrendingUp className="text-orange-400" size={14} />
                                                  )}
                                              </motion.div>
                                              <motion.h3 
                                                layoutId={`title-${insight.id}`}
                                                className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1"
                                              >
                                                  {insight.companyName}
                                              </motion.h3>
                                          </div>
                                          <button
                                              onClick={(e) => handleLike(e, insight.companyName)}
                                              className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
                                                  insight.isLiked 
                                                      ? 'text-pink-400 bg-pink-500/20 border border-pink-500/30' 
                                                      : 'text-white/40 hover:text-pink-400 hover:bg-pink-500/10 border border-transparent'
                                              }`}
                                          >
                                              <FiHeart className={insight.isLiked ? 'fill-current' : ''} size={14} />
                                              {insight.likeCount > 0 && (
                                                  <span className="text-xs font-medium">{insight.likeCount}</span>
                                              )}
                                          </button>
                                      </div>
                                  </div>
                                  
                                  {/* Card Body */}
                                  <div className="p-5 pt-4 flex-1 flex flex-col gap-4">
                                      {/* Summary Preview */}
                                      <p className="text-sm text-white/60 leading-relaxed line-clamp-2 flex-shrink-0">
                                          {insight.shortSummary}
                                      </p>
                                      
                                      {/* Topics Tags */}
                                      {insight.topTopics.length > 0 && (
                                          <div className="flex flex-wrap gap-1.5">
                                              {insight.topTopics.map((topic, i) => (
                                                  <span 
                                                      key={i} 
                                                      className="px-2 py-1 bg-white/5 text-white/70 rounded-md text-xs border border-white/10"
                                                  >
                                                      {topic}
                                                  </span>
                                              ))}
                                              {insight.topics.length > 3 && (
                                                  <span className="px-2 py-1 text-white/40 text-xs">
                                                      +{insight.topics.length - 3} more
                                                  </span>
                                              )}
                                          </div>
                                      )}
                                      
                                      {/* Stats Row */}
                                      <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                                          <motion.div layoutId={`count-${insight.id}`} className="flex items-center gap-2">
                                              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                                  <FiCode className="text-emerald-400" size={14} />
                                              </div>
                                              <div>
                                                  <span className="text-lg font-bold text-white">{insight.questionCount}</span>
                                                  <span className="text-xs text-white/50 ml-1">questions</span>
                                              </div>
                                          </motion.div>
                                          
                                          <div className="flex items-center gap-1.5 text-white/40">
                                              <FiClock size={12} />
                                              <span className="text-xs">{formatDate(insight.updatedAt)}</span>
                                          </div>
                                      </div>
                                  </div>
                                  
                                  {/* Hover Overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                  
                                  {/* Click Indicator */}
                                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                      <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center border border-emerald-500/50">
                                          <FiArrowUpRight className="text-emerald-400" size={14} />
                                      </div>
                                  </div>
                              </motion.div>
                          ))}
                </div>

                {/* More Coming Soon */}
                {!loading && formattedInsights.length > 0 && !searchQuery && (
                    <div className="text-center mt-8 py-6">
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
                            <span className="flex gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </span>
                            <span className="text-white/60 text-sm font-medium">More companies coming soon</span>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedId && selectedInsight && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedId(null)}
                            className="fixed inset-0 bg-black/90 backdrop-blur-md z-40"
                        />
                        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4 sm:p-6">
                            <motion.div
                                layoutId={`card-${selectedId}`}
                                className="pointer-events-auto w-full max-w-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                            >
                                {/* Header - Fixed */}
                                <div className="relative p-6 sm:p-8 border-b border-white/10 bg-zinc-950/80 backdrop-blur-sm flex-shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedId(null);
                                        }}
                                        className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200"
                                    >
                                        <FiX size={18} />
                                    </button>

                                    <div className="space-y-3 pr-12">
                                        <motion.div layoutId={`tier-${selectedId}`} className="inline-flex items-center gap-3 flex-wrap">
                                            <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider font-semibold ${selectedInsight.tierInfo.bg} ${selectedInsight.tierInfo.color} ${selectedInsight.tierInfo.border} border`}>
                                                {selectedInsight.tierInfo.label}
                                            </span>
                                            <span className="text-sm text-white/50">Updated {formatDate(selectedInsight.updatedAt)}</span>
                                        </motion.div>
                                        
                                        <div className="flex flex-col gap-2">
                                            <motion.h2 
                                                layoutId={`title-${selectedId}`}
                                                className="text-2xl sm:text-3xl font-bold text-white leading-tight"
                                            >
                                                {selectedInsight.companyName}
                                            </motion.h2>
                                            <motion.div layoutId={`count-${selectedId}`} className="flex items-center gap-2">
                                                <span className="text-2xl font-semibold text-emerald-400">{selectedInsight.questionCount}</span>
                                                <span className="text-white/60">questions available</span>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>

                                {/* Scrollable Content */}
                                <div 
                                    className="flex-1 overflow-y-auto bg-zinc-900/50"
                                    style={{
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: 'rgba(255,255,255,0.2) transparent'
                                    }}
                                >
                                    <div className="p-6 sm:p-8 space-y-8">
                                        {/* AI Insights Section */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <h3 className="text-sm uppercase tracking-wider text-white/40 font-medium mb-4">AI Insights</h3>
                                            <div className="bg-white/5 rounded-2xl p-5 sm:p-6 border border-white/10">
                                                {selectedInsight.htmlContent ? (
                                                    <div
                                                        className="text-white/90 text-base leading-relaxed space-y-4 
                                                            [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-3 [&_h1]:mt-4
                                                            [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mb-2 [&_h2]:mt-4
                                                            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white/90 [&_h3]:mb-2 [&_h3]:mt-3
                                                            [&_p]:text-white/80 [&_p]:leading-7 [&_p]:mb-3
                                                            [&_ul]:space-y-2 [&_ul]:my-3 [&_ul]:pl-0 [&_ul]:list-none
                                                            [&_ol]:space-y-2 [&_ol]:my-3 [&_ol]:pl-0
                                                            [&_li]:text-white/80 [&_li]:leading-6 [&_li]:pl-5 [&_li]:relative
                                                            [&_li]:before:content-['•'] [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-emerald-400
                                                            [&_strong]:text-white [&_strong]:font-semibold
                                                            [&_em]:text-emerald-300 [&_em]:not-italic
                                                            [&_code]:bg-white/10 [&_code]:px-2 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-emerald-300
                                                            [&_a]:text-emerald-400 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-emerald-300"
                                                        dangerouslySetInnerHTML={{ __html: cleanHtmlContent(selectedInsight.htmlContent) }}
                                                    />
                                                ) : (
                                                    <div className="space-y-4">
                                                        <p className="text-white/80 text-base leading-7">{selectedInsight.summary}</p>
                                                        {selectedInsight.tips.length > 0 && (
                                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                                <p className="text-sm font-medium text-white/60 mb-3">Key Tips:</p>
                                                                <ul className="space-y-2">
                                                                    {selectedInsight.tips.map((tip, i) => (
                                                                        <li key={i} className="flex items-start gap-3 text-white/80 leading-6">
                                                                            <span className="text-emerald-400 mt-1">•</span>
                                                                            <span>{tip}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>

                                        {/* Topics Section */}
                                        {selectedInsight.topics.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15 }}
                                            >
                                                <h3 className="text-sm uppercase tracking-wider text-white/40 font-medium mb-4">Common Topics</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedInsight.topics.map((topicItem, i) => {
                                                        // Handle both string and object formats
                                                        const topicName = typeof topicItem === 'string' ? topicItem : topicItem?.topic || '';
                                                        const topicCount = typeof topicItem === 'object' ? topicItem?.count : null;
                                                        if (!topicName) return null;
                                                        return (
                                                            <span 
                                                                key={i} 
                                                                className="px-3 py-1.5 bg-blue-500/15 text-blue-300 rounded-full text-sm font-medium border border-blue-500/20 flex items-center gap-2"
                                                            >
                                                                {topicName}
                                                                {topicCount && (
                                                                    <span className="text-xs text-blue-400/70">({topicCount})</span>
                                                                )}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Questions List */}
                                        {selectedInsight.allQuestions.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm uppercase tracking-wider text-white/40 font-medium">Question Vault</h3>
                                                    <span className="text-xs text-white/30">{selectedInsight.allQuestions.length} questions</span>
                                                </div>
                                                
                                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}>
                                                    {selectedInsight.allQuestions.map((q, idx) => {
                                                        // Extract path from full URL for React Router navigation
                                                        const getRouterPath = (url) => {
                                                            if (!url) return '/';
                                                            try {
                                                                const urlObj = new URL(url);
                                                                return urlObj.pathname + urlObj.search;
                                                            } catch {
                                                                // If URL parsing fails, try to extract path directly
                                                                const match = url.match(/\/question-with-editor\/[^?]+(\?.*)?$/);
                                                                return match ? match[0] : url;
                                                            }
                                                        };
                                                        
                                                        return (
                                                            <Link
                                                                key={`${selectedId}-q-${idx}`}
                                                                to={getRouterPath(q.url)}
                                                                className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 transition-all duration-200 group"
                                                            >
                                                                <div className="flex items-start gap-4">
                                                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/30 transition-colors mt-0.5">
                                                                        <FiArrowUpRight size={18} />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-white font-semibold text-base group-hover:text-emerald-300 transition-colors leading-snug">
                                                                            {q.title}
                                                                        </p>
                                                                        {q.ai_insight && (
                                                                            <p className="text-sm text-white/60 mt-2 leading-relaxed">
                                                                                {q.ai_insight}
                                                                            </p>
                                                                        )}
                                                                        {q.difficulty && (
                                                                            <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                                                                                q.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                                                                q.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                                'bg-red-500/20 text-red-400'
                                                                            }`}>
                                                                                {q.difficulty}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
            </section>
        </>
    );
};

export default CompanyInsightsShowcase;
