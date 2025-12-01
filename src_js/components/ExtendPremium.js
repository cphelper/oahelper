import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import SEO from './SEO';
import { FaCoins, FaRocket, FaClock, FaCheckCircle, FaArrowRight, FaWhatsapp, FaTelegram, FaShareAlt } from 'react-icons/fa';
import useScrollToTop from '../hooks/useScrollToTop';
import { useAuth } from '../contexts/AuthContext';

function ExtendPremium() {
    useScrollToTop();
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const [userBalance, setUserBalance] = useState(0);
    const [daysAvailable, setDaysAvailable] = useState(0);

    useEffect(() => {
        if (isAuthenticated() && user) {
            const balance = user.oacoins || 0;
            setUserBalance(balance);
            setDaysAvailable(Math.floor(balance / 3.5));
        }
    }, [isAuthenticated, user]);

    const pricingData = [
        { days: 1, coins: 3.5 },
        { days: 7, coins: 24.5 },
        { days: 30, coins: 105 },
        { days: 90, coins: 315 },
    ];

    const benefits = [
        'Instant activation - no waiting',
        'Flexible duration - extend by any number of days',
        'No payment hassle - use your existing coins',
        'Never lose access - extend before expiry',
    ];

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            <SEO
                title="Extend Premium with OACoins | OAHelper"
                description="Learn how to earn OACoins and extend your premium subscription. Flexible, instant, and hassle-free premium extension using coins."
                keywords="OACoins, extend premium, earn coins, premium subscription, flexible payment"
            />

            {/* Grid Background Pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-25"
                style={{
                    backgroundImage: `
                        linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px),
                        linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px)
                    `,
                    backgroundSize: '45px 45px',
                    backgroundPosition: '16px 14px, 0 14px',
                    maskImage: 'linear-gradient(-20deg, transparent 50%, white)',
                    WebkitMaskImage: 'linear-gradient(-20deg, transparent 50%, white)',
                    zIndex: 1
                }}
            />

            {/* Minimal background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl opacity-20"></div>
            </div>

            <Navbar />

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="inline-block mb-6">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 mx-auto">
                            <FaCoins className="text-4xl text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Extend Premium with OACoins
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto">
                        Use your OACoins to extend your premium subscription. Flexible, instant, and hassle-free!
                    </p>
                </div>

                {/* User Balance Card (if authenticated) */}
                {isAuthenticated() && (
                    <div className="mb-12">
                        <div className="backdrop-blur-xl rounded-2xl border border-white/10 bg-white/5 p-8">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                                <div>
                                    <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Your Balance</p>
                                    <p className="text-5xl font-bold text-white mb-2">
                                        {userBalance.toFixed(1)} <span className="text-2xl text-gray-400">coins</span>
                                    </p>
                                    <p className="text-gray-300 text-lg">
                                        ≈ <strong className="text-white">{daysAvailable} days</strong> of premium
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/extend-premium-action')}
                                    className="flex items-center justify-center space-x-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl
                                             border border-white/20 hover:bg-white/20 transition-all duration-300 font-bold text-lg hover:scale-105"
                                >
                                    <FaRocket />
                                    <span>Extend Now</span>
                                    <FaArrowRight />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pricing Section */}
                <div className="mb-16">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-white mb-3">Simple Pricing</h2>
                        <p className="text-gray-400 text-lg">Extend your premium for any duration you want</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {pricingData.map((item, index) => (
                            <div key={index} className="backdrop-blur-xl rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                                        <FaClock className="text-2xl text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">{item.days} Day{item.days > 1 ? 's' : ''}</h3>
                                    <p className="text-3xl font-bold text-white mb-1">{item.coins}</p>
                                    <p className="text-gray-400 text-sm">coins</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <p className="text-gray-400 text-sm">
                            💡 Formula: <strong className="text-white">3.5 OACoins = 1 Day</strong> of premium access
                        </p>
                    </div>
                </div>

                {/* Earn OACoins Section */}
                <div className="mb-16">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-white mb-3">How to Earn OACoins</h2>
                        <p className="text-gray-400 text-lg">Share groups and earn coins to extend your premium</p>
                    </div>

                    <div className="max-w-2xl mx-auto">
                        <div className="backdrop-blur-xl rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 border border-white/20">
                                    <FaShareAlt className="text-3xl text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">Share Groups</h3>
                                <p className="text-gray-400 text-base mb-6 leading-relaxed max-w-lg">
                                    Share WhatsApp/Telegram groups where OA questions are being shared and earn coins for every valid group you contribute
                                </p>
                                <div className="px-6 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                                    <span className="text-white font-bold text-lg">+3.5- 24.5 coins</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="mb-16">
                    <div className="backdrop-blur-xl rounded-2xl border border-white/10 bg-white/5 p-8">
                        <h2 className="text-2xl font-bold text-white mb-6 text-center">Why Use OACoins?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-start space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                    <FaCheckCircle className="text-white text-xl flex-shrink-0 mt-1" />
                                    <p className="text-gray-400 text-base">{benefit}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Share Groups CTA */}
                <div className="mb-16">
                    <div className="backdrop-blur-xl rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">Start Earning OACoins Today!</h2>
                        <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                            Share WhatsApp or Telegram groups where OA questions are being shared and earn coins instantly
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="https://wa.me/919274985691?text=I%20want%20to%20share%20a%20group%20to%20earn%20OACoins"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center space-x-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl
                                         border border-white/20 hover:bg-white/20 transition-all duration-300 font-bold text-lg hover:scale-105"
                            >
                                <FaWhatsapp className="text-2xl" />
                                <span>Share via WhatsApp</span>
                            </a>

                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mb-16">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-white mb-3">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-4 max-w-4xl mx-auto">
                        {[
                            {
                                q: 'How do I extend my premium with OACoins?',
                                a: 'Click on your name in the navbar, select "Extend Premium", choose the number of days, and confirm. Your subscription will be extended instantly!'
                            },
                            {
                                q: 'What is the conversion rate?',
                                a: '3.5 OACoins = 1 day of premium access. You can extend for any duration from 1 to 365 days.'
                            },
                            {
                                q: 'How do I earn OACoins?',
                                a: 'Share WhatsApp/Telegram groups where OA questions are being shared. Contact us via WhatsApp or Telegram to submit groups.'
                            },
                            {
                                q: 'Is the extension instant?',
                                a: 'Yes! Once you confirm the extension, your premium subscription is extended immediately with no waiting time.'
                            },
                        ].map((faq, index) => (
                            <div key={index} className="backdrop-blur-xl rounded-xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                                <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final CTA */}
                {!isAuthenticated() && (
                    <div className="text-center">
                        <button
                            onClick={() => navigate('/signup')}
                            className="inline-flex items-center justify-center space-x-2 px-10 py-5 bg-white/10 backdrop-blur-sm text-white rounded-2xl
                                     border border-white/20 hover:bg-white/20 transition-all duration-300 font-bold text-xl hover:scale-105"
                        >
                            <FaRocket className="text-2xl" />
                            <span>Get Started - Sign Up Free</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ExtendPremium;
