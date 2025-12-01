import React from 'react';
import { FaArrowLeft, FaShieldAlt, FaUserCheck, FaDatabase, FaLock, FaEye, FaFileContract, FaCalendarAlt } from 'react-icons/fa';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import DotPattern from './DotPattern';
import SEO from './SEO';

function PrivacyPolicy() {
    const navigate = useNavigate();

    const lastUpdated = "October 2, 2025";

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            <SEO
                title="Privacy Policy | OA Helper"
                description="Learn how OA Helper protects your privacy and handles your personal information when using our platform."
                keywords="privacy policy, data protection, user privacy, OA Helper privacy"
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
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full
                                  flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                        <FaShieldAlt className="text-2xl text-blue-300" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Your privacy is important to us. Learn how we protect and handle your data.
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

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FaUserCheck className="mr-3 text-blue-400" />
                            Information We Collect
                        </h2>

                        <p>
                            We collect information you provide directly to us, such as when you create an account,
                            make a purchase, or contact us for support.
                        </p>

                        <h3 className="text-xl font-semibold text-white mb-4">Personal Information</h3>
                        <ul>
                            <li>Name and email address</li>
                            <li>Payment information (processed securely through third-party providers)</li>
                            <li>Profile information you choose to provide</li>
                            <li>Communications you send to us</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-white mb-4">Usage Information</h3>
                        <ul>
                            <li>How you interact with our platform</li>
                            <li>Questions you view and solve</li>
                            <li>Features you use</li>
                            <li>Device and browser information</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FaDatabase className="mr-3 text-green-400" />
                            How We Use Your Information
                        </h2>

                        <p>We use the information we collect to:</p>
                        <ul>
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process payments and manage subscriptions</li>
                            <li>Send you technical notices and support messages</li>
                            <li>Respond to your comments and questions</li>
                            <li>Analyze usage patterns to improve user experience</li>
                            <li>Prevent fraud and ensure platform security</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FaLock className="mr-3 text-purple-400" />
                            Data Security
                        </h2>

                        <p>
                            We implement appropriate security measures to protect your personal information against
                            unauthorized access, alteration, disclosure, or destruction. This includes:
                        </p>
                        <ul>
                            <li>Encryption of sensitive data in transit and at rest</li>
                            <li>Regular security audits and updates</li>
                            <li>Limited access to personal information on a need-to-know basis</li>
                            <li>Secure payment processing through certified providers</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FaEye className="mr-3 text-orange-400" />
                            Information Sharing
                        </h2>

                        <p>We do not sell, trade, or otherwise transfer your personal information to third parties, except:</p>
                        <ul>
                            <li>With your explicit consent</li>
                            <li>To comply with legal obligations</li>
                            <li>To protect our rights and safety</li>
                            <li>In connection with a business transfer</li>
                            <li>With service providers who assist in our operations (under strict confidentiality agreements)</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FaFileContract className="mr-3 text-indigo-400" />
                            Your Rights
                        </h2>

                        <p>You have the right to:</p>
                        <ul>
                            <li>Access the personal information we hold about you</li>
                            <li>Correct inaccurate or incomplete information</li>
                            <li>Request deletion of your personal information</li>
                            <li>Object to or restrict certain processing activities</li>
                            <li>Data portability (receive your data in a structured format)</li>
                            <li>Withdraw consent where applicable</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-6">Contact Us</h2>

                        <p>
                            If you have any questions about this Privacy Policy or our data practices,
                            please contact us at:
                        </p>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-4">
                            <p className="text-blue-300">
                                <strong>Email:</strong> privacy@oahelper.in<br />
                                <strong>WhatsApp:</strong> +91 9274985691
                            </p>
                        </div>

                        <div className="mt-8 p-4 bg-gray-500/10 border border-gray-500/20 rounded-xl">
                            <p className="text-gray-300 text-sm">
                                This privacy policy is effective as of {lastUpdated} and may be updated periodically.
                                We will notify you of any material changes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicy;
