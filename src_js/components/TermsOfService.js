import React from 'react';
import { FaArrowLeft, FaFileContract, FaUserCheck, FaShieldAlt, FaBalanceScale, FaExclamationTriangle, FaCalendarAlt, FaHeadset } from 'react-icons/fa';
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';
import DotPattern from './DotPattern';
import SEO from './SEO';

function TermsOfService() {
    const navigate = useNavigate();

    const lastUpdated = "October 2, 2025";

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            <SEO
                title="Terms of Service | OA Helper"
                description="Read our Terms of Service to understand the rules and guidelines for using OA Helper platform."
                keywords="terms of service, terms and conditions, user agreement, OA Helper terms"
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
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full
                                  flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
                        <FaFileContract className="text-2xl text-indigo-300" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Please read these terms carefully before using OA Helper.
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
                            Acceptance of Terms
                        </h2>

                        <p>
                            By accessing and using OA Helper, you accept and agree to be bound by the terms and
                            provision of this agreement. If you do not agree to abide by the above, please do not
                            use this service.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FaExclamationTriangle className="mr-3 text-yellow-400" />
                            Educational Purpose & Company Disclaimer
                        </h2>

                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
                            <p className="font-semibold text-yellow-300 mb-3">
                                IMPORTANT DISCLAIMER:
                            </p>
                            <p>
                                OA Helper is an independent educational platform designed to help students and professionals 
                                prepare for technical interviews. All company names, logos, trademarks, and related content 
                                mentioned on this platform are used solely for <strong>educational and informational purposes only</strong>.
                            </p>
                            <p className="mt-4">
                                <strong>We are NOT affiliated with, endorsed by, sponsored by, or officially connected to any 
                                of the companies mentioned on this platform.</strong> All company names and trademarks are the 
                                property of their respective owners. The use of these names does not imply any association with, 
                                approval of, or endorsement by these companies.
                            </p>
                            <p className="mt-4">
                                The questions, interview experiences, and other content related to companies are provided for 
                                educational purposes to help users prepare for technical interviews. This content is either 
                                user-generated, publicly available, or created for educational purposes.
                            </p>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FaShieldAlt className="mr-3 text-green-400" />
                            Use License
                        </h2>

                        <p>
                            Permission is granted to temporarily access the materials on OA Helper's platform for
                            personal, non-commercial transitory viewing only. This is the grant of a license, not a
                            transfer of title, and under this license you may not:
                        </p>
                        <ul>
                            <li>Modify or copy the materials</li>
                            <li>Use the materials for any commercial purpose or for any public display</li>
                            <li>Attempt to reverse engineer any software contained on the platform</li>
                            <li>Remove any copyright or other proprietary notations from the materials</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FaBalanceScale className="mr-3 text-purple-400" />
                            User Accounts
                        </h2>

                        <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for:</p>
                        <ul>
                            <li>Safeguarding your account password</li>
                            <li>All activities that occur under your account</li>
                            <li>Notifying us immediately of any unauthorized use</li>
                            <li>Maintaining the security of your login credentials</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FaShieldAlt className="mr-3 text-red-400" />
                            Intellectual Property Rights & Protection
                        </h2>

                        <p className="font-semibold text-white mb-3">
                            Respect for Intellectual Property:
                        </p>
                        <p>
                            OA Helper respects the intellectual property rights of others and expects users to do the same. 
                            We comply with the Digital Millennium Copyright Act (DMCA) and other applicable intellectual 
                            property laws.
                        </p>

                        <p className="mt-4 font-semibold text-white mb-3">
                            User Responsibilities:
                        </p>
                        <ul>
                            <li>You must not upload, post, or share content that infringes on any third party's copyrights, trademarks, patents, or other intellectual property rights</li>
                            <li>You warrant that any content you submit is either your original work or you have obtained all necessary permissions and licenses</li>
                            <li>You must not use company names, logos, or trademarks in a way that suggests endorsement or affiliation without proper authorization</li>
                            <li>You agree to indemnify OA Helper against any claims arising from your violation of intellectual property rights</li>
                        </ul>

                        <p className="mt-4 font-semibold text-white mb-3">
                            Content Removal & DMCA Compliance:
                        </p>
                        <p>
                            If you believe any content on our platform infringes your intellectual property rights, please 
                            refer to our <a href="/dmca-policy" className="text-blue-400 hover:text-blue-300 underline">DMCA Policy</a> for 
                            the proper procedure to submit a takedown notice. We will respond to valid notices within 3 business days.
                        </p>

                        <p className="mt-4 font-semibold text-white mb-3">
                            Repeat Infringer Policy:
                        </p>
                        <p>
                            We maintain a policy of terminating accounts of users who are repeat infringers of intellectual 
                            property rights. Users found to repeatedly violate IP rights will have their accounts permanently suspended.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FaExclamationTriangle className="mr-3 text-orange-400" />
                            Prohibited Uses
                        </h2>

                        <p>You may not use our platform:</p>
                        <ul>
                            <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                            <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                            <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                            <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                            <li>To submit false or misleading information</li>
                            <li>To upload or transmit viruses or any other type of malicious code</li>
                            <li>To scrape, harvest, or collect data from the platform using automated means without permission</li>
                            <li>To misrepresent your affiliation with any company or organization</li>
                            <li>To use company names or trademarks in a misleading or unauthorized manner</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-6">Premium Subscriptions</h2>

                        <p>
                            Premium subscriptions are governed by our separate Refund Policy. By subscribing to premium features:
                        </p>
                        <ul>
                            <li>You agree to pay all fees associated with your chosen subscription plan</li>
                            <li>You understand that subscriptions auto-renew unless cancelled</li>
                            <li>You acknowledge our refund policy and processing times</li>
                            <li>You agree to use premium features in accordance with these terms</li>
                        </ul>

                        <h2 className="text-2xl font-bold text-white mb-6">User-Generated Content</h2>

                        <p>
                            Our platform allows users to upload and share content. You are solely responsible for the content you post:
                        </p>
                        <ul>
                            <li>All content must be original or properly licensed with appropriate permissions</li>
                            <li>Content must not violate any laws or infringe on third-party intellectual property rights</li>
                            <li>You must not submit content that contains proprietary or confidential information without authorization</li>
                            <li>You retain ownership of your content but grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute it on our platform</li>
                            <li>We reserve the right to review, moderate, edit, or remove any content that violates these terms or infringes on intellectual property rights</li>
                            <li>You agree to cooperate with any investigation regarding potential intellectual property violations</li>
                        </ul>

                        <p className="mt-4 font-semibold text-white">
                            Content Moderation:
                        </p>
                        <p>
                            We actively monitor and moderate content to ensure compliance with intellectual property laws. 
                            If you notice any content that infringes on intellectual property rights, please use our 
                            <a href="/report-content" className="text-blue-400 hover:text-blue-300 underline ml-1">Report Content</a> feature 
                            to notify us immediately.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-6">Disclaimer</h2>

                        <p>
                            The materials on OA Helper's platform are provided on an 'as is' basis. OA Helper makes no
                            warranties, expressed or implied, and hereby disclaims and negates all other warranties including
                            without limitation, implied warranties or conditions of merchantability, fitness for a particular
                            purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-6">Limitation of Liability</h2>

                        <p>
                            In no event shall OA Helper or its suppliers be liable for any damages (including, without limitation,
                            damages for loss of data or profit, or due to business interruption) arising out of the use or
                            inability to use the materials on OA Helper's platform.
                        </p>

                        <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>

                        <p>
                            If you have any questions about these Terms of Service, please contact us:
                        </p>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-4">
                            <p className="text-blue-300">
                                <strong>Email:</strong> legal@oahelper.in<br />
                                <strong>WhatsApp:</strong> +91 9274985691<br />
                                <strong>Address:</strong> [Your Business Address]
                            </p>
                        </div>

                        <div className="mt-8 p-4 bg-gray-500/10 border border-gray-500/20 rounded-xl">
                            <p className="text-gray-300 text-sm">
                                These terms of service are effective as of {lastUpdated} and constitute the entire agreement
                                between you and OA Helper. By using our service, you acknowledge that you have read,
                                understood, and agree to be bound by these terms.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TermsOfService;
