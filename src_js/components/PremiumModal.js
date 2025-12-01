import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCrown, FaTimes, FaInfinity, FaPaperPlane, FaHeadset, FaBuilding, FaHeart, FaUsers } from 'react-icons/fa';

const PremiumModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleUpgrade = () => {
        onClose();
        navigate('/payment');
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}></div>
            <div className="relative backdrop-blur-xl bg-white/10 p-6 rounded-2xl border border-white/20
                           shadow-2xl transform animate-fade-up text-center max-w-sm mx-4">

                {/* Header */}
                <div className="mb-5">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full
                                  flex items-center justify-center mx-auto mb-3">
                        <FaCrown className="text-lg text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Premium Required</h3>
                    <p className="text-gray-300 text-sm">
                        Unlock this feature and get unlimited access
                    </p>
                </div>

                {/* Plan Selection */}
                <div className="mb-6 bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="text-base font-semibold text-white mb-4">Choose Your Plan:</h4>
                    <div className="space-y-3 text-left">

                        {/* Basic Plan */}
                        <div className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <h5 className="text-white font-semibold text-sm">Basic Plan</h5>
                                <span className="text-blue-400 font-bold text-sm">₹99/month</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-400">
                                <p>✓ Unlimited Question Access</p>
                                <p>✓ Request 5 Solutions Daily</p>
                                <p>✓ Priority Support</p>
                                <p>✓ Premium Community Access</p>
                                <p>✓ Request Missing Companies</p>
                            </div>
                        </div>

                        {/* Pro Plan - Most Popular */}
                        <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border-2 border-purple-500/30 relative">
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                MOST POPULAR
                            </div>
                            <div className="flex items-center justify-between mb-2 mt-2">
                                <h5 className="text-white font-semibold text-sm">Pro Plan</h5>
                                <span className="text-purple-400 font-bold text-sm">₹199/month</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-400">
                                <p>✓ Unlimited Question Access</p>
                                <p>✓ Request <span className="text-purple-400 font-semibold">15 Solutions Daily</span></p>
                                <p>✓ Priority Support</p>
                                <p>✓ Premium Community Access</p>
                                <p>✓ Request Missing Companies</p>
                                <p>✓ <span className="text-purple-400 font-semibold">Faster Response Times</span></p>
                            </div>
                        </div>

                        {/* Unlimited Plan - Best Value */}
                        <div className="p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/30 relative">
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg animate-pulse">
                                🎯 BEST VALUE 🎯
                            </div>
                            <div className="flex items-center justify-between mb-2 mt-2">
                                <h5 className="text-white font-semibold text-sm">Unlimited Plan</h5>
                                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 rounded-lg px-2 py-1">
                                    <span className="text-orange-300 font-bold text-xs">✨ ₹299/45 days ✨</span>
                                </div>
                            </div>
                            <div className="space-y-1 text-xs text-gray-400">
                                <p>✓ Unlimited Question Access</p>
                                <p>✓ Request <span className="text-orange-400 font-semibold">Unlimited Solutions Daily</span></p>
                                <p>✓ Priority Support</p>
                                <p>✓ Premium Community Access</p>
                                <p>✓ Request Missing Companies</p>
                                <p>✓ <span className="text-orange-400 font-semibold">Instant Response Guarantee</span></p>
                                <p>✓ <span className="text-orange-400 font-semibold">VIP Support Channel</span></p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Trust Link */}
                <div className="mb-4 text-center">
                    <button
                        onClick={() => {
                            onClose();
                            navigate('/trust-in-oahelper');
                        }}
                        className="text-blue-300 hover:text-blue-200 text-xs underline transition-colors"
                    >
                        Have doubts about Premium? See why users trust OAHelper →
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5">
                    <button
                        onClick={handleUpgrade}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700
                                 text-white font-medium py-3 px-4 rounded-lg transition-all transform hover:scale-105 text-sm"
                    >
                        Choose Your Plan & Upgrade
                    </button>
                    <button
                        onClick={handleClose}
                        className="w-full bg-gray-600/50 hover:bg-gray-600/70 text-gray-300 font-medium py-2.5 px-4 rounded-lg
                                 transition-all border border-gray-500/20 text-sm"
                    >
                        Maybe Later
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <FaTimes />
                </button>
            </div>
        </div>
    );
};

export default PremiumModal;
