import React, { useState } from 'react';
import { FaCrown, FaArrowLeft, FaCheck, FaTimes, FaBolt, FaStar, FaRocket, FaRupeeSign, FaCoins } from 'react-icons/fa';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useScrollToTop from '../hooks/useScrollToTop';

function PremiumPlans() {
    useScrollToTop();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState('rupee'); // 'rupee' or 'oacoins'

    const plans = {
        basic: {
            name: 'Basic',
            price: 99,
            duration: '30 days',
            icon: FaRocket,
            solutions: '5 Solutions Daily',
            badge: null,
            features: [
                'Unlimited Question Access',
                '5 Solutions Daily',
                'Priority Support',
                'Premium Community Access',
                'Request Missing Companies'
            ],
            buttonText: 'Get Basic'
        },
        pro: {
            name: 'Pro',
            price: 199,
            duration: '30 days',
            icon: FaStar,
            solutions: '15 Solutions Daily',
            badge: 'Most Popular',
            features: [
                'Unlimited Question Access',
                '15 Solutions Daily',
                'Priority Support',
                'Premium Community Access',
                'Request Missing Companies'
            ],
            buttonText: 'Get Pro'
        },
        unlimited: {
            name: 'Unlimited',
            price: 299,
            duration: '45 days',
            icon: FaBolt,
            solutions: 'Unlimited Solutions',
            badge: 'Best Value',
            features: [
                'Unlimited Question Access',
                'Unlimited Solutions Daily',
                'Priority Support',
                'Premium Community Access',
                'Request Missing Companies'
            ],
            buttonText: 'Get Unlimited'
        },
        yearly: {
            name: 'Yearly',
            price: 999,
            duration: '365 days',
            icon: FaCrown,
            solutions: 'Unlimited Solutions',
            badge: 'Ultimate Value',
            savings: 'Save 72%',
            features: [
                'Unlimited Question Access',
                'Unlimited Solutions Daily',
                'VIP Support Channel',
                'Premium Community Access',
                'All Future Features'
            ],
            buttonText: 'Get Yearly'
        }
    };

    const handlePlanSelect = (planKey) => {
        const planAmount = plans[planKey].price;
        navigate('/payment', { state: { selectedPlan: planAmount, paymentMethod: paymentMethod } });
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden font-sans selection:bg-white/20">
            <Navbar />
            
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-gray-300 font-medium text-xs tracking-wide uppercase">Available Now</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-semibold mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        Choose the perfect plan<br />
                        for your journey
                    </h1>
                    
                    <p className="text-xl text-gray-400 mb-10 leading-relaxed font-light">
                        Unlock unlimited solutions, premium support, and exclusive features.
                    </p>

                    {/* Payment Method Toggle */}
                    <div className="flex justify-center">
                         <div className="bg-[#1a1a1a] p-1.5 rounded-full inline-flex relative border border-white/10">
                            <button
                                onClick={() => setPaymentMethod('rupee')}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                                    paymentMethod === 'rupee'
                                        ? 'bg-white text-black shadow-lg scale-105'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <FaRupeeSign />
                                <span>Rupee</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('oacoins')}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                                    paymentMethod === 'oacoins'
                                        ? 'bg-amber-400 text-black shadow-lg scale-105'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <FaCoins />
                                <span>OACoins</span>
                            </button>
                         </div>
                    </div>
                </div>

                {/* Video Section - Minimalist */}
                <div className="max-w-5xl mx-auto mb-20">
                    <div className="bg-[#111] border border-white/10 rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative">
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-1 text-left z-10">
                                <div className="inline-flex items-center space-x-2 text-green-400 mb-4">
                                    <FaBolt />
                                    <span className="text-sm font-medium uppercase tracking-wider">Instant Activation</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
                                    Start coding in seconds
                                </h2>
                                <p className="text-gray-400 leading-relaxed mb-8">
                                    See how fast our premium activation process works. No waiting, no manual verification for OACoins.
                                </p>
                                <button 
                                    onClick={() => handlePlanSelect('basic')}
                                    className="text-white font-medium border-b border-white/30 hover:border-white pb-0.5 transition-all"
                                >
                                    Get started now &rarr;
                                </button>
                            </div>
                            
                            <div className="flex-1 w-full relative group">
                                <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
                                     <video 
                                        id="premium-video"
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        preload="none"
                                        loop
                                        muted
                                        playsInline
                                        poster="/placeholder-video.jpg" // Add a poster if available
                                        onClick={(e) => {
                                            if (e.target.paused) {
                                                e.target.play();
                                                e.target.setAttribute('controls', 'controls');
                                            }
                                        }}
                                    >
                                        <source src="/payment.mp4" type="video/mp4" />
                                    </video>
                                    
                                    {/* Play Button Overlay */}
                                    <div 
                                        className="absolute inset-0 flex items-center justify-center cursor-pointer group-hover:bg-black/20 transition-all"
                                        onClick={(e) => {
                                            const video = e.currentTarget.previousElementSibling;
                                            video.play();
                                            video.setAttribute('controls', 'controls');
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    >
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                                            <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-32">
                    {Object.entries(plans).map(([key, plan]) => (
                        <div 
                            key={key}
                            className="group relative bg-[#111] border border-white/10 rounded-[2rem] p-8 flex flex-col hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1"
                        >
                            {/* Badge */}
                            {plan.badge && (
                                <div className="absolute top-6 right-6">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        {plan.badge}
                                    </span>
                                </div>
                            )}
                            
                            <div className="mb-8">
                                <h3 className="text-2xl font-medium text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline space-x-1">
                                    {paymentMethod === 'oacoins' ? (
                                        <>
                                            <FaCoins className="text-xl text-amber-400" />
                                            <span className="text-4xl font-semibold text-white">{plan.price}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-2xl text-gray-400">₹</span>
                                            <span className="text-4xl font-semibold text-white">{plan.price}</span>
                                        </>
                                    )}
                                    <span className="text-gray-500 text-sm ml-2">/{plan.duration}</span>
                                </div>
                                {plan.savings && (
                                    <p className="text-green-400 text-sm mt-2 font-medium">{plan.savings}</p>
                                )}
                            </div>

                            <div className="flex-grow">
                                <p className="text-gray-400 text-sm mb-6 pb-6 border-b border-white/10">
                                    Get started with your Google account.
                                </p>
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start space-x-3">
                                            <FaCheck className="text-blue-400 text-sm mt-1 flex-shrink-0" />
                                            <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                onClick={() => handlePlanSelect(key)}
                                className={`w-full py-4 rounded-full font-medium text-sm transition-all duration-300 transform active:scale-95 ${
                                    key === 'pro' || key === 'yearly'
                                        ? 'bg-white text-black hover:bg-gray-200'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                {plan.buttonText}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Back Button */}
                <div className="text-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 text-gray-500 hover:text-white font-medium transition-colors duration-300 flex items-center justify-center space-x-2 mx-auto"
                    >
                        <FaArrowLeft />
                        <span>Return to Home</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PremiumPlans;
