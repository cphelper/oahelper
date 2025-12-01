import React from 'react';
import { FaArrowLeft, FaUndoAlt, FaClock, FaCheckCircle, FaTimesCircle, FaCreditCard, FaShieldAlt, FaCalendarAlt, FaHeadset } from 'react-icons/fa';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import DotPattern from './DotPattern';
import SEO from './SEO';

function RefundPolicy() {
    const navigate = useNavigate();

    const lastUpdated = "October 2, 2025";

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            <SEO
                title="Refund Policy | OA Helper"
                description="Learn about our refund policy including our 1-hour refund window and conditions for premium subscriptions."
                keywords="refund policy, money back guarantee, premium refund, OA Helper refund"
            />

            {/* Background Pattern */}
            <DotPattern
                width={32}
                height={32}
                cx={16}
                cy={16}
                cr={1.5}
                className="absolute inset-0 opacity-10 z-0"
            />

            <Navbar />

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="mb-8 px-4 py-2.5 bg-white/5 text-indigo-300 font-medium rounded-xl
                             border border-indigo-500/20 hover:bg-indigo-500/10
                             transition-all duration-300 flex items-center space-x-2"
                >
                    <FaArrowLeft className="mr-2" />
                    Go Back
                </button>

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full
                                  flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                        <FaUndoAlt className="text-2xl text-green-300" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent mb-4">
                        Refund Policy
                    </h1>
                    <p className="text-gray-400 text-lg">
                        We want you to be completely satisfied with your premium subscription.
                    </p>
                    <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
                        <FaCalendarAlt className="mr-2" />
                        Last updated: {lastUpdated}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="prose prose-invert max-w-none prose-headings:text-white prose-headings:font-bold
                                  prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
                                  prose-strong:text-white prose-strong:font-semibold
                                  prose-ul:text-gray-300 prose-ol:text-gray-300
                                  prose-li:mb-2 prose-li:text-gray-300">

                        {/* 1-Hour Refund Guarantee - Highlighted */}
                        <div className="mb-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
                            <div className="flex items-center mb-4">
                                <div className="bg-green-500/20 p-2 rounded-lg mr-3">
                                    <FaClock className="text-green-300" />
                                </div>
                                <h2 className="text-2xl font-bold text-green-300">1-Hour Money-Back Guarantee</h2>
                            </div>
                            <p className="text-green-200 mb-4">
                                We're confident you'll love OA Helper Premium! If you're not completely satisfied within the first hour of your purchase, we'll refund your payment in full - no questions asked.
                            </p>
                            <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-4">
                                <p className="text-green-300 font-medium">
                                    ⏰ <strong>Refund Window:</strong> Within 1 hour of purchase<br />
                                    💯 <strong>Guarantee:</strong> 100% money back, no questions asked<br />
                                    ⚡ <strong>Process:</strong> Instant refund to original payment method
                                </p>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FaCheckCircle className="mr-3 text-green-400" />
                            Eligible Refunds
                        </h2>

                        <p>You are eligible for a refund if:</p>
                        <ul>
                            <li>You request a refund within 1 hour of purchase</li>
                            <li>You haven't used premium features extensively (e.g., requested multiple solutions)</li>
                            <li>There are technical issues preventing you from using the service</li>
                            <li>You accidentally purchased a duplicate subscription</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FaTimesCircle className="mr-3 text-red-400" />
                            Non-Refundable Situations
                        </h2>

                        <p>Refunds are generally not available for:</p>
                        <ul>
                            <li>Requests made after 1 hour from purchase</li>
                            <li>Extensive use of premium features (multiple solution requests)</li>
                            <li>Violation of our Terms of Service</li>
                            <li>Disputes initiated through payment providers without contacting us first</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FaCreditCard className="mr-3 text-blue-400" />
                            Refund Process
                        </h2>

                        <p>To request a refund:</p>
                        <ol>
                            <li>Contact us within 1 hour of purchase via WhatsApp or email</li>
                            <li>Provide your transaction details and reason for the refund</li>
                            <li>We'll verify your purchase and process the refund immediately</li>
                            <li>Refunds are processed to the original payment method</li>
                        </ol>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 my-6">
                            <h3 className="text-blue-300 font-semibold mb-2 flex items-center">
                                <FaHeadset className="mr-2" />
                                Contact for Refunds:
                            </h3>
                            <p className="text-blue-200">
                                <strong>WhatsApp:</strong> +91 9274985691<br />
                                <strong>Email:</strong> refunds@oahelper.in<br />
                                <strong>Response Time:</strong> Within 30 minutes during business hours
                            </p>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FaShieldAlt className="mr-3 text-purple-400" />
                            Refund Processing Time
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                                <h3 className="text-purple-300 font-semibold mb-2">UPI Payments</h3>
                                <p className="text-gray-300 text-sm">1-3 business days</p>
                            </div>
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                                <h3 className="text-purple-300 font-semibold mb-2">Card Payments</h3>
                                <p className="text-gray-300 text-sm">5-7 business days</p>
                            </div>
                        </div>

                        <p className="text-gray-300">
                            <strong>Note:</strong> Processing times may vary depending on your bank or payment provider.
                            We'll send you a confirmation email once the refund is processed.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-6">Subscription Cancellation</h2>

                        <p>
                            You can cancel your premium subscription at any time. Upon cancellation:
                        </p>
                        <ul>
                            <li>You'll retain premium access until the end of your current billing period</li>
                            <li>No future charges will be made to your account</li>
                            <li>You can resubscribe at any time without penalty</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-6">Changes to This Policy</h2>

                        <p>
                            We may update this refund policy from time to time. Any changes will be posted on this page
                            with an updated revision date. For significant changes, we'll also notify active subscribers.
                        </p>

                        <div className="mt-8 p-4 bg-gray-500/10 border border-gray-500/20 rounded-xl">
                            <p className="text-gray-300 text-sm">
                                This refund policy is effective as of {lastUpdated}.
                                By purchasing our premium subscription, you agree to these terms.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RefundPolicy;
